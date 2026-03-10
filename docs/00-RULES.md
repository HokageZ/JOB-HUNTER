# 00 - Project Rules & Constraints

> The single source of truth for how this project is built, maintained, and operated.
> Every decision, file, and line of code must comply with these rules.

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Name** | Job Hunter AI Agent |
| **Type** | Local-only, single-user web application |
| **Purpose** | AI-powered job search assistant that scrapes, matches, and helps users track job applications across ALL industries and experience levels |
| **Users** | One person - the machine owner. No multi-user support. |
| **Network** | Runs on `localhost:3000`. Never exposed to the internet. |

---

## 2. Architecture Rules

### 2.1 Simplicity First

These are hard constraints. Do NOT introduce complexity beyond what is listed here.

- **NO authentication** - single user, localhost only, no login screens
- **NO Docker required** - runs with `npm run dev` + Python available on PATH
- **NO external database server** - SQLite file only (`data/jobhunter.db`)
- **NO deployment infrastructure** - this app never leaves localhost
- **NO microservices** - one Next.js app + one Python script called via subprocess
- **NO environment-specific configs** - one `.env.local` file with the OpenRouter key
- **NO build step required for development** - `npm run dev` starts everything

### 2.2 Tech Stack (Locked)

Do not substitute any of these without updating this document first.

| Layer | Choice | Reason | Negotiable? |
|-------|--------|--------|-------------|
| Framework | Next.js 15 (App Router) | Full-stack in one process | No |
| Language | TypeScript (strict mode) | Type safety | No |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI, accessible components | No |
| Database | SQLite via `better-sqlite3` | Zero config, file-based, fast | No |
| AI/LLM | OpenRouter API (free models) | Free, multi-model access | No |
| Scraping | Python 3.10+ with `python-jobspy` | Best job scraper available | No |
| Runtime | Node.js 20+ | LTS support | No |
| Package Manager | npm | Simplicity | No |

### 2.3 File & Folder Conventions

```
job-hunter-agent/
├── docs/                          # All project documentation (you are here)
├── src/                           # All application source code
│   ├── app/                       # Next.js App Router pages + API routes
│   │   ├── page.tsx              # Dashboard (home)
│   │   ├── setup/                # Profile wizard
│   │   ├── jobs/                 # Job feed + search
│   │   ├── tracker/              # Application kanban board
│   │   ├── resume/               # Resume upload + AI review
│   │   ├── chat/                 # AI chat assistant
│   │   ├── settings/             # Config (API key, scraping, export)
│   │   └── api/                  # Backend API routes
│   │       ├── profile/          # Profile CRUD
│   │       ├── jobs/             # Job listing + search
│   │       ├── scrape/           # Trigger Python scraper
│   │       ├── match/            # AI matching engine
│   │       └── ai/               # OpenRouter proxy
│   ├── components/               # Shared React components
│   │   └── ui/                   # shadcn/ui primitives
│   ├── lib/                      # Shared utilities & business logic
│   │   ├── db.ts                 # SQLite connection + query helpers
│   │   ├── openrouter.ts         # OpenRouter API client
│   │   ├── scraper.ts            # Python subprocess caller
│   │   ├── matching.ts           # Job scoring algorithm
│   │   └── migrations/           # SQL migration files
│   └── types/                    # Shared TypeScript interfaces
├── scraper/                       # Python scraping code
│   ├── scrape.py                 # Entry point (reads args, outputs JSON)
│   └── requirements.txt          # Pinned Python dependencies
├── data/                          # Runtime data (gitignored)
│   └── jobhunter.db              # SQLite database file
├── uploads/                       # Uploaded resumes (gitignored)
├── public/                        # Static assets
├── .env.local                     # OpenRouter API key (gitignored)
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

### 2.4 Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `JobCard.tsx`, `ProfileWizard.tsx` |
| Utility files | camelCase | `openrouter.ts`, `matchScore.ts` |
| API route folders | kebab-case | `api/scrape/`, `api/match/` |
| Database tables | snake_case | `match_scores`, `job_sources` |
| TypeScript interfaces | PascalCase, prefixed `I` only if ambiguous | `Job`, `UserProfile`, `MatchResult` |
| CSS classes | Tailwind utilities only | No custom CSS files unless absolutely necessary |
| Environment variables | SCREAMING_SNAKE_CASE | `OPENROUTER_API_KEY` |

---

## 3. Coding Standards

### 3.1 TypeScript

```typescript
// GOOD
const fetchJobs = async (query: string): Promise<Job[]> => {
  const results = await db.query<Job>('SELECT * FROM jobs WHERE title LIKE ?', [`%${query}%`]);
  return results;
};

