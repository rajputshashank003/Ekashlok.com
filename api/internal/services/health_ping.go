package services

import (
	"context"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"bgs/internal/config"
)

// StartHealthPingCron boots a background goroutine that periodically pings
// all URLs listed in HEALTH_URLS (comma-separated) every HEALTH_WAIT minutes.
// Accepts a context so it exits cleanly on shutdown.
func StartHealthPingCron(ctx context.Context) {
	urls := parseHealthURLs(config.HealthURLs)
	if len(urls) == 0 {
		log.Println("[HEALTH-PING] HEALTH_URLS not set — health ping cron skipped.")
		return
	}

	waitMins, err := strconv.Atoi(config.HealthWait)
	if err != nil || waitMins <= 0 {
		log.Printf("[HEALTH-PING] Invalid HEALTH_WAIT value %q, defaulting to 8 minutes.\n", config.HealthWait)
		waitMins = 8
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[HEALTH-PING] CRITICAL PANIC recovered: %v\n", r)
			}
		}()

		log.Printf("[HEALTH-PING] Cron started — pinging %d URL(s) every %d minute(s).\n", len(urls), waitMins)

		ticker := time.NewTicker(time.Duration(waitMins) * time.Minute)
		defer ticker.Stop()

		// Hit immediately on boot
		pingURLs(urls)

		for {
			select {
			case <-ticker.C:
				pingURLs(urls)
			case <-ctx.Done():
				log.Println("[HEALTH-PING] Cron stopped (context cancelled).")
				return
			}
		}
	}()
}

// pingURLs fires a GET request to each URL concurrently.
func pingURLs(urls []string) {
	log.Println("[HEALTH-PING] Pinging URLs...")
	client := &http.Client{Timeout: 15 * time.Second}

	for _, u := range urls {
		go func(url string) {
			resp, err := client.Get(url)
			if err != nil {
				log.Printf("[HEALTH-PING][ERROR] %s — %v\n", url, err)
				return
			}
			defer resp.Body.Close()
			log.Printf("[HEALTH-PING][OK] %s — %s\n", url, resp.Status)
		}(u)
	}
}

// parseHealthURLs splits the raw comma-separated env string into a clean slice.
func parseHealthURLs(raw string) []string {
	var urls []string
	for _, u := range strings.Split(raw, ",") {
		if trimmed := strings.TrimSpace(u); trimmed != "" {
			urls = append(urls, trimmed)
		}
	}
	return urls
}
