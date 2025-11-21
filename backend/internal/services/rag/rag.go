package rag

import (
	"context"
	"encoding/json"
	"sort"

	"github.com/google/generative-ai-go/genai"

	"github.com/muhammednithal/AI_TWIN/backend/internal/repositories"
	"github.com/muhammednithal/AI_TWIN/backend/pkg/utils"
)

// RankedSample is a sample or memory with its similarity score.
type RankedSample struct {
	Text       string  `json:"text"`
	Similarity float64 `json:"similarity"`
	Source     string  `json:"source"` // "sample" or "memory"
}

// RAGService handles retrieval for a personality.
type RAGService struct {
	SampleRepo *repositories.SampleRepository
	MemoryRepo *repositories.MemoryRepository
	Client     *genai.Client
}

// NewRAGService constructs a RAGService with both sample & memory repos.
func NewRAGService(sampleRepo *repositories.SampleRepository, memoryRepo *repositories.MemoryRepository, client *genai.Client) *RAGService {
	return &RAGService{
		SampleRepo: sampleRepo,
		MemoryRepo: memoryRepo,
		Client:     client,
	}
}

// embedQuery embeds a single text using Gemini.
func (r *RAGService) embedQuery(text string) ([]float32, error) {
	ctx := context.Background()
	model := r.Client.EmbeddingModel("text-embedding-004")

	resp, err := model.EmbedContent(ctx, genai.Text(text))
	if err != nil {
		return nil, err
	}
	return resp.Embedding.Values, nil
}

// RetrieveTopK returns top-K matching from samples + memories.
func (r *RAGService) RetrieveTopK(personalityID string, query string, k int) ([]RankedSample, error) {

	// 1) Embed the query text
	queryVec, err := r.embedQuery(query)
	if err != nil {
		return nil, err
	}

	// 2) Load all samples
	samples, err := r.SampleRepo.ListByPersonality(personalityID)
	if err != nil {
		return nil, err
	}

	// 3) Load saved memories
	memories, err := r.MemoryRepo.ListByPersonality(personalityID)
	if err != nil {
		return nil, err
	}

	ranked := make([]RankedSample, 0, len(samples)+len(memories))

	// 4) Rank samples
	for _, sm := range samples {
		var vec []float32
		_ = json.Unmarshal(sm.Embedding, &vec)

		score := utils.CosineSimilarity(queryVec, vec)
		ranked = append(ranked, RankedSample{
			Text:       sm.Text,
			Similarity: score,
			Source:     "sample",
		})
	}

	// 5) Rank memories
	for _, mem := range memories {
		var vec []float32
		_ = json.Unmarshal(mem.Embedding, &vec)

		score := utils.CosineSimilarity(queryVec, vec)
		ranked = append(ranked, RankedSample{
			Text:       mem.Content,
			Similarity: score,
			Source:     "memory",
		})
	}

	// 6) Sort descending by similarity
	sort.Slice(ranked, func(i, j int) bool {
		return ranked[i].Similarity > ranked[j].Similarity
	})

	// 7) Return top-K
	if len(ranked) < k {
		return ranked, nil
	}
	return ranked[:k], nil
}
