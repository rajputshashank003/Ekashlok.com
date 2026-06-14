package controllers

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"bgs/internal/activitylog"
	"bgs/internal/cache"
	"bgs/internal/database"
	"bgs/internal/gita"
	"bgs/internal/models"

	"github.com/gin-gonic/gin"
)

// GetMe returns the current user's profile.
// GET /api/users/me
func GetMe(c *gin.Context) {
	user := c.MustGet("user").(models.User)
	c.JSON(http.StatusOK, gin.H{"user": user})
}

// GetTodayShlok returns the user's current shlok.
// If the user is NOT WhatsApp-subscribed AND has not had their count advanced today,
// it advances shlok_count by 1 (once per calendar day, IST).
// GET /api/shlok/today
func GetTodayShlok(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Determine if we should advance the count today.
	// Only auto-advance on website if the user is NOT WA-subscribed
	// (WA-subscribed users get advanced by the cron job).
	if !user.IsWASubscribed {
		istLoc, _ := time.LoadLocation("Asia/Kolkata")
		now := time.Now().In(istLoc)
		todayIST := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, istLoc)

		shouldAdvance := user.LastShlokAdvanced == nil ||
			user.LastShlokAdvanced.In(istLoc).Before(todayIST)

		if shouldAdvance {
			// It's a new day — advance the counter first, then serve
			// (on day 1 / first visit, we DON'T advance; we serve shlok 1 as-is)
			if user.LastShlokAdvanced != nil {
				// Not the very first visit — advance count
				nextCount := gita.AdvanceCount(user.ShlokCount)
				now := time.Now()
				if err := database.DB.Model(&user).Updates(map[string]interface{}{
					"shlok_count":         nextCount,
					"last_shlok_advanced": now,
				}).Error; err == nil {
					user.ShlokCount = nextCount
					user.LastShlokAdvanced = &now
				}
			} else {
				// First visit ever — record today without advancing
				now := time.Now()
				database.DB.Model(&user).Update("last_shlok_advanced", now)
				user.LastShlokAdvanced = &now
			}
			// Invalidate user cache
			cache.AppCache.Invalidate(fmt.Sprintf("user_%d", userID))
		}
	}

	// shlok_count = 0 means the user just signed up; tomorrow's first delivery will
	// be shlok #1.  Show them shlok #1 on the home page as a preview.
	displayCount := user.ShlokCount
	if displayCount < 1 {
		displayCount = 1
	}

	verse := gita.GetByShlokCount(displayCount)
	if verse == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Shlok not found"})
		return
	}

	// Record today as an active day in the heatmap, storing which shlok was served.
	// The call is idempotent — visiting multiple times per day is safe.
	activitylog.Log(userID, displayCount)

	c.JSON(http.StatusOK, gin.H{
		"shlok_count":  user.ShlokCount, // raw value for progress bar
		"total_verses": gita.TotalVerses(),
		"verse":        verse,
	})
}