// BAD - no any, no var, no .then chains
var fetchJobs = (query) => {
  return fetch('/api/jobs').then(r => r.json());
};
```

- **Strict mode enabled** (`"strict": true` in tsconfig)
- **No `any` types** - use proper interfaces, `unknown` if truly unknown
- **All API request/response bodies validated with Zod**
- **Prefer `const` over `let`**, never use `var`
- **Use `async/await`**, never raw `.then()` chains
- **Destructure** when accessing object properties
- **No default exports** except for Next.js pages (required by framework)

### 3.2 React / Next.js

- **Server Components by default** - only add `"use client"` when hooks/state/effects are needed
- **Colocate page-specific components** with their page directory
- **Shared components** go in `src/components/`
- **Use shadcn/ui primitives** - do not build custom buttons, inputs, dialogs, etc.
- **No prop drilling deeper than 2 levels** - use React Context or Zustand if needed
- **Every component that fetches data** must handle: loading, error, and empty states

### 3.3 API Routes

Every API route follows this response contract:

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: "Human-readable error message" }
```

- **Zod validation** on all incoming request bodies
- **Routes are thin** - extract business logic to `src/lib/`
- **try/catch every route** with meaningful error messages
- **No authentication middleware** (single user, localhost)

### 3.4 Database (SQLite)

- **`better-sqlite3`** for synchronous, simple queries (no async overhead)
- **Migrations** stored as numbered SQL files: `001_init.sql`, `002_add_match_scores.sql`
- **Auto-run migrations** on app startup (check which have been applied)
- **No ORM** - raw SQL with thin TypeScript wrappers for type safety
- **Indexes** on: `jobs.title`, `jobs.company`, `jobs.date_scraped`, `applications.status`
- **Foreign keys enabled** via `PRAGMA foreign_keys = ON`

### 3.5 Python Scraper

- **Single entry point**: `python scraper/scrape.py`
- **Input**: CLI arguments (`--search "term" --location "place" --sites "indeed,linkedin"`)
- **Output**: JSON array to stdout, parsed by Node.js
- **Error output**: stderr (Node.js reads and logs it)
- **`requirements.txt`** with pinned versions
- **No web server** - the Python code is a CLI tool, not a service

Communication protocol between Node.js and Python:

```
Node.js                           Python
  |                                 |
  |-- execFile('python', [...]) --> |
  |                                 | -- scrape_jobs(...) via JobSpy
  |                                 | -- print(json.dumps(results))
  | <-- stdout (JSON) ------------- |
  |                                 |
  | <-- stderr (errors) ----------- |
```

---

## 4. AI Agent Behavior Rules

### 4.1 User Profiling

- **MUST ask clarifying questions** before any job search. Never search blind.
- **MUST cover all of these**: specialty/field, experience level, specific skills, preferred locations, remote preference, salary expectations, education, languages spoken
- **NEVER assume** the user's field or level - always ask explicitly
- **Profile stored as a single JSON file** (`data/profile.json`) AND as a row in SQLite
- **Profile is editable anytime** from the `/setup` page or `/settings`
- **Validate profile completeness** - warn the user if critical fields are empty

### 4.2 Resume Review

The AI agent MUST follow this protocol when reviewing a resume:

1. **Parse** the uploaded file (PDF/DOCX) into plain text
2. **Analyze** against target role(s) from the user's profile
3. **Score** ATS compatibility (0-100)
4. **Identify** specific strengths (what works well)
5. **Identify** specific weaknesses (what to fix)
6. **List** missing keywords compared to target job descriptions
7. **Suggest** concrete improvements (not vague advice)

Rules:
- **NEVER give generic praise** - be honest and specific
- **NEVER fabricate skills** the resume doesn't mention
- **ALWAYS compare** against the user's target roles
- **Provide before/after examples** for suggested rewrites
- **Flag formatting issues** (length, sections, readability)

### 4.3 Job Matching & Scoring

Every scraped job is scored 0-100 against the user's profile:

