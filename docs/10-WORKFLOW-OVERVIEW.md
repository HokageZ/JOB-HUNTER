# 10 - Workflow Overview: End-to-End System Flow

> The master document that ties all other docs together. Shows the complete user journey from first launch to receiving an offer, and maps each step to the responsible system component.

---

## 1. System Architecture (Final)

```
┌────────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                              │
│                     http://localhost:3000                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   /setup          /jobs           /tracker        /resume          │
│   Profile         Job Feed        Kanban          Resume           │
│   Wizard          + Search        Board           Review           │
│                                                                    │
│   /chat           /settings       / (dashboard)                    │
│   AI Chat         Config          Stats + Overview                 │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                    Next.js API Routes                               │
│                                                                    │
│  /api/profile   /api/jobs   /api/scrape   /api/match   /api/ai    │
│  CRUD profile   Query jobs  Trigger       Score jobs   OpenRouter  │
│                             Python        vs profile   proxy       │
│                             scraper                                │
├─────────────────┬──────────────────────────────────────────────────┤
│                 │                                                    │
│   SQLite DB     │     Python Subprocess                             │
│   (data/)       │     (scraper/scrape.py)                          │
│                 │                                                    │
│   - profile     │     - python-jobspy                               │
│   - jobs        │     - Indeed, LinkedIn,                           │
│   - applications│       Glassdoor, Google,                          │
│   - match_scores│       ZipRecruiter                               │
│   - resumes     │                                                    │
│   - reminders   │     Output: JSON → stdout                        │
│   - interview   │                                                    │
│     _prep       │                                                    │
│   - scrape_cache│                                                    │
│                 │                                                    │
├─────────────────┴──────────────────────────────────────────────────┤
│                    External Services                                │
│                                                                    │
│   OpenRouter API ──── Free LLM models (Llama, Mistral, Gemma)     │
│   Job Board Sites ── Indeed, LinkedIn, Glassdoor, Google, Zip      │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Complete User Journey

### Phase 1: Setup (First Launch)

```
Step 1 ──── Open http://localhost:3000
             │
             ├── System checks: profile exists?
             │   NO → Redirect to /setup
             │
Step 2 ──── /setup - Profile Wizard
             │
             ├── Step 1/5: Basic Info
             │   Name, location, languages
             │   [Doc: 02-USER-PROFILING.md §3.1]
             │
             ├── Step 2/5: Professional Identity
             │   Specialty, level, years, education
             │   [Doc: 02-USER-PROFILING.md §3.2]
             │
             ├── Step 3/5: Skills & Expertise
             │   Skills (tag picker), tools, certs
             │   [Doc: 02-USER-PROFILING.md §3.3]
             │
             ├── Step 4/5: Job Preferences
             │   Roles, locations, remote, salary, job types
             │   [Doc: 02-USER-PROFILING.md §3.4]
             │
             ├── Step 5/5: Resume Upload
             │   Drag & drop PDF/DOCX (optional)
             │   [Doc: 03-RESUME-REVIEW.md §2]
             │
             └── POST /api/profile → Save to JSON + SQLite
                  │
                  └── Trigger initial scrape → Redirect to /jobs
```

### Phase 2: Job Discovery

```
Step 3 ──── /jobs - Job Feed
             │
             ├── System generates search queries from profile
             │   [Doc: 05-SEARCH-STRATEGY.md §2]
             │
             ├── Calls POST /api/scrape
             │   │
             │   ├── Selects sources based on profile
             │   │   [Doc: 04-JOB-SOURCES-DATABASE.md §11]
             │   │
             │   ├── Executes Python scraper (subprocess)
             │   │   python scraper/scrape.py --search "..." --location "..."
             │   │   [Doc: 05-SEARCH-STRATEGY.md §4]
             │   │
             │   ├── Receives JSON results from stdout
             │   │
             │   ├── Deduplicates against existing jobs
             │   │   [Doc: 05-SEARCH-STRATEGY.md §5]
             │   │
             │   └── Inserts new jobs into SQLite
             │
             ├── Runs matching algorithm on new jobs
             │   POST /api/match
             │   [Doc: 06-JOB-MATCHING.md §3]
             │
             ├── Generates AI match reasoning (batch, via OpenRouter)
             │   [Doc: 06-JOB-MATCHING.md §4]
             │
             └── Displays results sorted by match score
                  │
                  ├── Filters: source, location, remote, salary, type, date
                  ├── Each card shows: title, company, score, skills, salary
                  ├── Click card → Side panel with full details
                  └── Actions: [Save] [Apply] [Dismiss]
