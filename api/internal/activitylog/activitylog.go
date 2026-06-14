// Package activitylog provides a single idempotent helper for recording that
// a user read or received a shlok on a given IST calendar day.
//
// Both the website (controllers.GetTodayShlok) and the WhatsApp cron
// (services.dispatchToUser) import this package so they share one code path
// without creating circular dependencies.
package activitylog

import (
	"log"
	"time"

	"bgs/internal/database"
)

// Log records that userID was active on today's IST calendar date, reading or
// receiving shlokCount (global 1–700).
//
// The call is idempotent:
//   - If no row exists for (userID, today), it is inserted.
//   - If a row exists with shlok_count = 0 (legacy row without shlok info),
//     the shlok_count is updated to the provided value.
//   - If a row exists with a non-zero shlok_count (already recorded today),
//     it is left unchanged — the first recorded value wins.
func Log(userID uint, shlokCount int) {
	istLoc, _ := time.LoadLocation("Asia/Kolkata")
	now := time.Now().In(istLoc)

	// Normalise to midnight UTC so the stored value is stable regardless of
	// when during the IST day the function is called.
	date := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)

	result := database.DB.Exec(
		`INSERT INTO shlok_activity_logs (user_id, date, shlok_count)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (user_id, date) DO UPDATE
		   SET shlok_count = EXCLUDED.shlok_count
		   WHERE shlok_activity_logs.shlok_count IS NULL OR shlok_activity_logs.shlok_count = 0`,
		userID, date, shlokCount,
	)
	if result.Error != nil {
		log.Printf("[ACTIVITY] Failed to log activity for user %d: %v\n", userID, result.Error)
	}
}

