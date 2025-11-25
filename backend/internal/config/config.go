package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port string

	DBHost string
	DBPort string
	DBUser string
	DBPass string
	DBName string

	JWTSecret string

	OpenAIKey      string
	EmbeddingModel string
	LLMModel       string
	Env            string
	// Comma separated list of allowed CORS origins (dev default set in server)
	CORSAllowedOrigins string
}

func Load() *Config {
	// Load .env file
	_ = godotenv.Load()

	cfg := &Config{
		Port:               getEnv("PORT", "8080"),
		DBHost:             getEnv("DB_HOST", "localhost"),
		DBPort:             getEnv("DB_PORT", "5432"),
		DBUser:             getEnv("DB_USER", "postgres"),
		DBPass:             getEnv("DB_PASS", ""),
		DBName:             getEnv("DB_NAME", "ai_twin"),
		JWTSecret:          getEnv("JWT_SECRET", "testsecret"),
		OpenAIKey:          getEnv("OPENAI_API_KEY", ""),
		EmbeddingModel:     getEnv("EMBEDDING_MODEL", "text-embedding-3-small"),
		LLMModel:           getEnv("LLM_MODEL", "gpt-4.1-mini"),
		Env:                getEnv("ENV", "dev"),
		CORSAllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173"),
	}

	// Warn if important vars are missing
	if cfg.JWTSecret == "" || cfg.JWTSecret == "testsecret" {
		log.Println("⚠️  WARNING: Using default JWT secret. Set JWT_SECRET in .env")
	}

	return cfg
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
