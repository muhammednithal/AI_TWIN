package workspace

import (
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"net/http"
	"strings"
	"time"
)

type claims struct{ jwt.RegisteredClaims }

func (a *API) token(u User) (string, error) {
	now := time.Now()
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims{jwt.RegisteredClaims{Subject: u.ID.String(), Issuer: "ai-twin", IssuedAt: jwt.NewNumericDate(now), ExpiresAt: jwt.NewNumericDate(now.Add(12 * time.Hour))}}).SignedString([]byte(a.Secret))
}
func parseToken(raw, secret string) (uuid.UUID, error) {
	c := &claims{}
	t, err := jwt.ParseWithClaims(raw, c, func(*jwt.Token) (any, error) { return []byte(secret), nil }, jwt.WithValidMethods([]string{"HS256"}), jwt.WithIssuer("ai-twin"), jwt.WithExpirationRequired())
	if err != nil || !t.Valid {
		return uuid.Nil, errors.New("invalid token")
	}
	return uuid.Parse(c.Subject)
}
func (a *API) authenticate(c *gin.Context) {
	if !strings.HasPrefix(c.GetHeader("Authorization"), "Bearer ") {
		fail(c, 401, "Please sign in again.")
		return
	}
	value := strings.TrimPrefix(c.GetHeader("Authorization"), "Bearer ")
	id, err := parseToken(value, a.Secret)
	if err != nil {
		fail(c, 401, "Please sign in again.")
		return
	}
	var user User
	if err := a.DB.WithContext(c.Request.Context()).First(&user, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			fail(c, 401, "Please sign in again.")
		} else {
			internal(c, err)
		}
		return
	}
	c.Set("user", user)
	c.Next()
}
func current(c *gin.Context) User { return c.MustGet("user").(User) }
func (a *API) signup(c *gin.Context) {
	var req struct {
		Email       string `json:"email" binding:"required,email,max=254"`
		Password    string `json:"password" binding:"required,min=10,max=72"`
		DisplayName string `json:"display_name" binding:"required,max=80"`
	}
	if c.ShouldBindJSON(&req) != nil {
		fail(c, 400, "Use a valid email, a name, and a password of 10–72 characters.")
		return
	}
	if len([]byte(req.Password)) > 72 || strings.TrimSpace(req.DisplayName) == "" {
		fail(c, 400, "Use a name and a password that fits within 72 UTF-8 bytes.")
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		fail(c, 500, "Could not create account.")
		return
	}
	user := User{Email: strings.ToLower(strings.TrimSpace(req.Email)), DisplayName: strings.TrimSpace(req.DisplayName), PasswordHash: string(hash)}
	if err := a.DB.WithContext(c.Request.Context()).Create(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			fail(c, 409, "Could not create account with this email.")
		} else {
			internal(c, err)
		}
		return
	}
	t, err := a.token(user)
	if err != nil {
		fail(c, 500, "Could not sign in.")
		return
	}
	c.JSON(http.StatusCreated, gin.H{"user": user, "token": t})
}
func (a *API) login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,max=72"`
	}
	if c.ShouldBindJSON(&req) != nil {
		fail(c, 400, "Enter your email and password.")
		return
	}
	var user User
	err := a.DB.WithContext(c.Request.Context()).First(&user, "email = ?", strings.ToLower(strings.TrimSpace(req.Email))).Error
	// Perform a password comparison even for unknown accounts to reduce timing differences.
	hash := user.PasswordHash
	if err != nil {
		hash = "$2a$10$7EqJtq98hPqEX7fNZaFWoO5VJtvC3dqZcyL.iWqO9ZvW/1XyF4i3a"
	}
	match := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password))
	if err != nil || match != nil {
		fail(c, 401, "Email or password is incorrect.")
		return
	}
	t, err := a.token(user)
	if err != nil {
		fail(c, 500, "Could not sign in.")
		return
	}
	c.JSON(200, gin.H{"user": user, "token": t})
}
