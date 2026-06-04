// Package services contains the Twilio WhatsApp integration.
//
// Sandbox mode (TWILIO_SANDBOX_MODE=true):
//   - Uses free-form text messages (works once a user has messaged the sandbox number)
//   - Users must first send "join burst-influence" to +14155238886 on WhatsApp
//   - Free-form works for both OTP and daily shlok in sandbox
//
// Production mode (TWILIO_SANDBOX_MODE=false):
//   - Uses approved WhatsApp sender number
//   - Free-form messages are allowed for 24h after user-initiated conversation
//   - Business-initiated messages require approved templates
package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"bgs/internal/config"
	"bgs/internal/database"
	"bgs/internal/gita"
	"bgs/internal/models"
)

// ErrDailyWALimitReached is returned by SendWhatsAppMessage when the daily
// WA message cap has been hit. Callers can check for this specifically.
var ErrDailyWALimitReached = errors.New("daily WhatsApp message limit reached")

// twilioResponse captures the minimal fields we care about from Twilio's API response.
type twilioResponse struct {
	SID          string `json:"sid"`
	Status       string `json:"status"`
	ErrorCode    int    `json:"error_code"`
	ErrorMessage string `json:"message"`
}

// SendWhatsAppMessage sends a WhatsApp message via the Twilio REST API.
// It checks the daily WA count against the configured limit (MAX_DAILY_WA_MESSAGES)
// before sending, and increments the counter atomically on success.
// Returns ErrDailyWALimitReached if the cap has been hit.
//
// Pass isAdmin=true (optional) to bypass the daily rate gate — used only for
// admin-level alerts so they always get delivered even when the cap is hit.
func SendWhatsAppMessage(to, body string, isAdmin ...bool) error {
	if config.TwilioAccountSID == "" || config.TwilioAuthToken == "" {
		return fmt.Errorf("Twilio credentials not configured — set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env")
	}

	// ── Daily rate gate ────────────────────────────────────────────────────────
	// Admin messages (e.g. limit-reached alerts) bypass the cap so they always
	// get delivered. All other callers are subject to MAX_DAILY_WA_MESSAGES.
	adminBypass := len(isAdmin) > 0 && isAdmin[0]
	if !adminBypass {
		limit := readMaxMessages()
		current := getDailyWACount()
		if current >= limit {
			log.Printf("[TWILIO] Daily WA limit of %d reached (count=%d) — message blocked to %s\n", limit, current, to)
			return ErrDailyWALimitReached
		}
	}

	// Ensure the 'to' number has the whatsapp: prefix
	if !strings.HasPrefix(to, "whatsapp:") {
		to = "whatsapp:+" + strings.TrimPrefix(to, "+")
	}

	apiURL := fmt.Sprintf(
		"https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json",
		config.TwilioAccountSID,
	)

	form := url.Values{}
	form.Set("From", config.TwilioWAFrom)
	form.Set("To", to)
	form.Set("Body", body)

	if err := postToTwilio(apiURL, form); err != nil {
		return err
	}

	// Increment the daily counter only on success
	incrementDailyWACount()
	return nil
}

