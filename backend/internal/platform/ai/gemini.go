// Package ai keeps provider transport and prompt construction outside HTTP handlers.
package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type Client interface {
	Embed(context.Context, string) ([]float32, error)
	Generate(context.Context, string, string) (string, error)
}
type Gemini struct {
	Key, ChatModel, EmbeddingModel string
	HTTP                           *http.Client
}

func New(key, chat, embedding string) *Gemini {
	return &Gemini{key, chat, embedding, &http.Client{Timeout: 45 * time.Second}}
}
func (g *Gemini) call(ctx context.Context, model, action string, body, out any) error {
	data, err := json.Marshal(body)
	if err != nil {
		return err
	}
	endpoint := "https://generativelanguage.googleapis.com/v1beta/models/" + url.PathEscape(model) + ":" + action
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(data))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", g.Key)
	res, err := g.HTTP.Do(req)
	if err != nil {
		return fmt.Errorf("AI request: %w", err)
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		return fmt.Errorf("AI provider returned status %d", res.StatusCode)
	}
	return json.NewDecoder(io.LimitReader(res.Body, 2<<20)).Decode(out)
}
func (g *Gemini) Embed(ctx context.Context, text string) ([]float32, error) {
	var out struct {
		Embedding struct {
			Values []float32 `json:"values"`
		} `json:"embedding"`
	}
	err := g.call(ctx, g.EmbeddingModel, "embedContent", map[string]any{"model": "models/" + g.EmbeddingModel, "content": map[string]any{"parts": []any{map[string]string{"text": text}}}}, &out)
	if err != nil {
		return nil, err
	}
	if len(out.Embedding.Values) == 0 {
		return nil, errors.New("AI returned an empty embedding")
	}
	return out.Embedding.Values, nil
}
func (g *Gemini) Generate(ctx context.Context, system, content string) (string, error) {
	var out struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text    string `json:"text"`
					Thought bool   `json:"thought"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	err := g.call(ctx, g.ChatModel, "generateContent", map[string]any{"system_instruction": map[string]any{"parts": []any{map[string]string{"text": system}}}, "contents": []any{map[string]any{"role": "user", "parts": []any{map[string]string{"text": content}}}}, "generationConfig": map[string]any{"maxOutputTokens": 2048}}, &out)
	if err != nil {
		return "", err
	}
	if len(out.Candidates) == 0 {
		return "", errors.New("AI returned no response")
	}
	var b strings.Builder
	for _, p := range out.Candidates[0].Content.Parts {
		if !p.Thought {
			b.WriteString(p.Text)
		}
	}
	if strings.TrimSpace(b.String()) == "" {
		return "", errors.New("AI returned an empty response")
	}
	return b.String(), nil
}
func Similarity(a, b []float32) float64 {
	if len(a) == 0 || len(a) != len(b) {
		return 0
	}
	var dot, x, y float64
	for i := range a {
		av, bv := float64(a[i]), float64(b[i])
		dot += av * bv
		x += av * av
		y += bv * bv
	}
	if x == 0 || y == 0 {
		return 0
	}
	return dot / math.Sqrt(x*y)
}
