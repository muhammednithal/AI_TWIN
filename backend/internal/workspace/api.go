package workspace

import (
	"context"
	"errors"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/muhammednithal/AI_TWIN/backend/internal/platform/ai"
	"gorm.io/gorm"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"
)

type API struct {
	DB      *gorm.DB
	AI      ai.Client
	Secret  string
	flights sync.Map
}

func New(db *gorm.DB, client ai.Client, secret string, origins []string) *gin.Engine {
	a := &API{DB: db, AI: client, Secret: secret}
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.Use(func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 90*time.Second)
		defer cancel()
		c.Request = c.Request.WithContext(ctx)
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("Cache-Control", "no-store")
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 1<<20)
		c.Next()
	})
	r.Use(cors.New(cors.Config{AllowOrigins: origins, AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}, AllowHeaders: []string{"Content-Type", "Authorization"}, MaxAge: 12 * time.Hour}))
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
	r.GET("/ready", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()
		db, err := a.DB.DB()
		if err != nil || db.PingContext(ctx) != nil {
			fail(c, 503, "Database unavailable.")
			return
		}
		c.JSON(200, gin.H{"status": "ready"})
	})
	authLimit := limiter(10, time.Minute, false)
	r.POST("/auth/signup", authLimit, a.signup)
	r.POST("/auth/login", authLimit, a.login)
	api := r.Group("/api", a.authenticate)
	api.GET("/me", func(c *gin.Context) { c.JSON(200, gin.H{"user": current(c)}) })
	api.GET("/twins", a.listTwins)
	api.POST("/twins", limiter(10, time.Minute, true), a.saveTwin)
	api.PUT("/twins/:id", limiter(10, time.Minute, true), a.saveTwin)
	api.DELETE("/twins/:id", a.deleteTwin)
	api.GET("/memories", a.listMemories)
	api.POST("/memories", limiter(20, time.Minute, true), a.saveMemory)
	api.PUT("/memories/:id", limiter(20, time.Minute, true), a.saveMemory)
	api.DELETE("/memories/:id", a.deleteMemory)
	api.GET("/sessions", a.listSessions)
	api.GET("/sessions/:id", a.getSession)
	api.PUT("/sessions/:id", a.renameSession)
	api.DELETE("/sessions/:id", a.deleteSession)
	api.POST("/chat", limiter(30, time.Minute, true), a.chat)
	api.GET("/export", a.export)
	return r
}
func fail(c *gin.Context, status int, message string) {
	c.AbortWithStatusJSON(status, gin.H{"error": message})
}
func internal(c *gin.Context, err error) {
	slog.Error("workspace request failed", "path", c.FullPath(), "error", err)
	fail(c, 500, "Something went wrong. Please try again.")
}
func validID(c *gin.Context, raw string) (uuid.UUID, bool) {
	id, err := uuid.Parse(raw)
	if err != nil || id == uuid.Nil {
		fail(c, 400, "Invalid resource ID.")
		return uuid.Nil, false
	}
	return id, true
}
func (a *API) twin(c *gin.Context, raw string) (Twin, bool) {
	id, ok := validID(c, raw)
	if !ok {
		return Twin{}, false
	}
	var t Twin
	err := a.DB.WithContext(c.Request.Context()).Preload("Samples").First(&t, "id = ? AND user_id = ?", id, current(c).ID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			fail(c, 404, "Twin not found.")
		} else {
			internal(c, err)
		}
		return t, false
	}
	return t, true
}
func (a *API) session(c *gin.Context) (Session, bool) {
	id, ok := validID(c, c.Param("id"))
	if !ok {
		return Session{}, false
	}
	var s Session
	err := a.DB.WithContext(c.Request.Context()).First(&s, "id = ? AND user_id = ?", id, current(c).ID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			fail(c, 404, "Conversation not found.")
		} else {
			internal(c, err)
		}
		return s, false
	}
	return s, true
}

// The in-process limiter bounds abuse and memory. Multi-replica deployments need a shared edge limiter.
func limiter(max int, window time.Duration, authenticated bool) gin.HandlerFunc {
	type entry struct {
		count int
		until time.Time
	}
	var mu sync.Mutex
	entries := map[string]entry{}
	return func(c *gin.Context) {
		key := c.ClientIP()
		if authenticated {
			key = current(c).ID.String()
		}
		now := time.Now()
		mu.Lock()
		if len(entries) > 10000 {
			for k, v := range entries {
				if now.After(v.until) {
					delete(entries, k)
				}
			}
			if len(entries) > 10000 {
				mu.Unlock()
				fail(c, 429, "Server is busy. Try again shortly.")
				return
			}
		}
		v := entries[key]
		if now.After(v.until) {
			v = entry{until: now.Add(window)}
		}
		v.count++
		entries[key] = v
		mu.Unlock()
		if v.count > max {
			c.Header("Retry-After", "60")
			fail(c, 429, "Too many requests. Try again in a minute.")
			return
		}
		c.Next()
	}
}
func trim(s string) string { return strings.TrimSpace(s) }
