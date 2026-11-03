package workspace

import (
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var errImportTooLarge = errors.New("imported memory too large")

// Import is explicit and copy-only. Stable destination IDs make retries safe;
// rerunning an import never overwrites a project memory the user has edited.
func (a *API) importTwinMemories(c *gin.Context) {
	p, ok := a.project(c)
	if !ok {
		return
	}
	var req struct {
		TwinID    uuid.UUID   `json:"twin_id"`
		MemoryIDs []uuid.UUID `json:"memory_ids" binding:"required,min=1,max=30"`
		Kind      string      `json:"kind"`
	}
	if c.ShouldBindJSON(&req) != nil || req.TwinID == uuid.Nil || !validMemoryKind(req.Kind) {
		fail(c, 400, "Choose a twin, a memory type, and up to 30 memories.")
		return
	}
	var twin Twin
	if err := a.DB.WithContext(c.Request.Context()).First(&twin, "id = ? AND user_id = ?", req.TwinID, current(c).ID).Error; err != nil {
		projectError(c, err)
		return
	}
	wanted := map[uuid.UUID]bool{}
	for _, id := range req.MemoryIDs {
		if id == uuid.Nil {
			fail(c, 400, "Invalid memory selection.")
			return
		}
		wanted[id] = true
	}
	rows := []Memory{}
	if err := a.DB.WithContext(c.Request.Context()).Where("personality_id = ? AND id IN ?", twin.ID, req.MemoryIDs).Find(&rows).Error; err != nil {
		internal(c, err)
		return
	}
	if len(rows) != len(wanted) {
		fail(c, 400, "Some memories are unavailable for this twin.")
		return
	}
	var imported int64
	err := a.DB.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		locked, err := lockProject(tx, p.ID, current(c).ID)
		if err != nil {
			return err
		}
		if locked.Archived {
			return errProjectArchived
		}
		for _, row := range rows {
			title := []rune(trim(row.Content))
			if len(title) > 110 {
				title = title[:110]
			}
			if len(title) == 0 {
				continue
			}
			if len([]rune(row.Content)) > 4000 {
				return errImportTooLarge
			}
			note := ProjectMemory{ID: uuid.NewSHA1(p.ID, []byte("legacy-memory:"+row.ID.String())), ProjectID: p.ID, Title: string(title), Kind: req.Kind, Content: row.Content, Tags: row.Tags, Source: "Imported from twin: " + twin.Name + " · memory " + row.ID.String(), Version: 1}
			result := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&note)
			if result.Error != nil {
				return result.Error
			}
			imported += result.RowsAffected
		}
		return nil
	})
	if err != nil {
		if err == errImportTooLarge {
			fail(c, 400, "A selected memory exceeds 4,000 characters. Shorten it before importing.")
		} else {
			projectError(c, err)
		}
		return
	}
	c.JSON(200, gin.H{"imported": imported, "already_present_or_empty": len(rows) - int(imported)})
}
