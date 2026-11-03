package workspace

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Decision struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID      uuid.UUID  `gorm:"type:uuid;index;not null" json:"user_id"`
	ProjectID   uuid.UUID  `gorm:"type:uuid;index;not null" json:"project_id"`
	TaskID      *uuid.UUID `gorm:"type:uuid" json:"task_id,omitempty"`
	Title       string     `json:"title"`
	Choice      string     `gorm:"type:text" json:"choice"`
	Reasoning   string     `gorm:"type:text" json:"reasoning"`
	Assumptions string     `gorm:"type:text" json:"assumptions"`
	Outcome     string     `gorm:"type:text" json:"outcome"`
	Status      string     `json:"status"`
	ReviewOn    string     `json:"review_on"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (a *API) listDecisions(c *gin.Context) {
	out := []Decision{}
	query := a.DB.WithContext(c.Request.Context()).Where("user_id = ?", current(c).ID)
	if raw := c.Query("project_id"); raw != "" {
		project, ok := a.ownedProject(c, raw)
		if !ok {
			return
		}
		query = query.Where("project_id = ?", project.ID)
	}
	if err := query.Order("updated_at DESC").Limit(200).Find(&out).Error; err != nil {
		internal(c, err)
		return
	}
	c.JSON(200, gin.H{"decisions": out})
}
func (a *API) saveDecision(c *gin.Context) {
	p, ok := a.project(c)
	if !ok {
		return
	}
	if p.Archived {
		projectError(c, errProjectArchived)
		return
	}
	var req struct {
		TaskID      *uuid.UUID `json:"task_id"`
		Title       string     `json:"title" binding:"required,max=120"`
		Choice      string     `json:"choice" binding:"required,max=4000"`
		Reasoning   string     `json:"reasoning" binding:"max=4000"`
		Assumptions string     `json:"assumptions" binding:"max=4000"`
		Outcome     string     `json:"outcome" binding:"max=4000"`
		Status      string     `json:"status" binding:"required,oneof=considering decided closed"`
		ReviewOn    string     `json:"review_on"`
	}
	if c.ShouldBindJSON(&req) != nil || trim(req.Title) == "" || trim(req.Choice) == "" || !validDate(req.ReviewOn) {
		fail(c, 400, "Add a title, a decision or question, a valid status, and a valid optional review date.")
		return
	}
	update := c.Param("decisionID") != ""
	id := uuid.New()
	if update {
		var valid bool
		id, valid = validID(c, c.Param("decisionID"))
		if !valid {
			return
		}
	}
	var decision Decision
	err := a.DB.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		locked, err := lockProject(tx, p.ID, current(c).ID)
		if err != nil {
			return err
		}
		if locked.Archived {
			return errProjectArchived
		}
		if update {
			if err := tx.First(&decision, "id = ? AND project_id = ? AND user_id = ?", id, p.ID, current(c).ID).Error; err != nil {
				return err
			}
		}
		if req.TaskID != nil {
			var task TaskRun
			if err := tx.First(&task, "id = ? AND project_id = ? AND user_id = ?", *req.TaskID, p.ID, current(c).ID).Error; err != nil {
				return err
			}
		}
		decision.ID = id
		decision.ProjectID = p.ID
		decision.UserID = current(c).ID
		decision.TaskID = req.TaskID
		decision.Title = trim(req.Title)
		decision.Choice = trim(req.Choice)
		decision.Reasoning = trim(req.Reasoning)
		decision.Assumptions = trim(req.Assumptions)
		decision.Outcome = trim(req.Outcome)
		decision.Status = req.Status
		decision.ReviewOn = req.ReviewOn
		if update {
			return tx.Model(&Decision{}).Where("id = ? AND project_id = ? AND user_id = ?", id, p.ID, current(c).ID).Select("task_id", "title", "choice", "reasoning", "assumptions", "outcome", "status", "review_on", "updated_at").Updates(&decision).Error
		}
		return tx.Create(&decision).Error
	})
	if err != nil {
		projectError(c, err)
		return
	}
	c.JSON(200, gin.H{"decision": decision})
}
