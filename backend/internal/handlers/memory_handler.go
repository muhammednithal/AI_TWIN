package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/muhammednithal/AI_TWIN/backend/internal/services/memory"
)

type MemoryHandler struct {
	svc *memory.MemoryService
}

func NewMemoryHandler() *MemoryHandler {
	return &MemoryHandler{
		svc: memory.NewMemoryService(),
	}
}

func (h *MemoryHandler) Create(c *gin.Context) {
	var req memory.CreateMemoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// user := c.MustGet("current_user").(*models.User)

	// TODO: ensure personality belongs to user

	mem, err := h.svc.Create(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, mem)
}

func (h *MemoryHandler) List(c *gin.Context) {
	pid := c.Param("personality_id")

	list, err := h.svc.List(pid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *MemoryHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	err := h.svc.Delete(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"deleted": true})
}
