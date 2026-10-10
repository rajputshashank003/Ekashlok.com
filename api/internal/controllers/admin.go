package controllers

import (
	"net/http"
	"strconv"
	"time"

	"bgs/internal/config"
	"bgs/internal/database"
	"bgs/internal/models"
	"bgs/internal/services"
	"bgs/internal/settings"

	"github.com/gin-gonic/gin"
)

// allowedSettingKeys is the whitelist of valid app_settings keys.
// UpdateSettings rejects any key not in this list.
var allowedSettingKeys = map[string]bool{
	"max_daily_wa_messages":     true,
	"otp_maintenance":           true,
	"dispatch_maintenance":      true,
	"email_shlok_enabled":       true,
	"resend_from_email":         true,
	"admin_notification_email":  true,
	"email_shlok_day":           true,
	"email_shlok_time":          true,
	"email_user_limit":          true,
	"email_batch_size":          true,
	"email_batch_delay_seconds": true,
	"email_shlok_count":         true,
	"last_email_dispatch_date":  true,
}

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
		"total_users":        totalUsers,
		"wa_subscribers":     waSubscribers,
		"msg_sent_today":     shlokSentToday,  // shlok dispatches only
		"wa_daily_count":     waSentToday,      // ALL WA messages today
		"wa_daily_limit":     waLimit,           // current configured limit
		"wa_daily_remaining": max(0, waLimit-waSentToday),
	})
}

// GetAdminUsers returns a paginated, filtered list of all users.
// GET /api/admin/users?page=1&limit=20&shlok_count_gte=5&shlok_count_lte=100
//   &last_login_from=2024-01-01&last_login_to=2024-12-31
//   &created_from=2024-01-01&created_to=2024-12-31
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

	q := database.DB.Model(&models.User{})

	// shlok_count filters
	if v := c.Query("shlok_count_gte"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			q = q.Where("shlok_count >= ?", n)
		}
	}
	if v := c.Query("shlok_count_lte"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			q = q.Where("shlok_count <= ?", n)
		}
	}

	// logged_count filters
	if v := c.Query("logged_count_gte"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			q = q.Where("logged_count >= ?", n)
		}
	}
	if v := c.Query("logged_count_lte"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			q = q.Where("logged_count <= ?", n)
		}
	}

	// email subscription filter
	if v := c.Query("email_status"); v != "" {
		if v == "subscribed" {
			q = q.Where("email_unsubscribed = false")
		} else if v == "unsubscribed" {
			q = q.Where("email_unsubscribed = true")
		}
	}

	// last login date range filters (checks last_active_at or last_shlok_advanced)
	if v := c.Query("last_login_from"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			q = q.Where("COALESCE(last_active_at, last_shlok_advanced) >= ?", t.UTC())
		}
	}
	if v := c.Query("last_login_to"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			q = q.Where("COALESCE(last_active_at, last_shlok_advanced) <= ?", t.Add(24*time.Hour).UTC())
		}
	}

	// signup (created_at) date range filters
	if v := c.Query("created_from"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			q = q.Where("created_at >= ?", t.UTC())
		}
	}
	if v := c.Query("created_to"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			q = q.Where("created_at <= ?", t.Add(24*time.Hour).UTC())
		}
	}

	var total int64
	q.Count(&total)

	var users []models.User
	q.Order("created_at desc").Limit(limit).Offset(offset).Find(&users)

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
	var settingsList []models.AppSetting
	database.DB.Find(&settingsList)

	result := make(map[string]string, len(settingsList)+10)
	for _, s := range settingsList {
		result[s.Key] = s.Value
	}

	setIfMissing := func(k, def string) {
		if v, ok := result[k]; !ok || v == "" {
			result[k] = def
		}
	}
	setIfMissing("email_shlok_enabled", strconv.FormatBool(config.EmailShlokEnabled))
	setIfMissing("resend_from_email", config.ResendFromEmail)
	setIfMissing("admin_notification_email", config.AdminNotificationEmail)
	setIfMissing("email_shlok_day", config.EmailShlokDay)
	setIfMissing("email_shlok_time", config.EmailShlokTime)
	setIfMissing("email_user_limit", config.EmailUserLimit)
	setIfMissing("email_batch_size", strconv.Itoa(config.EmailBatchSize))
	setIfMissing("email_batch_delay_seconds", strconv.Itoa(config.EmailBatchDelaySeconds))
	setIfMissing("email_shlok_count", "1")

	c.JSON(http.StatusOK, gin.H{"settings": result})
}

// UpdateSettings updates one or more app settings.
// Only keys in allowedSettingKeys are accepted to prevent junk writes.
// PATCH /api/admin/settings
func UpdateSettings(c *gin.Context) {
	var req map[string]string
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	for k := range req {
		if !allowedSettingKeys[k] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown setting key: " + k})
			return
		}
	}

	for k, v := range req {
		var s models.AppSetting
		if err := database.DB.Where("key = ?", k).First(&s).Error; err != nil {
			database.DB.Create(&models.AppSetting{
				Key:       k,
				Value:     v,
				UpdatedAt: time.Now(),
			})
		} else {
			database.DB.Model(&s).Updates(map[string]interface{}{
				"value":      v,
				"updated_at": time.Now(),
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Settings updated"})
}

// GetPublicSettings returns the two maintenance flags without authentication.
// This lets the frontend show a site-wide banner for all users.
// GET /api/settings/public
func GetPublicSettings(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"otp_maintenance":      settings.IsOTPMaintenance(),
		"dispatch_maintenance": settings.IsDispatchMaintenance(),
	})
}

// GetFailedSignupAttempts returns a paginated, filtered log of all WA signup failures.
// GET /api/admin/signup-attempts?page=1&limit=20&created_from=2024-01-01&created_to=2024-12-31
func GetFailedSignupAttempts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	q := database.DB.Model(&models.WASignupAttempt{})

	// created_at date range filters
	if v := c.Query("created_from"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			q = q.Where("created_at >= ?", t.UTC())
		}
	}
	if v := c.Query("created_to"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			q = q.Where("created_at <= ?", t.Add(24*time.Hour).UTC())
		}
	}

	var total int64
	q.Count(&total)

	var attempts []models.WASignupAttempt
	q.Preload("User").
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&attempts)

	c.JSON(http.StatusOK, gin.H{
		"attempts": attempts,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}
