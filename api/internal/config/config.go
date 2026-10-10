package config

import (
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

var (
	// Database
	PostgresDSN string

	// Auth & Security
	JWTSecret      string
	GoogleClientID string

	// App
	FrontendURL string
	Port        string
	AdminEmail  string // first admin bootstrapped on login

	// Health Ping Cron
	HealthURLs    string
	HealthWait    string
	RunUptimeCron bool

	// Twilio
	TwilioAccountSID        string
	TwilioAuthToken         string
	TwilioWAFrom            string // e.g. "whatsapp:+14155238886"
	TwilioSandboxMode       bool   // true = sandbox, users must join first
	TwilioSandboxJoinPhrase string // e.g. "join burst-influence"

	// WhatsApp dispatch limits (fallback; overridden by AppSetting in DB)
	MaxDailyWAMessages int

	// WhatsApp dispatch time
	WASendTime string // e.g. "0600" = 6:00 AM, "1345" = 13:45 IST

	// Email (Resend)
	ResendAPIKey              string
	ResendFromEmail           string // e.g. "shlok@ekashlok.com"
	AdminNotificationEmail    string // alert destination, e.g. admin email
	EmailShlokEnabled         bool   // master on/off switch
	EmailShlokDay             string // "daily", "monday", "tuesday", …
	EmailShlokTime            string // "0600" = 6:00 AM IST
	EmailUserLimit            string // "ALL" or a positive integer string
	EmailBatchSize            int    // emails per batch (default 10)
	EmailBatchDelaySeconds    int    // sleep between batches (default 2)
)

// Load initialises all environment variables into the Go process.
func Load() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables.")
	}

	PostgresDSN = getEnvOrDefault("POSTGRES_DSN", "host=localhost user=postgres password=postgres dbname=gitadaily port=5432 sslmode=disable")
	JWTSecret = getEnvOrDefault("JWT_SECRET", "supersecret_change_in_production")
	GoogleClientID = os.Getenv("GOOGLE_CLIENT_ID")

	FrontendURL = getEnvOrDefault("VITE_FRONTEND_URL", "http://localhost:5173")
	Port = getEnvOrDefault("PORT", "8081")
	AdminEmail = os.Getenv("ADMIN_EMAIL")

	// Health ping
	HealthURLs = os.Getenv("URL")
	HealthWait = getEnvOrDefault("HEALTH_WAIT", "8")
	RunUptimeCron = os.Getenv("RUN_UPTIME_CRON") == "true"

	// Twilio
	TwilioAccountSID = os.Getenv("TWILIO_ACCOUNT_SID")
	TwilioAuthToken = os.Getenv("TWILIO_AUTH_TOKEN")
	TwilioWAFrom = getEnvOrDefault("TWILIO_WA_FROM", "whatsapp:+14155238886")
	TwilioSandboxMode = os.Getenv("TWILIO_SANDBOX_MODE") == "true"
	TwilioSandboxJoinPhrase = getEnvOrDefault("TWILIO_SANDBOX_JOIN_PHRASE", "join burst-influence")

	maxWA, err := strconv.Atoi(os.Getenv("MAX_DAILY_WA_MESSAGES"))
	if err != nil || maxWA <= 0 {
		maxWA = 200
	}
	MaxDailyWAMessages = maxWA

	WASendTime = getEnvOrDefault("WA_SEND_TIME", "0600")

	// Email (Resend)
	ResendAPIKey           = os.Getenv("RESEND_API_KEY")
	ResendFromEmail        = getEnvOrDefault("RESEND_FROM_EMAIL", "shlok@ekashlok.com")
	AdminNotificationEmail = getEnvOrDefault("ADMIN_NOTIFICATION_EMAIL", AdminEmail)
	EmailShlokEnabled      = os.Getenv("EMAIL_SHLOK_ENABLED") == "true"
	EmailShlokDay          = strings.ToLower(getEnvOrDefault("EMAIL_SHLOK_DAY", "monday"))
	EmailShlokTime         = getEnvOrDefault("EMAIL_SHLOK_TIME", "0600")
	EmailUserLimit         = getEnvOrDefault("EMAIL_USER_LIMIT", "ALL")

	batchSize, bse := strconv.Atoi(os.Getenv("EMAIL_BATCH_SIZE"))
	if bse != nil || batchSize <= 0 {
		batchSize = 10
	}
	EmailBatchSize = batchSize

	batchDelay, bde := strconv.Atoi(os.Getenv("EMAIL_BATCH_DELAY_SECONDS"))
	if bde != nil || batchDelay < 0 {
		batchDelay = 2
	}
	EmailBatchDelaySeconds = batchDelay
}

func getEnvOrDefault(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
