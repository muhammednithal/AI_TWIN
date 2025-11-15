package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/muhammednithal/AI_TWIN/backend/internal/handlers"
	"github.com/muhammednithal/AI_TWIN/backend/internal/middleware"
)

func RegisterRoutes(r *gin.Engine) {

	auth := handlers.NewAuthHandler()

	// Public routes
	r.POST("/auth/signup", auth.Register)
	r.POST("/auth/login", auth.Login)

	// Protected
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	api.GET("/me", auth.MeHandler)

	// Personality endpoints
	ph := handlers.NewPersonalityHandler()
	api.POST("/personality", ph.Create)
	api.GET("/personality/:id", ph.Get)
	api.GET("/personalities", ph.List)
}
