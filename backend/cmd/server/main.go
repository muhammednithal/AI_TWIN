package main

import (
	"log"

	"github.com/muhammednithal/AI_TWIN/backend/internal/config"
	"github.com/muhammednithal/AI_TWIN/backend/internal/models"
	"github.com/muhammednithal/AI_TWIN/backend/internal/server"
)

func main() {
	cfg := config.Load()

	// Connect DB
	config.ConnectDatabase(cfg)

	// Run migrations
	if cfg.Env == "dev" {
		log.Println("🛠 Running auto migrations (dev mode)")
		config.DB.AutoMigrate(
			&models.User{},
			&models.Personality{},
			&models.Sample{},
			&models.Memory{},
			&models.ChatSession{},
			&models.Message{},
		)
		log.Println("🛠 Database migrated")
	}

	s := server.New(cfg)

	log.Println("🚀 AI Twin backend running on port", cfg.Port)
	s.Start()
}
