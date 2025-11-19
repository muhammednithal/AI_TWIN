package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/muhammednithal/AI_TWIN/backend/internal/models"
	"github.com/muhammednithal/AI_TWIN/backend/internal/services"
)

type ChatHandler struct {
	svc *services.ChatService
}

func NewChatHandler() *ChatHandler {
	return &ChatHandler{
		svc: services.NewChatService(),
	}
}

func (h *ChatHandler) Send(c *gin.Context) {
	var req services.ChatRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := c.MustGet("current_user").(*models.User)
	req.UserID = user.ID.String()

	resp, err := h.svc.SendMessage(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}
