package workspace

import (
	"errors"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Project is a durable topic/workspace, independent of an assistant's writing style.
type Project struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID       uuid.UUID `gorm:"type:uuid;index;not null" json:"user_id"`
	Name         string    `json:"name"`
	Purpose      string    `gorm:"type:text" json:"purpose"`
	Instructions string    `gorm:"type:text" json:"instructions"`
	Archived     bool      `json:"archived"`
	MemoryCount  int64     `gorm:"->;-:migration" json:"memory_count"`
	TaskCount    int64     `gorm:"->;-:migration" json:"task_count"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (a *API) project(c *gin.Context) (Project, bool) {
	return a.ownedProject(c, c.Param("id"))
}
func (a *API) ownedProject(c *gin.Context, raw string) (Project, bool) {
	id, ok := validID(c, raw)
	if !ok {
		return Project{}, false
	}
	var p Project
	err := a.DB.WithContext(c.Request.Context()).First(&p, "id = ? AND user_id = ?", id, current(c).ID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			fail(c, 404, "Project not found.")
		} else {
			internal(c, err)
		}
		return p, false
	}
	return p, true
}
func (a *API) listProjects(c *gin.Context) {
	out := []Project{}
	err := a.DB.WithContext(c.Request.Context()).Model(&Project{}).Select("projects.*, (SELECT COUNT(*) FROM project_memories WHERE project_id = projects.id AND archived = false) AS memory_count, (SELECT COUNT(*) FROM task_runs WHERE project_id = projects.id) AS task_count").Where("user_id = ?", current(c).ID).Order("archived ASC, updated_at DESC").Find(&out).Error
	if err != nil {
		internal(c, err)
		return
	}
	c.JSON(200, gin.H{"projects": out})
}
func (a *API) getProject(c *gin.Context) {
	p, ok := a.project(c)
	if ok {
		c.JSON(200, gin.H{"project": p})
	}
}
func (a *API) saveProject(c *gin.Context) {
	var p Project
	update := c.Param("id") != ""
	if update {
		var ok bool
		p, ok = a.project(c)
		if !ok {
			return
		}
	}
	var req struct {
		Name         string `json:"name" binding:"required,max=100"`
		Purpose      string `json:"purpose" binding:"max=3000"`
		Instructions string `json:"instructions" binding:"max=4000"`
		Archived     bool   `json:"archived"`
	}
	if c.ShouldBindJSON(&req) != nil || trim(req.Name) == "" {
		fail(c, 400, "Enter a project name of up to 100 characters.")
		return
	}
	if !update {
		p.ID = uuid.New()
		p.UserID = current(c).ID
	}
	p.Name = trim(req.Name)
	p.Purpose = trim(req.Purpose)
	p.Instructions = trim(req.Instructions)
	p.Archived = req.Archived
	var err error
	if update {
		err = a.DB.WithContext(c.Request.Context()).Model(&p).Updates(map[string]any{"name": p.Name, "purpose": p.Purpose, "instructions": p.Instructions, "archived": p.Archived}).Error
	} else {
		err = a.DB.WithContext(c.Request.Context()).Create(&p).Error
	}
	if err != nil {
		internal(c, err)
		return
	}
	c.JSON(200, gin.H{"project": p})
}

// All project-child mutations lock the parent first. Context confirmation checks
// use the same lock, so memory edits cannot silently change a running task's input.
func lockProject(tx *gorm.DB, id, userID uuid.UUID) (Project, error) {
	var p Project
	err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&p, "id = ? AND user_id = ?", id, userID).Error
	return p, err
}
