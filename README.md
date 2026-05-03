# QuestionnaireWithBackend

An online career anchor assessment system with full-stack capabilities. Answer 10 questions, get your dominant career anchor(s), and submit data to a persistent backend.

Based on Edgar Schein's Career Anchor theory: 8 core drives that shape career choices. Forked from [Spandan-Bhattarai/Personality-Traits-Tester](https://github.com/Spandan-Bhattarai/Personality-Traits-Tester) (React + TypeScript + Tailwind CSS frontend). Replaced the MBTI model with a Career Anchor model and added a Go backend with SQLite for data collection and export.

---

## Features

- **Questionnaire Flow**: 10-step questions with auto-advance and progress bar
- **Auto Scoring**: Counts A-H selections, determines dominant career anchor(s)
- **Result Page**: Anchor name, description, key traits, career suggestions, and score distribution across all 8 anchors
- **Dual Anchor Support**: If two anchors tie for highest count, both are displayed (e.g. "TF+SV")
- **Data Persistence**: Every submission saved to SQLite with UUIDs
- **CSV Export**: Download all submissions as CSV
- **Statistics**: Total count and per-type distribution
- **Version Check**: Frontend polls backend version every 30s; prompts refresh on mismatch
- **Duplicate Protection**: Prevents double-submit on the final question
- **Required Contact Info**: Name (Chinese, ≤10 chars) and phone (digits, ≤16) required before starting

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Backend | Go 1.24+ + Gin |
| Database | SQLite (modernc.org/sqlite, pure Go, no CGO) |

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 3000) |
| `ADMIN_TOKEN` | No | Protects `/submissions`, `/export`, `/stats`. If unset, these endpoints return 401. |

---

## Deployment Architecture

Production deployment uses this setup:

- **Frontend**: GitHub Pages (static hosting)
- **Backend**: Local Windows machine running Go + SQLite
- **Tunnel**: Cloudflare Tunnel exposes local backend to the internet with a temporary URL
- **API Base**: Hardcoded in `src/api/client.ts` to the current tunnel URL

> Note: Cloudflare quick tunnels generate a new URL on each restart. Update `src/api/client.ts` and redeploy if the tunnel URL changes.

---

## Quick Start

### Prerequisites

- Node.js 18+
- Go 1.23+
- npm

### 1. Clone

```bash
git clone https://github.com/chorious/QuestionnaireWithBackend.git
cd QuestionnaireWithBackend
```

### 2. Start Backend

```bash
cd backend-go
# Optional: set admin token to protect data endpoints
# If not set, /submissions, /export, /stats return 401
set ADMIN_TOKEN=your-secret-token
go run main.go
```

Backend runs at `http://localhost:3000`

### 3. Start Frontend

In another terminal:

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:5174`

The Vite dev server proxies `/api` requests to `http://localhost:3000`.

### 4. Build for Production

Frontend:
```bash
npm run build
```

Backend (single binary):
```bash
cd backend-go
go build -o questionnaire-backend
```

---

## API Reference

### GET /api/version

Response:
```json
{"version": "0.0.5"}
```

The version follows semantic-like numbering (`major.minor.patch`). The frontend polls this every 30s and prompts the user to refresh when the backend version differs from the frontend's `APP_VERSION`.

**Auto-bump:** A `pre-commit` hook in `.githooks/pre-commit` automatically increments the patch version on every commit. It updates both `src/config/version.ts` and `backend-go/main.go`, then stages the changes.

Enable it once:
```bash
git config core.hooksPath .githooks
```

### POST /api/submit

Request body:
```json
{
  "answers": ["A", "B", "C", "D", "E", "F", "G", "H", "A", "B"],
  "scores": {"TF": 2, "GM": 2, "AU": 1, "SE": 1, "EC": 1, "SV": 1, "CH": 1, "LS": 1},
  "result": "TF+GM",
  "source": "Android",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "张三",
  "phone": "13800138000"
}
```

- `user_id` is optional. If provided, it is stored as-is. If omitted, the server generates one.
- The frontend persists `user_id` in localStorage so the same user always submits the same ID.
- `name` and `phone` are collected on the welcome screen. Name must be Chinese characters (≤10). Phone must be digits (≤16).
- `source` is auto-populated by the frontend based on `navigator.userAgent` platform detection (`Android`, `iOS`, `Windows`, `macOS`, `Linux`, or `Web`).

