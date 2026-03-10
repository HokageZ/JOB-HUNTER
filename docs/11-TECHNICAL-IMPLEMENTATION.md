# 11 - Technical Implementation Guide

> The step-by-step coding blueprint for the entire application. Each priority (P0-P12) is broken down into exact files to create, exact commands to run, exact code patterns to follow, and exact verification steps. A coding agent should be able to follow this document top-to-bottom and produce the complete application.

---

## IMPORTANT: Read Before Coding

1. **Read `00-RULES.md` first** — it governs all decisions
2. **Install agent skills from `12-AGENT-SKILLS.md`** — install ALL required skills before starting
3. **Follow priorities in order** — P0 before P1, P1 before P2, etc.
4. **Verify each priority works** before moving to the next
5. **Reference the specific doc** listed for each priority for detailed business logic
6. **Never skip error handling** — every API route needs try/catch, every component needs loading/error/empty states
7. **Never use `any` type** — TypeScript strict mode is non-negotiable

---

## P0: Project Skeleton

**Goal:** A running Next.js 15 app with SQLite, Tailwind, shadcn/ui, and the DB schema initialized.

**Reference docs:** `00-RULES.md` §2, `10-WORKFLOW-OVERVIEW.md` §4

### P0 Step 1: Initialize Next.js Project

