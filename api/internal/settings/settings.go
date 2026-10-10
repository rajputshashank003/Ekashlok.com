// Package settings provides helpers to read admin-toggleable maintenance and email flags
// from the app_settings table at runtime.
//
// It is a separate package to avoid import cycles between controllers, services,
// and the database/models layers.
package settings

import (
	"strconv"
	"strings"

	"bgs/internal/config"
	"bgs/internal/database"
	"bgs/internal/models"
)

// IsOTPMaintenance returns true when the admin has disabled WhatsApp OTP sending.
func IsOTPMaintenance() bool {
	return GetBoolSetting("otp_maintenance", false)
}

// IsDispatchMaintenance returns true when the admin has paused the daily shlok
// cron dispatch to WhatsApp subscribers.
func IsDispatchMaintenance() bool {
	return GetBoolSetting("dispatch_maintenance", false)
}

// ── Email Broadcast Settings ──────────────────────────────────────────────────

// IsEmailShlokEnabled returns whether the scheduled email cron is active.
func IsEmailShlokEnabled() bool {
	return GetBoolSetting("email_shlok_enabled", config.EmailShlokEnabled)
}

// GetResendFromEmail returns the verified sender email address.
func GetResendFromEmail() string {
	return GetStringSetting("resend_from_email", config.ResendFromEmail)
}

// GetAdminNotificationEmail returns the email to receive milestone alerts.
func GetAdminNotificationEmail() string {
	return GetStringSetting("admin_notification_email", config.AdminNotificationEmail)
}

// GetEmailShlokDay returns "daily" or a weekday name like "monday".
func GetEmailShlokDay() string {
	day := GetStringSetting("email_shlok_day", config.EmailShlokDay)
	if day == "" {
		return "monday"
	}
	return strings.ToLower(strings.TrimSpace(day))
}

// GetEmailShlokTime returns the 24-hr IST time format, e.g. "0600".
func GetEmailShlokTime() string {
	t := GetStringSetting("email_shlok_time", config.EmailShlokTime)
	if t == "" {
		return "0600"
	}
	return strings.TrimSpace(t)
}

// GetEmailUserLimit returns "ALL" or a limit integer string like "100".
func GetEmailUserLimit() string {
	l := GetStringSetting("email_user_limit", config.EmailUserLimit)
	if l == "" {
		return "ALL"
	}
	return strings.TrimSpace(l)
}

// GetEmailBatchSize returns batch size (e.g. 10).
func GetEmailBatchSize() int {
	return GetIntSetting("email_batch_size", config.EmailBatchSize)
}

// GetEmailBatchDelaySeconds returns delay between batches in seconds (e.g. 2).
func GetEmailBatchDelaySeconds() int {
	return GetIntSetting("email_batch_delay_seconds", config.EmailBatchDelaySeconds)
}

// ── Generic Setting Accessors ────────────────────────────────────────────────

// GetStringSetting returns the DB setting value or fallback if not found or empty.
func GetStringSetting(key string, fallback string) string {
	if database.DB == nil {
		return fallback
	}
	var s models.AppSetting
	if err := database.DB.Where("key = ?", key).First(&s).Error; err != nil || s.Value == "" {
		return fallback
	}
	return s.Value
}

// GetBoolSetting returns true/false based on DB value or fallback.
func GetBoolSetting(key string, fallback bool) bool {
	if database.DB == nil {
		return fallback
	}
	var s models.AppSetting
	if err := database.DB.Where("key = ?", key).First(&s).Error; err != nil {
		return fallback
	}
	val := strings.ToLower(strings.TrimSpace(s.Value))
	if val == "true" || val == "1" || val == "yes" {
		return true
	}
	if val == "false" || val == "0" || val == "no" {
		return false
	}
	return fallback
}

// GetIntSetting returns parsed integer or fallback.
func GetIntSetting(key string, fallback int) int {
	if database.DB == nil {
		return fallback
	}
	var s models.AppSetting
	if err := database.DB.Where("key = ?", key).First(&s).Error; err != nil {
		return fallback
	}
	if n, err := strconv.Atoi(strings.TrimSpace(s.Value)); err == nil && n >= 0 {
		return n
	}
	return fallback
}
