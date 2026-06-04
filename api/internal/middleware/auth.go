package middleware

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"bgs/internal/cache"
	"bgs/internal/config"
	"bgs/internal/database"
	"bgs/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// RequireAuth validates the Bearer JWT and sets `userID`, `isAdmin`, and `user` in the context.
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization format must be Bearer {token}"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return []byte(config.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// user_id is encoded as float64 by JSON
		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
			c.Abort()
			return
		}
		userID := uint(userIDFloat)

		// is_admin from JWT claim (authoritative — updated on login)
		isAdmin, _ := claims["is_admin"].(bool)

		c.Set("userID", userID)
		c.Set("isAdmin", isAdmin)

		// Preload user — cached in-memory for 5 min to avoid DB round trip on every request
		cacheKey := fmt.Sprintf("user_%d", userID)
		var user models.User
		if cached, ok := cache.AppCache.Get(cacheKey); ok {
			user = cached.(models.User)
		} else {
			if err := database.DB.First(&user, userID).Error; err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
				c.Abort()
				return
			}
			cache.AppCache.Set(cacheKey, user, 5*time.Minute)
		}
		c.Set("user", user)

		c.Next()
	}
}
