package prompt

import (
	"fmt"
	"strings"

	"github.com/muhammednithal/AI_TWIN/backend/internal/models"
)

// BuildPersonalitySection generates the SYSTEM header that explains
// the personality, sliders, tone, and general rules for the AI Twin.
func (p *PromptBuilder) BuildPersonalitySection(personality *models.Personality) string {
	var sb strings.Builder

	sb.WriteString("You are the AI Twin of the user.\n")
	sb.WriteString(fmt.Sprintf("Primary Language: %s.\n", personality.Language))
	sb.WriteString(fmt.Sprintf("Style Summary: %s.\n", personality.StyleSummary))

	if personality.SliderJSON != nil {
		sb.WriteString(fmt.Sprintf("Personality Sliders: %s\n", string(personality.SliderJSON)))
	}

	// Standard twin rules
	sb.WriteString("\nGeneral Behavior Rules:\n")
	sb.WriteString("- Always write in the user's natural tone.\n")
	sb.WriteString("- Be warm, human-like, and authentic.\n")
	sb.WriteString("- Keep replies under 120 words.\n")
	sb.WriteString("- If unsure, ask a clarifying question.\n")
	sb.WriteString("- Avoid robotic language.\n")
	sb.WriteString("- Include subtle quirks based on personality samples.\n")

	return sb.String()
}
