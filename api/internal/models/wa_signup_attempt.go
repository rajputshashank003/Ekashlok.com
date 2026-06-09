package models

import "time"

// WASignupAttempt logs every failed WhatsApp phone-signup attempt at any stage.
// Stage values:  "send_otp" | "verify_otp" | "subscribe"
// FailReason values: "maintenance" | "twilio_error" | "invalid_phone" |
//
//	"invalid_otp" | "phone_not_verified" | "db_error"
type WASignupAttempt struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"index;not null" json:"user_id"`
	User        User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	Phone       string    `gorm:"not null" json:"phone"`
	Stage       string    `gorm:"not null" json:"stage"`       // which step failed
	FailReason  string    `gorm:"not null" json:"fail_reason"` // why it failed
	ErrorDetail string    `json:"error_detail"`                // raw error / extra context
	CreatedAt   time.Time `json:"created_at"`
}
