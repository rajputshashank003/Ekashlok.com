package models

import "time"

// AppSetting stores admin-configurable runtime settings.
type AppSetting struct {
	ID        uint      `gorm:"primaryKey"`
	Key       string    `gorm:"uniqueIndex;not null"`
	Value     string    `gorm:"not null"`
	UpdatedAt time.Time `json:"updated_at"`
}
