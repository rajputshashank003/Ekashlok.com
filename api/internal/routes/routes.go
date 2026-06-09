package routes

import (
	"net/http"

	"bgs/internal/controllers"
	"bgs/internal/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes registers all Gita Daily API endpoints.
func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		// ── Health ────────────────────────────────────────────────────────
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "Gita Daily API"})
		})

		// ── Public Settings (no auth required) ─────────────────────────
		// Returns maintenance flags so the frontend can show banners without auth.
		api.GET("/settings/public", controllers.GetPublicSettings)

		// ── Auth ──────────────────────────────────────────────────────────
		auth := api.Group("/auth")
		{
			auth.POST("/google", controllers.VerifyGoogleToken)
		}

		// ── Shlok Browse (Public) ─────────────────────────────────────────
		shloks := api.Group("/shloks")
		{
			shloks.GET("", controllers.GetChapters)
			shloks.GET("/:chapter", controllers.GetChapterVerses)
			shloks.GET("/:chapter/:verse", controllers.GetVerse)
		}

		// ── Authenticated User Endpoints ──────────────────────────────────
		users := api.Group("/users")
		users.Use(middleware.RequireAuth())
		{
			users.GET("/me", controllers.GetMe)
		}

		// ── Shlok (Protected) ─────────────────────────────────────────────
		shlok := api.Group("/shlok")
		shlok.Use(middleware.RequireAuth())
		{
			shlok.GET("/today", controllers.GetTodayShlok)
			shlok.POST("/reset", controllers.ResetShlokCount)
			shlok.PATCH("/count", controllers.SetShlokCount)
		}

		// ── WhatsApp (Protected) ──────────────────────────────────────────
		wa := api.Group("/wa")
		wa.Use(middleware.RequireAuth())
		{
			wa.POST("/send-otp", controllers.SendOTP)
			wa.POST("/verify-otp", controllers.VerifyOTP)
			wa.POST("/subscribe", controllers.SubscribeWA)
			wa.POST("/unsubscribe", controllers.UnsubscribeWA)
		}

		// ── Admin (Protected + Admin role) ────────────────────────────────
		admin := api.Group("/admin")
		admin.Use(middleware.RequireAuth(), middleware.RequireAdmin())
		{
			admin.GET("/stats", controllers.GetAdminStats)
			admin.GET("/users", controllers.GetAdminUsers)
			admin.PATCH("/users/:id/toggle-admin", controllers.ToggleAdminStatus)
			admin.GET("/settings", controllers.GetSettings)
			admin.PATCH("/settings", controllers.UpdateSettings)
			admin.GET("/signup-attempts", controllers.GetFailedSignupAttempts)
		}
	}
}
