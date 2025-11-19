package prompt

// PromptBuilder is a lightweight orchestrator that builds structured prompts
// for the AI Twin.
type PromptBuilder struct{}

func NewPromptBuilder() *PromptBuilder {
	return &PromptBuilder{}
}