| Factor | Weight | Scoring Method |
|--------|--------|---------------|
| Skill match | 35% | % overlap between user skills and job required/preferred skills |
| Experience level | 20% | Exact match = 100, one level off = 60, two+ = 20 |
| Location fit | 15% | Exact city = 100, same country + remote OK = 80, mismatch = 0 |
| Salary range | 15% | Job range overlaps user range = 100, partial overlap = 50, no overlap = 0 |
| Job type fit | 10% | Remote/hybrid/onsite matches preference = 100, else = 30 |
| Recency | 5% | Posted today = 100, this week = 70, this month = 40, older = 10 |

Rules:
- **Jobs scoring 60+ are "Recommended"** and shown prominently
- **Jobs scoring 40-59 are "Possible"** and shown in secondary feed
- **Jobs scoring below 40** are hidden by default (user can reveal)
- **AI generates a 1-2 sentence explanation** for every match score
- **User can adjust weights** from settings

### 4.4 Job Search Behavior

- **Search across ALL relevant platforms** for the user's specialty
- **Use multiple search queries** derived from the user's desired roles and skills
- **Deduplicate** results by hashing `(title + company + location)`
- **Preserve original application URLs** - never modify or redirect
- **Cache results** - don't re-scrape the same query within 1 hour
- **Rate limit** scraping to avoid bans (random delays between requests)
- **On-demand scraping** triggered by user + **scheduled scraping** every 6 hours

### 4.5 Privacy & Data

- **ALL data stays on the local machine.** Period.
- The only outbound network calls are:
  1. OpenRouter API (for AI features) - sends resume text + job descriptions
  2. Job board websites (for scraping) - sends search queries
- **No telemetry, no analytics, no tracking, no cookies**
- **User can export ALL data** as JSON or CSV from settings
- **User can delete ALL data** with a single button (wipes DB + uploads)
- **Resume content IS sent to OpenRouter** for AI review - this is disclosed in the UI
- **`.env.local` is gitignored** - API keys never leave the machine

---

## 5. UI/UX Rules

### 5.1 Design Principles

1. **Dark mode by default** with a light mode toggle in settings
2. **Desktop-first** - optimized for wide screens, responsive but not mobile-primary
3. **Minimal clicks** - every common action reachable in 2 clicks or less
4. **Loading states everywhere** - skeleton loaders for data, spinners for actions
5. **Keyboard accessible** - tab navigation, Enter to confirm, Escape to cancel
6. **No unnecessary animations** - subtle transitions only where they aid comprehension
7. **Information density** - show as much useful data as possible without clutter

### 5.2 Pages (Exactly These)

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | Stats overview, recent recommendations, pending follow-ups |
| `/setup` | Profile Wizard | 5-step onboarding wizard (also used to edit profile) |
| `/jobs` | Job Feed | Scraped jobs with filters, search, match scores |
| `/tracker` | Application Tracker | Kanban board: Saved > Applied > Screening > Interview > Offer/Rejected |
| `/resume` | Resume Review | Upload PDF/DOCX, get AI-powered analysis |
| `/chat` | AI Chat | Conversational assistant for job search queries |
| `/settings` | Settings | API key config, scraping schedule, data export/delete |

**No other pages.** If a feature doesn't fit in one of these, it belongs in a component within an existing page.

### 5.3 Component Rules

- Every async action shows a **loading state** (spinner or skeleton)
- Every destructive action requires a **confirmation dialog** (delete data, clear profile)
- **Toast notifications** for success/error feedback (bottom-right)
- **No modals for content** - modals only for confirmations and quick forms
- **Side panels** (drawers) for job detail views in the feed
- **Empty states** with helpful messaging ("No jobs found. Try adjusting your profile or running a new search.")

---

## 6. Workflow Rules

### 6.1 First-Time User Flow

```
User opens app
  └─> No profile detected?
       └─> Redirect to /setup
            └─> Step 1: Basic Info (name, location, languages)
            └─> Step 2: Experience (specialty, level, years, education)
            └─> Step 3: Skills (tag-based picker + freeform)
            └─> Step 4: Preferences (remote, salary, relocation, sponsorship)
            └─> Step 5: Resume Upload (optional, drag & drop)
            └─> Profile saved
                 └─> Trigger initial job scrape
                 └─> Redirect to /jobs with first results
```

