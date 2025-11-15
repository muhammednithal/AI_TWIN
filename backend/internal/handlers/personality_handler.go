package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/muhammednithal/AI_TWIN/backend/internal/models"
	"github.com/muhammednithal/AI_TWIN/backend/internal/services"
)

type PersonalityHandler struct {
	svc *services.PersonalityService
}

func NewPersonalityHandler() *PersonalityHandler {
	return &PersonalityHandler{
		svc: services.NewPersonalityService(),
	}
}

type CreateReq struct {
	Name         string             `json:"name" binding:"required"`
	Language     string             `json:"language"`
	Sliders      map[string]float64 `json:"sliders"`
	StyleSummary string             `json:"style_summary"`
	Samples      []struct {
		Text   string `json:"text" binding:"required"`
		Source string `json:"source"`
	} `json:"samples" binding:"required"`
}

func (h *PersonalityHandler) Create(c *gin.Context) {
	u := c.MustGet("current_user").(*models.User)

	var req CreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input := &services.CreatePersonalityInput{
		UserID:       u.ID.String(),
		Name:         req.Name,
		Language:     req.Language,
		Sliders:      req.Sliders,
		StyleSummary: req.StyleSummary,
	}

	for _, sm := range req.Samples {
		input.Samples = append(input.Samples, services.SampleInput{
			Text:   sm.Text,
			Source: sm.Source,
		})
	}

	p, err := h.svc.CreatePersonality(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"personality": p})
}

func (h *PersonalityHandler) Get(c *gin.Context) {
	id := c.Param("id")
	p, err := h.svc.PersonalityRepo().GetByID(id)
	if err != nil {
		c.JSON(404, gin.H{"error": "not found"})
		return
	}
	c.JSON(200, gin.H{"personality": p})
}

func (h *PersonalityHandler) List(c *gin.Context) {
	u := c.MustGet("current_user").(*models.User)
	list, err := h.svc.PersonalityRepo().ListByUser(u.ID.String())
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"personalities": list})
}
