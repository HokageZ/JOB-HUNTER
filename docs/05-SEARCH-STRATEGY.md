# 05 - Search Strategy: From Profile to Search Queries

> Defines how the system translates a user profile into effective search queries across multiple platforms, maximizing relevant results while minimizing noise.

---

## 1. The Search Pipeline

```
User Profile
  │
  ├─> 1. QUERY GENERATION
  │     - Build search terms from desired roles + skills
  │     - Build location strings per platform format
  │     - Build filters (job type, remote, hours_old)
  │
  ├─> 2. SOURCE SELECTION
  │     - Pick sources based on profile (see 04-JOB-SOURCES-DATABASE.md)
  │     - Separate into: JobSpy-scraped vs Manual-link sources
  │
  ├─> 3. JOBSPY EXECUTION
  │     - Call Python scraper with generated queries
  │     - One call per (search_term, location) combination
  │     - Aggregate all results
  │
  ├─> 4. DEDUPLICATION
  │     - Hash each job: sha256(normalize(title + company + location))
  │     - Skip jobs already in database
  │
  ├─> 5. STORAGE
  │     - Insert new jobs into SQLite
  │     - Tag with source, scrape timestamp, search query used
  │
  └─> 6. MATCHING
        - Run AI matching on new jobs (see 06-JOB-MATCHING.md)
        - Store match scores
        - Return sorted results to frontend
```

---

## 2. Query Generation Rules

### 2.1 Search Term Construction

The system generates **multiple search queries** from the user's profile to maximize coverage.

**Primary queries** (from desired roles):
```
User has desiredRoles: ["Senior Frontend Engineer", "Full Stack Developer"]
→ Query 1: "Senior Frontend Engineer"
→ Query 2: "Full Stack Developer"
```

**Secondary queries** (skill-enhanced):
```
User has skills: ["React", "TypeScript", "Node.js"]
User has desiredRoles: ["Frontend Engineer"]
→ Query 3: "React developer"
→ Query 4: "TypeScript frontend"
```

**Level-adjusted queries** (for entry-level users who need wider nets):
```
User has experienceLevel: "entry"
User has desiredRoles: ["Software Engineer"]
→ Query 5: "junior software engineer"
→ Query 6: "entry level software engineer"
→ Query 7: "software engineer new grad"
→ Query 8: "software engineer intern"  (if jobTypes includes "internship")
```

### 2.2 Query Generation Algorithm

```typescript
function generateSearchQueries(profile: UserProfile): SearchQuery[] {
  const queries: SearchQuery[] = [];
  
  // 1. Direct role queries
  for (const role of profile.desiredRoles) {
    queries.push({ term: role, priority: 1 });
  }
  
  // 2. Level-prefixed role queries
  const levelPrefixes = LEVEL_PREFIX_MAP[profile.experienceLevel];
  // student:  ["intern", "internship", "co-op"]
  // entry:    ["junior", "entry level", "new grad", "associate"]
  // junior:   ["junior", "jr"]
  // mid:      [] (no prefix needed)
  // senior:   ["senior", "sr", "staff"]
  // lead:     ["lead", "principal", "staff", "architect"]
  // executive:["director", "vp", "head of", "chief"]
  
  for (const role of profile.desiredRoles) {
    for (const prefix of levelPrefixes) {
      // Avoid redundancy: don't prefix "Senior Frontend Engineer" with "senior"
      if (!role.toLowerCase().includes(prefix.toLowerCase())) {
        queries.push({ term: `${prefix} ${role}`, priority: 2 });
      }
    }
  }
  
  // 3. Skill-based queries (top 3 skills only, to avoid too many queries)
  const topSkills = profile.skills.slice(0, 3);
  for (const skill of topSkills) {
    queries.push({ term: `${skill} developer`, priority: 3 });
    queries.push({ term: `${skill} engineer`, priority: 3 });
  }
  
  // 4. Industry-specific modifiers
  if (profile.desiredIndustries.length > 0) {
    for (const role of profile.desiredRoles.slice(0, 2)) {
      for (const industry of profile.desiredIndustries.slice(0, 2)) {
        queries.push({ term: `${role} ${industry}`, priority: 4 });
      }
    }
  }
  
  // Deduplicate and sort by priority
  return deduplicateQueries(queries).sort((a, b) => a.priority - b.priority);
}
```

