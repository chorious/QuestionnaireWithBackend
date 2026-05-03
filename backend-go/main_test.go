package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
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

func TestPollFrontendVersion(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Save and restore original URL
	originalURL := frontendVersionURL
	defer func() { frontendVersionURL = originalURL }()

	// Create a temp VERSION file in a parent dir so ../VERSION resolves correctly
	tmpDir := t.TempDir()
	parentDir := filepath.Dir(tmpDir)
	versionFile := filepath.Join(parentDir, "VERSION")
	if err := os.WriteFile(versionFile, []byte("0.0.10\n"), 0644); err != nil {
		t.Fatalf("failed to create temp VERSION: %v", err)
	}

	// Temporarily change working dir so ../VERSION resolves to parentDir
	originalWd, _ := os.Getwd()
	os.Chdir(tmpDir)
	defer os.Chdir(originalWd)

	tests := []struct {
		name            string
		initialTarget   string
		initialDeployed string
		frontendVersion string
		versionFileBody string // content of ../VERSION before poll
		wantDeployed    string
		wantTarget      string
	}{
		{
			name:            "frontend caught up: advance deployedVersion to target",
			initialTarget:   "0.0.10",
			initialDeployed: "0.0.9",
			frontendVersion: "0.0.10",
			versionFileBody: "0.0.10",
			wantDeployed:    "0.0.10",
			wantTarget:      "0.0.10",
		},
		{
			name:            "frontend lagging: keep deployedVersion unchanged",
			initialTarget:   "0.0.12",
			initialDeployed: "0.0.11",
			frontendVersion: "0.0.11",
			versionFileBody: "0.0.12",
			wantDeployed:    "0.0.11",
			wantTarget:      "0.0.12",
		},
		{
			name:            "frontend newer than target: advance deployedVersion",
			initialTarget:   "0.0.10",
			initialDeployed: "0.0.9",
			frontendVersion: "0.0.11",
			versionFileBody: "0.0.10",
			wantDeployed:    "0.0.10",
			wantTarget:      "0.0.10",
		},
		{
			name:            "VERSION file changed mid-flight: reloads target then advances",
			initialTarget:   "0.0.10",
			initialDeployed: "0.0.10",
			frontendVersion: "0.0.11",
			versionFileBody: "0.0.11",
			wantDeployed:    "0.0.11",
			wantTarget:      "0.0.11",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup mock GitHub Pages server
			mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				fmt.Fprintf(w, `{"version": "%s"}`, tt.frontendVersion)
			}))
			defer mockServer.Close()
			frontendVersionURL = mockServer.URL + "/version.json"

			// Reset global state
			targetVersion = tt.initialTarget
			deployedVersion = tt.initialDeployed

			// Write VERSION file content before poll
			os.WriteFile(versionFile, []byte(tt.versionFileBody+"\n"), 0644)

			pollFrontendVersion()

			if deployedVersion != tt.wantDeployed {
				t.Errorf("deployedVersion = %q, want %q", deployedVersion, tt.wantDeployed)
			}
			if targetVersion != tt.wantTarget {
				t.Errorf("targetVersion = %q, want %q", targetVersion, tt.wantTarget)
			}
		})
	}
}