```bash
cd C:\Users\Dead\job-hunter-agent
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

When prompted:
- Would you like to use TypeScript? **Yes**
- Would you like to use ESLint? **Yes**
- Would you like to use Tailwind CSS? **Yes**
- Would you like your code inside a `src/` directory? **Yes**
- Would you like to use App Router? **Yes**
- Would you like to use Turbopack? **Yes**
- Would you like to customize the import alias? **Yes** → `@/*`

> If the project folder already has docs/ and the CLI complains, either run it in an empty temp directory and move files, or use `--no-git` and handle manually.

### P0 Step 2: Install Dependencies

```bash
npm install better-sqlite3 zod pdf-parse mammoth
npm install -D @types/better-sqlite3 @types/pdf-parse
```

**Package purposes:**
| Package | Purpose | Used in |
|---------|---------|---------|
| `better-sqlite3` | SQLite database driver (synchronous) | `src/lib/db.ts` |
| `zod` | Request/response validation schemas | Every API route |
| `pdf-parse` | Extract text from PDF resumes | `src/lib/resume-parser.ts` |
| `mammoth` | Extract text from DOCX resumes | `src/lib/resume-parser.ts` |
| `@types/better-sqlite3` | TypeScript types for better-sqlite3 | Dev only |
| `@types/pdf-parse` | TypeScript types for pdf-parse | Dev only |

### P0 Step 3: Initialize shadcn/ui

```bash
npx shadcn@latest init
```

When prompted:
- Which style? **New York**
- Which base color? **Zinc** (works best for dark mode)
- CSS variables for theming? **Yes**

Then install the core components we need across the app:

```bash
npx shadcn@latest add button input label card dialog select tabs badge toast textarea separator skeleton dropdown-menu sheet scroll-area progress switch slider checkbox radio-group tooltip alert form table
```

This creates files in `src/components/ui/` — one file per component.

### P0 Step 4: Create Directory Structure

```bash
# Create all directories (these don't exist yet)
mkdir -p src/app/setup
mkdir -p src/app/jobs
mkdir -p src/app/tracker
mkdir -p src/app/resume
mkdir -p src/app/chat
mkdir -p src/app/settings
mkdir -p src/app/api/profile
mkdir -p src/app/api/jobs
mkdir -p src/app/api/scrape
mkdir -p src/app/api/match
mkdir -p src/app/api/ai
mkdir -p src/app/api/applications
mkdir -p src/app/api/reminders
mkdir -p src/app/api/resume
mkdir -p src/app/api/stats
mkdir -p src/app/api/export
mkdir -p src/app/api/data
mkdir -p src/lib/migrations
mkdir -p src/types
mkdir -p src/components
mkdir -p scraper
mkdir -p data
mkdir -p uploads
mkdir -p public
```

### P0 Step 5: Create `.env.local`

Create file: `.env.local`

```env
OPENROUTER_API_KEY=sk-or-replace-with-your-key
```

### P0 Step 6: Create `.gitignore`

Create file: `.gitignore`

```gitignore
# Dependencies
node_modules/
.next/

# Runtime data
data/
uploads/

# Environment
.env.local

# SQLite
*.db
*.db-journal
*.db-wal

# Python
__pycache__/
*.pyc
.venv/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db
```

### P0 Step 7: Create TypeScript Types

Create file: `src/types/index.ts`

This file contains ALL shared TypeScript interfaces used across the application. Copy every interface from `02-USER-PROFILING.md` §2 (UserProfile, Specialty, ExperienceLevel, etc.), `06-JOB-MATCHING.md` §3 (MatchResult, Weights), `08-TRACKING-FOLLOWUP.md` §7 (VALID_TRANSITIONS), and add:

```typescript
// === DATABASE ROW TYPES ===

export interface JobRow {
  id: number;
  external_id: string | null;
  source: string;
  hash: string;
  title: string;
  company: string | null;
  company_url: string | null;
  job_url: string;
  city: string | null;
  state: string | null;
  country: string | null;
  is_remote: number; // 0 or 1 (SQLite boolean)
  description: string | null;
  job_type: string | null;
  job_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_interval: string | null;
  salary_currency: string | null;
  date_posted: string | null;
  date_scraped: string;
  skills: string | null; // JSON array string
  is_dismissed: number;
  created_at: string;
}

export interface MatchScoreRow {
  id: number;
  job_id: number;
  overall_score: number;
  skill_score: number;
  experience_score: number;
  location_score: number;
  salary_score: number;
  job_type_score: number;
  recency_score: number;
  reasoning: string | null;
  is_recommended: number;
  created_at: string;
}

export interface ApplicationRow {
  id: number;
  job_id: number;
  status: string;
  applied_date: string | null;
  resume_file: string | null;
  cover_letter: string | null;
  notes: string | null; // JSON array
  rejection_reason: string | null;
  salary_offered: string | null;
  follow_up_date: string | null;
  interview_dates: string | null; // JSON array
  created_at: string;
  updated_at: string;
}

export interface ReminderRow {
  id: number;
  application_id: number;
  reminder_date: string;
  message: string;
  is_completed: number;
  created_at: string;
}

export interface ResumeRow {
  id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  raw_text: string | null;
  parsed_data: string | null; // JSON
  ai_review: string | null;   // JSON
  ats_score: number | null;
  is_default: number;
  created_at: string;
  updated_at: string;
}

// === API RESPONSE CONTRACT ===

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

Also include ALL the enums/types from `02-USER-PROFILING.md` §2.2 (Specialty, ExperienceLevel, RemotePreference, JobType, CompanySizePreference, Education, UserProfile) and the MatchResult/Weights from `06-JOB-MATCHING.md` §3.

### P0 Step 8: Create SQLite Database Module

Create file: `src/lib/db.ts`

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'jobhunter.db');

// Singleton pattern — one connection for the whole app
let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    // Enable WAL mode for better concurrent read performance
    db.pragma('journal_mode = WAL');
    // Enable foreign key enforcement
    db.pragma('foreign_keys = ON');
    // Run migrations on first connection
    runMigrations(db);
  }
  return db;
}

function runMigrations(database: Database.Database): void {
  // Create migrations tracking table
  database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Read all migration files from src/lib/migrations/
  const migrationsDir = path.join(process.cwd(), 'src', 'lib', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Alphabetical = chronological with numbered prefix

  for (const file of files) {
    const applied = database.prepare(
      'SELECT id FROM _migrations WHERE name = ?'
    ).get(file);

    if (!applied) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      database.exec(sql);
      database.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
      console.log(`[db] Migration applied: ${file}`);
    }
  }
}
```

**Key points:**
- `better-sqlite3` is **synchronous** — no `await` needed for queries
- Singleton pattern prevents multiple DB connections
- WAL mode enables concurrent reads while writing
- Migrations auto-run on app startup

### P0 Step 9: Create Initial Migration

Create file: `src/lib/migrations/001_init.sql`

Copy the COMPLETE SQL schema from `10-WORKFLOW-OVERVIEW.md` §4 — all 10 `CREATE TABLE` statements and all `CREATE INDEX` statements. This includes: `profile`, `profile_skills`, `jobs`, `match_scores`, `applications`, `reminders`, `resumes`, `interview_prep`, `scrape_cache`, `chat_history`, and all indexes.

### P0 Step 10: Create OpenRouter Client

Create file: `src/lib/openrouter.ts`

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';
const FALLBACK_MODELS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free',
];

export async function chat(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set in .env.local');
  }

  const model = options.model || DEFAULT_MODEL;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Job Hunter AI Agent',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export async function chatWithRetry(
  messages: ChatMessage[],
  options: ChatOptions = {},
  retries = 3
): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Try fallback models on retry
      const model = attempt === 0
        ? (options.model || DEFAULT_MODEL)
        : FALLBACK_MODELS[attempt % FALLBACK_MODELS.length];

      return await chat(messages, { ...options, model });
    } catch (error) {
      console.error(`[openrouter] Attempt ${attempt + 1} failed:`, error);
      if (attempt === retries - 1) throw error;
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error('All OpenRouter retries exhausted');
}

export async function chatJSON<T>(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<T> {
  const response = await chatWithRetry(messages, options);
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, response];
  const jsonStr = jsonMatch[1]?.trim() || response.trim();
  return JSON.parse(jsonStr) as T;
}
```

**Key points:**
- Three helper functions: `chat()` (raw), `chatWithRetry()` (with retries + model fallback), `chatJSON()` (parses JSON from response)
- Uses free models by default — user can change in settings later
- Retry with exponential backoff (1s, 2s, 4s) and model fallback
- Extracts JSON from markdown code blocks (LLMs often wrap JSON in ``` blocks)

### P0 Step 11: Configure `next.config.ts`

Update `next.config.ts` to include:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow better-sqlite3 native module
  serverExternalPackages: ['better-sqlite3'],

  // Security headers (good habit even for localhost)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

> `serverExternalPackages` (formerly `serverComponentsExternalPackages`) is required for native Node.js modules like `better-sqlite3` to work with Next.js bundler.

### P0 Step 12: Update `tsconfig.json`

Ensure `strict: true` is set (should be by default with create-next-app):

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### P0 Step 13: Create App Layout with Dark Mode + Navigation

Create/update file: `src/app/layout.tsx`

This is the root layout. It must include:
- `<html>` with `className="dark"` (dark mode by default)
- Sidebar navigation with links to all 7 pages (`/`, `/setup`, `/jobs`, `/tracker`, `/resume`, `/chat`, `/settings`)
- A `<Toaster />` component for toast notifications (from shadcn/ui)
- Global font import (Inter or Geist — whichever create-next-app used)
- Responsive layout: sidebar on desktop, hamburger on smaller screens

**Navigation items (use icons from lucide-react, which ships with shadcn/ui):**

| Icon | Label | Route |
|------|-------|-------|
| LayoutDashboard | Dashboard | `/` |
| UserCircle | Profile | `/setup` |
| Search | Jobs | `/jobs` |
| Columns3 | Tracker | `/tracker` |
| FileText | Resume | `/resume` |
| MessageSquare | Chat | `/chat` |
| Settings | Settings | `/settings` |

### P0 Step 14: Create Placeholder Pages

For each route, create a minimal `page.tsx` that renders the page title. These will be fleshed out in later priorities.

Create these files:
- `src/app/page.tsx` — Dashboard (show "Dashboard — coming in P10")
- `src/app/setup/page.tsx` — Profile Wizard (show "Profile Wizard — coming in P1")
- `src/app/jobs/page.tsx` — Job Feed (show "Job Feed — coming in P3")
- `src/app/tracker/page.tsx` — Tracker (show "Tracker — coming in P5")
- `src/app/resume/page.tsx` — Resume (show "Resume Review — coming in P6")
- `src/app/chat/page.tsx` — Chat (show "AI Chat — coming in P7")
- `src/app/settings/page.tsx` — Settings (show "Settings — coming in P11")

Each page should be a Server Component (no `"use client"`) rendering a Card with the page title and a placeholder message.

### P0 Step 15: Create the Python Scraper Skeleton

Create file: `scraper/requirements.txt`

```
python-jobspy>=1.1.82
```

Create file: `scraper/scrape.py`

Copy the complete Python script from `05-SEARCH-STRATEGY.md` §4.2. This is the final production version — CLI args in, JSON out, errors to stderr.

### P0 Step 16: Verify P0

```bash
# 1. Start the dev server
npm run dev

# 2. Open http://localhost:3000 in browser
# Expected: App loads, sidebar navigation visible, dark mode active

# 3. Navigate to each page — all 7 should load without errors

# 4. Check database was created
# Expected: data/jobhunter.db exists, all tables created

# 5. Check Python scraper works
pip install -r scraper/requirements.txt
python scraper/scrape.py --search "test" --sites "indeed" --results 5
# Expected: JSON array printed to stdout (or error if no results)
```

**P0 is DONE when:** App runs, all pages load, sidebar navigation works, SQLite DB initializes with all tables, and Python scraper runs standalone.

---

## P1: Profile Wizard (`/setup`)

**Goal:** A 5-step onboarding form that saves the user's profile to SQLite + JSON file.

**Reference docs:** `02-USER-PROFILING.md` (entire document)

### P1 Step 1: Create Zod Schemas for Profile

Create file: `src/lib/schemas/profile.ts`

Define Zod schemas for each wizard step and the full profile. These schemas enforce validation rules:

```typescript
import { z } from 'zod';

// Step 1: Basic Info
export const basicInfoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional().default(''),
  country: z.string().min(1, 'Country is required'),
  languages: z.array(z.string()).min(1, 'At least one language required'),
});

// Step 2: Professional Identity (see 02-USER-PROFILING.md §3.2)
// Step 3: Skills (see 02-USER-PROFILING.md §3.3)
// Step 4: Job Preferences (see 02-USER-PROFILING.md §3.4)
// Step 5: Resume Upload (optional, handled separately)

// Full profile schema — combination of all steps
export const profileSchema = z.object({ ... }); // Merge all step schemas
```

Use the exact field names from the `UserProfile` interface in `02-USER-PROFILING.md` §2.1.

### P1 Step 2: Create Profile API Route

Create file: `src/app/api/profile/route.ts`

Implement two handlers:

**GET `/api/profile`:**
1. Query `SELECT data FROM profile WHERE id = 1`
2. If found, parse JSON and return `{ success: true, data: profile }`
3. If not found, return `{ success: true, data: null }`

**POST `/api/profile`:**
1. Parse request body
2. Validate with `profileSchema.safeParse(body)`
3. If validation fails, return `{ success: false, error: formatted errors }`
4. Compute `profileCompleteness` score using the scoring table from `02-USER-PROFILING.md` §4
5. Upsert into `profile` table: `INSERT OR REPLACE INTO profile (id, data, completeness) VALUES (1, ?, ?)`
6. Sync skills to `profile_skills` table: DELETE all, then INSERT each skill
7. Write to `data/profile.json` (human-readable backup)
8. Return `{ success: true, data: savedProfile }`

### P1 Step 3: Create Profile Completeness Calculator

Create file: `src/lib/profile-completeness.ts`

Implement the exact scoring table from `02-USER-PROFILING.md` §4:

| Field | Points |
|-------|--------|
| Name | 2 |
| Location (city + country) | 5 |
| Specialty | 10 |
| Experience level | 10 |
| Years of experience | 5 |
| Skills (3+) | 15 |
| Skills (5+) | +5 bonus |
| Skills (10+) | +5 bonus |
| Desired roles (1+) | 15 |
| Remote preference set | 5 |
| Desired locations set | 5 |
| Salary range set | 8 |
| Education set | 5 |
| Resume uploaded | 10 |
| **Total possible** | **105** (capped at 100) |

### P1 Step 4: Create the Wizard Component

Create file: `src/app/setup/page.tsx` — This is a `"use client"` component.

The wizard has 5 steps. Implementation approach:

1. **State management:** Single `useState` holding the full profile object, plus `currentStep` (1-5)
2. **Step rendering:** A switch/case or array of step components
3. **Navigation:** "Back" and "Next" buttons; "Next" validates current step before proceeding
4. **Final submission:** On step 5 "Finish", call `POST /api/profile` with the full profile
5. **Edit mode:** On mount, call `GET /api/profile`. If profile exists, populate form with existing data.

**Step components:**

| Step | Component Name | Key Inputs (see 02-USER-PROFILING.md §3) |
|------|---------------|------------------------------------------|
| 1 | `BasicInfoStep` | name (text), email (text), city (text), state (text), country (select), languages (tag input) |
| 2 | `ProfessionalStep` | specialty (searchable select with all Specialty enum values), currentTitle (text), experienceLevel (radio group with descriptions), yearsOfExperience (slider 0-40), education fields |
| 3 | `SkillsStep` | skills (tag input with specialty-aware suggestions from §3.3 table), tools (tag input), certifications (tag input) |
| 4 | `PreferencesStep` | desiredRoles (tag input, max 5), remotePreference (radio), desiredLocations (tag input), salary fields, jobTypes (checkbox group), companySize (radio) |
| 5 | `ResumeStep` | File upload drag & drop zone (PDF/DOCX, max 10MB), "Skip for now" button |

**Tag input pattern:** Use a custom component that wraps shadcn/ui Input + Badge. Type to add, click X to remove. For skills, show typeahead suggestions based on selected specialty (hardcode the suggestion lists from `02-USER-PROFILING.md` §3.3).

**After successful save:**
1. Show toast: "Profile saved!"
2. If this is the first save (no previous profile), trigger initial job scrape via `POST /api/scrape` (this will work after P2)
3. Redirect to `/jobs` (or `/` if scraping isn't set up yet)

### P1 Step 5: Add Profile Check Middleware

Create file: `src/lib/profile-check.ts`

A helper function that checks if a profile exists:

```typescript
export function hasProfile(): boolean {
  const db = getDb();
  const row = db.prepare('SELECT id FROM profile WHERE id = 1').get();
  return !!row;
}
```

In `src/app/page.tsx` (Dashboard) and other pages, use this to redirect to `/setup` if no profile exists. Use Next.js `redirect()` from `next/navigation` in Server Components.

### P1 Step 6: Verify P1

```
1. Navigate to /setup
2. Fill out all 5 steps
3. Submit
4. Check: data/profile.json exists with correct data
5. Check: SQLite profile table has row with id=1
6. Check: profile_skills table has the entered skills
7. Navigate to /setup again — form should be pre-filled with saved data
8. Edit a field, re-save — data should update
9. Navigate to / — should NOT redirect to /setup (profile exists now)
10. Delete the profile row from SQLite — navigating to / should redirect to /setup
```

**P1 is DONE when:** Profile wizard works end-to-end, data persists in both SQLite and JSON, profile completeness score calculates correctly, and profile-check redirect works.

---

## P2: Python Scraper Integration (`/api/scrape`)

**Goal:** An API route that calls the Python scraper as a subprocess and stores results in SQLite.

**Reference docs:** `05-SEARCH-STRATEGY.md` (entire document)

### P2 Step 1: Create Scraper Subprocess Caller

Create file: `src/lib/scraper.ts`

Implement the exact interface from `05-SEARCH-STRATEGY.md` §4.1:

```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
```

The function takes a `ScrapeRequest` object and returns `Promise<ScrapedJob[]>`.

Key implementation details:
- Use `execFile` (not `exec`) for security — avoids shell injection
- Set `timeout: 120_000` (2 minutes)
- Set `maxBuffer: 10 * 1024 * 1024` (10MB)
- Parse stdout as JSON
- Log stderr as warnings
- If Python isn't found, throw a clear error: "Python not found. Install Python 3.10+ and ensure it's on PATH."

### P2 Step 2: Create Query Generator

Create file: `src/lib/query-generator.ts`

Implement `generateSearchQueries()` from `05-SEARCH-STRATEGY.md` §2.2. This function takes a UserProfile and returns an array of SearchQuery objects (term + priority), respecting the limits from §2.3 (max 10 queries per session).

Also implement `buildIndeedQuery()` from §2.4 and `buildGoogleQuery()` from §2.5.

### P2 Step 3: Create Deduplication Module

Create file: `src/lib/dedup.ts`

Implement `jobHash()` and `normalize()` from `05-SEARCH-STRATEGY.md` §5.1. Uses Node.js `crypto.createHash('sha256')`.

### P2 Step 4: Create Scrape Cache Module

Create file: `src/lib/scrape-cache.ts`

Implement `shouldScrape()` from `05-SEARCH-STRATEGY.md` §6. Checks the `scrape_cache` table to see if the same query was run within the last hour.

### P2 Step 5: Create Scrape API Route

Create file: `src/app/api/scrape/route.ts`

**POST `/api/scrape`:**

Request body (validated with Zod):
```typescript
const scrapeRequestSchema = z.object({
  searchTerm: z.string().min(1).optional(),  // If omitted, generate from profile
  location: z.string().optional(),
  sites: z.array(z.string()).optional().default(['indeed']),
  resultsWanted: z.number().optional().default(50),
  hoursOld: z.number().optional().default(72),
  isRemote: z.boolean().optional(),
});
```

Implementation flow:
1. Load user profile from DB
2. If no `searchTerm` provided, generate queries from profile using `generateSearchQueries()`
3. For each query, check `shouldScrape()` (skip if recently cached)
4. Call `scrapeJobs()` with the query
5. For each returned job, compute `jobHash()` and check for existing hash in `jobs` table
6. Insert new (non-duplicate) jobs into `jobs` table
7. Update `scrape_cache` table with query hash and timestamp
8. Return `{ success: true, data: { newJobs: count, duplicatesSkipped: count, queries: count } }`

### P2 Step 6: Create Job Insertion Helper

Create file: `src/lib/job-storage.ts`

A function that maps the raw JobSpy output (Python dict keys use snake_case: `job_url`, `date_posted`, etc.) to our SQLite schema and inserts rows. Handle null/NaN values from Python carefully.

JobSpy output fields to map:
| JobSpy Field | Our Column | Notes |
|---|---|---|
| `id` | `external_id` | Platform-specific ID |
| `site` | `source` | indeed, linkedin, etc. |
| `title` | `title` | |
| `company` | `company` | |
| `company_url` | `company_url` | |
| `job_url` | `job_url` | |
| `location` → parse city/state/country | `city`, `state`, `country` | May need splitting |
| `is_remote` | `is_remote` | Convert to 0/1 |
| `description` | `description` | Full job description HTML/text |
| `job_type` | `job_type` | |
| `salary_source` | — | Not stored |
| `min_amount` | `salary_min` | |
| `max_amount` | `salary_max` | |
| `interval` | `salary_interval` | yearly, monthly, hourly |
| `currency` | `salary_currency` | |
| `date_posted` | `date_posted` | ISO string |

### P2 Step 7: Verify P2

```
1. Ensure Python + python-jobspy are installed: pip install python-jobspy
2. Ensure a profile exists (from P1)
3. POST /api/scrape with body: { "searchTerm": "software engineer", "sites": ["indeed"], "resultsWanted": 10 }
4. Check response: { success: true, data: { newJobs: N, ... } }
5. Check SQLite: SELECT count(*) FROM jobs → should be > 0
6. Re-send the same POST → should report higher duplicatesSkipped
7. POST /api/scrape with no body → should auto-generate queries from profile
```

**P2 is DONE when:** Scraper runs via API, results persist in SQLite, deduplication works, and cache prevents re-scraping within 1 hour.

---

## P3: Job Feed Page (`/jobs`)

**Goal:** A page that displays scraped jobs with filters, search, pagination, and match scores.

**Reference docs:** `06-JOB-MATCHING.md` §7 (UI layout)

### P3 Step 1: Create Jobs API Route

Create file: `src/app/api/jobs/route.ts`

**GET `/api/jobs`:**

Query parameters (all optional):
| Param | Type | Default | Purpose |
|-------|------|---------|---------|
| `page` | number | 1 | Pagination |
| `limit` | number | 50 | Items per page |
| `search` | string | — | Search title/company |
| `source` | string | — | Filter by source (indeed, linkedin, etc.) |
| `minScore` | number | 0 | Minimum match score |
| `maxScore` | number | 100 | Maximum match score |
| `isRemote` | boolean | — | Filter remote jobs |
| `jobType` | string | — | fulltime, parttime, etc. |
| `sortBy` | string | 'score' | 'score', 'date', 'salary' |
| `showDismissed` | boolean | false | Include dismissed jobs |

Build a dynamic SQL query with parameterized WHERE clauses. JOIN with `match_scores` table to include scores. Return paginated results with total count.

Response: `{ success: true, data: { jobs: JobWithScore[], total: number, page: number, totalPages: number } }`

### P3 Step 2: Create Job Detail API Route

Create file: `src/app/api/jobs/[id]/route.ts`

**GET `/api/jobs/[id]`:**

Return full job details including match score breakdown and any existing application.

### P3 Step 3: Create Job Dismiss API Route

Create file: `src/app/api/jobs/dismiss/route.ts`

**POST `/api/jobs/dismiss`:**

Body: `{ jobId: number }`
Action: `UPDATE jobs SET is_dismissed = 1 WHERE id = ?`

### P3 Step 4: Build Job Feed Page

Create file: `src/app/jobs/page.tsx`

This is the main job discovery page. Structure:

```
┌─────────────────────────────────────────────────────┐
│  Jobs  [Search input........]  [Search for Jobs ↻]  │
├─────────────────────────────────────────────────────┤
│  Filters: [Source ▼] [Score ▼] [Remote ▼]           │
│           [Job Type ▼] [Sort ▼]                     │
├─────────────────────────────────────────────────────┤
│  Found 247 jobs · 38 recommended                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [JobCard] [JobCard] [JobCard] ...                   │
│                                                     │
│  [Load More] or pagination                          │
└─────────────────────────────────────────────────────┘
```

**Components to build:**

1. **`JobCard`** — Displays: title, company, location, match score badge (colored per §7 table in 06-JOB-MATCHING.md), salary range, skills tags, posted date, source badge. Actions: [Save] [Apply] [Dismiss].

2. **`JobFilters`** — Row of shadcn Select/DropdownMenu for filtering. Debounced search input (300ms).

3. **`JobDetailSheet`** — A shadcn Sheet (side panel) that opens when clicking a job card. Shows full description, match breakdown (bar chart per factor), matching/missing skills, AI reasoning, and action buttons. See `06-JOB-MATCHING.md` §7 for the detailed layout.

4. **`SearchButton`** — Triggers `POST /api/scrape` to run a new scrape. Shows loading state with progress text.

### P3 Step 5: Verify P3

```
1. Ensure jobs exist in DB (from P2)
2. Navigate to /jobs
3. Jobs should display sorted by match score (if scores exist) or date
4. Click a job → detail panel opens
5. Use filters → list updates
6. Click "Search for Jobs" → scraper runs, new jobs appear
7. Click "Dismiss" → job disappears (unless "show dismissed" is on)
8. Click "Save" → creates application in "saved" status (for P5)
```

**P3 is DONE when:** Jobs display with all metadata, filters work, detail panel opens, search triggers scraping, and save/dismiss actions work.

---

## P4: Match Scoring (`/api/match`)

**Goal:** Implement the 6-factor scoring algorithm and AI match reasoning.

**Reference docs:** `06-JOB-MATCHING.md` (entire document)

### P4 Step 1: Create Matching Engine

Create file: `src/lib/matching.ts`

Implement ALL six scoring functions exactly as specified in `06-JOB-MATCHING.md` §2:

1. `scoreSkillMatch()` — §2.2 (include the RELATED_SKILLS synonym map)
2. `scoreExperienceMatch()` + `normalizeJobLevel()` — §2.3
3. `scoreLocationFit()` — §2.4
4. `scoreSalaryFit()` + `normalizeToAnnual()` — §2.5
5. `scoreJobTypeFit()` — §2.6
6. `scoreRecency()` — §2.7

Then implement `calculateMatchScore()` from §3 that combines all six into a weighted overall score.

### P4 Step 2: Create Skill Extraction Module

Create file: `src/lib/skill-extraction.ts`

Implement `extractSkillsFromText()` from `06-JOB-MATCHING.md` §5. Include the full `TECH_SKILLS` list (all skills listed in §5 plus extend it to at least 200 common skills across specialties).

For non-tech jobs, implement the AI-based extraction prompt from §5 that sends the job description to OpenRouter and gets back `{ required: [], preferred: [] }`.

### P4 Step 3: Create Match API Route

Create file: `src/app/api/match/route.ts`

**POST `/api/match`:**

Body (Zod-validated):
```typescript
const matchRequestSchema = z.object({
  jobIds: z.array(z.number()).optional(),  // If omitted, score ALL unscored jobs
  regenerate: z.boolean().optional().default(false),  // Re-score even if scored
});
```

Implementation:
1. Load user profile
2. Get target jobs (specific IDs or all unscored: `SELECT * FROM jobs WHERE id NOT IN (SELECT job_id FROM match_scores)`)
3. For each job, call `calculateMatchScore(profile, job)`
4. Insert/replace into `match_scores` table
5. For recommended jobs (score >= 60), generate AI reasoning in batches of 5 via `generateMatchReasons()` from §4
6. Return `{ success: true, data: { scored: count, recommended: count } }`

### P4 Step 4: Create Match Reasoning Generator

Create file: `src/lib/match-reasoning.ts`

Implement `generateMatchReasons()` from `06-JOB-MATCHING.md` §4. For each batch of 5 recommended jobs:
1. Build the prompt template from §4 with profile + job + score breakdown
2. Call `chatJSON()` from openrouter.ts
3. Update `match_scores.reasoning` for each job

If OpenRouter is unavailable, skip reasoning (graceful degradation) — the deterministic scores still work.

### P4 Step 5: Hook Matching into Scrape Pipeline

Update `src/app/api/scrape/route.ts`:

After inserting new jobs (step 6 in P2's route), automatically trigger matching:
```typescript
// After job insertion
const newJobIds = insertedJobs.map(j => j.id);
// Score new jobs immediately
await matchJobs(newJobIds);
```

### P4 Step 6: Verify P4

```
1. Ensure profile and jobs exist
2. POST /api/match (no body) → scores all unscored jobs
3. Check: match_scores table has rows
4. Check: scores are 0-100, factor scores look reasonable
5. Check: jobs with score >= 60 have reasoning text (if OpenRouter key is set)
6. Navigate to /jobs → cards should now show colored score badges
7. Click a job → detail panel should show score breakdown bars
8. POST /api/scrape → new jobs should auto-score
```

**P4 is DONE when:** All jobs have match scores, scores correctly reflect profile-job alignment, AI reasoning generates for recommended jobs, and the job feed displays scores.

---

## P5: Application Tracker (`/tracker`)

**Goal:** A kanban board with drag-and-drop for tracking applications through the pipeline.

**Reference docs:** `08-TRACKING-FOLLOWUP.md` (entire document)

### P5 Step 1: Create Applications API Routes

Create file: `src/app/api/applications/route.ts`

**GET `/api/applications`:**
- Returns all applications with joined job data
- Optional query param `status` to filter by column
- Returns: `{ success: true, data: ApplicationWithJob[] }`

**POST `/api/applications`:**
- Body: `{ jobId: number, status?: 'saved' | 'applied', notes?: string }`
- Creates new application record
- If status is 'applied', auto-set `follow_up_date` to 7 days from now
- If status is 'applied', create a reminder in `reminders` table
- Returns created application

Create file: `src/app/api/applications/[id]/route.ts`

**PATCH `/api/applications/[id]`:**
- Body: `{ status?, notes?, rejectionReason?, salaryOffered?, followUpDate? }`
- Validate transition using `VALID_TRANSITIONS` from `08-TRACKING-FOLLOWUP.md` §7
- If invalid transition, return error
- Auto-set follow-up reminders based on new status (see §4.1 auto-reminders table)
- Update `updated_at` timestamp

**DELETE `/api/applications/[id]`:**
- Delete application and cascade to reminders
- Confirmation required (enforced in UI)

### P5 Step 2: Create Reminders API Routes

Create file: `src/app/api/reminders/route.ts`

**GET `/api/reminders`:**
- Returns all incomplete reminders sorted by date
- Include overdue flag: `reminder_date <= datetime('now')`
- Join with applications and jobs for context

**POST `/api/reminders`:**
- Body: `{ applicationId: number, reminderDate: string, message: string }`
- Creates custom reminder

Create file: `src/app/api/reminders/[id]/route.ts`

**PATCH `/api/reminders/[id]`:**
- Body: `{ isCompleted: boolean }`
- Marks reminder as complete

### P5 Step 3: Build Kanban Board Page

Create file: `src/app/tracker/page.tsx` — `"use client"` component.

**Kanban columns (6 + 1 archived):**
1. Saved
2. Applied
3. Screening
4. Interview
5. Offer
6. Archived (collapsed by default, contains Rejected + Withdrawn)

**Implementation approach:**

Use `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Components to build:

1. **`KanbanBoard`** — Main container with `DndContext`. Manages columns and drag handlers.
2. **`KanbanColumn`** — A single column with header (title + count), droppable area, and card list.
3. **`KanbanCard`** — A card showing company, title, score badge, follow-up indicator, and interview date.
4. **`ApplicationDetail`** — A Sheet (side panel) that opens on card click. Shows timeline, notes, resume used, cover letter, and action buttons. Matches the layout from `08-TRACKING-FOLLOWUP.md` §3.

**Drag-and-drop behavior:**
- On drag end, determine source column and destination column
- Check `canTransition(from, to)` — if invalid, snap back with toast error
- If valid, optimistically update UI, then `PATCH /api/applications/[id]` with new status
- On API error, revert the card position

### P5 Step 4: Update Job Feed Actions

Update `/jobs` page (P3):
- "Save" button: `POST /api/applications` with `{ jobId, status: 'saved' }`
- "Apply" button: Opens the pre-apply checklist dialog (see `07-APPLICATION-PREP.md` §6), then `POST /api/applications` with `{ jobId, status: 'applied' }`
- Show "Saved" or "Applied" badge on job cards that already have applications

### P5 Step 5: Verify P5

```
1. Save a few jobs from /jobs page
2. Navigate to /tracker → saved jobs appear in "Saved" column
3. Drag a card from Saved to Applied → status updates, follow-up reminder auto-created
4. Drag from Applied to Interview → status updates
5. Click a card → detail panel opens with timeline and notes
6. Add a note → persists on reload
7. Try invalid drag (e.g., Saved → Offer) → snaps back with error toast
8. Check reminders: GET /api/reminders → shows upcoming follow-ups
```

**P5 is DONE when:** Kanban board renders all columns, drag-and-drop works with validation, detail panel shows full application info, and reminders auto-create on status transitions.

---

## P6: Resume Upload + AI Review (`/resume`)

**Goal:** Upload PDF/DOCX resume, extract text, get AI-powered analysis with ATS score.

**Reference docs:** `03-RESUME-REVIEW.md` (entire document)

### P6 Step 1: Create Resume Parser Module

Create file: `src/lib/resume-parser.ts`

```typescript
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';

export async function parseResume(filePath: string, fileType: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);

  switch (fileType) {
    case 'pdf': {
      const result = await pdfParse(buffer);
      return result.text;
    }
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case 'txt': {
      return buffer.toString('utf-8');
    }
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}
```

### P6 Step 2: Create Resume Upload API Route

Create file: `src/app/api/resume/upload/route.ts`

**POST `/api/resume/upload`:**

Uses Next.js `request.formData()` for multipart file handling:
1. Extract file from form data
2. Validate: file type (pdf, docx, txt only), file size (< 10MB)
3. Save to `uploads/` directory with timestamp prefix
4. Parse text from file using `parseResume()`
5. If text is too short (< 50 words), warn but continue
6. Insert into `resumes` table with raw_text
7. Return `{ success: true, data: { id: resumeId, fileName, rawText (first 500 chars preview) } }`

### P6 Step 3: Create Resume Analysis API Route

Create file: `src/app/api/resume/analyze/route.ts`

**POST `/api/resume/analyze`:**

Body: `{ resumeId: number }`

Implementation (two sequential AI calls):
1. Load resume raw_text from DB
2. Load user profile
3. **Step 1 — Structure Extraction:** Send raw text + extraction prompt from `03-RESUME-REVIEW.md` §3.1 to `chatJSON()`. Store result in `resumes.parsed_data`.
4. **Step 2 — Comprehensive Analysis:** Send structured resume + profile + analysis prompt from `03-RESUME-REVIEW.md` §3.2 to `chatJSON()`. Store result in `resumes.ai_review`. Extract `atsScore` and store in `resumes.ats_score`.
5. Return `{ success: true, data: { parsedData, aiReview, atsScore } }`

### P6 Step 4: Build Resume Review Page

Create file: `src/app/resume/page.tsx`

Split layout matching `03-RESUME-REVIEW.md` §7:
- **Left panel:** Upload zone (drag & drop) + resume file list (if multiple uploads) + resume text preview
- **Right panel:** ATS score progress bar + overall assessment + strengths list + weaknesses with priority badges + missing keywords as tags + section-by-section feedback + bullet rewrite suggestions with [Copy] buttons

Components:
- `ResumeUploader` — Drag-and-drop zone using native HTML drag events + file input
- `ResumeAnalysis` — Displays the AI review results in organized sections
- `BulletRewrite` — Shows original vs improved bullets with a copy button

### P6 Step 5: Verify P6

```
1. Navigate to /resume
2. Upload a PDF resume
3. Check: file appears in uploads/ directory
4. Check: resumes table has row with raw_text
5. Click "Analyze" → AI processes (shows loading state)
6. Check: ATS score displays, strengths/weaknesses show
7. Upload a DOCX → should also work
8. Upload a .exe → should reject with clear error
9. Upload a 15MB file → should reject with size error
```

**P6 is DONE when:** File upload works for PDF/DOCX/TXT, text extraction works, AI analysis returns structured feedback, and UI displays all sections from the spec.

---

## P7: AI Chat (`/chat`)

**Goal:** A conversational chat interface where users can ask job search questions, trigger actions, and get advice.

**Reference docs:** `10-WORKFLOW-OVERVIEW.md` §2 Phase 7

### P7 Step 1: Create Chat API Route

Create file: `src/app/api/ai/chat/route.ts`

**POST `/api/ai/chat`:**

Body: `{ message: string }`

Implementation:
1. Load user profile (for context)
2. Load recent chat history from `chat_history` table (last 20 messages)
3. Build system prompt that includes: user profile summary, available capabilities (search jobs, review resume, write cover letter, prep interview, show stats)
4. Append the new user message
5. Call `chatWithRetry()` from openrouter.ts
6. Save both user message and assistant response to `chat_history`
7. Return `{ success: true, data: { response: string } }`

**System prompt template:**
```
You are a helpful job search assistant. You help the user find jobs, review their resume, prepare for interviews, and track applications.

User Profile:
- Name: {name}
- Looking for: {desiredRoles}
- Level: {experienceLevel} ({yearsOfExperience} years)
- Skills: {skills}
- Location: {location}
- Remote preference: {remotePreference}

You can help with:
1. Job search advice and strategy
2. Resume feedback and improvement suggestions
3. Cover letter drafting
4. Interview preparation
5. Salary negotiation advice
6. Application tracking tips
7. Skill gap analysis

Be concise, specific, and actionable. Reference the user's actual profile data when relevant.
```

### P7 Step 2: Build Chat Page

Create file: `src/app/chat/page.tsx` — `"use client"` component.

Standard chat UI:
- Message list (scrollable, auto-scroll to bottom)
- Input bar at bottom with send button
- User messages right-aligned, assistant messages left-aligned
- Loading indicator while AI responds
- Empty state: "Ask me anything about your job search!"

Use shadcn/ui `ScrollArea` for the message list, `Input` + `Button` for the input bar.

Render assistant messages as markdown (install and use a lightweight markdown renderer like `react-markdown` if needed, or use simple text with line breaks).

### P7 Step 3: Verify P7

```
1. Navigate to /chat
2. Type "What skills am I missing for senior roles?" → get relevant response
3. Type "Help me prepare for an interview at Google" → get prep content
4. Refresh page → chat history persists
5. Check chat_history table → messages saved
```

**P7 is DONE when:** Chat sends/receives messages, history persists, AI responses reference user's profile, and markdown renders correctly.

---

## P8: Cover Letter + Resume Tailoring

**Goal:** Generate tailored cover letters and resume suggestions for specific jobs.

**Reference docs:** `07-APPLICATION-PREP.md` (entire document)

### P8 Step 1: Create Cover Letter API Route

Create file: `src/app/api/ai/cover-letter/route.ts`

**POST `/api/ai/cover-letter`:**

Body: `{ jobId: number }`

Implementation:
1. Load job details from DB
2. Load user profile
3. Load user's default resume (if exists)
4. Build the cover letter prompt from `07-APPLICATION-PREP.md` §5
5. Call `chatWithRetry()`
6. Return `{ success: true, data: { coverLetter: string } }`

### P8 Step 2: Create Resume Tailoring API Route

Create file: `src/app/api/ai/tailor-resume/route.ts`

**POST `/api/ai/tailor-resume`:**

Body: `{ jobId: number, resumeId?: number }`

Implementation:
1. Load job, profile, and resume
2. Build the tailoring prompt from `07-APPLICATION-PREP.md` §4
3. Call `chatJSON()` to get structured tailoring suggestions
4. Return the suggestions object

### P8 Step 3: Add Application Prep UI to Job Detail Panel

Update the job detail Sheet (from P3):
- Add "Generate Cover Letter" button → calls cover letter API, displays result in a textarea (editable)
- Add "Tailor Resume" button → calls tailoring API, displays suggestions
- Add pre-apply checklist (from `07-APPLICATION-PREP.md` §6)
- "Mark as Applied" button saves the cover letter text with the application record

### P8 Step 4: Verify P8

```
1. Open a job detail panel
2. Click "Generate Cover Letter" → AI generates 3-4 paragraph letter
3. Edit the letter → changes persist in textarea
4. Click "Tailor Resume" → suggestions display
5. Click "Mark as Applied" → application created with cover letter saved
6. Check applications table → cover_letter column has the text
```

**P8 is DONE when:** Cover letters generate correctly, resume tailoring suggestions appear, and the checklist flow works.

---

## P9: Interview Prep

**Goal:** Generate comprehensive interview prep packages when applications reach "Interview" status.

**Reference docs:** `09-INTERVIEW-PREP.md` (entire document)

### P9 Step 1: Create Interview Prep API Route

Create file: `src/app/api/ai/interview-prep/route.ts`

**POST `/api/ai/interview-prep`:**

Body: `{ applicationId: number, interviewType?: string, interviewDate?: string }`

Implementation:
1. Load application + job + profile
2. Send ONE combined prompt to OpenRouter that generates ALL sections:
   - Company research brief (§3 prompt)
   - 15 technical questions with key points (§4 prompt)
   - 10 behavioral STAR questions (§5 prompt)
   - 8-10 questions to ask interviewer (§6 prompt)
3. Store in `interview_prep` table
4. Return the full prep package

### P9 Step 2: Add Interview Prep UI

Add an "Interview Prep" view accessible from the application detail panel when status is "Interview".

Display all 5 sections from `09-INTERVIEW-PREP.md` §2:
1. Company brief (Card with key facts)
2. Technical questions (Accordion/collapsible list with key points)
3. Behavioral questions (Each with STAR template fields the user can fill in)
4. Questions to ask (Checklist the user can check off as they review)
5. Logistics checklist (from §7)

Add a "User Notes" textarea for personal prep notes.

### P9 Step 3: Create Thank-You Email Generator

Add to the interview detail view:
- "Generate Thank-You Email" button
- Uses the prompt from `09-INTERVIEW-PREP.md` §8
- Displays in editable textarea with [Copy] button

### P9 Step 4: Verify P9

```
1. Move an application to "Interview" status
2. Click "Prep for Interview"
3. AI generates all 5 sections
4. Check: company brief, questions, STAR templates all display
5. Add personal notes → persist on reload
6. Click "Generate Thank-You" → email draft appears
7. Check interview_prep table → data saved
```

**P9 is DONE when:** Full interview prep package generates, all 5 sections display, user notes persist, and thank-you email generates.

---

## P10: Dashboard Stats (`/`)

**Goal:** Replace the placeholder dashboard with real statistics, recent recommendations, and follow-up reminders.

**Reference docs:** `08-TRACKING-FOLLOWUP.md` §5

### P10 Step 1: Create Stats API Route

Create file: `src/app/api/stats/route.ts`

**GET `/api/stats`:**

Query SQLite for all metrics from `08-TRACKING-FOLLOWUP.md` §5.1:

```sql
-- Total jobs
SELECT count(*) FROM jobs WHERE is_dismissed = 0;

-- Applications sent
SELECT count(*) FROM applications WHERE status != 'saved';

-- Response rate
SELECT
  CAST(count(CASE WHEN status IN ('screening','interview','offer') THEN 1 END) AS FLOAT) /
  NULLIF(count(CASE WHEN status != 'saved' THEN 1 END), 0) * 100
FROM applications;

-- (and so on for interview rate, offer rate, etc.)
```

Also return:
- Recent recommended jobs (top 5 by score, not yet saved/applied)
- Overdue/upcoming reminders
- Weekly application counts (last 8 weeks)
- Application funnel data (count per status)

### P10 Step 2: Build Dashboard Page

Update `src/app/page.tsx`:

1. **Profile check:** If no profile, redirect to `/setup`
2. **Stats cards row:** Total Jobs | Applications | Response Rate | Interviews | Offers
3. **Follow-up widget:** Overdue (red), Due Today (yellow), Upcoming (green) — see `08-TRACKING-FOLLOWUP.md` §4.3
4. **Recent recommendations:** Top 5 job cards with [Save] [Apply] buttons
5. **Application funnel:** Horizontal bar chart showing Applied → Screening → Interview → Offer with percentages — see §5.2
6. **Quick actions:** [Search Jobs] [Review Resume] [Open Tracker]

### P10 Step 3: Verify P10

```
1. Navigate to / (with profile + jobs + applications existing)
2. Stats cards show correct numbers
3. Follow-up widget shows pending reminders
4. Funnel visualization renders
5. Quick action buttons navigate to correct pages
6. With empty DB (no profile), redirects to /setup
```

**P10 is DONE when:** Dashboard displays all stats, follow-ups, recommendations, and funnel visualization.

---

## P11: Settings + Data Export (`/settings`)

**Goal:** Configuration page for API key, scraping preferences, data export, and data deletion.

**Reference docs:** `00-RULES.md` §4.5 (privacy), `08-TRACKING-FOLLOWUP.md` §8 (export)

### P11 Step 1: Create Export API Route

Create file: `src/app/api/export/route.ts`

**POST `/api/export`:**

Body: `{ format: 'json' | 'csv' }`

- **JSON:** Dump all tables (profile, jobs, applications, match_scores, resumes metadata, interview_prep, chat_history) as a single JSON object
- **CSV:** Export applications table in CSV format matching `08-TRACKING-FOLLOWUP.md` §8

Return as a downloadable file (set Content-Disposition header).

### P11 Step 2: Create Data Deletion API Route

Create file: `src/app/api/data/route.ts`

**DELETE `/api/data`:**

Body: `{ confirm: true }` (safety check)

1. Delete all rows from all tables
2. Delete all files in `uploads/`
3. Delete `data/profile.json`
4. Return `{ success: true, data: { message: "All data deleted" } }`

### P11 Step 3: Build Settings Page

Create file: `src/app/settings/page.tsx`

Sections:
1. **API Key:** Input field for OpenRouter API key. Save to `.env.local` is tricky (env files don't hot-reload), so instead store in SQLite settings table or display current key status (set/not set).
2. **Matching Weights:** 6 sliders for adjusting match score weights (see `06-JOB-MATCHING.md` §2.1). Show current weights, allow adjustment, save.
3. **Scraping Preferences:** Default sites (checkboxes for Indeed, LinkedIn, Glassdoor, Google, ZipRecruiter), default results count, hours old filter.
4. **Data Export:** [Export as JSON] and [Export as CSV] buttons.
5. **Danger Zone:** [Delete All Data] button with confirmation dialog.
6. **Dark/Light Mode Toggle:** Switch between dark and light themes.

### P11 Step 4: Verify P11

```
1. Navigate to /settings
2. Adjust matching weights → save → re-match a job → score changes
3. Click Export JSON → downloads JSON file with all data
4. Click Export CSV → downloads CSV file
5. Click Delete All Data → confirm → all data wiped, redirected to /setup
6. Toggle dark/light mode → theme switches
```

**P11 is DONE when:** Settings page has all sections, export downloads work, deletion wipes everything, and theme toggle works.

---

## P12: Scheduled Scraping

**Goal:** Background job that auto-scrapes new jobs every 6 hours.

**Reference docs:** `05-SEARCH-STRATEGY.md` §7

### P12 Step 1: Implement Scheduled Scraping

Since this is a Next.js app (no cron daemon), use one of these approaches:

**Option A: API Route + setInterval (simplest)**

Create file: `src/lib/scheduler.ts`

```typescript
let schedulerRunning = false;

export function startScheduler() {
  if (schedulerRunning) return;
  schedulerRunning = true;

  // Run every 6 hours
  setInterval(async () => {
    try {
      await scheduledScrape();
    } catch (error) {
      console.error('[scheduler] Error:', error);
    }
  }, 6 * 60 * 60 * 1000);

  console.log('[scheduler] Started. Will scrape every 6 hours.');
}
```

Call `startScheduler()` from the root layout or a route that's guaranteed to execute on app start.

**Option B: Next.js Instrumentation (better)**

Create file: `src/instrumentation.ts` (Next.js 15 supports this):

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('./lib/scheduler');
    startScheduler();
  }
}
```

And enable in `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  experimental: {
    instrumentationHook: true,
  },
};
```

### P12 Step 2: Add Scraping Controls to Settings

Update settings page:
- Show last scrape time
- [Run Now] button to trigger immediate scrape
- Toggle to enable/disable scheduled scraping
- Input for scraping interval (default: 6 hours)

### P12 Step 3: Verify P12

```
1. Start the app
2. Check console: "[scheduler] Started"
3. Wait or manually trigger a scrape from settings
4. Check: new jobs appear in /jobs
5. Check: scrape_cache updated with timestamps
```

**P12 is DONE when:** Scheduled scraping runs automatically, can be triggered manually, and settings page shows controls.

---

## Post-MVP: Quality Checklist

After completing P0-P12, verify the entire application:

### Functional Verification

| Check | How |
|-------|-----|
| First-time flow | Delete all data, open app → redirects to /setup → complete wizard → auto-scrape → /jobs shows results |
| Returning user flow | Open app with existing profile → dashboard shows stats |
| Job search | Click "Search for Jobs" → new results appear with scores |
| Apply flow | Save job → apply → checklist → cover letter → mark applied → appears in tracker |
| Tracker flow | Drag between all valid columns → invalid drags rejected |
| Resume flow | Upload PDF → extract text → AI analysis → scores display |
| Chat flow | Ask questions → get AI responses referencing profile |
| Interview prep | Move to Interview → generate prep → all 5 sections display |
| Data export | Export JSON and CSV → files download correctly |
| Data delete | Delete all → everything wiped → redirects to /setup |

### Error Handling Verification

| Scenario | Expected Behavior |
|----------|-------------------|
| No OpenRouter API key | AI features disabled, banner shown, non-AI features work |
| Python not installed | Scraping fails with clear setup instructions |
| Network down | Cached jobs shown with "stale data" warning |
| Upload wrong file type | Clear error: "Only PDF, DOCX, TXT supported" |
| Upload too large | Clear error: "File must be under 10MB" |
| Invalid status transition | Toast: "Cannot move from X to Y" |

### Performance Verification

| Check | Target |
|-------|--------|
| Page load | < 2 seconds for any page |
| Job feed (500 jobs) | Scrolls smoothly, pagination works |
| Scraping (50 results) | Completes within 2 minutes |
| AI response | Returns within 30 seconds |
| DB queries | < 100ms for any query |

---

## References

- All business logic details: `docs/00-RULES.md` through `docs/10-WORKFLOW-OVERVIEW.md`
- Agent skills: `docs/12-AGENT-SKILLS.md`
- Next.js 15: https://nextjs.org/docs
- shadcn/ui: https://ui.shadcn.com/
- better-sqlite3: https://github.com/WiseLibs/better-sqlite3
- OpenRouter: https://openrouter.ai/docs
- python-jobspy: https://github.com/speedyapply/JobSpy
- @dnd-kit: https://docs.dndkit.com/