### 2.3 Query Limits

To avoid excessive scraping and rate limits:

| Constraint | Limit |
|-----------|-------|
| Max queries per search session | 10 |
| Max results per query per site | 50 |
| Max total results per session | 500 |
| Min time between sessions (same query) | 1 hour |
| Max sites per query | 5 (all JobSpy-supported) |

### 2.4 Indeed-Specific Query Syntax

Indeed searches description text, so queries need to be precise:

```python
# Good Indeed query - uses Boolean operators
search_term = '"frontend engineer" (React OR Vue OR Angular) remote -senior'

# Bad Indeed query - too broad
search_term = 'engineer'
```

**Indeed query construction rules:**
- Use `"exact phrase"` for job titles
- Use `OR` for skill alternatives
- Use `-word` to exclude irrelevant results
- Use `(group)` for OR groups
- Include level keywords based on profile

```typescript
function buildIndeedQuery(profile: UserProfile): string {
  const parts: string[] = [];
  
  // Exact role match
  parts.push(`"${profile.desiredRoles[0]}"`);
  
  // Skill alternatives (top 3)
  if (profile.skills.length > 0) {
    const skillGroup = profile.skills.slice(0, 3).join(' OR ');
    parts.push(`(${skillGroup})`);
  }
  
  // Level inclusion
  if (profile.experienceLevel === 'entry' || profile.experienceLevel === 'junior') {
    parts.push('(junior OR "entry level" OR "new grad")');
    parts.push('-senior -lead -principal -director');
  }
  
  // Remote modifier
  if (profile.remotePreference === 'remote') {
    parts.push('remote');
  }
  
  return parts.join(' ');
}
// Output: "frontend engineer" (React OR TypeScript OR Node.js) (junior OR "entry level") -senior
```

### 2.5 Google Jobs Query Syntax

Google Jobs requires a natural language query:

```typescript
function buildGoogleQuery(profile: UserProfile): string {
  const role = profile.desiredRoles[0];
  const location = profile.desiredLocations[0] || profile.location.city;
  const recency = 'since yesterday'; // or 'since last week'
  
  return `${role} jobs near ${location} ${recency}`;
}
// Output: "frontend engineer jobs near San Francisco, CA since yesterday"
```

---

## 3. Location Handling

Different platforms handle location differently:

| Platform | Location Format | Remote Handling |
|----------|----------------|----------------|
| Indeed | `"San Francisco, CA"` | `is_remote=True` parameter |
| LinkedIn | `"San Francisco, California"` | `is_remote=True` parameter |
| Glassdoor | Same as Indeed | Same as Indeed |
| ZipRecruiter | `"San Francisco, CA"` | `is_remote=True` parameter |
| Google Jobs | `"near San Francisco, CA"` | Include "remote" in search term |

**Multi-location strategy:**

If the user has multiple desired locations, run separate queries for each:

```typescript
const locations = ["San Francisco, CA", "New York, NY", "Remote"];

for (const location of locations) {
  if (location === "Remote") {
    // Use is_remote flag instead of location
    scrapeJobs({ search_term: query, is_remote: true });
  } else {
    scrapeJobs({ search_term: query, location: location });
  }
}
```

---

## 4. Scraper Execution

### 4.1 Python Script Interface

The Node.js backend calls the Python scraper as a subprocess:

```typescript
// src/lib/scraper.ts
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface ScrapeRequest {
  searchTerm: string;
  location?: string;
  sites: string[];          // ["indeed", "linkedin", "glassdoor", "google", "zip_recruiter"]
  resultsWanted: number;    // per site
  hoursOld: number;         // max age of postings
  countryIndeed?: string;   // "USA", "UK", etc.
  isRemote?: boolean;
  jobType?: string;         // "fulltime", "parttime", "internship", "contract"
}

async function scrapeJobs(request: ScrapeRequest): Promise<Job[]> {
  const args = [
    'scraper/scrape.py',
    '--search', request.searchTerm,
    '--sites', request.sites.join(','),
    '--results', String(request.resultsWanted),
    '--hours-old', String(request.hoursOld),
  ];
  
  if (request.location) args.push('--location', request.location);
  if (request.countryIndeed) args.push('--country', request.countryIndeed);
  if (request.isRemote) args.push('--remote');
  if (request.jobType) args.push('--job-type', request.jobType);
  
  const { stdout, stderr } = await execFileAsync('python', args, {
    timeout: 120_000, // 2 minute timeout
    maxBuffer: 10 * 1024 * 1024, // 10MB output buffer
  });
  
  if (stderr) {
    console.warn('[scraper] stderr:', stderr);
  }
  
  return JSON.parse(stdout) as Job[];
}
```

### 4.2 Python Script (`scraper/scrape.py`)

```python
#!/usr/bin/env python3
"""Job scraper entry point. Called by Node.js via subprocess."""

import argparse
import json
import sys
from jobspy import scrape_jobs

def main():
    parser = argparse.ArgumentParser(description='Scrape jobs from multiple boards')
    parser.add_argument('--search', required=True, help='Search term')
    parser.add_argument('--location', default=None, help='Location filter')
    parser.add_argument('--sites', default='indeed,linkedin,glassdoor,google,zip_recruiter',
                       help='Comma-separated list of sites')
    parser.add_argument('--results', type=int, default=50, help='Results per site')
    parser.add_argument('--hours-old', type=int, default=72, help='Max hours since posted')
    parser.add_argument('--country', default='USA', help='Country for Indeed/Glassdoor')
    parser.add_argument('--remote', action='store_true', help='Remote jobs only')
    parser.add_argument('--job-type', default=None, help='fulltime|parttime|internship|contract')
    
    args = parser.parse_args()
    
    try:
        jobs = scrape_jobs(
            site_name=args.sites.split(','),
            search_term=args.search,
            google_search_term=f"{args.search} jobs near {args.location or 'United States'}" if 'google' in args.sites else None,
            location=args.location,
            results_wanted=args.results,
            hours_old=args.hours_old,
            country_indeed=args.country,
            is_remote=args.remote if args.remote else None,
            job_type=args.job_type,
            verbose=0,  # Suppress logs to avoid polluting stdout
        )
        
        # Convert DataFrame to JSON-serializable list
        result = jobs.to_dict(orient='records')
        
        # Clean NaN/NaT values
        for job in result:
            for key, value in job.items():
                if isinstance(value, float) and (value != value):  # NaN check
                    job[key] = None
        
        print(json.dumps(result, default=str))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
```

---

## 5. Deduplication Strategy

### 5.1 Hash-Based Deduplication

```typescript
import { createHash } from 'crypto';

function jobHash(job: Job): string {
  const normalized = [
    normalize(job.title),
    normalize(job.company),
    normalize(job.location?.city || ''),
    normalize(job.location?.state || ''),
  ].join('|');
  
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')  // Remove special chars
    .replace(/\s+/g, ' ');         // Collapse whitespace
}
```

### 5.2 Fuzzy Deduplication (Stretch Goal)

Sometimes the same job has slightly different titles across platforms:
- LinkedIn: "Senior Software Engineer - Backend"
- Indeed: "Sr. Software Engineer, Backend Team"
- Glassdoor: "Senior Backend Software Engineer"

For v1, hash-based is sufficient. For v2, consider TF-IDF or Levenshtein distance.

---

## 6. Caching Strategy

```typescript
interface ScrapeCache {
  queryHash: string;      // hash of (searchTerm + location + sites + filters)
  lastScraped: Date;
  resultCount: number;
}

function shouldScrape(query: ScrapeRequest): boolean {
  const queryHash = hashQuery(query);
  const cached = db.get('SELECT * FROM scrape_cache WHERE query_hash = ?', queryHash);
  
  if (!cached) return true;
  
  const hoursSinceLastScrape = (Date.now() - new Date(cached.last_scraped).getTime()) / 3600000;
  return hoursSinceLastScrape >= 1; // Re-scrape after 1 hour
}
```