// postToTwilio executes the HTTP POST to the Twilio Messages API.
func postToTwilio(apiURL string, form url.Values) error {
	req, err := http.NewRequest("POST", apiURL, strings.NewReader(form.Encode()))
	if err != nil {
		return fmt.Errorf("failed to build Twilio request: %w", err)
	}
	req.SetBasicAuth(config.TwilioAccountSID, config.TwilioAuthToken)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("Twilio HTTP error: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	var twResp twilioResponse
	json.Unmarshal(bodyBytes, &twResp)

	if resp.StatusCode >= 400 {
		log.Printf("[TWILIO] Error %d — code %d: %s\n", resp.StatusCode, twResp.ErrorCode, twResp.ErrorMessage)
		return fmt.Errorf("Twilio %d (code %d): %s", resp.StatusCode, twResp.ErrorCode, twResp.ErrorMessage)
	}

	log.Printf("[TWILIO] Message sent — SID: %s, Status: %s\n", twResp.SID, twResp.Status)
	return nil
}

// ── Daily WA count helpers ─────────────────────────────────────────────────────
// Uses two app_settings keys:
//   - "wa_daily_date"  — IST date string "2006-01-02" of the current window
//   - "wa_daily_count" — number of WA messages sent since that date

const (
	waDailyDateKey  = "wa_daily_date"
	waDailyCountKey = "wa_daily_count"
)

func istToday() string {
	loc, _ := time.LoadLocation("Asia/Kolkata")
	return time.Now().In(loc).Format("2006-01-02")
}

// getDailyWACount returns how many WA messages have been sent today (IST).
// Returns 0 if the stored date is not today (effectively auto-resets).
func getDailyWACount() int {
	today := istToday()

	var dateSetting models.AppSetting
	if err := database.DB.Where("key = ?", waDailyDateKey).First(&dateSetting).Error; err != nil {
		return 0 // no record yet
	}
	if dateSetting.Value != today {
		return 0 // new day — counter not reset yet in DB, but treat as 0
	}

	var countSetting models.AppSetting
	if err := database.DB.Where("key = ?", waDailyCountKey).First(&countSetting).Error; err != nil {
		return 0
	}
	count := 0
	fmt.Sscanf(countSetting.Value, "%d", &count)
	return count
}

// incrementDailyWACount increments today's (IST) WA message count in app_settings.
// If the date has rolled over it resets the counter to 1.
func incrementDailyWACount() {
	today := istToday()

	// Check stored date
	var dateSetting models.AppSetting
	dateExists := database.DB.Where("key = ?", waDailyDateKey).First(&dateSetting).Error == nil

	if !dateExists || dateSetting.Value != today {
		// New day — reset both keys
		upsertSetting(waDailyDateKey, today)
		upsertSetting(waDailyCountKey, "1")
		log.Printf("[TWILIO] Daily WA counter reset for %s — count=1\n", today)
		return
	}

	// Same day — read current count and increment
	var countSetting models.AppSetting
	count := 0
	if err := database.DB.Where("key = ?", waDailyCountKey).First(&countSetting).Error; err == nil {
		fmt.Sscanf(countSetting.Value, "%d", &count)
	}
	count++
	upsertSetting(waDailyCountKey, fmt.Sprintf("%d", count))
	log.Printf("[TWILIO] Daily WA count incremented to %d (limit=%d)\n", count, readMaxMessages())
}

// upsertSetting writes a key=value pair to app_settings, creating it if absent.
func upsertSetting(key, value string) {
	database.DB.Where(models.AppSetting{Key: key}).
		Assign(models.AppSetting{Value: value}).
		FirstOrCreate(&models.AppSetting{})
	database.DB.Model(&models.AppSetting{}).
		Where("key = ?", key).
		Update("value", value)
}

// GetDailyWAStats returns today's (IST) WA sent count and the configured limit.
// Exported so the admin controller can include it in stats.
func GetDailyWAStats() (sent int, limit int) {
	return getDailyWACount(), readMaxMessages()
}

// ── Message formatters ─────────────────────────────────────────────────────────

// FormatShlokMessage formats a Gita verse into the WhatsApp delivery template.
// Matches exactly the format shown in the product spec.
func FormatShlokMessage(v *gita.Verse) string {
	return fmt.Sprintf(
		"🌼 *Bhagavad Gita – Adhyay %d, Shlok %d*\n\n"+
			"🕉️ *Sanskrit:*\n%s\n\n"+
			"🔤 *Transliteration:*\n%s\n\n"+
			"🪷 *Hinglish Meaning:*\n%s\n\n"+
			"✨ *Simple Explanation (Hinglish):*\n%s\n\n"+
			"📚 *Life Lesson:*\n%s\n\n"+
			"— _Gita Daily_ 🙏",
		v.ChapterNumber, v.VerseNumber,
		v.Sanskrit,
		v.Transliteration,
		v.HinglishMeaning,
		v.SimpleExplanation,
		v.LifeLesson,
	)
}

// FormatOTPMessage returns the OTP message body.
func FormatOTPMessage(code string) string {
	return fmt.Sprintf(
		"🕉️ *Gita Daily* — WhatsApp Verification\n\n"+
			"Your OTP is: *%s*\n\n"+
			"This code expires in 10 minutes.\nDo not share it with anyone.\n\n"+
			"_Jai Shri Krishna_ 🙏",
		code,
	)
}

// SandboxJoinMessage returns a user-friendly sandbox join instruction.
// Only relevant in sandbox mode (TWILIO_SANDBOX_MODE=true).
func SandboxJoinMessage() string {
	if !config.TwilioSandboxMode {
		return ""
	}
	return fmt.Sprintf(
		"📱 *Before you can receive messages, please join our WhatsApp sandbox:*\n\n"+
			"Send this message to *+1 415 523 8886* on WhatsApp:\n\n"+
			"*%s*\n\n"+
			"Once joined, come back and complete verification.",
		config.TwilioSandboxJoinPhrase,
	)
}
