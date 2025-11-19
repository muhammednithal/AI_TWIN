package personality

import (
	"context"
	"encoding/json"
	"errors"
	"os"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"

	"github.com/muhammednithal/AI_TWIN/backend/internal/models"
	"github.com/muhammednithal/AI_TWIN/backend/internal/repositories"
	"github.com/muhammednithal/AI_TWIN/backend/pkg/utils"
)

type PersonalityService struct {
	personalityRepo *repositories.PersonalityRepository
	sampleRepo      *repositories.SampleRepository
	client          *genai.Client
}

func NewPersonalityService() *PersonalityService {
	ctx := context.Background()
	apiKey := os.Getenv("GEMINI_API_KEY")

	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		panic(err)
	}

	return &PersonalityService{
		personalityRepo: repositories.NewPersonalityRepository(),
		sampleRepo:      repositories.NewSampleRepository(),
		client:          client,
	}
}

type CreatePersonalityInput struct {
	UserID       string             `json:"user_id"`
	Name         string             `json:"name"`
	Language     string             `json:"language"`
	Sliders      map[string]float64 `json:"sliders"`
	StyleSummary string             `json:"style_summary"`
	Samples      []struct {
		Text   string `json:"text"`
		Source string `json:"source"`
	} `json:"samples"`
}

func (s *PersonalityService) CreatePersonality(input *CreatePersonalityInput) (*models.Personality, error) {
	if len(input.Samples) == 0 {
		return nil, errors.New("at least one sample required")
	}

	// create personality record
	p := &models.Personality{
		UserID:       utils.ParseUUID(input.UserID),
		Name:         input.Name,
		Language:     input.Language,
		StyleSummary: input.StyleSummary,
	}

	if b, err := json.Marshal(input.Sliders); err == nil {
		p.SliderJSON = b
	}

	if err := s.personalityRepo.Create(p); err != nil {
		return nil, err
	}

	// --- INDIVIDUAL EMBEDDINGS WITH GEMINI  //
	ctx := context.Background()

	model := s.client.EmbeddingModel("text-embedding-004")

	for _, sm := range input.Samples {
		// 1 sample → 1 embedding request
		resp, err := model.EmbedContent(ctx, genai.Text(sm.Text))
		if err != nil {
			return nil, err
		}

		// resp.Embedding is *ContentEmbedding
		vec := resp.Embedding.Values // []float32

		embJSON, _ := json.Marshal(vec)

		sample := &models.Sample{
			PersonalityID: p.ID,
			Text:          sm.Text,
			Source:        sm.Source,
			Embedding:     embJSON,
		}

		if err := s.sampleRepo.Create(sample); err != nil {
			return nil, err
		}

		sample.VectorID = sample.ID.String()
		s.sampleRepo.Update(sample)
	}

	return s.personalityRepo.GetByID(p.ID.String())
}

func (s *PersonalityService) PersonalityRepo() *repositories.PersonalityRepository {
	return s.personalityRepo
}