Response:
```json
{
  "success": true,
  "id": "c8e06fa3-d3ef-4116-be03-7a08c5805c64",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### GET /api/submissions

**Protected.** Requires `X-Admin-Token` header matching `ADMIN_TOKEN` env var.

```bash
curl -H "X-Admin-Token: your-secret-token" http://localhost:3000/api/submissions
```

Response:
```json
{
  "count": 5,
  "submissions": [
    {
      "id": "...",
      "user_id": "...",
      "name": "张三",
      "phone": "13800138000",
      "answers": "[\"3\",\"5\",\"1\"]",
      "scores": "{\"TF\":3,\"GM\":2}",
      "result": "TF+GM",
      "created_at": 1777567977647,
      "source": ""
    }
  ]
}
```

### GET /api/submissions/export

**Protected.** Requires `X-Admin-Token` header.

Returns a CSV file with BOM for Excel compatibility. Columns: `id`, `user_id`, `name`, `phone`, `result`, `created_at`, `source`, `answers`, `scores`.

### GET /api/stats

**Protected.** Requires `X-Admin-Token` header.

Response:
```json
{
  "total": 5,
  "byResult": [
    {"result": "TF", "count": 3},
    {"result": "GM", "count": 2},
    {"result": "TF+SV", "count": 1}
  ]
}
```

---

## QA Auto-Testing

Open `public/qa.html` directly in a browser (or visit `https://your-github-pages-url/QuestionnaireWithBackend/qa.html` after deploy). This standalone module simulates real users completing the questionnaire:

- Configure API base URL, submission count, delay, answer strategy
- **Strategies**: random, biased toward one of 8 anchors (70% weight), or uniform distribution
- Auto-generates Chinese names and valid phone numbers
- Real-time progress bar and log
- Backend verification buttons query `/api/stats` and `/api/submissions` (requires `X-Admin-Token`)

---

## Project Structure

```
QuestionnaireWithBackend/
|
|-- src/                           # Frontend
|   |-- components/
|   |   |-- WelcomeScreen.tsx
|   |   |-- QuestionnaireScreen.tsx
|   |   |-- ResultsScreen.tsx
|   |   |-- VersionCheck.tsx
|   |   |-- BackgroundAnimation.tsx
|   |   |-- ProgressBar.tsx
|   |-- api/
|   |   |-- client.ts              # HTTP client for backend API
|   |-- config/
|   |   |-- version.ts             # Frontend version constant
|   |-- data/
|   |   |-- questions.ts           # Question definitions
|   |   |-- personalityTypes.ts    # Result type definitions
|   |-- types/
|   |   |-- personality.ts
|   |-- utils/
|   |   |-- personalityCalculator.ts
|   |-- App.tsx
|   |-- main.tsx
|   |-- index.css
|
|-- backend-go/                    # Go backend
|   |-- main.go                    # HTTP server + API handlers + DB init
|   |-- go.mod
|   |-- go.sum
|   |-- data.db                    # SQLite database (gitignored)
|
|-- public/
|   |-- qa.html                    # Standalone QA auto-test module
|
|-- package.json
|-- vite.config.ts
|-- tailwind.config.js
|-- README.md
```

---

## Roadmap / TODO

- [x] Replace MBTI 32-question model with Career Anchor 10-question A-H scoring
- [x] Add nickname and required contact fields (name + phone) to submission
- [x] Platform detection (Android/iOS/Windows/macOS/Linux)
- [x] Cache invalidation for static hosting deploys
- [x] Admin data dashboard (basic via `public/qa.html`)
- [x] QA auto-test bot for load testing
- [ ] Add result share image generation (Canvas / html2canvas)
- [ ] Deploy backend to cloud server or VPS (currently local + tunnel)
- [ ] Multi-language support

---

## Acknowledgments

- Original frontend UI by [Spandan Bhattarai](https://github.com/Spandan-Bhattarai) / [Personality-Traits-Tester](https://github.com/Spandan-Bhattarai/Personality-Traits-Tester)
- Icons from [Lucide](https://lucide.dev/)
- Styling powered by [Tailwind CSS](https://tailwindcss.com/)

---

## License

MIT License - see the original repository for details.
