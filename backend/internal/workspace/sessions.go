package workspace

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func (a *API) listSessions(c *gin.Context) {
	out := []Session{}
	query := a.DB.WithContext(c.Request.Context()).Where("user_id = ?", current(c).ID)
	if raw := c.Query("twin_id"); raw != "" {
		id, ok := validID(c, raw)
		if !ok {
			return
		}
		query = query.Where("personality_id = ?", id)
	}
	if err := query.Order("updated_at DESC").Limit(200).Find(&out).Error; err != nil {
		internal(c, err)
		return
	}
	c.JSON(200, gin.H{"sessions": out})
}
func (a *API) getSession(c *gin.Context) {
	s, ok := a.session(c)
	if !ok {
		return
	}
	s.Messages = []Message{}
	if err := a.DB.WithContext(c.Request.Context()).Where("session_id = ?", s.ID).Order("created_at ASC, id ASC").Find(&s.Messages).Error; err != nil {
		internal(c, err)
		return
	}
	c.JSON(200, gin.H{"session": s})
}
func (a *API) renameSession(c *gin.Context) {
	s, ok := a.session(c)
	if !ok {
		return
	}
	var req struct {
		Title string `json:"title" binding:"required,max=100"`
	}
	if c.ShouldBindJSON(&req) != nil || trim(req.Title) == "" {
		fail(c, 400, "Enter a title of up to 100 characters.")
		return
	}
	if err := a.DB.WithContext(c.Request.Context()).Model(&s).Update("title", trim(req.Title)).Error; err != nil {
		internal(c, err)
		return
	}
	c.JSON(200, gin.H{"session": s})
}
func (a *API) deleteSession(c *gin.Context) {
	s, ok := a.session(c)
	if !ok {
		return
	}
	err := a.DB.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		// Follow chat's lock order: twin first, then session, to avoid deadlocks.
		var twin Twin
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&twin, "id = ? AND user_id = ?", s.PersonalityID, current(c).ID).Error; err != nil {
			return err
		}
		var locked Session
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&locked, "id = ? AND user_id = ?", s.ID, current(c).ID).Error; err != nil {
			return err
		}
		if err := tx.Where("session_id = ?", s.ID).Delete(&Message{}).Error; err != nil {
			return err
		}
		return tx.Delete(&s).Error
	})
	if err != nil {
		internal(c, err)
		return
	}
	c.Status(204)
}
func (a *API) export(c *gin.Context) {
	uid := current(c).ID
	twins := []Twin{}
	sessions := []Session{}
	memories := []Memory{}
	projects := []Project{}
	projectMemories := []ProjectMemory{}
	tasks := []TaskRun{}
	decisions := []Decision{}
	err := a.DB.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		if err := tx.Preload("Samples").Where("user_id = ?", uid).Find(&twins).Error; err != nil {
			return err
		}
		if err := tx.Preload("Messages", func(db *gorm.DB) *gorm.DB { return db.Order("created_at ASC") }).Where("user_id = ?", uid).Find(&sessions).Error; err != nil {
			return err
		}
		if err := tx.Joins("JOIN personalities ON personalities.id = memories.personality_id").Where("personalities.user_id = ?", uid).Find(&memories).Error; err != nil {
			return err
		}
		if err := tx.Where("user_id = ?", uid).Find(&projects).Error; err != nil {
			return err
		}
		if err := tx.Joins("JOIN projects ON projects.id = project_memories.project_id").Where("projects.user_id = ?", uid).Find(&projectMemories).Error; err != nil {
			return err
		}
		if err := tx.Where("user_id = ?", uid).Find(&tasks).Error; err != nil {
			return err
		}
		return tx.Where("user_id = ?", uid).Find(&decisions).Error
	})
	if err != nil {
		internal(c, err)
		return
	}
	c.Header("Content-Disposition", "attachment; filename=ai-twin-workspace.json")
	c.JSON(200, gin.H{"version": 2, "user": current(c), "twins": twins, "sessions": sessions, "memories": memories, "projects": projects, "project_memories": projectMemories, "tasks": tasks, "decisions": decisions})
}
