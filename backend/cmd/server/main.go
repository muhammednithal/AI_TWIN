package main

import (
	"context"
	"errors"
	"flag"
	"github.com/gin-gonic/gin"
	"github.com/muhammednithal/AI_TWIN/backend/internal/platform/ai"
	"github.com/muhammednithal/AI_TWIN/backend/internal/platform/settings"
	"github.com/muhammednithal/AI_TWIN/backend/internal/workspace"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	migrate := flag.Bool("migrate", false, "apply additive schema migration and exit")
	flag.Parse()
	cfg, err := settings.Load()
	if err != nil {
		slog.Error("configuration invalid", "error", err)
		os.Exit(1)
	}
	db, err := gorm.Open(postgres.Open(cfg.DSN), &gorm.Config{TranslateError: true, Logger: logger.New(log.New(os.Stdout, "", log.LstdFlags), logger.Config{SlowThreshold: time.Second, LogLevel: logger.Warn, ParameterizedQueries: true})})
	if err != nil {
		slog.Error("database connection failed", "error", err)
		os.Exit(1)
	}
	sqlDB, err := db.DB()
	if err != nil {
		slog.Error("database pool failed", "error", err)
		os.Exit(1)
	}
	defer sqlDB.Close()
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)
	if *migrate {
		if err := db.AutoMigrate(&workspace.User{}, &workspace.Twin{}, &workspace.Sample{}, &workspace.Memory{}, &workspace.Session{}, &workspace.Message{}, &workspace.Project{}, &workspace.ProjectMemory{}, &workspace.TaskRun{}, &workspace.Decision{}); err != nil {
			slog.Error("migration failed", "error", err)
			os.Exit(1)
		}
		slog.Info("schema migration complete")
		return
	}
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	router := workspace.New(db, ai.New(cfg.GeminiKey, cfg.ChatModel, cfg.EmbeddingModel), cfg.JWTSecret, cfg.Origins)
	_ = router.SetTrustedProxies(nil)
	srv := &http.Server{Addr: ":" + cfg.Port, Handler: router, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 100 * time.Second, IdleTimeout: 60 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	serverErrors := make(chan error, 1)
	go func() {
		slog.Info("AI Twin API listening", "port", cfg.Port)
		serverErrors <- srv.ListenAndServe()
	}()
	select {
	case <-ctx.Done():
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server failed", "error", err)
			os.Exit(1)
		}
	}
	shutdown, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdown); err != nil {
		slog.Error("shutdown failed", "error", err)
	}
}
