package memory

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"github.com/google/uuid"
	"google.golang.org/api/option"

	"github.com/muhammednithal/AI_TWIN/backend/internal/models"
	"github.com/muhammednithal/AI_TWIN/backend/internal/repositories"
)

type AutoMemoryExtractor struct {
	client     *genai.Client
	memoryRepo *repositories.MemoryRepository
}

func NewAutoMemoryExtractor() *AutoMemoryExtractor {
	apiKey := os.Getenv("GEMINI_API_KEY")
	client, err := genai.NewClient(context.Background(), option.WithAPIKey(apiKey))
	if err != nil {
		panic(err)
	}

	return &AutoMemoryExtractor{
		client:     client,
		memoryRepo: repositories.NewMemoryRepository(),
	}
}

func (e *AutoMemoryExtractor) ExtractAndSave(personalityID string, userMessage string, assistantReply string) error {

	// Build prompt
	prompt := `
You are extracting personal facts from a conversation.

If the message contains a STABLE personal fact about the user, return ONLY the fact in ONE short sentence.

Examples:
- "My birthday is June 12" → "User birthday is June 12"
- "I love chai" → "User loves chai"
- "I like Python more than Java" → "User likes Python more than Java"

If it does NOT contain a personal fact or it's temporary, return exactly: NO_MEMORY

User said: "` + userMessage + `"
Assistant replied: "` + assistantReply + `"
`

	// Call Gemini small text model
	model := e.client.GenerativeModel("gemini-1.5-flash")
	resp, err := model.GenerateContent(context.Background(),
		genai.Text(prompt),
	)
	if err != nil {
		return err
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil {
		return nil // no memory
	}

	text := resp.Candidates[0].Content.Parts[0].(genai.Text)
	result := strings.TrimSpace(string(text))

	// Skip if no memory
	if result == "" || strings.ToUpper(result) == "NO_MEMORY" {
		return nil
	}

	// Embed + store memory
	return e.saveMemory(personalityID, result)
}

func (e *AutoMemoryExtractor) saveMemory(personalityID string, text string) error {
	model := e.client.EmbeddingModel("gemini-embedding-001")

	resp, err := model.EmbedContent(context.Background(), genai.Text(text))
	if err != nil {
		return err
	}
	if resp.Embedding == nil {
		return errors.New("no embedding returned")
	}

	vecJSON, _ := json.Marshal(resp.Embedding.Values)

	mem := &models.Memory{
		ID:            uuid.New(),
		PersonalityID: uuid.MustParse(personalityID),
		Content:       text,
		Tags:          "",
		Embedding:     vecJSON,
	}

	return e.memoryRepo.Create(mem)
}
