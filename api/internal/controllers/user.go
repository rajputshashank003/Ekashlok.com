package controllers

import (
	"net/http"
	"time"

	"bgs/internal/cache"
	"bgs/internal/database"
	"bgs/internal/gita"
	"bgs/internal/models"

	"fmt"

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

	verse := gita.GetByShlokCount(user.ShlokCount)
	if verse == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Shlok not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"shlok_count":  user.ShlokCount,
		"total_verses": gita.TotalVerses(),
		"verse":        verse,
	})
}

// ResetShlokCount resets the user's shlok_count to 1.
// POST /api/shlok/reset
func ResetShlokCount(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	if err := database.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"shlok_count":         1,
		"last_shlok_advanced": nil,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset shlok count"})
		return
	}
	cache.AppCache.Invalidate(fmt.Sprintf("user_%d", userID))

	c.JSON(http.StatusOK, gin.H{"message": "Shlok count reset to 1"})
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
