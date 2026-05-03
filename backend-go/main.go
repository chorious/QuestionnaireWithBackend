package main

import (
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	_ "modernc.org/sqlite"
)

var db *sql.DB
var adminToken string
var deployedVersion string
var targetVersion string

const frontendVersionURL = "https://chorious.github.io/QuestionnaireWithBackend/version.json"

func init() {
	adminToken = os.Getenv("ADMIN_TOKEN")
	if adminToken == "" {
		adminToken = "aass1122"
	}
	initVersion()
}

func initVersion() {
	data, err := os.ReadFile("../VERSION")
	if err != nil {
		fmt.Println("read VERSION failed:", err)
		deployedVersion = "unknown"
		targetVersion = "unknown"
		return
	}
	targetVersion = strings.TrimSpace(string(data))
	deployedVersion = targetVersion
	fmt.Println("target version:", targetVersion)
	startVersionPoller()
}

func startVersionPoller() {
	ticker := time.NewTicker(15 * time.Second)
	go func() {
		for range ticker.C {
			pollFrontendVersion()
		}
	}()
	// Poll immediately on startup
	go pollFrontendVersion()
}

func pollFrontendVersion() {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(frontendVersionURL)
	if err != nil {
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return
	}
	var v struct {
		Version string `json:"version"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&v); err != nil {
		return
	}
	frontendVer := strings.TrimSpace(v.Version)
	if frontendVer == "" {
		return
	}
	// Only advance deployedVersion when frontend has caught up to target
	if compareVersion(frontendVer, targetVersion) >= 0 {
		if deployedVersion != targetVersion {
			deployedVersion = targetVersion
			fmt.Println("[version] frontend deployed", deployedVersion)
		}
	} else if compareVersion(frontendVer, deployedVersion) < 0 {
		// Frontend rolled back or stale
		deployedVersion = frontendVer
		fmt.Println("[version] frontend lagging", deployedVersion)
	}
}

func compareVersion(a, b string) int {
	partsA := strings.Split(a, ".")
	partsB := strings.Split(b, ".")
	for i := 0; i < len(partsA) && i < len(partsB); i++ {
		na, _ := strconv.Atoi(partsA[i])
		nb, _ := strconv.Atoi(partsB[i])
		if na > nb {
			return 1
		}
		if na < nb {
			return -1
		}
	}
	return len(partsA) - len(partsB)
}

func main() {
	var err error
	db, err = sql.Open("sqlite", "data.db")
	if err != nil {
		fmt.Println("open db failed:", err)
		os.Exit(1)
	}
	defer db.Close()

	initDB()

	r := gin.Default()
	r.Use(corsMiddleware())

	api := r.Group("/api")
	{
		api.GET("/version", handleVersion)
		api.POST("/submit", handleSubmit)
	}

	admin := api.Group("", adminAuth())
	{
		admin.GET("/submissions", handleList)
		admin.GET("/submissions/export", handleExport)
		admin.GET("/stats", handleStats)
	}

	// SPA fallback: serve dist/index.html for non-API routes
	r.NoRoute(func(c *gin.Context) {
		c.File("../dist/index.html")
	})

	port := getenv("PORT", "3000")
	fmt.Println("Server running at http://0.0.0.0:" + port)
	fmt.Println("API endpoints:")
	fmt.Println("  GET  http://localhost:" + port + "/api/version")
	fmt.Println("  POST http://localhost:" + port + "/api/submit")
	fmt.Println("  GET  http://localhost:" + port + "/api/submissions")
	fmt.Println("  GET  http://localhost:" + port + "/api/submissions/export")
	fmt.Println("  GET  http://localhost:" + port + "/api/stats")
	r.Run(":" + port)
}

func initDB() {
	stmt := `
	CREATE TABLE IF NOT EXISTS submissions (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		answers TEXT NOT NULL,
		scores TEXT NOT NULL,
		result TEXT NOT NULL,
		created_at INTEGER NOT NULL,
		source TEXT DEFAULT '',
		name TEXT DEFAULT '',
		phone TEXT DEFAULT ''
	);
	CREATE INDEX IF NOT EXISTS idx_created_at ON submissions(created_at);
	CREATE INDEX IF NOT EXISTS idx_result ON submissions(result);
	`
	if _, err := db.Exec(stmt); err != nil {
		fmt.Println("init db failed:", err)
		os.Exit(1)
	}
}

func handleVersion(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"version": deployedVersion})
}

func handleSubmit(c *gin.Context) {
	var req struct {
		Answers []string       `json:"answers"`
		Scores  map[string]int `json:"scores"`
		Result  string         `json:"result"`
		Source  string         `json:"source"`
		UserID  string         `json:"user_id"`
		Name    string         `json:"name"`
		Phone   string         `json:"phone"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	phoneRe := regexp.MustCompile(`^1[3-9]\d{9}$`)
	if !phoneRe.MatchString(req.Phone) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid phone number"})
		return
	}

	id := uuid.New().String()
	userID := req.UserID
	if userID == "" {
		userID = uuid.New().String()
	}
	createdAt := time.Now().UnixMilli()

	_, err := db.Exec(
		"INSERT INTO submissions (id, user_id, answers, scores, result, created_at, source, name, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
		id, userID, toJSON(req.Answers), toJSON(req.Scores), req.Result, createdAt, req.Source, req.Name, req.Phone,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("[submit] result=%s user_id=%s name=%s id=%s time=%d\n", req.Result, userID, req.Name, id, createdAt)

	c.JSON(http.StatusOK, gin.H{"success": true, "id": id, "user_id": userID})
}

func handleList(c *gin.Context) {
	rows, err := db.Query("SELECT id, user_id, answers, scores, result, created_at, source, name, phone FROM submissions ORDER BY created_at DESC LIMIT 10000")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var submissions []map[string]any
	for rows.Next() {
		var id, userID, answers, scores, result, source, name, phone string
		var createdAt int64
		if err := rows.Scan(&id, &userID, &answers, &scores, &result, &createdAt, &source, &name, &phone); err != nil {
			continue
		}
		submissions = append(submissions, map[string]any{
			"id":         id,
			"user_id":    userID,
			"answers":    answers,
			"scores":     scores,
			"result":     result,
			"created_at": createdAt,
			"source":     source,
			"name":       name,
			"phone":      phone,
		})
	}

	c.JSON(http.StatusOK, gin.H{"count": len(submissions), "submissions": submissions})
}

func handleExport(c *gin.Context) {
	rows, err := db.Query("SELECT id, user_id, answers, scores, result, created_at, source, name, phone FROM submissions ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", "attachment; filename=\"submissions.csv\"")

	writer := csv.NewWriter(c.Writer)
	writer.Write([]string{"id", "user_id", "name", "phone", "result", "created_at", "source", "answers", "scores"})

	for rows.Next() {
		var id, userID, answers, scores, result, source, name, phone string
		var createdAt int64
		if err := rows.Scan(&id, &userID, &answers, &scores, &result, &createdAt, &source, &name, &phone); err != nil {
			continue
		}
		writer.Write([]string{id, userID, name, phone, result, time.UnixMilli(createdAt).Format(time.RFC3339), source, answers, scores})
	}
	writer.Flush()
}

func handleStats(c *gin.Context) {
	var total int
	row := db.QueryRow("SELECT COUNT(*) FROM submissions")
	row.Scan(&total)

	rows, err := db.Query("SELECT result, COUNT(*) as count FROM submissions GROUP BY result ORDER BY count DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var byResult []gin.H
	for rows.Next() {
		var result string
		var count int
		rows.Scan(&result, &count)
		byResult = append(byResult, gin.H{"result": result, "count": count})
	}

	c.JSON(http.StatusOK, gin.H{"total": total, "byResult": byResult})
}

func adminAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		if adminToken == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "admin token not configured"})
			return
		}
		if c.GetHeader("X-Admin-Token") != adminToken {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		c.Next()
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Admin-Token")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func toJSON(v any) string {
	b, _ := json.Marshal(v)
	return string(b)
}
