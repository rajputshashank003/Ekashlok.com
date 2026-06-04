package config

import (
	"log"
	"os"
	"strconv"

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
}

func getEnvOrDefault(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
