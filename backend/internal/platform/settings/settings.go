// Package settings validates runtime configuration before accepting traffic.
package settings

import (
	"fmt"
	"github.com/joho/godotenv"
	"os"
	"strings"
)

type Config struct {
	Port, DSN, JWTSecret, GeminiKey, ChatModel, EmbeddingModel, Env string
	Origins                                                         []string
}

func Load() (Config, error) {
	_ = godotenv.Load()
	c := Config{Port: env("PORT", "8080"), Env: env("ENV", "development"), JWTSecret: os.Getenv("JWT_SECRET"), GeminiKey: os.Getenv("GEMINI_API_KEY"), ChatModel: env("GEMINI_CHAT_MODEL", "gemini-3.8-flash"), EmbeddingModel: env("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001"), DSN: os.Getenv("DATABASE_URL")}
	if len(c.JWTSecret) < 32 || strings.HasPrefix(c.JWTSecret, "replace-with") {
		return c, fmt.Errorf("JWT_SECRET must contain at least 32 characters")
	}
	if c.GeminiKey == "" {
		return c, fmt.Errorf("GEMINI_API_KEY is required")
	}
	if c.DSN == "" {
		c.DSN = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s", env("DB_HOST", "localhost"), env("DB_PORT", "5432"), env("DB_USER", "postgres"), os.Getenv("DB_PASS"), env("DB_NAME", "ai_twin"), env("DB_SSLMODE", "disable"))
	}
	for _, origin := range strings.Split(env("CORS_ALLOWED_ORIGINS", "http://localhost:5173"), ",") {
		c.Origins = append(c.Origins, strings.TrimSpace(origin))
	}
	if c.Env == "production" {
		for _, origin := range c.Origins {
			if origin == "*" || !strings.HasPrefix(origin, "https://") {
				return c, fmt.Errorf("production CORS origins must use explicit HTTPS URLs")
			}
		}
	}
	return c, nil
}
func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
