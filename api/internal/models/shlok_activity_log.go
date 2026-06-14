package models

import "time"

// ShlokActivityLog records one row per user per calendar day (IST) when they
// read or received a shlok. Used to render the reading-streak heatmap.
//
// Composite unique index on (user_id, date) makes the table idempotent —
// multiple calls on the same day are silently de-duplicated via ON CONFLICT.
//
// ShlokCount stores the global shlok number (1–700) that was read/delivered
// on that day. Rows created before this column was added will have ShlokCount = 0
// and are treated as "unknown" by the API — the heatmap shows them as active
// without displaying a specific chapter/verse.
type ShlokActivityLog struct {
	ID         uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     uint      `gorm:"uniqueIndex:idx_user_date;not null"  json:"user_id"`
	Date       time.Time `gorm:"uniqueIndex:idx_user_date;type:date;not null" json:"date"`
	ShlokCount int       `gorm:"default:0" json:"shlok_count"`
}
