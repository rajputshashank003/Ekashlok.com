package controllers

import (
	"net/http"
	"strconv"
	"time"

	"bgs/internal/database"
	"bgs/internal/models"
	"bgs/internal/services"

	"github.com/gin-gonic/gin"
)

// GetAdminStats returns top-level stats for the admin dashboard.
// GET /api/admin/stats
func GetAdminStats(c *gin.Context) {
	var totalUsers, waSubscribers int64
	database.DB.Model(&models.User{}).Count(&totalUsers)
	database.DB.Model(&models.User{}).Where("is_wa_subscribed = true").Count(&waSubscribers)

	// Count shlok dispatches sent today (users whose last_shlok_advanced = today IST)
	istLoc, _ := time.LoadLocation("Asia/Kolkata")
	now := time.Now().In(istLoc)
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, istLoc)

	var shlokSentToday int64
	database.DB.Model(&models.User{}).
		Where("is_wa_subscribed = true AND last_shlok_advanced >= ?", todayStart.UTC()).
		Count(&shlokSentToday)

	// Total WA messages sent today across ALL types (OTP, shlok, welcome, admin alerts)
	waSentToday, waLimit := services.GetDailyWAStats()

	c.JSON(http.StatusOK, gin.H{
		"total_users":      totalUsers,
		"wa_subscribers":   waSubscribers,
		"msg_sent_today":   shlokSentToday,   // shlok dispatches only
		"wa_daily_count":   waSentToday,       // ALL WA messages today (OTP + shlok + welcome + alerts)
		"wa_daily_limit":   waLimit,           // current configured limit
		"wa_daily_remaining": max(0, waLimit-waSentToday),
	})
}


// GetAdminUsers returns a paginated list of all users.
// GET /api/admin/users?page=1&limit=20
func GetAdminUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	var users []models.User
	var total int64
	database.DB.Model(&models.User{}).Count(&total)
	database.DB.Order("created_at desc").Limit(limit).Offset(offset).Find(&users)

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// ToggleAdminStatus toggles the is_admin flag for a user.
// PATCH /api/admin/users/:id/toggle-admin
func ToggleAdminStatus(c *gin.Context) {
	callerID := c.MustGet("userID").(uint)

	targetID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Cannot toggle your own admin status
	if uint(targetID) == callerID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot modify your own admin status"})
		return
	}

	var targetUser models.User
	if err := database.DB.First(&targetUser, uint(targetID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	newStatus := !targetUser.IsAdmin
	if err := database.DB.Model(&targetUser).Update("is_admin", newStatus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update admin status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Admin status updated",
		"user_id":  targetUser.ID,
		"is_admin": newStatus,
	})
}

// GetSettings returns all admin-configurable app settings.
// GET /api/admin/settings
func GetSettings(c *gin.Context) {
	var settings []models.AppSetting
	database.DB.Find(&settings)

	result := make(map[string]string, len(settings))
	for _, s := range settings {
		result[s.Key] = s.Value
	}
	c.JSON(http.StatusOK, gin.H{"settings": result})
}

// UpdateSettings updates one or more app settings.
// PATCH /api/admin/settings
func UpdateSettings(c *gin.Context) {
	var req map[string]string
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	for k, v := range req {
		database.DB.Model(&models.AppSetting{}).
			Where("key = ?", k).
			Updates(map[string]interface{}{
				"value":      v,
				"updated_at": time.Now(),
			})
	}

	c.JSON(http.StatusOK, gin.H{"message": "Settings updated"})
}
