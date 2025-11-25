package server

import (
	"fmt"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/muhammednithal/AI_TWIN/backend/internal/config"
	"github.com/muhammednithal/AI_TWIN/backend/internal/routes"
)

type Server struct {
	engine *gin.Engine
	cfg    *config.Config
}

func New(cfg *config.Config) *Server {
	r := gin.Default()

	// Allow CORS from the frontend dev server for development
	// Accept requests from http://localhost:5173 (Vite default) and allow Authorization header
	// parse allowed origins from config (comma separated)
	allowed := strings.Split(cfg.CORSAllowedOrigins, ",")
	for i := range allowed {
		allowed[i] = strings.TrimSpace(allowed[i])
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowed,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	routes.RegisterRoutes(r)

	return &Server{engine: r, cfg: cfg}
}

func (s *Server) Start() {
	s.engine.Run(fmt.Sprintf(":%s", s.cfg.Port))
}
