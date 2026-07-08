# Gita Daily - Project Summary & Specification

This document provides a detailed summary of the Gita Daily application, covering both the backend (Go/Gin) and the frontend (Vite/React/TypeScript) architectures, including database schemas, routing, API endpoints, key business features, and system configurations.

---

## 1. System Architecture

The project consists of:
1. **Backend (API)**: Written in Go using the **Gin** HTTP framework and **GORM** for PostgreSQL database interaction.
2. **Frontend (Client)**: A Single Page Application (SPA) built using **React**, **TypeScript**, and **Vite**, styled with custom CSS (including glassmorphism, responsive grids, and responsive components) and using Tailwind CSS utility styles.

---

## 2. Database Schema (PostgreSQL via GORM)

The backend uses GORM's `AutoMigrate` to manage PostgreSQL tables. Below are the structural definitions of the models:

### 2.1. User Model (`models.User`)
Represents a registered user in the application.
- **`id`** (`uint`, Primary Key): Auto-incrementing unique identifier.
- **`email`** (`string`, Unique Index, Not Null): Google account email.
- **`name`** (`string`): Full name retrieved from Google Profile.
- **`avatar_url`** (`string`): Profile picture URL retrieved from Google Profile.
- **`google_id`** (`string`, Unique Index): Unique sub-claim from Google OAuth payload.
- **`is_admin`** (`bool`, Default: `false`): Admin privileges flag.
- **`shlok_count`** (`int`, Default: `1`): The current progress of the user (ranges from `0` to `700`, representing the last shlok completed/read).
- **`last_shlok_advanced`** (`*time.Time`, Index): Timestamp of the last time the user's shlok count was advanced (either via manual navigation or daily dispatch).
- **`phone`** (`string`, Index): E.164-sanitized phone number (without the leading `+`).
- **`is_phone_verified`** (`bool`, Default: `false`): Verification status of the phone number.
- **`is_wa_subscribed`** (`bool`, Default: `false`): Active subscription flag for daily WhatsApp message delivery.
- **`created_at`** (`time.Time`): Record creation timestamp.
- **`updated_at`** (`time.Time`): Record modification timestamp.
- **`deleted_at`** (`gorm.DeletedAt`, Index): Soft delete support.

### 2.2. OTP Model (`models.OTP`)
Stores short-lived one-time passwords for WhatsApp verification.
- **`id`** (`uint`, Primary Key): Unique identifier.
- **`user_id`** (`uint`, Index, Not Null): Reference to the associated user ID.
- **`phone`** (`string`, Not Null): Target phone number.
- **`code`** (`string`, Not Null): 6-digit numeric OTP code.
- **`expires_at`** (`time.Time`, Index, Not Null): Expiration timestamp (10 minutes lifetime).
- **`used`** (`bool`, Default: `false`): Flag indicating if the OTP has been consumed.
- **`created_at`** (`time.Time`): Creation timestamp.

### 2.3. AppSetting Model (`models.AppSetting`)
Stores key-value configurations for admin-configurable runtime settings.
- **`id`** (`uint`, Primary Key): Unique identifier.
- **`key`** (`string`, Unique Index, Not Null): Configuration key. Whitelisted keys are:
  - `"max_daily_wa_messages"`: Numeric cap for daily WhatsApp dispatches.
  - `"otp_maintenance"`: `"true"` or `"false"` flag.
  - `"dispatch_maintenance"`: `"true"` or `"false"` flag.
  - `"last_dispatch_date"`: `"YYYY-MM-DD"` of the last execution of the daily cron job.
  - `"wa_daily_date"`: `"YYYY-MM-DD"` tracking the current rate-limit window.
  - `"wa_daily_count"`: Total WhatsApp messages sent during the date in `wa_daily_date`.
- **`value`** (`string`, Not Null): Configuration value.
- **`updated_at`** (`time.Time`): Last update timestamp.

### 2.4. ShlokActivityLog Model (`models.ShlokActivityLog`)
Records daily activity for rendering the streak heatmap.
- **`id`** (`uint`, Primary Key, Auto-Increment): Unique identifier.
- **`user_id`** (`uint`, Unique Index: `idx_user_date`, Not Null): Associated user ID.
- **`date`** (`time.Time`, Unique Index: `idx_user_date`, Type: `date`, Not Null): UTC date (truncated to date part) representing activity day.
- **`shlok_count`** (`int`, Default: `0`): The global shlok number (1–700) read or delivered on that day (legacy records default to `0`).

### 2.5. WASignupAttempt Model (`models.WASignupAttempt`)
Logs WhatsApp subscription failures.
- **`id`** (`uint`, Primary Key): Unique identifier.
- **`user_id`** (`uint`, Index, Not Null): Associated user ID.
- **`phone`** (`string`, Not Null): Target phone number.
- **`stage`** (`string`, Not Null): Step that failed. One of:
  - `"send_otp"`
  - `"verify_otp"`
  - `"subscribe"`
