package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHandleVersion(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name            string
		deployedVersion string
		want            string
	}{
		{
			name:            "returns deployed version",
			deployedVersion: "0.0.11",
			want:            "0.0.11",
		},
		{
			name:            "returns unknown when empty",
			deployedVersion: "",
			want:            "",
		},
		{
			name:            "returns updated version after poll",
			deployedVersion: "0.0.12",
			want:            "0.0.12",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			deployedVersion = tt.deployedVersion

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			handleVersion(c)

			if w.Code != http.StatusOK {
				t.Fatalf("expected status 200, got %d", w.Code)
			}

			var resp map[string]any
			if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
				t.Fatalf("failed to unmarshal response: %v", err)
			}

			got, ok := resp["version"].(string)
			if !ok {
				t.Fatalf("expected version to be string, got %T", resp["version"])
			}

			if got != tt.want {
				t.Errorf("handleVersion() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestCompareVersion(t *testing.T) {
	tests := []struct {
		name string
		a    string
		b    string
		want int
	}{
		{"equal", "0.0.10", "0.0.10", 0},
		{"greater patch", "0.0.11", "0.0.10", 1},
		{"lesser patch", "0.0.9", "0.0.10", -1},
		{"greater minor", "0.1.0", "0.0.10", 1},
		{"lesser minor", "0.0.10", "0.1.0", -1},
		{"greater major", "1.0.0", "0.9.9", 1},
		{"multi-digit patch", "0.0.10", "0.0.9", 1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := compareVersion(tt.a, tt.b)
			if got != tt.want {
				t.Errorf("compareVersion(%q, %q) = %d, want %d", tt.a, tt.b, got, tt.want)
			}
		})
	}
}
