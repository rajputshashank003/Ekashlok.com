package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireAdmin is applied after RequireAuth.
// It checks that the JWT claim `is_admin` is true.
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		isAdmin, exists := c.Get("isAdmin")
		if !exists || !isAdmin.(bool) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}
