package prompt

import (
	"fmt"
	"strings"

	"github.com/muhammednithal/AI_TWIN/backend/internal/services/rag"
)

// BuildRAGSection injects the Top-K personality samples retrieved via embeddings.
// These help the AI maintain consistent tone and persona.
func (p *PromptBuilder) BuildRAGSection(samples []rag.RankedSample) string {
	var sb strings.Builder

	if len(samples) == 0 {
		sb.WriteString("No personality examples available.\n")
		return sb.String()
	}

	sb.WriteString("Relevant Personality Examples:\n")

	for i, s := range samples {
		sb.WriteString(fmt.Sprintf("%d) \"%s\"\n", i+1, s.Text))
	}

	return sb.String()
}
