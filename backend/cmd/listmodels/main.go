package main

import (
	"context"
	"fmt"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

func main() {
	ctx := context.Background()
	apiKey := "YOUR_GEMINI_API_KEY" // Replace with your actual API key

	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		panic(err)
	}

	iter := client.ListModels(ctx)
	for {
		m, err := iter.Next()
		if err != nil {
			break
		}

		fmt.Printf("\n=========== MODEL ===========\n")
		fmt.Printf("%+v\n", m)
	}
}
