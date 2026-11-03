package workspace

import (
	"errors"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProjectMemory struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	ProjectID    uuid.UUID  `gorm:"type:uuid;index;not null" json:"project_id"`
	Title        string     `json:"title"`
	Kind         string     `json:"kind"`
	Content      string     `gorm:"type:text" json:"content"`
	Tags         string     `json:"tags"`
	Source       string     `json:"source"`
	SourceTaskID *uuid.UUID `gorm:"type:uuid" json:"source_task_id,omitempty"`
	Pinned       bool       `json:"pinned"`
	Archived     bool       `json:"archived"`
	ReviewOn     string     `json:"review_on"`
	Version      int        `json:"version"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func validMemoryKind(kind string) bool {
	switch kind {
	case "fact", "preference", "research", "instruction", "decision":
		return true
	}
	return false
}
func validDate(raw string) bool {
	if raw == "" {
		return true
	}
	_, err := time.Parse("2006-01-02", raw)
	return err == nil
}
func (a *API) listProjectMemories(c *gin.Context) {
	p, ok := a.project(c)
	if !ok {
		return
	}
	out := []ProjectMemory{}
	if err := a.DB.WithContext(c.Request.Context()).Where("project_id = ?", p.ID).Order("archived ASC, pinned DESC, updated_at DESC").Find(&out).Error; err != nil {
		internal(c, err)
		return
	}
	c.JSON(200, gin.H{"memories": out})
}
func (a *API) saveProjectMemory(c *gin.Context) {
	p, ok := a.project(c)
	if !ok {
		return
	}
	if p.Archived {
		fail(c, 409, "Restore this project before changing its memories.")
		return
	}
	var req struct {
		Title        string     `json:"title" binding:"required,max=120"`
		Kind         string     `json:"kind"`
		Content      string     `json:"content" binding:"required,max=4000"`
		Tags         string     `json:"tags" binding:"max=200"`
		Source       string     `json:"source" binding:"max=500"`
		SourceTaskID *uuid.UUID `json:"source_task_id"`
		Pinned       bool       `json:"pinned"`
		Archived     bool       `json:"archived"`
		ReviewOn     string     `json:"review_on"`
	}
	if c.ShouldBindJSON(&req) != nil || trim(req.Title) == "" || trim(req.Content) == "" || !validMemoryKind(req.Kind) || !validDate(req.ReviewOn) {
		fail(c, 400, "Enter a title, memory type, content (up to 4,000 characters), and a valid review date.")
		return
	}
	update := c.Param("memoryID") != ""
	id := uuid.New()
	if update {
		var valid bool
		id, valid = validID(c, c.Param("memoryID"))
		if !valid {
			return
		}
	}
	var result ProjectMemory
	err := a.DB.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		locked, err := lockProject(tx, p.ID, current(c).ID)
		if err != nil {
			return err
		}
		if locked.Archived {
			return errProjectArchived
		}
		if update {
			if err := tx.First(&result, "id = ? AND project_id = ?", id, p.ID).Error; err != nil {
				return err
			}
		}
		if req.SourceTaskID != nil {
			var task TaskRun
			if err := tx.First(&task, "id = ? AND project_id = ? AND user_id = ?", *req.SourceTaskID, p.ID, current(c).ID).Error; err != nil {
				return err
			}
		}
		result.ID = id
		result.ProjectID = p.ID
		result.Title = trim(req.Title)
		result.Kind = req.Kind
		result.Content = trim(req.Content)
		result.Tags = trim(req.Tags)
		result.Source = trim(req.Source)
		result.SourceTaskID = req.SourceTaskID
		result.Pinned = req.Pinned
		result.Archived = req.Archived
		result.ReviewOn = req.ReviewOn
		result.Version++
		if update {
			return tx.Model(&ProjectMemory{}).Where("id = ? AND project_id = ?", id, p.ID).Select("title", "kind", "content", "tags", "source", "source_task_id", "pinned", "archived", "review_on", "version", "updated_at").Updates(&result).Error
		}
		return tx.Create(&result).Error
	})
	if err != nil {
		projectError(c, err)
		return
	}
	c.JSON(200, gin.H{"memory": result})
}

var errProjectArchived = errors.New("project archived")

func projectError(c *gin.Context, err error) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		fail(c, 404, "Project resource not found.")
	} else if errors.Is(err, errProjectArchived) {
		fail(c, 409, "Restore this project before making changes.")
	} else {
		internal(c, err)
	}
}
