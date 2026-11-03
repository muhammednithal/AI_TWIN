package settings

import (
	"strings"
	"testing"
)

func TestConfigurationRequiresSecrets(t *testing.T) {
	t.Setenv("JWT_SECRET", "short")
	t.Setenv("GEMINI_API_KEY", "test")
	if _, err := Load(); err == nil {
		t.Fatal("accepted weak secret")
	}
	t.Setenv("JWT_SECRET", strings.Repeat("s", 32))
	t.Setenv("GEMINI_API_KEY", "")
	if _, err := Load(); err == nil {
		t.Fatal("accepted missing key")
	}
}
func TestProductionRejectsInsecureOrigins(t *testing.T) {
	t.Setenv("JWT_SECRET", strings.Repeat("s", 32))
	t.Setenv("GEMINI_API_KEY", "test")
	t.Setenv("ENV", "production")
	for _, origin := range []string{"*", "http://localhost:5173"} {
		t.Setenv("CORS_ALLOWED_ORIGINS", origin)
		if _, err := Load(); err == nil {
			t.Fatal("accepted insecure origin")
		}
	}
	t.Setenv("CORS_ALLOWED_ORIGINS", "https://twin.example.com")
	if _, err := Load(); err != nil {
		t.Fatal(err)
	}
}
