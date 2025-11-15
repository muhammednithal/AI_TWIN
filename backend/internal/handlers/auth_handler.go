package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/muhammednithal/AI_TWIN/backend/internal/services"
)

type AuthHandler struct {
	svc *services.AuthService
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		svc: services.NewAuthService(),
	}
}

type RegisterRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=6"`
	DisplayName string `json:"display_name"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	user, err := h.svc.Register(req.Email, req.Password, req.DisplayName)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	token, _ := h.svc.GenerateToken(user)

	c.JSON(201, gin.H{"user": user, "token": token})
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	user, token, err := h.svc.Login(req.Email, req.Password)
	if err != nil {
		c.JSON(401, gin.H{"error": "invalid credentials"})
		return
	}

	c.JSON(200, gin.H{"user": user, "token": token})
}

func (h *AuthHandler) MeHandler(c *gin.Context) {
	user, _ := c.Get("current_user")
	c.JSON(200, gin.H{"user": user})
}
