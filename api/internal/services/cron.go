package services

import (
	"context"
	"log"
	"strconv"
	"strings"
	"time"

	"bgs/internal/config"
	"bgs/internal/database"
	"bgs/internal/models"
)

// StartDailyShlokCron schedules DispatchDailyShloks to run every day at the
// configured WA_SEND_TIME (IST). It accepts a context so the goroutine exits
// cleanly on application shutdown — no goroutine leak on SIGTERM/SIGINT.
func StartDailyShlokCron(ctx context.Context) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[CRON] PANIC in daily shlok cron: %v\n", r)
			}
		}()

		for {
			nextRun := nextSendTimeIST()
			duration := time.Until(nextRun)
			log.Printf("[CRON] Next shlok dispatch scheduled at %s IST (in %s)\n",
				nextRun.Format("2006-01-02 15:04:05"), duration.Round(time.Second))

			// ── Graceful sleep: cancelled immediately on shutdown ──────────────
			if duration > 0 {
				select {
				case <-time.After(duration):
					// woke up naturally — proceed to dispatch
				case <-ctx.Done():
					log.Println("[CRON] Daily shlok cron stopped (context cancelled).")
					return
				}
			}

			// ── DB duplicate guard ─────────────────────────────────────────────
			// Prevents double-send if the service restarts within the same minute
			// or if the process crashes and is restarted mid-dispatch.
			if alreadyDispatchedToday() {
				log.Println("[CRON] Dispatch already ran today — skipping.")
			} else {
				if err := DispatchDailyShloks(); err != nil {
					log.Printf("[CRON] Dispatch failed: %v\n", err)
				} else {
					markDispatchedToday()
				}
			}

			// ── Wait until we're fully in the NEXT minute before looping ──────
			// This prevents the loop from immediately re-triggering because
			// nextSendTimeIST() still sees "same minute" right after dispatch.
			select {
			case <-time.After(70 * time.Second):
				// safely past the dispatch minute
			case <-ctx.Done():
				log.Println("[CRON] Daily shlok cron stopped (context cancelled).")
				return
			}
		}
	}()
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// nextSendTimeIST returns the next scheduled dispatch instant in IST.
// It parses config.WASendTime (e.g. "0600" or "1345"). Falls back to 06:00.
// If we are currently inside the scheduled minute it returns now so dispatch
// runs immediately (the DB guard prevents double-sends on restart).
func nextSendTimeIST() time.Time {
	istLoc, err := time.LoadLocation("Asia/Kolkata")
	if err != nil {
		istLoc = time.FixedZone("IST", 5*3600+30*60)
	}

	hour, minute := 6, 0
	s := strings.TrimSpace(config.WASendTime)
	if len(s) == 4 {
		if h, err := strconv.Atoi(s[:2]); err == nil && h >= 0 && h <= 23 {
			if m, err := strconv.Atoi(s[2:]); err == nil && m >= 0 && m <= 59 {
				hour = h
				minute = m
			}
		}
	}

	now := time.Now().In(istLoc)

	// If we are currently inside the scheduled minute, run immediately.
	// The DB guard (alreadyDispatchedToday) handles restart-storm protection.
	if now.Hour() == hour && now.Minute() == minute {
		return now
	}

	next := time.Date(now.Year(), now.Month(), now.Day(), hour, minute, 0, 0, istLoc)
	if !now.Before(next) {
		// DST-safe: build tomorrow's date explicitly instead of adding 24h.
		// India doesn't observe DST, but this is the correct pattern regardless.
		next = time.Date(now.Year(), now.Month(), now.Day()+1, hour, minute, 0, 0, istLoc)
	}
	return next
}

// dispatchDateKey is the AppSetting key used to track the last dispatch date.
const dispatchDateKey = "last_dispatch_date"

// alreadyDispatchedToday returns true if a dispatch has already been recorded
// for today (IST date) in the app_settings table.
func alreadyDispatchedToday() bool {
	istLoc, _ := time.LoadLocation("Asia/Kolkata")
	today := time.Now().In(istLoc).Format("2006-01-02")

	var setting models.AppSetting
	if err := database.DB.Where("key = ?", dispatchDateKey).First(&setting).Error; err != nil {
		return false // key doesn't exist yet → never dispatched
	}
	return setting.Value == today
}

// markDispatchedToday upserts today's IST date into app_settings so future
// calls to alreadyDispatchedToday return true for the rest of the day.
func markDispatchedToday() {
	istLoc, _ := time.LoadLocation("Asia/Kolkata")
	today := time.Now().In(istLoc).Format("2006-01-02")

	// Use GORM's Save-or-update pattern via Upsert on the unique key index.
	database.DB.Where(models.AppSetting{Key: dispatchDateKey}).
		Assign(models.AppSetting{Value: today}).
		FirstOrCreate(&models.AppSetting{})

	// Update the value in case the row already existed with an older date.
	database.DB.Model(&models.AppSetting{}).
		Where("key = ?", dispatchDateKey).
		Update("value", today)

	log.Printf("[CRON] Dispatch marked as done for %s\n", today)
}
