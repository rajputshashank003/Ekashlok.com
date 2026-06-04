package models

import "time"

// OTP stores a short-lived one-time password for WhatsApp phone verification.
type OTP struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uint      `gorm:"index;not null"`
	Phone     string    `gorm:"not null"`
	Code      string    `gorm:"not null"` // 6-digit numeric code
	ExpiresAt time.Time `gorm:"not null;index"`
	Used      bool      `gorm:"default:false"`
	CreatedAt time.Time
}