```

### Phase 3: Resume Optimization

```
Step 4 ──── /resume - Resume Review
             │
             ├── User uploads PDF/DOCX
             │   POST /api/resume/upload
             │
             ├── System parses text from file
             │   [Doc: 03-RESUME-REVIEW.md §2, step 2]
             │
             ├── AI extracts structured data (OpenRouter)
             │   [Doc: 03-RESUME-REVIEW.md §3.1]
             │
             ├── AI performs comprehensive analysis (OpenRouter)
             │   [Doc: 03-RESUME-REVIEW.md §3.2]
             │   │
             │   ├── ATS score (0-100)
             │   ├── Strengths identified
             │   ├── Weaknesses with fixes
             │   ├── Missing keywords
             │   ├── Bullet rewrite suggestions
             │   └── Section-by-section feedback
             │
             └── Display results in split view
                  Left: resume preview
                  Right: AI analysis + suggestions
```

### Phase 4: Application Preparation

```
Step 5 ──── User decides to apply to a specific job
             │
             ├── Click "Apply" on a job card
             │
             ├── System runs job-specific gap analysis
             │   [Doc: 07-APPLICATION-PREP.md §3]
             │
             ├── AI generates resume tailoring suggestions
             │   [Doc: 07-APPLICATION-PREP.md §4]
             │
             ├── AI drafts cover letter (optional)
             │   [Doc: 07-APPLICATION-PREP.md §5]
             │
             ├── Application checklist presented
             │   [Doc: 07-APPLICATION-PREP.md §6]
             │   ☐ Resume tailored
             │   ☐ Cover letter ready
             │   ☐ Application URL opened
             │
             └── User marks as "Applied"
                  │
                  ├── Application record created in SQLite
                  ├── Follow-up reminder set (7 days)
                  └── Job moves to "Applied" column in tracker
```

### Phase 5: Application Tracking

```
Step 6 ──── /tracker - Kanban Board
             │
             ├── Columns: Saved → Applied → Screening → Interview → Offer
             │   [Doc: 08-TRACKING-FOLLOWUP.md §2]
             │
             ├── Drag & drop to change status
             │
             ├── Click card for detail panel
             │   ├── Timeline of status changes
             │   ├── Notes (add freeform notes)
             │   ├── Resume & cover letter used
             │   └── Follow-up reminders
             │
             └── Dashboard shows:
                  ├── Upcoming follow-ups (overdue highlighted)
                  ├── Application funnel stats
                  └── Weekly activity chart
                  [Doc: 08-TRACKING-FOLLOWUP.md §5]
```

### Phase 6: Interview Preparation

```
Step 7 ──── User moves application to "Interview" status
             │
             ├── System prompts: "Want to prep for this interview?"
             │
             ├── Click "Prep for Interview"
             │   [Doc: 09-INTERVIEW-PREP.md]
             │
             ├── AI generates prep package:
             │   ├── Company research brief
             │   ├── 15 technical questions (role-specific)
             │   ├── 10 behavioral questions (STAR templates)
             │   ├── 8-10 questions to ask interviewer
             │   └── Logistics checklist
             │
             ├── User reviews and adds personal notes
             │
             └── After interview:
                  ├── Update outcome (passed/failed/pending)
                  ├── Generate thank-you email draft
                  └── Set follow-up reminder
```

### Phase 7: Ongoing Search & AI Chat

```
Step 8 ──── /chat - AI Assistant (anytime)
             │
             ├── "Find me React jobs at startups in NYC"
             │   → Triggers targeted scrape + displays results
             │
             ├── "Review my resume for this job [paste URL]"
             │   → Job-specific resume tailoring
             │
             ├── "Help me write a cover letter for Acme Corp"
             │   → Generates tailored cover letter
             │
             ├── "What skills am I missing for senior roles?"
             │   → Analyzes profile vs. senior job requirements
             │
             ├── "How should I negotiate the offer from Beta Inc?"
             │   → Salary negotiation advice based on market data
             │
             └── "Show me my application stats"
                  → Displays funnel metrics and trends
```

---

## 3. Data Flow Diagram

```
                    ┌─────────┐
                    │  User   │
                    └────┬────┘
                         │ Interacts with UI
                         ▼
                  ┌──────────────┐
                  │   Frontend   │
                  │  (Next.js)   │
                  └──────┬───────┘
                         │ API calls
                         ▼
                  ┌──────────────┐
                  │  API Routes  │──────────────────────┐
                  │  (Next.js)   │                      │
                  └──┬───┬───┬──┘                      │
                     │   │   │                         │
          ┌──────────┘   │   └──────────┐              │
          ▼              ▼              ▼              ▼
    ┌───────────┐ ┌───────────┐ ┌───────────┐  ┌───────────┐
    │  SQLite   │ │  Python   │ │OpenRouter │  │   File    │
    │  Database │ │  Scraper  │ │   API     │  │  System   │
    │           │ │           │ │           │  │ (uploads) │
    │ - profile │ │ - JobSpy  │ │ - Resume  │  │ - PDFs    │
    │ - jobs    │ │ - Indeed  │ │   review  │  │ - DOCX    │
    │ - apps    │ │ - LinkedIn│ │ - Match   │  │ - profile │
    │ - scores  │ │ - Glassdor│ │   reasons │  │   .json   │
    │ - preps   │ │ - Google  │ │ - Cover   │  │           │
    │ - remind  │ │ - ZipRecr │ │   letters │  │           │
    └───────────┘ └───────────┘ │ - Int prep│  └───────────┘
                                │ - Chat    │
                                └───────────┘
