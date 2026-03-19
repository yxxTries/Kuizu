# slides-to-quiz

Convert presentation slides into Kahoot-style quizzes in seconds using AI.

Upload a `.pptx` or `.pdf`, and get a quiz ready to import into Kahoot, Quizlet, or Google Forms.

## Project structure

```
slides-to-quiz/
├── backend/        # FastAPI — file parsing, AI generation, CSV export
├── frontend/       # React — upload UI, quiz editor, export
└── docker-compose.yml
```

## Quickstart

```bash
# 1. Clone & enter
git clone https://github.com/your-org/slides-to-quiz.git
cd slides-to-quiz

# 2. Configure environment
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# 3. Start with Docker
docker-compose up

# Or run manually:
# Backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
# Frontend
cd frontend && npm install && npm run dev
```

## How it works

1. **Upload** a `.pptx` or `.pdf`
2. **Extract** — slide text, titles, and speaker notes are parsed per slide
3. **Generate** — Claude produces one question + 3 distractors per slide chunk
4. **Edit** — review and tweak questions before exporting
5. **Export** — download a Kahoot-ready CSV (or Quizlet/Google Forms)

## Environment variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Required for AI question generation |
| `MAX_SLIDES` | Max slides per upload (default: 100) |
| `CORS_ORIGINS` | Allowed frontend origins |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
