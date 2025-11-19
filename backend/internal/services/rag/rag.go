package rag

import (
	"context"
	"encoding/json"
	"sort"

	"github.com/google/generative-ai-go/genai"

	"github.com/muhammednithal/AI_TWIN/backend/internal/repositories"
	"github.com/muhammednithal/AI_TWIN/backend/pkg/utils"
)

// RankedSample is a sample with its similarity score.
type RankedSample struct {
	Text       string  `json:"text"`
	Similarity float64 `json:"similarity"`
}

// RAGService handles retrieval of top-K samples for a personality.
type RAGService struct {
	SampleRepo *repositories.SampleRepository
	Client     *genai.Client
}

// NewRAGService constructs a RAGService.
func NewRAGService(sampleRepo *repositories.SampleRepository, client *genai.Client) *RAGService {
	return &RAGService{
		SampleRepo: sampleRepo,
		Client:     client,
	}
}

// embedQuery embeds a single text using Gemini (your SDK).
func (r *RAGService) embedQuery(text string) ([]float32, error) {
	ctx := context.Background()
	model := r.Client.EmbeddingModel("text-embedding-004")

	resp, err := model.EmbedContent(ctx, genai.Text(text))
	if err != nil {
		return nil, err
	}
	// resp.Embedding.Values is []float32 according to your SDK
	return resp.Embedding.Values, nil
}

// RetrieveTopK returns top-k personality samples most similar to query.
func (r *RAGService) RetrieveTopK(personalityID string, query string, k int) ([]RankedSample, error) {

	// 1) Embed the query
	queryVec, err := r.embedQuery(query)
	if err != nil {
		return nil, err
	}

	// 2) Load all samples for the personality
	samples, err := r.SampleRepo.ListByPersonality(personalityID)
	if err != nil {
		return nil, err
	}

	// 3) Compute similarity for each sample
	ranked := make([]RankedSample, 0, len(samples))
	for _, sm := range samples {
		var sampleVec []float32
		// sm.Embedding is datatypes.JSON (bytes), unmarshal to []float32
		_ = json.Unmarshal(sm.Embedding, &sampleVec)

		score := utils.CosineSimilarity(queryVec, sampleVec)

		ranked = append(ranked, RankedSample{
			Text:       sm.Text,
			Similarity: score,
		})
	}

	// 4) Sort descending by similarity
	sort.Slice(ranked, func(i, j int) bool {
		return ranked[i].Similarity > ranked[j].Similarity
	})

	// 5) Return top-k
	if len(ranked) < k {
		return ranked, nil
	}
	return ranked[:k], nil
}
