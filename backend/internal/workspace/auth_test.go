package workspace

import (
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"strings"
	"testing"
	"time"
)

func TestTokenValidation(t *testing.T) {
	secret := strings.Repeat("s", 32)
	uid := uuid.New()
	a := &API{Secret: secret}
	raw, err := a.token(User{ID: uid})
	if err != nil {
		t.Fatal(err)
	}
	got, err := parseToken(raw, secret)
	if err != nil || got != uid {
		t.Fatalf("round trip: %s %v", got, err)
	}
	for _, tc := range []struct {
		name            string
		method          jwt.SigningMethod
		issuer, subject string
		expires         *jwt.NumericDate
	}{
		{"wrong algorithm", jwt.SigningMethodHS384, "ai-twin", uid.String(), jwt.NewNumericDate(time.Now().Add(time.Hour))},
		{"wrong issuer", jwt.SigningMethodHS256, "other", uid.String(), jwt.NewNumericDate(time.Now().Add(time.Hour))},
		{"expired", jwt.SigningMethodHS256, "ai-twin", uid.String(), jwt.NewNumericDate(time.Now().Add(-time.Hour))},
		{"missing expiry", jwt.SigningMethodHS256, "ai-twin", uid.String(), nil},
		{"malformed subject", jwt.SigningMethodHS256, "ai-twin", "not-a-uuid", jwt.NewNumericDate(time.Now().Add(time.Hour))},
	} {
		t.Run(tc.name, func(t *testing.T) {
			raw, err := jwt.NewWithClaims(tc.method, claims{jwt.RegisteredClaims{Issuer: tc.issuer, Subject: tc.subject, ExpiresAt: tc.expires}}).SignedString([]byte(secret))
			if err != nil {
				t.Fatal(err)
			}
			if _, err := parseToken(raw, secret); err == nil {
				t.Fatal("accepted invalid token")
			}
		})
	}
	if _, err := parseToken(raw, "wrong-key"); err == nil {
		t.Fatal("accepted wrong signature")
	}
}
