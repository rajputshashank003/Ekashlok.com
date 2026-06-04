package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"bgs/internal/config"
	"bgs/internal/database"
	"bgs/internal/gita"
	"bgs/internal/routes"
	"bgs/internal/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Load configuration
	config.Load()

	// 2. Connect to PostgreSQL
	database.Connect()

	// 3. Run DB migrations
	database.AutoMigrate()

	// 4. Load Gita data into memory
	gita.Load()

	// 5. Configure Gin
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173",
			"http://localhost:5174",
			config.FrontendURL,
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 6. Register routes
	routes.SetupRoutes(r)

	// 7. OS signal context — cancelled on SIGINT (Ctrl+C) or SIGTERM.
	// All background goroutines receive this so they exit cleanly.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// 8. Start background jobs
	services.StartDailyShlokCron(ctx)
	services.StartOTPCleanupCron()

	if config.RunUptimeCron {
		services.StartHealthPingCron(ctx)
	}

	// 9. Build http.Server manually so we can call Shutdown() on it.
	//    This is the key difference from r.Run() — Gin's r.Run() blocks
	//    forever and ignores context cancellation.
	srv := &http.Server{
		Addr:    ":" + config.Port,
		Handler: r,
	}

	// Start server in a goroutine so we don't block signal handling below.
	go func() {
		log.Printf("Gita Daily API running on port %s\n", config.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[SERVER] ListenAndServe error: %v\n", err)
		}
	}()

	// 10. Block until Ctrl+C / SIGTERM arrives.
	<-ctx.Done()
	stop() // release signal resources

	log.Println("[SERVER] Shutdown signal received — draining connections (5s timeout)...")

	// Give in-flight requests up to 5 seconds to finish.
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("[SERVER] Forced shutdown after timeout: %v\n", err)
	} else {
		log.Println("[SERVER] Graceful shutdown complete. Bye 🙏")
	}
}
