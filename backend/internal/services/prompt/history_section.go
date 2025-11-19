package prompt

import (
	"strings"

	"github.com/muhammednithal/AI_TWIN/backend/internal/models"
)

// BuildHistorySection summarizes the last few user–twin messages.
func (p *PromptBuilder) BuildHistorySection(history []models.Message) string {
	var sb strings.Builder

	if len(history) == 0 {
		sb.WriteString("No recent chat history.\n")
		return sb.String()
	}

	sb.WriteString("Conversation Context:\n")

	for _, m := range history {
		if m.FromUser {
			sb.WriteString("User: " + m.Content + "\n")
		} else {
			sb.WriteString("Twin: " + m.Content + "\n")
		}
	}

	return sb.String()
}