### 6.2 Returning User Flow

```
User opens app
  └─> Profile exists?
       └─> Show Dashboard (/)
            ├─> Stats: total jobs found, applications sent, response rate
            ├─> New jobs since last visit (highlighted)
            ├─> Pending follow-ups (applications needing attention)
            └─> Quick actions: Search, Review Resume, Open Tracker
```

### 6.3 Job Search Flow

```
1. Read user profile
2. Generate search queries from: desired roles + skills + location
3. Call Python scraper with generated queries
4. Receive JSON results from stdout
5. Deduplicate against existing jobs in database
6. Insert new jobs into SQLite
7. Run AI matching on new jobs (batch, via OpenRouter)
8. Store match scores
9. Return sorted results to frontend
```

### 6.4 Application Tracking Flow

```
User saves a job ───> "Saved" column
User clicks "Applied" ───> "Applied" column (enter date, optionally paste cover letter)
Status update ───> "Screening" | "Interview" | "Offer" | "Rejected" | "Withdrawn"
Each transition ───> Optional note, auto-set follow-up reminder (7 days)
Interview stage ───> Link to /interview prep for that company
Offer stage ───> Salary comparison view
```

---

## 7. Documentation Standards

Every file in `docs/` follows this structure:

```markdown
# XX - Title

> One-line purpose statement.

---

## Section 1
[Content]

## Section 2
[Content]

---

## Implementation Notes
[How this doc maps to actual code/features]

## References
[Links, sources, credits]
```

Rules:
- **Use tables** for structured/comparative data
- **Use code blocks** for any technical content (SQL, TypeScript, Python, JSON)
- **Use blockquotes** for callouts and important notes
- **Be direct and actionable** - no filler text
- **Every doc must explain WHY**, not just what

---

## 8. Git Rules

### Commit Messages

Format: `type: short description`

| Type | When |
|------|------|
| `feat` | New feature or functionality |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code restructure, no behavior change |
| `style` | Formatting, CSS, no logic change |
| `chore` | Dependencies, config, tooling |

Examples:
- `feat: add job feed page with filters`
- `fix: scraper timeout on LinkedIn queries`
- `docs: complete 04-JOB-SOURCES-DATABASE.md`

### .gitignore (Mandatory)

```gitignore
node_modules/
.next/
data/
uploads/
.env.local
*.db
*.db-journal
__pycache__/
*.pyc
.venv/
```

---

## 9. Error Handling Rules

- **Never swallow errors silently** - every catch block must log or surface the error
- **Console logging** with context: `console.error('[scraper]', error.message)`
- **User-facing errors** shown as toast notifications with actionable text
- **Retry logic**: failed API calls retry up to 3 times with exponential backoff (1s, 2s, 4s)
- **Graceful degradation**:
  - Scraper fails? Show cached jobs from database with a "stale data" warning
  - OpenRouter down? Disable AI features, show a banner, let user continue manually
  - Python not installed? Show setup instructions on first run
- **Never crash the app** - catch at route/page level, show error boundary

---

## 10. Performance Rules

- **SQLite indexes** on: `jobs(title)`, `jobs(company)`, `jobs(date_scraped)`, `applications(status)`, `match_scores(score)`
- **Pagination**: job feed loads 50 items per page, infinite scroll or "Load More"
- **Async resume parsing** - don't block the UI thread
- **Scraping cache**: same query not re-scraped within 1 hour (configurable)
- **Lazy load** images and heavy components
- **Debounce** search input (300ms)
- **No unnecessary re-renders** - memoize expensive components

---

## 11. Security Rules (Even for Localhost)

- **`.env.local` is gitignored** - never commit API keys
- **Sanitize all user input** before SQL queries (parameterized queries only, never string concatenation)
- **Validate file uploads**: only `.pdf` and `.docx`, max 10MB
- **No `eval()` or `Function()` anywhere**
- **No `dangerouslySetInnerHTML`** unless rendering sanitized markdown from AI responses
- **CSP headers** set in `next.config.ts` even for localhost (good habit)

---

## References

- [Next.js 15 Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [OpenRouter API](https://openrouter.ai/docs)
- [python-jobspy](https://github.com/speedyapply/JobSpy)
- [Tailwind CSS](https://tailwindcss.com/docs)
