package workspace

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TaskInput struct {
	Objective    string      `json:"objective" binding:"required,max=12000"`
	Kind         string      `json:"kind" binding:"required,oneof=analyze compare plan draft"`
	MemoryIDs    []uuid.UUID `json:"memory_ids" binding:"max=30"`
	PreviewToken string      `json:"preview_token"`
	RequestID    uuid.UUID   `json:"request_id"`
}
type ContextMemory struct {
	ID           uuid.UUID  `json:"id"`
	Label        string     `json:"label"`
	Title        string     `json:"title"`
	Kind         string     `json:"kind"`
	Content      string     `json:"content"`
	Source       string     `json:"source"`
	SourceTaskID *uuid.UUID `json:"source_task_id,omitempty"`
	Version      int        `json:"version"`
	Reason       string     `json:"reason"`
	ReviewOn     string     `json:"review_on"`
	UpdatedAt    time.Time  `json:"updated_at"`
}
type TaskContext struct {
	PromptVersion int             `json:"prompt_version"`
	ProjectID     uuid.UUID       `json:"project_id"`
	ProjectName   string          `json:"project_name"`
	Purpose       string          `json:"purpose"`
	Instructions  string          `json:"instructions"`
	Objective     string          `json:"objective"`
	Kind          string          `json:"kind"`
	Memories      []ContextMemory `json:"memories"`
	Warnings      []string        `json:"warnings"`
}

var errContextChanged = errors.New("context changed")
var errInvalidContext = errors.New("invalid context")

// buildContext is deterministic: every pinned memory is included, explicit IDs
// must belong to this active project, and the size bound never silently drops a constraint.
func buildContext(p Project, memories []ProjectMemory, input TaskInput, now time.Time) (TaskContext, error) {
	out := TaskContext{PromptVersion: 2, ProjectID: p.ID, ProjectName: p.Name, Purpose: p.Purpose, Instructions: p.Instructions, Objective: trim(input.Objective), Kind: input.Kind, Memories: []ContextMemory{}, Warnings: []string{}}
	wanted := map[uuid.UUID]bool{}
	for _, id := range input.MemoryIDs {
		if id == uuid.Nil {
			return out, fmt.Errorf("%w: invalid memory ID", errInvalidContext)
		}
		wanted[id] = true
	}
	sort.Slice(memories, func(i, j int) bool {
		if memories[i].Pinned != memories[j].Pinned {
			return memories[i].Pinned
		}
		return memories[i].ID.String() < memories[j].ID.String()
	})
	for _, m := range memories {
		if m.ProjectID != p.ID || m.Archived {
			continue
		}
		selected := wanted[m.ID]
		delete(wanted, m.ID)
		if !m.Pinned && !selected {
			continue
		}
		reason := "selected"
		if m.Pinned {
			reason = "pinned constraint"
		}
		label := fmt.Sprintf("M%d", len(out.Memories)+1)
		out.Memories = append(out.Memories, ContextMemory{m.ID, label, m.Title, m.Kind, m.Content, m.Source, m.SourceTaskID, m.Version, reason, m.ReviewOn, m.UpdatedAt})
		if m.ReviewOn != "" && m.ReviewOn <= now.UTC().Format("2006-01-02") {
			out.Warnings = append(out.Warnings, label+": review date reached; verify this memory is still accurate.")
		}
	}
	if len(wanted) > 0 {
		return out, fmt.Errorf("%w: a selected memory is unavailable, archived, or outside this project", errInvalidContext)
	}
	if len(out.Memories) > 30 {
		return out, fmt.Errorf("%w: context exceeds 30 memories; unpin or deselect some memories first", errInvalidContext)
	}
	if len(out.Memories) == 0 {
		out.Warnings = append(out.Warnings, "No memories selected. The task will use only the project brief and your objective.")
	}
	return out, nil
}
func (a *API) contextToken(context TaskContext) string {
	data, _ := json.Marshal(context)
	mac := hmac.New(sha256.New, []byte(a.Secret))
	mac.Write([]byte("twin:task-context:v1\x00"))
	mac.Write(data)
	return hex.EncodeToString(mac.Sum(nil))
}
func (a *API) loadContext(db *gorm.DB, p Project, input TaskInput) (TaskContext, error) {
	memories := []ProjectMemory{}
	if err := db.Where("project_id = ? AND archived = false", p.ID).Find(&memories).Error; err != nil {
		return TaskContext{}, err
	}
	return buildContext(p, memories, input, time.Now())
}
func (a *API) previewTask(c *gin.Context) {
	p, ok := a.project(c)
	if !ok {
		return
	}
	if p.Archived {
		projectError(c, errProjectArchived)
		return
	}
	var input TaskInput
	if c.ShouldBindJSON(&input) != nil || trim(input.Objective) == "" {
		fail(c, 400, "Choose a task type and describe the result you need (up to 12,000 characters).")
		return
	}
	var preview TaskContext
	err := a.DB.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		locked, err := lockProject(tx, p.ID, current(c).ID)
		if err != nil {
			return err
		}
		if locked.Archived {
			return errProjectArchived
		}
		preview, err = a.loadContext(tx, locked, input)
		return err
	})
	if err != nil {
		if errors.Is(err, errInvalidContext) {
			fail(c, 400, err.Error())
		} else {
			projectError(c, err)
		}
		return
	}
	c.JSON(200, gin.H{"context": preview, "preview_token": a.contextToken(preview)})
}
