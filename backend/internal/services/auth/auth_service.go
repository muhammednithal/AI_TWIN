package auth

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/muhammednithal/AI_TWIN/backend/internal/models"
	"github.com/muhammednithal/AI_TWIN/backend/internal/repositories"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo *repositories.UserRepository
	secret   string
	exp      time.Duration
}

func NewAuthService() *AuthService {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "testsecret"
	}

	expStr := os.Getenv("JWT_EXPIRES_IN")
	if expStr == "" {
		expStr = "24h"
	}
	exp, _ := time.ParseDuration(expStr)

	return &AuthService{
		userRepo: repositories.NewUserRepository(),
		secret:   secret,
		exp:      exp,
	}
}

func (s *AuthService) HashPassword(password string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(b), err
}

func (s *AuthService) CheckPassword(hashed, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashed), []byte(password))
}

func (s *AuthService) Register(email, password, name string) (*models.User, error) {
	existing, _ := s.userRepo.GetByEmail(email)
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	hash, err := s.HashPassword(password)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Email:        email,
		PasswordHash: hash,
		DisplayName:  name,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) Login(email, password string) (*models.User, string, error) {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil || user == nil {
		return nil, "", errors.New("invalid credentials")
	}

	if err := s.CheckPassword(user.PasswordHash, password); err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	token, err := s.GenerateToken(user)
	return user, token, err
}

func (s *AuthService) GenerateToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":   user.ID.String(),
		"email": user.Email,
		"iat":   time.Now().Unix(),
		"exp":   time.Now().Add(s.exp).Unix(),
	}

	jwtt := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return jwtt.SignedString([]byte(s.secret))
}

func (s *AuthService) ParseToken(tokenStr string) (string, error) {
	tok, err := jwt.Parse(tokenStr, func(tok *jwt.Token) (interface{}, error) {
		return []byte(s.secret), nil
	})

	if err != nil || !tok.Valid {
		return "", errors.New("invalid token")
	}

	claims := tok.Claims.(jwt.MapClaims)
	return claims["sub"].(string), nil
}
