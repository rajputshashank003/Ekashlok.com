// Package services – email_cron.go
// Implements the scheduled email shlok broadcast (weekly or daily).
//
// Configuration (all in .env):
//   EMAIL_SHLOK_ENABLED=true
//   EMAIL_SHLOK_DAY=monday          # "daily" OR any weekday name
//   EMAIL_SHLOK_TIME=0600           # 24-hr IST time, e.g. "0600", "2354"
//   EMAIL_USER_LIMIT=100            # "ALL" or a positive integer
//   EMAIL_BATCH_SIZE=10             # emails per batch
//   EMAIL_BATCH_DELAY_SECONDS=2     # seconds between batches
package services

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"bgs/internal/database"
	"bgs/internal/gita"
	"bgs/internal/models"
	"bgs/internal/settings"
)

// StartEmailShlokCron starts the scheduled email broadcast goroutine.
// It schedules based on email_shlok_day + email_shlok_time (IST).
// A DB guard (last_email_dispatch_date) prevents double-sends on restart.
func StartEmailShlokCron(ctx context.Context) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[EMAIL-CRON] PANIC: %v\n", r)
			}
		}()

		for {
			nextRun := nextEmailSendTimeIST()
			duration := time.Until(nextRun)
			log.Printf("[EMAIL-CRON] Next email dispatch at %s IST (in %s)\n",
				nextRun.Format("2006-01-02 15:04:05"), duration.Round(time.Second))

			// Graceful sleep
			if duration > 0 {
				select {
				case <-time.After(duration):
				case <-ctx.Done():
					log.Println("[EMAIL-CRON] Stopped (context cancelled).")
					return
				}
			}

			// Check runtime master switch from settings
			if !settings.IsEmailShlokEnabled() {
				log.Println("[EMAIL-CRON] Email shlok is disabled in settings. Skipping dispatch.")
			} else if emailAlreadyDispatchedForWindow() {
				log.Println("[EMAIL-CRON] Already dispatched for this window — skipping.")
			} else {
				if err := dispatchEmailShlok(); err != nil {
					log.Printf("[EMAIL-CRON] Dispatch failed: %v\n", err)
				} else {
					markEmailDispatchedNow()
				}
			}

			// Wait 70s to safely clear the current minute before next loop
			select {
			case <-time.After(70 * time.Second):
			case <-ctx.Done():
				log.Println("[EMAIL-CRON] Stopped (context cancelled).")
				return
			}
		}
	}()
}

// ─────────────────────────────────────────────────────────────────────────────
// Core dispatch
// ─────────────────────────────────────────────────────────────────────────────

