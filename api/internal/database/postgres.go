package database

import (
	"fmt"
	"log"
	"time"

	"bgs/internal/config"
	"bgs/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	dsn := config.PostgresDSN

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		PrepareStmt: false,
	})
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v\n", err)
	}

	// Optimise connection pool for Neon serverless
	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.SetMaxIdleConns(10)
		sqlDB.SetMaxOpenConns(50)
		sqlDB.SetConnMaxLifetime(time.Hour)
	}

	fmt.Println("Connected to PostgreSQL successfully")
	DB = db
}

// AutoMigrate creates / updates all Gita Daily tables.
func AutoMigrate() {
	err := DB.AutoMigrate(
		&models.User{},
		&models.OTP{},
		&models.AppSetting{},
		&models.WASignupAttempt{},
	)
	if err != nil {
		log.Fatalf("AutoMigrate failed: %v\n", err)
	}
	log.Println("[DB] AutoMigrate complete")

	// Seed default settings if they don't exist
	seedDefaultSettings()
}

func seedDefaultSettings() {
	defaults := map[string]string{
		"max_daily_wa_messages": "200",
		// Maintenance flags — default OFF so no behaviour changes on first deploy
		"otp_maintenance":      "false",
		"dispatch_maintenance": "false",
	}
	for k, v := range defaults {
		DB.Where(models.AppSetting{Key: k}).FirstOrCreate(&models.AppSetting{
			Key:   k,
			Value: v,
		})
	}
}
