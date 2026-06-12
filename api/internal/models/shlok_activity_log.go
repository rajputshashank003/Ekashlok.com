package models

import "time"

// ShlokActivityLog records one row per user per calendar day (IST) when they
// read or received a shlok. Used to render the reading-streak heatmap.
//
// Composite unique index on (user_id, date) makes the table idempotent —
// multiple calls on the same day are silently de-duplicated via ON CONFLICT.
type ShlokActivityLog struct {
	ID     uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID uint      `gorm:"uniqueIndex:idx_user_date;not null"  json:"user_id"`
	Date   time.Time `gorm:"uniqueIndex:idx_user_date;type:date;not null" json:"date"`
}
