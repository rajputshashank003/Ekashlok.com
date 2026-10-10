package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents a registered Gita Daily user.
type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email"`
	Name      string         `json:"name"`
	AvatarURL string         `json:"avatar_url"`
	GoogleID  string         `gorm:"uniqueIndex" json:"google_id"`
	IsAdmin   bool           `gorm:"default:false" json:"is_admin"`

	// Shlok progress (1–700). Shared between website & WhatsApp.
	ShlokCount        int        `gorm:"default:1" json:"shlok_count"`
	LastShlokAdvanced *time.Time `gorm:"index" json:"last_shlok_advanced"`

	// WhatsApp subscription
	Phone           string `gorm:"index" json:"phone"`
	IsPhoneVerified bool   `gorm:"default:false" json:"is_phone_verified"`
	IsWASubscribed  bool   `gorm:"default:false" json:"is_wa_subscribed"`

	// Email features
	EmailUnsubscribed bool       `gorm:"default:false;index" json:"email_unsubscribed"`
	LoggedCount       int        `gorm:"default:0" json:"logged_count"`
	LastActiveAt      *time.Time `gorm:"index" json:"last_active_at"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
