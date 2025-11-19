package llm

import (
	"context"
	"errors"
	"os"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

// LLMClient: simple interface for chat generation.
type LLMClient interface {
	Generate(ctx context.Context, prompt string) (string, error)
}

type GeminiLLM struct {
	client *genai.Client
	model  *genai.GenerativeModel
}

func NewGeminiLLM() (*GeminiLLM, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, errors.New("GEMINI_API_KEY required")
	}

	ctx := context.Background()

	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, err
	}

	// Using 1.5 Flash or 1.5 Pro — your choice:
	model := client.GenerativeModel("models/gemini-flash-latest")

	return &GeminiLLM{
		client: client,
		model:  model,
	}, nil
}

func (g *GeminiLLM) Generate(ctx context.Context, prompt string) (string, error) {
	resp, err := g.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	// No candidates returned?
	if len(resp.Candidates) == 0 {
		return "", errors.New("no candidates returned")
	}

	cand := resp.Candidates[0]
	if cand.Content == nil || len(cand.Content.Parts) == 0 {
		return "", errors.New("empty candidate content")
	}

	var sb strings.Builder
	for _, p := range cand.Content.Parts {
		switch v := p.(type) {
		case genai.Text:
			sb.WriteString(string(v))
		case *genai.Text:
			sb.WriteString(string(*v))
		}
	}

	return sb.String(), nil
}
