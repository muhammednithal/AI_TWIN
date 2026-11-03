package workspace

import (
	"encoding/json"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func (a *API) listTwins(c *gin.Context) {
	out := []Twin{}
	err := a.DB.WithContext(c.Request.Context()).Preload("Samples").Where("user_id = ?", current(c).ID).Order("updated_at DESC").Find(&out).Error
	if err != nil {
		internal(c, err)
		return
	}
	c.JSON(200, gin.H{"twins": out})
}

type twinInput struct {
	Name         string             `json:"name" binding:"required,max=80"`
	Language     string             `json:"language" binding:"required,max=40"`
	StyleSummary string             `json:"style_summary" binding:"max=2000"`
	Sliders      map[string]float64 `json:"sliders"`
	Samples      []struct {
		Text string `json:"text" binding:"required,max=4000"`
	} `json:"samples" binding:"required,min=1,max=10,dive"`
}

func (a *API) saveTwin(c *gin.Context) {
	var existing Twin
	update := c.Param("id") != ""
	if update {
		var ok bool
		existing, ok = a.twin(c, c.Param("id"))
		if !ok {
			return
		}
	}
	var req twinInput
	if c.ShouldBindJSON(&req) != nil || trim(req.Name) == "" || trim(req.Language) == "" {
		fail(c, 400, "A name, language, and 1–10 writing samples are required.")
		return
	}
	for key, value := range req.Sliders {
		if (key != "humor" && key != "formality" && key != "empathy") || value < 0 || value > 1 {
			fail(c, 400, "Tone values must be between 0 and 1.")
			return
		}
	}
	t := existing
	if !update {
		t.ID = uuid.New()
		t.UserID = current(c).ID
	}
	t.Name = trim(req.Name)
	t.Language = trim(req.Language)
	t.StyleSummary = trim(req.StyleSummary)
	t.SliderJSON, _ = json.Marshal(req.Sliders)
	samples := make([]Sample, 0, len(req.Samples))
	for _, sample := range req.Samples {
		if trim(sample.Text) == "" {
			fail(c, 400, "Writing samples cannot be blank.")
			return
		}
		vec, err := a.AI.Embed(c.Request.Context(), sample.Text)
		if err != nil {
			fail(c, 502, "Could not learn writing samples. Please try again.")
			return
		}
		emb, _ := json.Marshal(vec)
		samples = append(samples, Sample{ID: uuid.New(), PersonalityID: t.ID, Text: trim(sample.Text), Source: "manual", Embedding: emb})
	}
	err := a.DB.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		if update {
			var locked Twin
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&locked, "id = ? AND user_id = ?", t.ID, current(c).ID).Error; err != nil {
				return err
			}
			if err := tx.Model(&Twin{}).Where("id = ? AND user_id = ?", t.ID, t.UserID).Updates(map[string]any{"name": t.Name, "language": t.Language, "style_summary": t.StyleSummary, "slider_json": t.SliderJSON}).Error; err != nil {
				return err
			}
			if err := tx.Where("personality_id = ?", t.ID).Delete(&Sample{}).Error; err != nil {
				return err
			}
		} else {
			t.Samples = nil
			if err := tx.Create(&t).Error; err != nil {
				return err
			}
		}
		return tx.Create(&samples).Error
	})
	if err != nil {
		internal(c, err)
		return
	}
	t.Samples = samples
	c.JSON(200, gin.H{"twin": t})
}
func (a *API) deleteTwin(c *gin.Context) {
	t, ok := a.twin(c, c.Param("id"))
	if !ok {
		return
	}
	err := a.DB.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		var locked Twin
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&locked, "id = ? AND user_id = ?", t.ID, current(c).ID).Error; err != nil {
			return err
		}
		sessions := tx.Model(&Session{}).Select("id").Where("personality_id = ? AND user_id = ?", t.ID, current(c).ID)
		if err := tx.Where("session_id IN (?)", sessions).Delete(&Message{}).Error; err != nil {
			return err
		}
		for _, model := range []any{&Session{}, &Memory{}, &Sample{}} {
			if err := tx.Where("personality_id = ?", t.ID).Delete(model).Error; err != nil {
				return err
			}
		}
		return tx.Delete(&t).Error
	})
	if err != nil {
		internal(c, err)
		return
	}
	c.Status(204)
}