// GetActivityHeatmap returns the user's per-day reading history from their
// account creation date up to today (IST), pre-computed streak counts, and
// the full list of active date strings for the frontend heatmap component.
// GET /api/shlok/activity-heatmap
func GetActivityHeatmap(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	istLoc, _ := time.LoadLocation("Asia/Kolkata")
	nowIST := time.Now().In(istLoc)
	// "Today" in UTC-midnight form so it matches stored dates
	today := time.Date(nowIST.Year(), nowIST.Month(), nowIST.Day(), 0, 0, 0, 0, time.UTC)

	// Determine the start date for the DB query: user's actual join day
	createdIST := user.CreatedAt.In(istLoc)
	joinDate := time.Date(createdIST.Year(), createdIST.Month(), createdIST.Day(), 0, 0, 0, 0, time.UTC)

	// For the heatmap view we always start from Jan 1 of the join year so the
	// grid shows a full calendar year (like LeetCode) even if the user joined
	// mid-year. Days before the join date simply appear as inactive cells.
	displayStart := time.Date(createdIST.Year(), 1, 1, 0, 0, 0, 0, time.UTC)

	// Fetch all activity rows since actual join date (no logs exist before that).
	// We use a raw query so the result always works regardless of whether the
	// shlok_count column has been added yet by AutoMigrate.  COALESCE handles
	// the NULL case for rows created before the migration.
	type rawRow struct {
		ID         uint
		UserID     uint
		Date       time.Time
		ShlokCount int
	}
	var rawRows []rawRow
	rawResult := database.DB.Raw(
		`SELECT id, user_id, date,
		        COALESCE(shlok_count, 0) AS shlok_count
		   FROM shlok_activity_logs
		  WHERE user_id = ? AND date >= ?
		  ORDER BY date ASC`,
		userID, joinDate,
	).Scan(&rawRows)
	if rawResult.Error != nil {
		// If the shlok_count column doesn't exist yet (migration still pending),
		// fall back to a simpler query without that column.
		log.Printf("[HEATMAP] Rich query failed for user %d (%v) — retrying without shlok_count", userID, rawResult.Error)
		rawResult = database.DB.Raw(
			`SELECT id, user_id, date, 0 AS shlok_count
			   FROM shlok_activity_logs
			  WHERE user_id = ? AND date >= ?
			  ORDER BY date ASC`,
			userID, joinDate,
		).Scan(&rawRows)
		if rawResult.Error != nil {
			log.Printf("[HEATMAP] Fallback query also failed for user %d: %v", userID, rawResult.Error)
		}
	}

	// activeDateEntry is the per-day enriched entry returned to the frontend.
	// chapter and verse are 0 when shlok_count is unknown (legacy rows).
	type activeDateEntry struct {
		Date       string `json:"date"`
		ShlokCount int    `json:"shlok_count"`
		Chapter    int    `json:"chapter"`
		Verse      int    `json:"verse"`
	}

	// Build a de-duplicated ordered list and a fast lookup set.
	// seen maps date-string → true for streak calculation.
	seen := make(map[string]bool, len(rawRows))
	activeDates := make([]activeDateEntry, 0, len(rawRows))
	for _, l := range rawRows {
		ds := l.Date.UTC().Format("2006-01-02")
		if !seen[ds] {
			seen[ds] = true
			ch, v := gita.ShlokCountToChapterVerse(l.ShlokCount)
			activeDates = append(activeDates, activeDateEntry{
				Date:       ds,
				ShlokCount: l.ShlokCount,
				Chapter:    ch,
				Verse:      v,
			})
		}
	}

	// Build a sorted plain date-string list for streak calculations.
	activeDateStrs := make([]string, len(activeDates))
	for i, e := range activeDates {
		activeDateStrs[i] = e.Date
	}
	totalActive := len(activeDates)

	// ── Current streak ────────────────────────────────────────────────────────
	// If today is not yet active (user hasn't visited yet), count from yesterday.
	currentStreak := 0
	checkDate := today
	if !seen[checkDate.Format("2006-01-02")] {
		checkDate = checkDate.AddDate(0, 0, -1)
	}
	for {
		if seen[checkDate.Format("2006-01-02")] {
			currentStreak++
			checkDate = checkDate.AddDate(0, 0, -1)
		} else {
			break
		}
	}

	// ── Max streak ────────────────────────────────────────────────────────────
	maxStreak := 0
	if totalActive > 0 {
		maxStreak = 1
		run := 1
		for i := 1; i < len(activeDateStrs); i++ {
			prev, _ := time.Parse("2006-01-02", activeDateStrs[i-1])
			curr, _ := time.Parse("2006-01-02", activeDateStrs[i])
			if curr.Sub(prev) == 24*time.Hour {
				run++
				if run > maxStreak {
					maxStreak = run
				}
			} else {
				run = 1
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"start_date":        displayStart.Format("2006-01-02"),
		"end_date":          today.Format("2006-01-02"),
		"total_active_days": totalActive,
		"current_streak":    currentStreak,
		"max_streak":        maxStreak,
		"active_dates":      activeDates,
	})
}

// ResetShlokCount resets the user's shlok_count to 0 (so the next morning
// delivery will be shlok #1). Clears LastShlokAdvanced so the website also
// re-serves shlok #1 on the next visit.
// POST /api/shlok/reset
func ResetShlokCount(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	if err := database.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"shlok_count":         0,
		"last_shlok_advanced": nil,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset shlok count"})
		return
	}
	cache.AppCache.Invalidate(fmt.Sprintf("user_%d", userID))

	c.JSON(http.StatusOK, gin.H{"message": "Shlok count reset", "shlok_count": 0})
}

// SetShlokCount sets the user's shlok_count to any valid value (1–700).
// The value represents the last shlok the user has completed; the next
// morning delivery will be count+1.
// PATCH /api/shlok/count
func SetShlokCount(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var req struct {
		Count int `json:"count" binding:"required,min=1,max=700"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("count must be between 1 and %d", gita.TotalVerses())})
		return
	}

	if err := database.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"shlok_count":         req.Count,
		"last_shlok_advanced": nil,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update shlok count"})
		return
	}
	cache.AppCache.Invalidate(fmt.Sprintf("user_%d", userID))

	c.JSON(http.StatusOK, gin.H{"message": "Shlok count updated", "shlok_count": req.Count})
}

// GetChapters returns all 18 chapter summaries (public).
// GET /api/shloks
func GetChapters(c *gin.Context) {
	chapters := gita.GetChapterList()
	c.JSON(http.StatusOK, gin.H{"chapters": chapters})
}

// GetChapterVerses returns all verses in a given chapter (public).
// GET /api/shloks/:chapter
func GetChapterVerses(c *gin.Context) {
	var req struct {
		Chapter int `uri:"chapter" binding:"required,min=1,max=18"`
	}
	if err := c.ShouldBindUri(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid chapter number (1–18)"})
		return
	}

	verses := gita.GetChapterVerses(req.Chapter)
	if verses == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chapter not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"chapter": req.Chapter,
		"verses":  verses,
	})
}

// GetVerse returns a specific verse (public).
// GET /api/shloks/:chapter/:verse
func GetVerse(c *gin.Context) {
	var req struct {
		Chapter int `uri:"chapter" binding:"required,min=1,max=18"`
		Verse   int `uri:"verse" binding:"required,min=1"`
	}
	if err := c.ShouldBindUri(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid chapter or verse number"})
		return
	}

	verse := gita.GetByChapterVerse(req.Chapter, req.Verse)
	if verse == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Verse not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"verse": verse})
}
