package workspace

import (
	"encoding/json"
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func (a *API) listMemories(c *gin.Context) {
	t, ok := a.twin(c, c.Query("twin_id"))
	if !ok {
		return
	}
	out := []Memory{}
	if err := a.DB.WithContext(c.Request.Context()).Where("personality_id = ?", t.ID).Order("created_at DESC").Find(&out).Error; err != nil {
		internal(c, err)
		return
	}
	c.JSON(200, gin.H{"memories": out})
}
func (a *API) ownedMemory(c *gin.Context) (Memory, bool) {
	id, ok := validID(c, c.Param("id"))
	if !ok {
		return Memory{}, false
	}
	var m Memory
	err := a.DB.WithContext(c.Request.Context()).Joins("JOIN personalities ON personalities.id = memories.personality_id").Where("memories.id = ? AND personalities.user_id = ?", id, current(c).ID).First(&m).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			fail(c, 404, "Memory not found.")
		} else {
			internal(c, err)
		}
		return m, false
	}
	return m, true
}
func (a *API) saveMemory(c *gin.Context) {
	var m Memory
	update := c.Param("id") != ""
	if update {
		var ok bool
		m, ok = a.ownedMemory(c)
		if !ok {
			return
		}
	}
	var req struct {
		PersonalityID string `json:"personality_id" binding:"required,uuid"`
		Content       string `json:"content" binding:"required,max=4000"`
		Tags          string `json:"tags" binding:"max=200"`
	}
	if c.ShouldBindJSON(&req) != nil || trim(req.Content) == "" {
		fail(c, 400, "Choose a twin and add a memory of up to 4,000 characters.")
		return
	}
	t, ok := a.twin(c, req.PersonalityID)
	if !ok {
		return
	}
	if update && m.PersonalityID != t.ID {
		fail(c, 400, "A memory cannot be moved to another twin.")
		return
	}
	vec, err := a.AI.Embed(c.Request.Context(), req.Content)
	if err != nil {
		fail(c, 502, "Could not index this memory. Try again.")
		return
	}
	if !update {
		m.ID = uuid.New()
		m.PersonalityID = t.ID
	}
	m.Content = trim(req.Content)
	m.Tags = trim(req.Tags)
	m.Embedding, _ = json.Marshal(vec)
	if err := a.DB.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		var locked Twin
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&locked, "id = ? AND user_id = ?", t.ID, current(c).ID).Error; err != nil {
			return err
		}
		if !update {
			return tx.Create(&m).Error
		}
		result := tx.Model(&Memory{}).Where("id = ? AND personality_id = ?", m.ID, t.ID).Updates(map[string]any{"content": m.Content, "tags": m.Tags, "embedding": m.Embedding})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return nil
	}); err != nil {
		internal(c, err)
		return
	}
	c.JSON(200, gin.H{"memory": m})
}
func (a *API) deleteMemory(c *gin.Context) {
	m, ok := a.ownedMemory(c)
	if !ok {
		return
	}
	if err := a.DB.WithContext(c.Request.Context()).Delete(&m).Error; err != nil {
		internal(c, err)
		return
	}
	c.Status(204)
}
