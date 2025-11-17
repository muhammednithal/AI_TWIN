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
	return &PersonalityHandler{svc: services.NewPersonalityService()}
}

type CreateReq struct {
	Name         string             `json:"name" binding:"required"`
	Language     string             `json:"language"`
	Sliders      map[string]float64 `json:"sliders"`
	StyleSummary string             `json:"style_summary"`
	Samples      []struct {
		Text   string `json:"text" binding:"required"`
		Source string `json:"source"`
	} `json:"samples" binding:"required,min=1"`
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
	for _, s := range req.Samples {
		input.Samples = append(input.Samples, struct {
			Text   string `json:"text"`
			Source string `json:"source"`
		}{Text: s.Text, Source: s.Source})
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
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"personality": p})
}

func (h *PersonalityHandler) List(c *gin.Context) {
	u := c.MustGet("current_user").(*models.User)
	out, err := h.svc.PersonalityRepo().ListByUser(u.ID.String())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"personalities": out})
}