- **`fail_reason`** (`string`, Not Null): Category of failure. One of:
  - `"maintenance"` (OTP maintenance is active)
  - `"twilio_error"` (Twilio API request failed)
  - `"invalid_phone"` (Invalid E.164 formatting)
  - `"invalid_otp"` (OTP mismatch or expired)
  - `"phone_not_verified"` (Attempt to subscribe without verification)
  - `"db_error"` (Database transaction error)
  - `"invalid_choice"` (Invalid custom start shlok)
- **`error_detail`** (`string`): Stack trace, raw error, or contextual details.
- **`created_at`** (`time.Time`): Timestamp of the failure attempt.

---

## 3. Backend Routes & API Endpoints

All backend routes are prefixed with `/api` and defined in `api/internal/routes/routes.go`.

### 3.1. Public Endpoints
No authentication token required.

- **GET `/api/health`**
  - **Description**: Returns API server status.
  - **Response**: `{"status": "ok", "service": "Gita Daily API"}`
- **GET `/api/settings/public`**
  - **Description**: Returns active maintenance states for client banners.
  - **Response**: `{"otp_maintenance": bool, "dispatch_maintenance": bool}`
- **POST `/api/auth/google`**
  - **Description**: Verifies Google Identity credential, upserts user info, and returns a BGS JWT.
  - **Payload**: `{"credential": "string"}` (Google OAuth JWT token)
  - **Response**: `{"token": "string", "user": UserObject}`
- **GET `/api/shloks`**
  - **Description**: Retrieves list of all 18 Gita chapters with summaries and verse counts.
  - **Response**: `{"chapters": []ChapterSummary}`
- **GET `/api/shloks/:chapter`**
  - **Description**: Retrieves all verses in a given chapter (1-18).
  - **Response**: `{"chapter": int, "verses": []Verse}`
- **GET `/api/shloks/:chapter/:verse`**
  - **Description**: Retrieves a specific verse from a specific chapter.
  - **Response**: `{"verse": VerseObject}`

### 3.2. Authenticated User Endpoints
Requires a valid `Authorization: Bearer <token>` header verified by `middleware.RequireAuth()`.

- **GET `/api/users/me`**
  - **Description**: Retrieves current logged-in user profile.
  - **Response**: `{"user": UserObject}`
- **GET `/api/shlok/today`**
  - **Description**: Retrieves the user's active daily shlok.
    - If user is **NOT** WhatsApp-subscribed and hasn't had their count advanced today (IST), auto-advances the count (except on their very first visit).
    - Idempotently logs this date-activity to the heatmap db table.
  - **Response**: `{"shlok_count": int, "total_verses": int, "verse": VerseObject}`
- **POST `/api/shlok/reset`**
  - **Description**: Resets user's `shlok_count` to `0` and clears `last_shlok_advanced`.
  - **Response**: `{"message": "Shlok count reset", "shlok_count": 0}`
- **PATCH `/api/shlok/count`**
  - **Description**: Manually updates user's `shlok_count` (ranges 1–700). Clears `last_shlok_advanced`.
  - **Payload**: `{"count": int}`
  - **Response**: `{"message": "Shlok count updated", "shlok_count": int}`
- **GET `/api/shlok/activity-heatmap`**
  - **Description**: Computes active days, current reading streak, max reading streak, and returns all logged activity days from the user's join year (starting Jan 1st).
  - **Response**:
    ```json
    {
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "total_active_days": int,
      "current_streak": int,
      "max_streak": int,
      "active_dates": [
        { "date": "YYYY-MM-DD", "shlok_count": int, "chapter": int, "verse": int }
      ]
    }
    ```
- **POST `/api/wa/send-otp`**
  - **Description**: Generates and stores a 6-digit OTP code, then sends it via Twilio WhatsApp. Invalidates previous pending OTPs.
  - **Payload**: `{"phone": "string"}`
  - **Response**: `{"message": "OTP sent to WhatsApp"}` (Includes `sandbox_note` if Twilio Sandbox mode is enabled).
- **POST `/api/wa/verify-otp`**
  - **Description**: Validates the 6-digit OTP code against the database. Marks user phone as verified.
  - **Payload**: `{"phone": "string", "code": "string"}`
  - **Response**: `{"message": "Phone verified successfully"}`
- **POST `/api/wa/subscribe`**
  - **Description**: Subscribes verified phone to the daily dispatch starting from a chosen configuration. Sends an immediate confirmation welcome WhatsApp message.
  - **Payload**: `{"start_choice": "from_start" | "current" | "custom", "custom_count": int}`
  - **Response**: `{"message": "Subscribed successfully", "shlok_count": int}`
