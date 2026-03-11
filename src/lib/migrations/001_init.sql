-- User profile (single row)
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data TEXT NOT NULL,
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
  external_id TEXT,
  source TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  company TEXT,
  company_url TEXT,
  job_url TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT,
  is_remote INTEGER DEFAULT 0,
  description TEXT,
  job_type TEXT,
  job_level TEXT,
  salary_min REAL,
  salary_max REAL,
  salary_interval TEXT,
  salary_currency TEXT,
  date_posted TEXT,
  date_scraped TEXT DEFAULT (datetime('now')),
  skills TEXT,
  is_dismissed INTEGER DEFAULT 0,
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
  notes TEXT,
  rejection_reason TEXT,
  salary_offered TEXT,
  follow_up_date TEXT,
  interview_dates TEXT,
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
  parsed_data TEXT,
  ai_review TEXT,
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

-- Chat history
CREATE TABLE IF NOT EXISTS chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
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
