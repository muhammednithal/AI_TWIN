package server

import (
	"fmt"

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

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	routes.RegisterRoutes(r)

	return &Server{engine: r, cfg: cfg}
}

func (s *Server) Start() {
	s.engine.Run(fmt.Sprintf(":%s", s.cfg.Port))
}
