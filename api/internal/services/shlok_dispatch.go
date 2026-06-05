package services

import (
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"bgs/internal/config"
	"bgs/internal/database"
	"bgs/internal/gita"
	"bgs/internal/models"
)

// DispatchDailyShloks sends the daily shlok WhatsApp message to all active subscribers.
// It respects the MAX_DAILY_WA_MESSAGES setting stored in AppSetting.
// Returns an error only for fatal failures (e.g. DB unreachable). Per-user
// send failures are logged but do not abort the whole batch.
func DispatchDailyShloks() error {
	log.Println("[DISPATCH] Starting daily shlok dispatch...")

	// Read max messages limit from DB settings
	maxMessages := readMaxMessages()

	// Fetch all active WA subscribers with verified phones
	var subscribers []models.User
	if err := database.DB.
		Where("is_wa_subscribed = true AND is_phone_verified = true AND phone != ''").
		Find(&subscribers).Error; err != nil {
		log.Printf("[DISPATCH] Failed to fetch subscribers: %v\n", err)
		return err
	}

	log.Printf("[DISPATCH] Found %d subscribers (limit: %d)\n", len(subscribers), maxMessages)

	sent := 0
	limitHit := false
	for _, user := range subscribers {
		if err := dispatchToUser(user); err != nil {
			// If the global daily WA cap was hit, stop immediately and alert admin.
			if err == ErrDailyWALimitReached {
				log.Printf("[DISPATCH] Daily WA limit of %d reached — stopping dispatch\n", maxMessages)
				limitHit = true
				break
			}
			log.Printf("[DISPATCH] Failed for user %d (%s): %v\n", user.ID, user.Phone, err)
			continue
		}
		sent++
	}

	log.Printf("[DISPATCH] Daily dispatch complete — sent to %d/%d subscribers\n", sent, len(subscribers))

	// ── Admin WhatsApp alert when daily limit is hit ───────────────────────────
	// Fires a WA message to the admin's registered phone number so they know
	// some subscribers were skipped and can raise MAX_DAILY_WA_MESSAGES before
	// tomorrow's dispatch.
	if limitHit {
		skipped := len(subscribers) - sent
		go notifyAdminLimitReached(sent, skipped, maxMessages)
	}

	return nil
}

// dispatchToUser sends the shlok and advances the count for one subscriber.
func dispatchToUser(user models.User) error {
	// shlok_count = 0 means the user is new / was reset to the beginning.
	// Their first delivery should be shlok #1.
	// We normalise here so the rest of the logic is uniform.
	if user.ShlokCount < 1 {
		log.Printf("[DISPATCH] User %d has shlok_count=0 (new/reset) — will deliver shlok #1\n", user.ID)
		user.ShlokCount = 0 // AdvanceCount(0) = 1, so they get shlok #1
	}

	// Determine which shlok to send: AdvanceCount gives the NEXT shlok.
	// shlok_count represents "last completed", so the next one to send is count+1.
	nextCount := gita.AdvanceCount(user.ShlokCount)
	verse := gita.GetByShlokCount(nextCount)
	if verse == nil {
		// Should never happen given AdvanceCount wraps 700→1, but guard anyway.
		log.Printf("[DISPATCH] Could not find verse for count %d (user %d) — skipping\n", nextCount, user.ID)
		return nil
	}

	message := FormatShlokMessage(verse)
	waNumber := "whatsapp:+" + strings.TrimPrefix(user.Phone, "+")

	if err := SendWhatsAppMessage(waNumber, message); err != nil {
		return err
	}

	// Mark this shlok as delivered — advance the stored count.
	wasLast := nextCount == gita.TotalVerses()
	now := time.Now()

	database.DB.Model(&models.User{}).Where("id = ?", user.ID).Updates(map[string]interface{}{
		"shlok_count":         nextCount,
		"last_shlok_advanced": now,
	})

	// If user just completed all 700 shloks, send a completion message
	if wasLast {
		go sendCompletionMessage(user.Phone, user.Name)
	}

	return nil
}


// sendCompletionMessage sends a congratulatory message when user finishes all 700 shloks.
func sendCompletionMessage(phone, name string) {
	waNumber := "whatsapp:+" + strings.TrimPrefix(phone, "+")
	firstName := strings.Fields(name)
	greeting := "Friend"
	if len(firstName) > 0 {
		greeting = firstName[0]
	}

	msg := "🙏 *Congratulations, " + greeting + "!*\n\n" +
		"You have completed all *700 shloks* of the Bhagavad Gita! 🌸\n\n" +
		"_\"Anantas chasmi naganam\"_ — I am the infinite among serpents (Gita 10.29)\n\n" +
		"Your journey begins anew from *Adhyay 1, Shlok 1* tomorrow.\n\n" +
		"Jai Shri Krishna 🕉️\n— _Gita Daily_"

	SendWhatsAppMessage(waNumber, msg)
}

// readMaxMessages fetches the max_daily_wa_messages setting from DB.
// Falls back to config value if not found.
func readMaxMessages() int {
	var setting models.AppSetting
	if err := database.DB.Where("key = ?", "max_daily_wa_messages").First(&setting).Error; err == nil {
		if v, err := strconv.Atoi(setting.Value); err == nil && v > 0 {
			return v
		}
	}
	return 200 // fallback
}

// notifyAdminLimitReached sends a WhatsApp alert to the admin when the daily
// message cap is hit mid-dispatch. It looks up the admin's phone number from
// the users table using config.AdminEmail so no extra env var is needed.
func notifyAdminLimitReached(sent, skipped, limit int) {
	// Find admin user's phone
	var admin models.User
	if err := database.DB.
		Where("email = ? AND phone != '' AND is_phone_verified = true", config.AdminEmail).
		First(&admin).Error; err != nil {
		log.Printf("[DISPATCH] Admin limit alert: could not find admin phone (%v) — alert not sent\n", err)
		return
	}

	waNumber := "whatsapp:+" + strings.TrimPrefix(admin.Phone, "+")
	msg := fmt.Sprintf(
		"⚠️ *Gita Daily — Daily Limit Reached*\n\n"+
			"Today's WhatsApp dispatch hit the limit of *%d messages*.\n\n"+
			"✅ Sent: *%d* subscribers\n"+
			"❌ Skipped: *%d* subscribers\n\n"+
			"To fix before tomorrow:\n"+
			"→ Go to Admin → Settings → raise *MAX_DAILY_WA_MESSAGES* above %d\n\n"+
			"_Gita Daily Admin_",
		limit, sent, skipped, limit,
	)

	if err := SendWhatsAppMessage(waNumber, msg, true); err != nil {
		log.Printf("[DISPATCH] Admin limit alert: failed to send WA to admin (%s): %v\n", admin.Phone, err)
		return
	}
	log.Printf("[DISPATCH] Admin limit alert sent to %s (sent=%d, skipped=%d, limit=%d)\n",
		admin.Phone, sent, skipped, limit)
}
