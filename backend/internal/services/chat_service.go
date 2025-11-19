package services

import (
	"context"
	"os"
	"time"

	"github.com/google/generative-ai-go/genai"
	"github.com/muhammednithal/AI_TWIN/backend/internal/models"
	"github.com/muhammednithal/AI_TWIN/backend/internal/repositories"
	"github.com/muhammednithal/AI_TWIN/backend/internal/services/llm"
	"github.com/muhammednithal/AI_TWIN/backend/internal/services/prompt"
	"github.com/muhammednithal/AI_TWIN/backend/internal/services/rag"
	"github.com/muhammednithal/AI_TWIN/backend/pkg/utils"
	"google.golang.org/api/option"
)

type ChatService struct {
	sessionRepo *repositories.ChatSessionRepository
	messageRepo *repositories.MessageRepository
	personRepo  *repositories.PersonalityRepository
	ragSvc      *rag.RAGService
	promptBldr  *prompt.PromptBuilder
	llmClient   llm.LLMClient
}

func NewChatService() *ChatService {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		panic("GEMINI_API_KEY missing")
	}

	ctx := context.Background()

	// Create Gemini client ONLY for RAG/Embeddings
	genaiClient, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		panic(err)
	}

	// LLM client for chat generation
	llmClient, err := llm.NewGeminiLLM(genaiClient)
	if err != nil {
		panic("failed to create LLM client: " + err.Error())
	}

	return &ChatService{
		sessionRepo: repositories.NewChatSessionRepository(),
		messageRepo: repositories.NewMessageRepository(),
		personRepo:  repositories.NewPersonalityRepository(),

		ragSvc: rag.NewRAGService(
			repositories.NewSampleRepository(),
			genaiClient,
		),

		promptBldr: prompt.NewPromptBuilder(),
		llmClient:  llmClient,
	}
}

type ChatRequest struct {
	PersonalityID string `json:"personality_id"`
	Message       string `json:"message"`
	SessionID     string `json:"session_id"`
	UserID        string `json:"user_id"`
}

type ChatResponse struct {
	Reply     string `json:"reply"`
	SessionID string `json:"session_id"`
}

func (s *ChatService) SendMessage(ctx context.Context, req *ChatRequest) (*ChatResponse, error) {

	// ----------------------------------------------------
	// 1) Load or create session
	// ----------------------------------------------------
	var session *models.ChatSession
	var err error

	if req.SessionID != "" {
		session, err = s.sessionRepo.GetByID(req.SessionID)

		// If session doesn't exist or an error occurred → create new
		if err != nil || session == nil {
			session = &models.ChatSession{
				PersonalityID: utils.ParseUUID(req.PersonalityID),
				UserID:        utils.ParseUUID(req.UserID),
				CreatedAt:     time.Now(),
			}
			_ = s.sessionRepo.Create(session)
		}
	} else {
		// No session provided → always create a new one
		session = &models.ChatSession{
			PersonalityID: utils.ParseUUID(req.PersonalityID),
			UserID:        utils.ParseUUID(req.UserID),
			CreatedAt:     time.Now(),
		}
		_ = s.sessionRepo.Create(session)
	}

	// ----------------------------------------------------
	// 2) Save user message
	// ----------------------------------------------------
	msg := &models.Message{
		SessionID: session.ID,
		FromUser:  true,
		Content:   req.Message,
		CreatedAt: time.Now(),
	}
	_ = s.messageRepo.Create(msg)

	// ----------------------------------------------------
	// 3) RAG retrieve top 3 samples
	// ----------------------------------------------------
	topK, _ := s.ragSvc.RetrieveTopK(req.PersonalityID, req.Message, 3)

	// ----------------------------------------------------
	// 4) Load personality
	// ----------------------------------------------------
	person, err := s.personRepo.GetByID(req.PersonalityID)
	if err != nil {
		return nil, err
	}

	// ----------------------------------------------------
	// 5) Load last 6 messages for history
	// ----------------------------------------------------
	history, _ := s.messageRepo.ListBySession(session.ID.String())
	if len(history) > 6 {
		history = history[len(history)-6:]
	}

	// ----------------------------------------------------
	// 6) Build prompt
	// ----------------------------------------------------
	promptText := s.promptBldr.BuildFullPrompt(person, topK, history, req.Message)

	// ----------------------------------------------------
	// 7) Generate LLM response
	// ----------------------------------------------------
	reply, err := s.llmClient.Generate(ctx, promptText)
	if err != nil {
		return nil, err
	}

	// ----------------------------------------------------
	// 8) Save assistant message
	// ----------------------------------------------------
	assistantMsg := &models.Message{
		SessionID: session.ID,
		FromUser:  false,
		Content:   reply,
		CreatedAt: time.Now(),
	}
	_ = s.messageRepo.Create(assistantMsg)

	// ----------------------------------------------------
	// 9) Return response
	// ----------------------------------------------------
	return &ChatResponse{
		Reply:     reply,
		SessionID: session.ID.String(),
	}, nil
}