```

---

## 4. Database Schema (Complete)

All tables across the entire system:

```sql
-- User profile (single row)
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data TEXT NOT NULL,                    -- Full profile JSON
  completeness INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Profile skills (for efficient matching)
CREATE TABLE IF NOT EXISTS profile_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill TEXT NOT NULL UNIQUE
);

-- Scraped jobs
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT,                      -- ID from source platform
  source TEXT NOT NULL,                  -- indeed, linkedin, glassdoor, etc.
  hash TEXT NOT NULL UNIQUE,             -- Dedup hash
  title TEXT NOT NULL,
  company TEXT,
  company_url TEXT,
  job_url TEXT NOT NULL,                 -- Direct application link
  city TEXT,
  state TEXT,
  country TEXT,
  is_remote INTEGER DEFAULT 0,
  description TEXT,
  job_type TEXT,                         -- fulltime, parttime, internship, contract
  job_level TEXT,                        -- junior, mid, senior, lead
  salary_min REAL,
  salary_max REAL,
  salary_interval TEXT,                  -- yearly, monthly, hourly
  salary_currency TEXT,
  date_posted TEXT,
  date_scraped TEXT DEFAULT (datetime('now')),
  skills TEXT,                           -- JSON array of extracted skills
  is_dismissed INTEGER DEFAULT 0,        -- User dismissed this job
  created_at TEXT DEFAULT (datetime('now'))
);

-- AI match scores (job vs profile)
CREATE TABLE IF NOT EXISTS match_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL UNIQUE,
  overall_score INTEGER NOT NULL,
  skill_score INTEGER NOT NULL,
  experience_score INTEGER NOT NULL,
  location_score INTEGER NOT NULL,
  salary_score INTEGER NOT NULL,
  job_type_score INTEGER NOT NULL,
  recency_score INTEGER NOT NULL,
  reasoning TEXT,
  is_recommended INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Application tracking
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'saved',
  applied_date TEXT,
  resume_file TEXT,
  cover_letter TEXT,
  notes TEXT,                            -- JSON array of notes
  rejection_reason TEXT,
  salary_offered TEXT,
  follow_up_date TEXT,
  interview_dates TEXT,                  -- JSON array
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Follow-up reminders
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  reminder_date TEXT NOT NULL,
  message TEXT NOT NULL,
  is_completed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Uploaded resumes
CREATE TABLE IF NOT EXISTS resumes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  raw_text TEXT,
  parsed_data TEXT,                      -- JSON
  ai_review TEXT,                        -- JSON
  ats_score INTEGER,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Interview prep materials
