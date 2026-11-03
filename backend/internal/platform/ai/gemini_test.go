package ai

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"
)

type roundTrip func(*http.Request) (*http.Response, error)

func (f roundTrip) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
func clientWith(t *testing.T, status int, body string) *Gemini {
	t.Helper()
	g := New("private-key", "chat", "embed")
	g.HTTP = &http.Client{Transport: roundTrip(func(r *http.Request) (*http.Response, error) {
		if r.URL.RawQuery != "" {
			t.Fatal("key leaked into URL")
		}
		if r.Header.Get("x-goog-api-key") != "private-key" {
			t.Fatal("missing API key header")
		}
		return &http.Response{StatusCode: status, Body: io.NopCloser(strings.NewReader(body)), Header: make(http.Header)}, nil
	})}
	return g
}
func TestGenerateHandlesProviderResponses(t *testing.T) {
	for _, tc := range []struct {
		name, body string
		status     int
		want       string
		fail       bool
	}{{"text", `{"candidates":[{"content":{"parts":[{"text":"Hello "},{"text":"world"}]}}]}`, 200, "Hello world", false}, {"blocked", `{"candidates":[]}`, 200, "", true}, {"empty", `{"candidates":[{"content":{"parts":[]}}]}`, 200, "", true}, {"rate limited", `{"error":"private provider details"}`, 429, "", true}, {"invalid json", `invalid`, 200, "", true}} {
		t.Run(tc.name, func(t *testing.T) {
			got, err := clientWith(t, tc.status, tc.body).Generate(context.Background(), "system", "message")
			if (err != nil) != tc.fail || got != tc.want {
				t.Fatalf("got %q %v", got, err)
			}
			if err != nil && strings.Contains(err.Error(), "private provider") {
				t.Fatal("leaked provider details")
			}
		})
	}
}
func TestEmbedRejectsEmptyVectors(t *testing.T) {
	_, err := clientWith(t, 200, `{"embedding":{"values":[]}}`).Embed(context.Background(), "hello")
	if err == nil {
		t.Fatal("accepted empty embedding")
	}
}
func TestSimilarity(t *testing.T) {
	for _, tc := range []struct {
		a, b []float32
		want float64
	}{{[]float32{1, 0}, []float32{1, 0}, 1}, {[]float32{1, 0}, []float32{0, 1}, 0}, {nil, nil, 0}, {[]float32{0}, []float32{1}, 0}, {[]float32{1}, []float32{1, 2}, 0}} {
		if got := Similarity(tc.a, tc.b); got != tc.want {
			t.Fatalf("got %v want %v", got, tc.want)
		}
	}
}
