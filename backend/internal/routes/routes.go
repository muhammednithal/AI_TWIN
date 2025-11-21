package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/muhammednithal/AI_TWIN/backend/internal/handlers"
	"github.com/muhammednithal/AI_TWIN/backend/internal/middleware"
)

func RegisterRoutes(r *gin.Engine) {
	auth := handlers.NewAuthHandler()
	r.POST("/auth/signup", auth.Register)
	r.POST("/auth/login", auth.Login)

	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())

	api.GET("/me", auth.MeHandler)

	// Personality
	ph := handlers.NewPersonalityHandler()
	api.POST("/personalities", ph.Create)
	api.GET("/personalities", ph.List)
	api.GET("/personalities/:id", ph.Get)
	// Chat
	ch := handlers.NewChatHandler()
	api.POST("/chat", ch.Send)

	mh := handlers.NewMemoryHandler()

	api.POST("/memory", mh.Create)
	api.GET("/memory/:personality_id", mh.List)
	api.DELETE("/memory/:id", mh.Delete)

}