```sql
CREATE TABLE IF NOT EXISTS scrape_cache (
  query_hash TEXT PRIMARY KEY,
  search_term TEXT NOT NULL,
  location TEXT,
  sites TEXT,
  last_scraped TEXT DEFAULT (datetime('now')),
  result_count INTEGER DEFAULT 0
);
```

---

## 7. Scheduled Scraping

The app runs background scrapes on a schedule:

```typescript
// Triggered by a cron-like interval (using setInterval in dev, or node-cron)
async function scheduledScrape() {
  const profile = loadProfile();
  if (!profile || profile.profileCompleteness < 30) return;
  
  const queries = generateSearchQueries(profile);
  const topQueries = queries.slice(0, 5); // Limit scheduled to top 5
  
  for (const query of topQueries) {
    if (shouldScrape(query)) {
      const jobs = await scrapeJobs(query);
      await processAndStoreJobs(jobs);
      await delay(randomBetween(5000, 15000)); // Rate limit protection
    }
  }
}

// Run every 6 hours
setInterval(scheduledScrape, 6 * 60 * 60 * 1000);
```

---

## 8. Manual Source Links

For non-JobSpy sources, the system generates pre-filled search URLs:

```typescript
const MANUAL_SOURCE_TEMPLATES: Record<string, string> = {
  'weworkremotely':    'https://weworkremotely.com/remote-jobs/search?term={query}',
  'remoteok':          'https://remoteok.com/remote-{query}-jobs',
  'ycombinator':       'https://www.workatastartup.com/jobs?query={query}',
  'hackernews':        'https://hnhiring.com/search?q={query}',
  'wellfound':         'https://wellfound.com/role/{query}',
  'dribbble':          'https://dribbble.com/jobs?keyword={query}',
  'stackoverflow':     'https://stackoverflowjobs.com/jobs?q={query}',
  'builtin':           'https://builtin.com/jobs?search={query}',
  'startupjobs':       'https://startup.jobs/s?q={query}',
};

function generateManualLinks(profile: UserProfile): ManualLink[] {
  const selectedSources = selectManualSources(profile);
  const query = encodeURIComponent(profile.desiredRoles[0]);
  
  return selectedSources.map(source => ({
    name: source.name,
    url: source.template.replace('{query}', query),
    category: source.category,
  }));
}
```

These links are shown in a "More Sources" section on the `/jobs` page.

---

## 9. Search Session Flow (User Perspective)

```
1. User clicks "Search for Jobs" on dashboard or /jobs page
2. System shows: "Searching across 5 platforms for 8 queries..."
3. Progress bar updates as each query completes
4. Results stream in as they're processed:
   - "Found 47 new jobs from Indeed..."
   - "Found 23 new jobs from LinkedIn..."
   - "12 duplicates removed"
5. AI matching runs on new jobs (batch)
6. Results displayed sorted by match score
7. Toast: "Search complete. 82 new jobs found, 15 recommended."
8. "More Sources" section shows links to 12 additional boards
```

---

## 10. Error Recovery

| Scenario | Recovery |
|----------|----------|
| Python not installed | Show setup instructions: "Install Python 3.10+ and run `pip install python-jobspy`" |
| JobSpy timeout (2 min) | Kill process, show partial results if any, retry with fewer sites |
| Rate limited (429) | Log which site, skip it, continue with others, show warning |
| Network error | Retry once after 5s, then show cached results |
| No results found | Suggest: "Try broadening your search or adjusting your profile" |
| All sites fail | Show cached results with "stale data" warning banner |

---

## Implementation Notes

- Search is triggered by: user clicking "Search" button OR 6-hour scheduled interval
- Each search session is logged in `scrape_cache` table
- The `/api/scrape` route is `POST` with the search parameters in the body
- Results are streamed to the client via Server-Sent Events (SSE) for real-time progress
- The Python subprocess runs with a 2-minute timeout to prevent hangs
- All scraping respects the rate limits documented in JobSpy's README

---

## References

- [JobSpy query syntax](https://github.com/speedyapply/JobSpy#frequently-asked-questions)
- Indeed Boolean search operators: [Indeed Help](https://support.indeed.com/hc/en-us/articles/200708610)
- LinkedIn search limitations documented in JobSpy README