CREATE TABLE IF NOT EXISTS interview_prep (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  company_brief TEXT,
  technical_questions TEXT,
  behavioral_questions TEXT,
  questions_to_ask TEXT,
  user_notes TEXT,
  interview_date TEXT,
  interview_type TEXT,
  interviewer_name TEXT,
  outcome TEXT,
  thank_you_sent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Scrape cache (prevent duplicate scraping)
CREATE TABLE IF NOT EXISTS scrape_cache (
  query_hash TEXT PRIMARY KEY,
  search_term TEXT NOT NULL,
  location TEXT,
  sites TEXT,
  last_scraped TEXT DEFAULT (datetime('now')),
  result_count INTEGER DEFAULT 0
);

-- Chat history (optional, for context)
CREATE TABLE IF NOT EXISTS chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,                    -- user | assistant
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_hash ON jobs(hash);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_date ON jobs(date_scraped);
CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_match_score ON match_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_match_rec ON match_scores(is_recommended);
CREATE INDEX IF NOT EXISTS idx_app_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_app_followup ON applications(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_reminder_date ON reminders(reminder_date);
```

---

## 5. API Route Map

| Method | Route | Purpose | Doc Reference |
|--------|-------|---------|--------------|
| GET | `/api/profile` | Get user profile | 02 §7 |
| POST | `/api/profile` | Create/update profile | 02 §7 |
| GET | `/api/jobs` | List jobs (with filters, pagination) | 06 §7 |
| GET | `/api/jobs/[id]` | Get single job detail | 06 §7 |
| POST | `/api/jobs/dismiss` | Dismiss a job | - |
| POST | `/api/scrape` | Trigger job scraping | 05 §4 |
| POST | `/api/match` | Run matching on new/all jobs | 06 §3 |
| POST | `/api/match/[jobId]` | Re-match single job | 06 §3 |
| GET | `/api/applications` | List all applications | 08 §6 |
| POST | `/api/applications` | Create application (save/apply) | 08 §6 |
| PATCH | `/api/applications/[id]` | Update status, notes | 08 §6 |
| DELETE | `/api/applications/[id]` | Delete application | 08 §6 |
| GET | `/api/reminders` | List upcoming reminders | 08 §4 |
| POST | `/api/reminders` | Create reminder | 08 §4 |
| PATCH | `/api/reminders/[id]` | Mark complete | 08 §4 |
| POST | `/api/resume/upload` | Upload resume file | 03 §2 |
| POST | `/api/resume/analyze` | Trigger AI analysis | 03 §3 |
| GET | `/api/resume/[id]` | Get resume + analysis | 03 §6 |
| POST | `/api/ai/chat` | Send chat message | - |
| POST | `/api/ai/cover-letter` | Generate cover letter | 07 §5 |
| POST | `/api/ai/tailor-resume` | Tailor resume for job | 07 §4 |
| POST | `/api/ai/interview-prep` | Generate interview prep | 09 §2 |
| GET | `/api/stats` | Dashboard statistics | 08 §5 |
| POST | `/api/export` | Export all data (JSON/CSV) | 08 §8 |
| DELETE | `/api/data` | Delete all user data | 00-RULES §4.5 |

---

## 6. File Inventory

| File | Purpose | Doc |
|------|---------|-----|
| `docs/00-RULES.md` | Project rules and constraints | This doc |
| `docs/01-RESEARCH.md` | Job hunting research findings | 01 |
| `docs/02-USER-PROFILING.md` | User profiling methodology | 02 |
| `docs/03-RESUME-REVIEW.md` | Resume analysis workflow | 03 |
| `docs/04-JOB-SOURCES-DATABASE.md` | 200+ job boards catalog | 04 |
| `docs/05-SEARCH-STRATEGY.md` | Search query generation & execution | 05 |
| `docs/06-JOB-MATCHING.md` | AI scoring & filtering | 06 |
| `docs/07-APPLICATION-PREP.md` | Resume tailoring & cover letters | 07 |
| `docs/08-TRACKING-FOLLOWUP.md` | Application tracking & reminders | 08 |
| `docs/09-INTERVIEW-PREP.md` | Interview preparation | 09 |
| `docs/10-WORKFLOW-OVERVIEW.md` | This document | 10 |

---

## 7. Tech Requirements Summary

### To Run This App

```bash
# Prerequisites
node >= 20.0.0
python >= 3.10
pip install python-jobspy

# Setup
git clone <repo>
cd job-hunter-agent
npm install
echo "OPENROUTER_API_KEY=sk-or-..." > .env.local

# Run
npm run dev
# Open http://localhost:3000
```

### Python Dependencies (`scraper/requirements.txt`)

```
python-jobspy>=1.1.82
```

### Node.js Dependencies (Key Packages)

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "better-sqlite3": "^11.0.0",
    "zod": "^3.23.0",
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.8.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/better-sqlite3": "^7.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

---

## 8. Implementation Priority Order

Build the app in this order to get value as early as possible:

| Priority | Feature | What Works After This |
|----------|---------|----------------------|
| **P0** | Project skeleton (Next.js + SQLite + Tailwind + shadcn) | App runs |
| **P1** | Profile wizard (`/setup`) | User can set up profile |
| **P2** | Python scraper integration (`/api/scrape`) | Jobs are scraped |
| **P3** | Job feed page (`/jobs`) | User can browse jobs |
| **P4** | Match scoring (`/api/match`) | Jobs are ranked |
| **P5** | Application tracker (`/tracker`) | User can track applications |
| **P6** | Resume upload + AI review (`/resume`) | Resume feedback works |
| **P7** | AI chat (`/chat`) | Conversational search |
| **P8** | Cover letter + resume tailoring | Application prep works |
| **P9** | Interview prep (`/interview`) | Interview prep works |
| **P10** | Dashboard stats (`/`) | Full analytics |
| **P11** | Settings + export (`/settings`) | Data management |
| **P12** | Scheduled scraping | Background job discovery |

**MVP = P0 through P5.** Everything else is enhancement.

---

## References

- All referenced documents: `docs/00-RULES.md` through `docs/09-INTERVIEW-PREP.md`
- Architecture patterns from [JobSync](https://github.com/Gsync/jobsync) and [job-ops](https://github.com/DaKheera47/job-ops)
- Database schema designed for SQLite performance characteristics
- API design follows REST conventions with pragmatic simplifications for single-user use
