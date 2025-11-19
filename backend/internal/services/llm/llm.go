package llm

import (
	"context"
	"errors"
	"strings"

	"github.com/google/generative-ai-go/genai"
)

// LLMClient: simple interface for chat generation.
type LLMClient interface {
	Generate(ctx context.Context, prompt string) (string, error)
}

type GeminiLLM struct {
	model *genai.GenerativeModel
}

func NewGeminiLLM(client *genai.Client) (*GeminiLLM, error) {

	model := client.GenerativeModel("models/gemini-flash-latest")

	return &GeminiLLM{
		// client: client,
		model: model,
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
