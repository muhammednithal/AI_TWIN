package prompt

import (
	"strings"

	"github.com/muhammednithal/AI_TWIN/backend/internal/models"
	"github.com/muhammednithal/AI_TWIN/backend/internal/services/rag"
)

// BuildFullPrompt merges SYSTEM, PERSONALITY, RAG, HISTORY,
// and the actual USER MESSAGE into one structured prompt.
func (p *PromptBuilder) BuildFullPrompt(
	personality *models.Personality,
	topSamples []rag.RankedSample,
	history []models.Message,
	userMessage string,
) string {

	var sb strings.Builder

	sb.WriteString("SYSTEM:\n")
	sb.WriteString(p.BuildPersonalitySection(personality))
	sb.WriteString("\n")

	sb.WriteString("PERSONALITY DATA:\n")
	sb.WriteString(p.BuildRAGSection(topSamples))
	sb.WriteString("\n")

	sb.WriteString("CHAT HISTORY:\n")
	sb.WriteString(p.BuildHistorySection(history))
	sb.WriteString("\n")

	sb.WriteString("USER MESSAGE:\n")
	sb.WriteString(userMessage)
	sb.WriteString("\n\n")

	sb.WriteString("INSTRUCTION:\n")
	sb.WriteString("Reply as the AI Twin.\n")
	sb.WriteString("Stay consistent with personality, tone, quirks, and relevant samples.\n")
	sb.WriteString("Keep it natural, concise, and human.\n")

	return sb.String()
}
