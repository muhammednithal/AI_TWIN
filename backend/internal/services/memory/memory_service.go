package memory

import (
	"context"
	"encoding/json"
	"errors"
	"os"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"

	"github.com/google/uuid"
	"github.com/muhammednithal/AI_TWIN/backend/internal/models"
	"github.com/muhammednithal/AI_TWIN/backend/internal/repositories"
)

type MemoryService struct {
	memoryRepo *repositories.MemoryRepository
	client     *genai.Client
}

func NewMemoryService() *MemoryService {
	apiKey := os.Getenv("GEMINI_API_KEY")

	client, err := genai.NewClient(context.Background(), option.WithAPIKey(apiKey))
	if err != nil {
		panic(err)
	}

	return &MemoryService{
		memoryRepo: repositories.NewMemoryRepository(),
		client:     client,
	}
}

type CreateMemoryRequest struct {
	PersonalityID string `json:"personality_id"`
	Content       string `json:"content"`
	Tags          string `json:"tags"`
}

func (s *MemoryService) Create(req CreateMemoryRequest) (*models.Memory, error) {

	// Embed using Gemini
	model := s.client.EmbeddingModel("gemini-embedding-001")

	resp, err := model.EmbedContent(context.Background(), genai.Text(req.Content))
	if err != nil {
		return nil, err
	}

	if resp.Embedding == nil {
		return nil, errors.New("no embedding returned")
	}

	vecJSON, _ := json.Marshal(resp.Embedding.Values)

	mem := &models.Memory{
		ID:            uuid.New(),
		PersonalityID: uuid.MustParse(req.PersonalityID),
		Content:       req.Content,
		Tags:          req.Tags,
		Embedding:     vecJSON,
	}

	err = s.memoryRepo.Create(mem)
	return mem, err
}

func (s *MemoryService) List(personalityID string) ([]models.Memory, error) {
	return s.memoryRepo.ListByPersonality(personalityID)
}

func (s *MemoryService) Delete(id string) error {
	return s.memoryRepo.Delete(id)
}
