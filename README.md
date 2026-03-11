# JOB-HUNTER

> **⚠️ This project is still in active development.** Features may be incomplete, unstable, or change without notice.

An AI-powered job hunting assistant that scrapes job listings, matches them to your profile, and helps you prepare applications — all from a single local dashboard.

## Features

- **Multi-source job scraping** — Searches Indeed, LinkedIn, Glassdoor, Google Jobs, and ZipRecruiter via [python-jobspy](https://github.com/Bunsly/JobSpy)
- **AI-powered matching** — Scores jobs against your profile (skills, experience, location, salary) using LLMs via [OpenRouter](https://openrouter.ai/)
- **Resume management** — Upload or paste resumes, get ATS compatibility analysis
- **Application tracker** — Kanban board to track applications through stages
- **Interview prep** — AI-generated practice questions based on job descriptions
- **Agentic chat** — Conversational AI with tool access to search, analyze, and manage jobs
- **System logs** — Live log viewer for monitoring scraper and AI operations

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript, Turbopack)
- **UI**: Tailwind CSS v4 + shadcn/ui (hand-drawn sketch theme)
- **Database**: SQLite via better-sqlite3 (local, zero-config)
- **AI**: OpenRouter API (free-tier models supported)
- **Scraping**: python-jobspy (Python subprocess)
- **Testing**: Vitest (unit) + Playwright (E2E)

## Prerequisites

- **Node.js** 20+ and npm
- **Python** 3.10+ (for the job scraper)
- An **OpenRouter API key** (free at [openrouter.ai](https://openrouter.ai/)) — optional, needed only for AI features

## Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/HokageZ/JOB-HUNTER.git
   cd JOB-HUNTER
   ```

2. **Install Node dependencies**

   ```bash
   npm install
   ```

3. **Install Python dependencies**

   ```bash
   pip install -r scraper/requirements.txt
   ```

4. **Create your environment file**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your OpenRouter API key (optional — AI features won't work without it, but scraping and tracking still function).

5. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) — the setup wizard will guide you through creating your profile.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | No | OpenRouter API key for AI matching, chat, and resume analysis |
| `LOG_LEVEL` | No | Logging verbosity: `debug`, `info`, `warn`, `error` (default: `info`) |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run dev:debug` | Start with debug-level logging |
| `npm run build` | Production build |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:all` | Run all test suites |

## Project Structure

```
src/
  app/           # Next.js App Router pages & API routes
  components/    # React components (UI + features)
  lib/           # Core logic (matching, scraping, DB, AI)
  types/         # TypeScript type definitions
scraper/         # Python job scraper (python-jobspy wrapper)
data/            # Runtime data (SQLite DB, logs) — gitignored
docs/            # Architecture & design documentation
tests/           # Unit, API, and E2E tests
```

## License

This project is for personal use and under active development.
