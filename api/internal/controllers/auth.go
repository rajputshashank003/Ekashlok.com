package controllers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"bgs/internal/cache"
	"bgs/internal/config"
	"bgs/internal/database"
	"bgs/internal/models"
	"bgs/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"google.golang.org/api/idtoken"
)

// VerifyGoogleToken validates a Google credential and issues a BGS JWT.
// POST /api/auth/google
func VerifyGoogleToken(c *gin.Context) {
	var req struct {
		Credential string `json:"credential" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "credential is required"})
		return
	}

	payload, err := idtoken.Validate(c.Request.Context(), req.Credential, config.GoogleClientID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Google credential"})
		return
	}

	email, _ := payload.Claims["email"].(string)
	name, _ := payload.Claims["name"].(string)
	picture, _ := payload.Claims["picture"].(string)
	googleID := payload.Subject

	if email == "" || googleID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Google token payload"})
		return
	}

	// Upsert user
	var user models.User
	result := database.DB.Where("google_id = ?", googleID).First(&user)
	if result.Error != nil {
		// New user
		isAdmin := strings.EqualFold(email, config.AdminEmail)
		user = models.User{
			Email:       email,
			Name:        name,
			AvatarURL:   picture,
			GoogleID:    googleID,
			IsAdmin:     isAdmin,
			ShlokCount:  0, // 0 = brand new; first WA delivery tomorrow = shlok #1
			LoggedCount: 1, // First login milestone
		}
		if err := database.DB.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}

		// First login milestone email (transactional journey update)
		if config.ResendAPIKey != "" {
			services.SendLoginMilestoneEmail(user.Email, user.Name, 1)
		}
	} else {
		// Existing user — update name/avatar, bootstrap admin if email matches
		now := time.Now()
		newLoggedCount := (user.LoggedCount%700) + 1
		updates := map[string]interface{}{
			"name":           name,
			"avatar_url":     picture,
			"logged_count":   newLoggedCount,
			"last_active_at": now,
		}
		if strings.EqualFold(email, config.AdminEmail) && !user.IsAdmin {
			updates["is_admin"] = true
		}
		database.DB.Model(&user).Updates(updates)
		user.Name = name
		user.AvatarURL = picture
		user.LoggedCount = newLoggedCount
		user.LastActiveAt = &now
		if strings.EqualFold(email, config.AdminEmail) {
			user.IsAdmin = true
		}

		// Fire milestone email asynchronously (non-blocking).
		// Note: Login milestone emails are transactional journey updates and are always sent on login;
		// user.EmailUnsubscribed only applies to weekly broadcasts.
		if config.ResendAPIKey != "" {
			services.SendLoginMilestoneEmail(user.Email, user.Name, newLoggedCount)
		}
	}

	// Invalidate cache so next request gets fresh user data
	cache.AppCache.Invalidate(fmt.Sprintf("user_%d", user.ID))

	token, err := issueJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to issue token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

// issueJWT creates a signed JWT for the given user.
func issueJWT(user models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"email":    user.Email,
		"is_admin": user.IsAdmin,
		"exp":      time.Now().Add(30 * 24 * time.Hour).Unix(), // 30 days
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString([]byte(config.JWTSecret))
}