- **POST `/api/wa/unsubscribe`**
  - **Description**: Cancels daily WhatsApp delivery subscription.
  - **Response**: `{"message": "Unsubscribed from WhatsApp shlok delivery"}`

### 3.3. Admin Endpoints
Requires admin role verified by `middleware.RequireAuth()` and `middleware.RequireAdmin()`.

- **GET `/api/admin/stats`**
  - **Description**: Retrieves high-level analytics.
  - **Response**:
    ```json
    {
      "total_users": int,
      "wa_subscribers": int,
      "msg_sent_today": int, // shlok dispatches only
      "wa_daily_count": int, // all WhatsApp messages sent today
      "wa_daily_limit": int, // current configured limit
      "wa_daily_remaining": int
    }
    ```
- **GET `/api/admin/users`**
  - **Description**: Paginated query of all system users.
  - **Query Params**: `?page=1&limit=20`
  - **Response**: `{"users": []User, "pagination": {"page": int, "limit": int, "total": int, "total_pages": int}}`
- **PATCH `/api/admin/users/:id/toggle-admin`**
  - **Description**: Grants or revokes administrative status of a target user. Admins cannot modify their own status.
  - **Response**: `{"message": "Admin status updated", "user_id": int, "is_admin": bool}`
- **GET `/api/admin/settings`**
  - **Description**: Retrieves all system setting keys and values.
  - **Response**: `{"settings": {"key": "value"}}`
- **PATCH `/api/admin/settings`**
  - **Description**: Updates whitelisted configurations (`max_daily_wa_messages`, `otp_maintenance`, `dispatch_maintenance`).
  - **Payload**: `{"setting_key": "new_value"}`
  - **Response**: `{"message": "Settings updated"}`
- **GET `/api/admin/signup-attempts`**
  - **Description**: Paginated query of logged WhatsApp subscription failures.
  - **Query Params**: `?page=1&limit=20`
  - **Response**: `{"attempts": []WASignupAttempt, "pagination": {...}}`

---

## 4. Frontend Router & Screen Catalog

All client routing is defined in `client/src/App.tsx` utilizing `react-router-dom`. The layout is designed with premium typography and interactive states.

### 4.1. Public Screens
- **`/` (Landing Screen)**
  - **Component**: `Landing.tsx`
  - **Features**: Hero sections with floating Om characters, interactive WhatsApp preview card, three-step onboarding flowchart, statistical numbers, a direct Google Auth client trigger, and a transparent navbar.
- **`/login` (Login Screen)**
  - **Component**: `Login.tsx`
  - **Features**: Centered glassmorphic login modal containing a Google authentication login button, terms disclosure, and floating decorative backgrounds.
- **`/shloks` (Shlok Browser)**
  - **Component**: `ShlokBrowser.tsx`
  - **Features**: Renders a grid of the 18 chapters of the Bhagavad Gita, color-coded badge counters, watermarked chapter numbers, and descriptions. Uses cache utility for instant load.
- **`/shloks/:chapter` (Chapter Verses List)**
  - **Component**: `ChapterVerses.tsx`
  - **Features**: Lists all verses inside a single chapter with their Sanskrit text preview, order badges, and pagination to previous/next chapters.
- **`/shloks/:chapter/:verse` (Single Verse Page)**
  - **Component**: `VersePage.tsx`
  - **Features**: Focus page rendering a detailed `ShlokCard` for a specific verse, incorporating step-navigation to adjacent shloks/chapters.

### 4.2. Protected Screens
Requires authenticated state.
- **`/home` (Dashboard Home)**
  - **Component**: `Home.tsx`
  - **Features**: Personalized Hindu greeting (`"Namaste"`), calendar display, progress indicator bar (tracking global completion percentage), the active daily shlok component, streak heatmap visualization, and quick actions to verify/subscribe to WhatsApp.
- **`/profile` (User Settings)**
  - **Component**: `Profile.tsx`
  - **Features**: Displays Google Profile info, sign-out command, progress bar reset actions, custom shlok index jumper input modal, and WhatsApp subscription settings.

### 4.3. Admin Screens
Requires logged-in admin permissions.
- **`/admin` (Admin Console)**
  - **Component**: `AdminDashboard.tsx`
  - **Features**: Analytics widgets (total users, active subscriptions, messages sent today), a visual daily Twilio API limit indicator bar, settings modification forms (modifying message caps and safety switches).
- **`/admin/users` (User Registry)**
  - **Component**: `AdminUsers.tsx`
  - **Features**: Paginated table representing user metrics, registration date, avatar preview, phone status, and authority control switches.