func dispatchEmailShlok() error {
	istLoc, _ := time.LoadLocation("Asia/Kolkata")
	now := time.Now().In(istLoc)
	log.Printf("[EMAIL-CRON] Starting email dispatch at %s\n", now.Format(time.RFC3339))

	// ── 1. Get current email shlok count from app_settings ──────────────────
	emailCount := getEmailShlokCount()
	v := gita.GetByShlokCount(emailCount)
	if v == nil {
		return fmt.Errorf("no verse for email_shlok_count=%d", emailCount)
	}
	log.Printf("[EMAIL-CRON] Dispatching Shlok #%d (Ch%d·V%d)\n", emailCount, v.ChapterNumber, v.VerseNumber)

	// ── 2. Query recipient list ───────────────────────────────────────────────
	recipients, err := getEmailRecipients()
	if err != nil {
		return fmt.Errorf("recipient query: %w", err)
	}
	if len(recipients) == 0 {
		log.Println("[EMAIL-CRON] No eligible recipients. Nothing to send.")
		return nil
	}
	log.Printf("[EMAIL-CRON] %d recipients selected\n", len(recipients))

	// ── 3. Batch send ─────────────────────────────────────────────────────────
	batchSize := settings.GetEmailBatchSize()
	if batchSize <= 0 {
		batchSize = 10
	}
	delay := time.Duration(settings.GetEmailBatchDelaySeconds()) * time.Second

	sent, failed := 0, 0
	for i := 0; i < len(recipients); i += batchSize {
		end := i + batchSize
		if end > len(recipients) {
			end = len(recipients)
		}
		batch := recipients[i:end]

		for _, u := range batch {
			title := fmt.Sprintf("Your %s Shlok — #%d of 700 🕉️", dayLabel(), emailCount)
			subtitle := fmt.Sprintf("Namaste %s! Here is your Gita Shlok for today.", firstName(u.Name))
			html := BuildShlokEmailHTML(v, u.Email, title, subtitle, true)
			subject := fmt.Sprintf("🕉️ Shlok #%d/%d — Bhagavad Gita | Ekashlok", emailCount, gita.TotalVerses())

			if err := SendEmail(u.Email, subject, html); err != nil {
				log.Printf("[EMAIL-CRON] Failed to send to %s: %v", u.Email, err)
				failed++
			} else {
				sent++
			}
		}

		// Sleep between batches (skip after last batch)
		if end < len(recipients) && delay > 0 {
			log.Printf("[EMAIL-CRON] Batch %d–%d sent. Waiting %s before next batch…\n", i+1, end, delay)
			time.Sleep(delay)
		}
	}

	log.Printf("[EMAIL-CRON] Dispatch complete — sent: %d, failed: %d\n", sent, failed)

	// ── 4. Advance email_shlok_count (700→1) ─────────────────────────────────
	nextCount := gita.AdvanceCount(emailCount)
	upsertSetting("email_shlok_count", strconv.Itoa(nextCount))
	log.Printf("[EMAIL-CRON] email_shlok_count advanced: %d → %d\n", emailCount, nextCount)

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// Recipient selection
// ─────────────────────────────────────────────────────────────────────────────

func getEmailRecipients() ([]models.User, error) {
	q := database.DB.Model(&models.User{}).
		Where("email_unsubscribed = false AND email != ''").
		// Most recently active first
		Order("COALESCE(last_active_at, last_shlok_advanced, updated_at, created_at) DESC")

	// Respect email_user_limit
	limit := strings.TrimSpace(settings.GetEmailUserLimit())
	if limit != "" && strings.ToUpper(limit) != "ALL" {
		if n, err := strconv.Atoi(limit); err == nil && n > 0 {
			q = q.Limit(n)
		}
	}

	var users []models.User
	if err := q.Select("id, email, name").Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// Scheduling helpers
// ─────────────────────────────────────────────────────────────────────────────

// nextEmailSendTimeIST calculates the next IST instant that matches
// email_shlok_day (or "daily") + email_shlok_time.
func nextEmailSendTimeIST() time.Time {
	istLoc, err := time.LoadLocation("Asia/Kolkata")
	if err != nil {
		istLoc = time.FixedZone("IST", 5*3600+30*60)
	}

	hour, minute := parseHHMM(settings.GetEmailShlokTime(), 6, 0)
	day := strings.ToLower(strings.TrimSpace(settings.GetEmailShlokDay()))
	now := time.Now().In(istLoc)

	// Build candidate time for today
	candidate := time.Date(now.Year(), now.Month(), now.Day(), hour, minute, 0, 0, istLoc)

	if day == "daily" {
		// If we're inside the scheduled minute, run immediately (DB guard handles restart)
		if now.Hour() == hour && now.Minute() == minute {
			return now
		}
		// If candidate is in the past, move to tomorrow
		if !now.Before(candidate) {
			candidate = candidate.AddDate(0, 0, 1)
		}
		return candidate
	}

	// Weekly: advance candidate until it lands on the target weekday
	targetWD := parseWeekday(day)
	for candidate.Weekday() != targetWD || !now.Before(candidate) {
		candidate = candidate.AddDate(0, 0, 1)
	}
	// If we're inside the scheduled minute on the correct weekday, run now
	if now.Weekday() == targetWD && now.Hour() == hour && now.Minute() == minute {
		return now
	}
	return candidate
}

func parseHHMM(s string, defaultH, defaultM int) (int, int) {
	s = strings.TrimSpace(s)
	if len(s) == 4 {
		if h, err := strconv.Atoi(s[:2]); err == nil && h >= 0 && h <= 23 {
			if m, err := strconv.Atoi(s[2:]); err == nil && m >= 0 && m <= 59 {
				return h, m
			}
		}
	}
	return defaultH, defaultM
}

func parseWeekday(s string) time.Weekday {
	switch s {
	case "sunday":    return time.Sunday
	case "monday":    return time.Monday
	case "tuesday":   return time.Tuesday
	case "wednesday": return time.Wednesday
	case "thursday":  return time.Thursday
	case "friday":    return time.Friday
	case "saturday":  return time.Saturday
	default:          return time.Monday
	}
}

func dayLabel() string {
	if strings.ToLower(settings.GetEmailShlokDay()) == "daily" {
		return "Daily"
	}
	return "Weekly"
}

// ─────────────────────────────────────────────────────────────────────────────
// DB guard helpers
// ─────────────────────────────────────────────────────────────────────────────

const emailDispatchDateKey = "last_email_dispatch_date"

// emailAlreadyDispatchedForWindow returns true if the last email dispatch
// occurred within the last 23 hours (prevents double-send on restart).
func emailAlreadyDispatchedForWindow() bool {
	var setting models.AppSetting
	if err := database.DB.Where("key = ?", emailDispatchDateKey).First(&setting).Error; err != nil {
		return false
	}
	t, err := time.Parse(time.RFC3339, setting.Value)
	if err != nil {
		return false
	}
	return time.Since(t) < 23*time.Hour
}

func markEmailDispatchedNow() {
	upsertSetting(emailDispatchDateKey, time.Now().UTC().Format(time.RFC3339))
	log.Printf("[EMAIL-CRON] Dispatch guard set to now.\n")
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings helpers
// ─────────────────────────────────────────────────────────────────────────────

// getEmailShlokCount reads the current email broadcast shlok counter from DB.
// Defaults to 1 if not set.
func getEmailShlokCount() int {
	var s models.AppSetting
	if err := database.DB.Where("key = ?", "email_shlok_count").First(&s).Error; err != nil {
		return 1
	}
	n, err := strconv.Atoi(s.Value)
	if err != nil || n < 1 || n > gita.TotalVerses() {
		return 1
	}
	return n
}
