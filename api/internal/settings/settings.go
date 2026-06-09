// Package settings provides helpers to read admin-toggleable maintenance flags
// from the app_settings table at runtime.
//
// It is a separate package to avoid import cycles between controllers, services,
// and the database/models layers.
package settings

import (
	"bgs/internal/database"
	"bgs/internal/models"
)

// IsOTPMaintenance returns true when the admin has disabled WhatsApp OTP sending.
// Default (key absent or value != "true") is false.
func IsOTPMaintenance() bool {
	return getBoolSetting("otp_maintenance")
}

// IsDispatchMaintenance returns true when the admin has paused the daily shlok
// cron dispatch to WhatsApp subscribers.
// Default (key absent or value != "true") is false.
func IsDispatchMaintenance() bool {
	return getBoolSetting("dispatch_maintenance")
}

func getBoolSetting(key string) bool {
	var s models.AppSetting
	if err := database.DB.Where("key = ?", key).First(&s).Error; err != nil {
		return false // key absent → feature is OFF
	}
	return s.Value == "true"
}