- **`/admin/signup-attempts` (System Logs)**
  - **Component**: `AdminSignupAttempts.tsx`
  - **Features**: Categorized failure logs (represented as color-coded badges matching the failure category: e.g., Twilio, DB, OTP) with complete logs to troubleshoot signup onboarding.

---

## 5. Key System Processes

### 5.1. Daily Dispatch Process (`services.DispatchDailyShloks`)
1. Executed daily via a dedicated goroutine running in `StartDailyShlokCron` that targets the configured `WA_SEND_TIME` in India Standard Time (IST).
2. Performs a safety check:
   - Validates if `dispatch_maintenance` is active (aborts if true).
   - Validates if a dispatch was already run today via database checking of `last_dispatch_date` (stops if true, preventing double-sends on server restarts).
3. Queries all active subscriptions: `is_wa_subscribed = true AND is_phone_verified = true`.
4. Iterates through users:
   - Increments the user's `shlok_count` (if new or reset, advances to Shlok #1).
   - If the user receives Shlok #700, sends a congratulations message and wraps the index back to `1`.
   - Sends the formatted message via Twilio API.
   - Atomically records the message transaction under `wa_daily_count`.
   - If `wa_daily_count` hits `max_daily_wa_messages`, halts dispatch and triggers an automated alert notification directly to the administrator's WhatsApp.

### 5.2. OTP Send & Verification Lifecycle
1. User enters a phone number in frontend modal.
2. Server sanitizes formatting to E.164 and checks `otp_maintenance`.
3. Server invalidates prior unconsumed OTPs for the user.
4. Generates a random 6-digit numeric code, records it in the database with a 10-minute expiry time.
5. Sends SMS via Twilio WhatsApp Business API.
6. The user submits the code on the client.
7. Server validates matching details, marks the OTP as used, and updates the user's status to `is_phone_verified = true`.

---

## 6. Client Cache Strategy

Defined in `client/src/utils/cache.ts` and used via `shlokApi`:
- **Stale-While-Revalidate (SWR)**: Static data (chapters list, chapter verses list, individual shloks) are cached in the client's `localStorage` with a TTL of 7 days.
- If cache hit exists: returns cached data instantly to prevent loading skeletons, then makes an asynchronous network call to update the cache in the background.
- Dynamic data (today's active shlok, activity heatmaps, admin dashboard telemetry, user information) bypasses caching to ensure freshness.

---

## 7. Environment Variables

### 7.1. Backend Variables (`.env`)
- `POSTGRES_DSN`: PostgreSQL connection string.
- `JWT_SECRET`: Security salt for signing user session tokens.
- `GOOGLE_CLIENT_ID`: Google OAuth client credential identifier.
- `VITE_FRONTEND_URL`: URL of the client application for CORS headers.
- `PORT`: API server port (defaults to `8081`).
- `ADMIN_EMAIL`: Google email of the primary root administrator.
- `TWILIO_ACCOUNT_SID`: Twilio account identifier.
- `TWILIO_AUTH_TOKEN`: Twilio API secret token.
- `TWILIO_WA_FROM`: Twilio registered sender number (e.g. `"whatsapp:+14155238886"`).
- `TWILIO_SANDBOX_MODE`: Boolean flag for sandbox mode operations.
- `TWILIO_SANDBOX_JOIN_PHRASE`: Phrase users must text to join (e.g., `"join burst-influence"`).
- `RUN_UPTIME_CRON`: Activates self-pinging background jobs.
- `WA_SEND_TIME`: Dispatch execution timing (e.g. `"0600"` represent 06:00 AM IST).

### 7.2. Frontend Variables (`.env`)
- `VITE_API_URL`: Backend endpoint URL (defaults to `http://localhost:8081/api`).
- `VITE_GOOGLE_CLIENT_ID`: Client OAuth key.

---

## 8. Product Constraints & Design Decisions

Based on alignment with the owner, the system is specified under the following product rules:

- **Single Administrator Only**: The platform is restricted to a single administrator (the website owner). Only the user with the Google account email matching `ADMIN_EMAIL` has administrative rights.
- **Automatic Progress Loop**: When a subscriber reads/receives Shlok #700, the system automatically restarts their progress from Shlok #1 the following day.
- **Geographic Scope**: The service is currently active only for users in India. The system architecture will be expanded in the future to support international timezones and users globally.
- **Database Storage**: Telemetry, rate-limit statistics (`wa_daily_count`), and session tokens remain hosted within PostgreSQL (Neon database connections). No caching server like Redis is required at this stage.
- **CORS Configuration**: Stays exactly as configured in `main.go` to support localhost environments and Vercel.
- **WhatsApp Only**: Message delivery is WhatsApp-exclusive. No legacy SMS backup, fallback, or cross-channel messaging is utilized.

