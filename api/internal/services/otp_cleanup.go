package services

import (
	"log"
	"time"

	"bgs/internal/database"
	"bgs/internal/models"
)

// StartOTPCleanupCron removes expired OTP records every hour to keep the table lean.
func StartOTPCleanupCron() {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[OTP-CLEANUP] PANIC: %v\n", r)
			}
		}()

		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()

		log.Println("[OTP-CLEANUP] Cron started — cleaning expired OTPs every hour.")

		for range ticker.C {
			result := database.DB.
				Where("expires_at < ? OR used = true", time.Now().Add(-1*time.Hour)).
				Delete(&models.OTP{})
			if result.Error != nil {
				log.Printf("[OTP-CLEANUP] Error: %v\n", result.Error)
			} else if result.RowsAffected > 0 {
				log.Printf("[OTP-CLEANUP] Removed %d expired/used OTP records\n", result.RowsAffected)
			}
		}
	}()
}
