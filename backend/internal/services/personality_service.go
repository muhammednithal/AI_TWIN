package services

import (
	"context"
	"encoding/json"
	"errors"
	"os"

	openai "github.com/sashabaranov/go-openai"

	"github.com/muhammednithal/AI_TWIN/backend/internal/models"
	"github.com/muhammednithal/AI_TWIN/backend/internal/repositories"
	"github.com/muhammednithal/AI_TWIN/backend/pkg/utils"
)

type PersonalityService struct {
	personalityRepo *repositories.PersonalityRepository
	sampleRepo      *repositories.SampleRepository
	openaiClient    *openai.Client
	embeddingModel  string
}

func NewPersonalityService() *PersonalityService {
	client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))
	model := os.Getenv("EMBEDDING_MODEL")
	if model == "" {
		model = "text-embedding-3-small"
	}

	return &PersonalityService{
		personalityRepo: repositories.NewPersonalityRepository(),
		sampleRepo:      repositories.NewSampleRepository(),
		openaiClient:    client,
		embeddingModel:  model,
	}
}

type CreatePersonalityInput struct {
	UserID       string             `json:"user_id"`
	Name         string             `json:"name"`
	Language     string             `json:"language"`
	Sliders      map[string]float64 `json:"sliders"`
	StyleSummary string             `json:"style_summary"`
	Samples      []SampleInput      `json:"samples"`
}

type SampleInput struct {
	Text   string `json:"text"`
	Source string `json:"source"`
}

func (s *PersonalityService) CreatePersonality(input *CreatePersonalityInput) (*models.Personality, error) {

	if len(input.Samples) == 0 {
		return nil, errors.New("at least 1 sample required")
	}

	// personality record
	p := &models.Personality{
		UserID:       utils.ParseUUID(input.UserID),
		Name:         input.Name,
		Language:     input.Language,
		StyleSummary: input.StyleSummary,
	}

	slidersJSON, _ := json.Marshal(input.Sliders)
	p.SliderJSON = slidersJSON

	// create personality
	if err := s.personalityRepo.Create(p); err != nil {
		return nil, err
	}

	// collect texts for bulk embedding
	var texts []string
	for _, sm := range input.Samples {
		texts = append(texts, sm.Text)
	}

	// bulk request
	embedResp, err := s.openaiClient.CreateEmbeddings(
		context.Background(),
		openai.EmbeddingRequest{
			Model: openai.EmbeddingModel(s.embeddingModel),
			Input: texts,
		},
	)

	if err != nil {
		return nil, err
	}

	// map each embedding to samples
	for i, sm := range input.Samples {
		vec := embedResp.Data[i].Embedding

		vecJSON, _ := json.Marshal(vec)

		sample := &models.Sample{
			PersonalityID: p.ID,
			Text:          sm.Text,
			Source:        sm.Source,
			Embedding:     vecJSON,
		}

		if err := s.sampleRepo.Create(sample); err != nil {
			return nil, err
		}

		// assign vector_id after sample has ID
		sample.VectorID = sample.ID.String()
		if err := s.sampleRepo.Update(sample); err != nil {
			return nil, err
		}
	}

	// return fully hydrated personality
	return s.personalityRepo.GetByID(p.ID.String())
}

func (s *PersonalityService) PersonalityRepo() *repositories.PersonalityRepository {
	return s.personalityRepo
}
