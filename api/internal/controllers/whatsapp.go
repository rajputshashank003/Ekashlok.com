package controllers

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"time"

	"bgs/internal/cache"
	"bgs/internal/config"
	"bgs/internal/database"
	"bgs/internal/gita"
	"bgs/internal/models"
	"bgs/internal/services"

	"github.com/gin-gonic/gin"
)


// SendOTP generates a 6-digit OTP and sends it via Twilio WhatsApp.
// POST /api/wa/send-otp
func SendOTP(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var req struct {
		Phone string `json:"phone" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "phone is required"})
		return
	}

	phone := sanitizePhone(req.Phone)
	if len(phone) < 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid phone number"})
		return
	}

	// Invalidate any previous unused OTPs for this user+phone
	database.DB.Model(&models.OTP{}).
		Where("user_id = ? AND phone = ? AND used = false", userID, phone).
		Update("used", true)

	// Generate 6-digit OTP
	code, err := generateOTP()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate OTP"})
		return
	}

	// Store OTP
	otp := models.OTP{
		UserID:    userID,
		Phone:     phone,
		Code:      code,
		ExpiresAt: time.Now().Add(10 * time.Minute),
	}
	if err := database.DB.Create(&otp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store OTP"})
		return
	}

	// Send via Twilio WhatsApp
	waNumber := "whatsapp:+" + strings.TrimPrefix(phone, "+")
	message := services.FormatOTPMessage(code)
	if err := services.SendWhatsAppMessage(waNumber, message, true); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":            "Failed to send WhatsApp message. Please check your number.",
			"sandbox_join_msg": services.SandboxJoinMessage(),
		})
		return
	}

	response := gin.H{"message": "OTP sent to WhatsApp"}
	if services.SandboxJoinMessage() != "" {
		response["sandbox_note"] = "Sandbox mode: Make sure you've joined by sending '" + config.TwilioSandboxJoinPhrase + "' to +14155238886 first"
	}
	c.JSON(http.StatusOK, response)
}

// VerifyOTP checks the OTP and marks the phone as verified.
// POST /api/wa/verify-otp
func VerifyOTP(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var req struct {
		Phone string `json:"phone" binding:"required"`
		Code  string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "phone and code are required"})
		return
	}

	phone := sanitizePhone(req.Phone)

	var otp models.OTP
	err := database.DB.Where(
		"user_id = ? AND phone = ? AND code = ? AND used = false AND expires_at > ?",
		userID, phone, req.Code, time.Now(),
	).First(&otp).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	// Mark OTP used
	database.DB.Model(&otp).Update("used", true)

	// Mark phone verified on user
	if err := database.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"phone":             phone,
		"is_phone_verified": true,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	cache.AppCache.Invalidate(fmt.Sprintf("user_%d", userID))
	c.JSON(http.StatusOK, gin.H{"message": "Phone verified successfully"})
}

// SubscribeWA subscribes the user to daily WhatsApp shloks.
// POST /api/wa/subscribe
func SubscribeWA(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var req struct {
		// "from_start"  → shlok_count = 1
		// "current"     → keep existing shlok_count
		// "custom"      → shlok_count = CustomCount
		StartChoice string `json:"start_choice" binding:"required"`
		CustomCount int    `json:"custom_count"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start_choice is required"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if !user.IsPhoneVerified {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Phone number must be verified before subscribing"})
		return
	}

	// Determine starting shlok count
	var newCount int
	switch req.StartChoice {
	case "from_start":
		newCount = 1
	case "current":
		newCount = user.ShlokCount
	case "custom":
		if req.CustomCount < 1 || req.CustomCount > gita.TotalVerses() {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("custom_count must be between 1 and %d", gita.TotalVerses())})
			return
		}
		newCount = req.CustomCount
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "start_choice must be 'from_start', 'current', or 'custom'"})
		return
	}

	updates := map[string]interface{}{
		"is_wa_subscribed": true,
		"shlok_count":      newCount,
	}
	if err := database.DB.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to subscribe"})
		return
	}

	cache.AppCache.Invalidate(fmt.Sprintf("user_%d", userID))

	// Send a welcome WhatsApp message
	waNumber := "whatsapp:+" + strings.TrimPrefix(user.Phone, "+")
	verse := gita.GetByShlokCount(newCount)
	welcomeMsg := fmt.Sprintf(
		"🌼 *Gita Daily* — Subscription Confirmed!\n\nNamaste 🙏\n\nYou're now subscribed to receive a daily shlok at *6:00 AM IST*.\n\nYour journey begins at Shlok *%d / %d*.\n\n✨ Starting tomorrow, you'll receive:\n%s\n\n_To manage your subscription, visit our website._",
		newCount, gita.TotalVerses(),
		formatShortPreview(verse),
	)
	services.SendWhatsAppMessage(waNumber, welcomeMsg) // best-effort, don't fail subscribe on this

	c.JSON(http.StatusOK, gin.H{
		"message":     "Subscribed successfully",
		"shlok_count": newCount,
	})
}

// UnsubscribeWA removes the user's WhatsApp subscription.
// POST /api/wa/unsubscribe
func UnsubscribeWA(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	if err := database.DB.Model(&models.User{}).Where("id = ?", userID).Update("is_wa_subscribed", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unsubscribe"})
		return
	}
	cache.AppCache.Invalidate(fmt.Sprintf("user_%d", userID))

	c.JSON(http.StatusOK, gin.H{"message": "Unsubscribed from WhatsApp shlok delivery"})
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func generateOTP() (string, error) {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// sanitizePhone normalises a phone number to E.164 without the leading +
// e.g. "+91 9876543210" → "919876543210"
func sanitizePhone(raw string) string {
	// Remove spaces and dashes
	phone := strings.ReplaceAll(raw, " ", "")
	phone = strings.ReplaceAll(phone, "-", "")
	// Strip leading + (Twilio wants "whatsapp:+<number>")
	phone = strings.TrimPrefix(phone, "+")
	return phone
}

// formatShortPreview returns a short 1-line preview of a verse for the welcome message.
func formatShortPreview(v *gita.Verse) string {
	if v == nil {
		return ""
	}
	return fmt.Sprintf("Adhyay %d, Shlok %d — %s", v.ChapterNumber, v.VerseNumber, truncate(v.HinglishMeaning, 80))
}

func truncate(s string, max int) string {
	runes := []rune(s)
	if len(runes) <= max {
		return s
	}
	return string(runes[:max]) + "…"
}
