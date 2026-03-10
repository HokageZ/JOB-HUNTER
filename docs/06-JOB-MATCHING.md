# 06 - Job Matching: AI Scoring & Filtering

> Defines how every scraped job is scored against the user's profile, how results are ranked, and how the user can tune the system.

---

## 1. Matching Philosophy

The goal is NOT to show every job. The goal is to surface **the jobs most likely to result in an interview**, ordered by relevance. This means:

- A perfect match is rare -- most jobs score 50-80
- A 70+ score means "you should seriously consider applying"
- A 40-69 score means "worth a look, but not ideal"
- Below 40 means "probably not a fit" (hidden by default)
- The user can always override the system and save any job

---

## 2. Scoring Model

Every job is scored 0-100 using a weighted multi-factor model.

### 2.1 Factor Weights (Default)

| Factor | Weight | What It Measures |
|--------|--------|-----------------|
| **Skill Match** | 35% | How many of the user's skills appear in the job description |
| **Experience Level Match** | 20% | Does the job's seniority match the user's level |
| **Location Fit** | 15% | Does the job's location match the user's preferences |
| **Salary Range Fit** | 15% | Does the job's pay overlap with the user's expectations |
| **Job Type Fit** | 10% | Remote/hybrid/onsite + fulltime/parttime/contract match |
| **Recency** | 5% | How recently the job was posted |

**Users can adjust these weights from the settings page.**

### 2.2 Skill Match Scoring (35%)

```typescript
function scoreSkillMatch(userSkills: string[], jobDescription: string, jobSkills: string[]): number {
  // Normalize everything to lowercase
  const userSet = new Set(userSkills.map(s => s.toLowerCase()));
  
  // Combine explicit job skills + skills extracted from description
  const jobSet = new Set([
    ...jobSkills.map(s => s.toLowerCase()),
    ...extractSkillsFromText(jobDescription),
  ]);
  
  if (jobSet.size === 0) return 50; // No skills listed = neutral score
  
  // Count matches
  let matches = 0;
  for (const skill of jobSet) {
    if (userSet.has(skill) || hasRelatedSkill(skill, userSet)) {
      matches++;
    }
  }
  
  const matchRatio = matches / jobSet.size;
  
  // Scale: 0% match = 0, 50% match = 60, 75% match = 80, 100% match = 100
  return Math.min(100, Math.round(matchRatio * 120));
}

// Related skills mapping (synonym/family)
const RELATED_SKILLS: Record<string, string[]> = {
  'javascript': ['js', 'ecmascript', 'es6'],
  'typescript': ['ts'],
  'react': ['react.js', 'reactjs'],
  'node.js': ['node', 'nodejs'],
  'python': ['python3', 'py'],
  'postgresql': ['postgres', 'psql'],
  'mongodb': ['mongo'],
  'kubernetes': ['k8s'],
  'docker': ['containers', 'containerization'],
  'aws': ['amazon web services'],
  'gcp': ['google cloud'],
  'ci/cd': ['continuous integration', 'continuous deployment', 'github actions', 'jenkins'],
  'machine learning': ['ml', 'deep learning', 'ai'],
  // ... extensible
};
```

### 2.3 Experience Level Scoring (20%)

```typescript
const LEVEL_ORDER = ['student', 'entry', 'junior', 'mid', 'senior', 'lead', 'executive'];

function scoreExperienceMatch(userLevel: string, jobLevel: string | null): number {
  if (!jobLevel) return 60; // Unknown level = neutral
  
  const userIndex = LEVEL_ORDER.indexOf(userLevel);
  const jobIndex = LEVEL_ORDER.indexOf(normalizeJobLevel(jobLevel));
  
  if (jobIndex === -1) return 60; // Can't determine = neutral
  
  const diff = Math.abs(userIndex - jobIndex);
  
  switch (diff) {
    case 0: return 100;  // Exact match
    case 1: return 70;   // One level off (e.g., junior applying to mid)
    case 2: return 40;   // Two levels off
    default: return 10;  // Three+ levels off
  }
}

function normalizeJobLevel(jobLevel: string): string {
  const text = jobLevel.toLowerCase();
  if (text.includes('intern') || text.includes('co-op')) return 'student';
  if (text.includes('entry') || text.includes('new grad') || text.includes('associate')) return 'entry';
  if (text.includes('junior') || text.includes('jr') || text.includes('i ') || text.endsWith(' i')) return 'junior';
  if (text.includes('senior') || text.includes('sr') || text.includes('iii') || text.includes(' 3')) return 'senior';
  if (text.includes('lead') || text.includes('principal') || text.includes('staff') || text.includes('architect')) return 'lead';
  if (text.includes('director') || text.includes('vp') || text.includes('head') || text.includes('chief')) return 'executive';
  if (text.includes('mid') || text.includes(' ii') || text.includes(' 2')) return 'mid';
  return 'mid'; // Default assumption
}
```

### 2.4 Location Fit Scoring (15%)

```typescript
function scoreLocationFit(
  userLocations: string[],
  userRemotePref: RemotePreference,
  jobLocation: { city?: string; state?: string; country?: string },
  jobIsRemote: boolean
): number {
  // Remote job + user wants remote = perfect
  if (jobIsRemote && (userRemotePref === 'remote' || userRemotePref === 'any')) {
    return 100;
  }
  
  // Remote job but user wants onsite = poor
  if (jobIsRemote && userRemotePref === 'onsite') {
    return 20;
  }
  
  // Onsite job but user wants remote = poor
  if (!jobIsRemote && userRemotePref === 'remote') {
    return 20;
  }
  
  // Check location match
  for (const userLoc of userLocations) {
    const normalizedUserLoc = userLoc.toLowerCase();
    const jobCity = (jobLocation.city || '').toLowerCase();
    const jobState = (jobLocation.state || '').toLowerCase();
    const jobCountry = (jobLocation.country || '').toLowerCase();
    
    // Exact city match
    if (normalizedUserLoc.includes(jobCity) && jobCity.length > 0) return 100;
    // Same state
    if (normalizedUserLoc.includes(jobState) && jobState.length > 0) return 80;
    // Same country
    if (normalizedUserLoc.includes(jobCountry) && jobCountry.length > 0) return 60;
  }
  
  return 30; // No location match
}
```

### 2.5 Salary Range Scoring (15%)

```typescript
function scoreSalaryFit(
  userMin: number | null,
  userMax: number | null,
  jobMin: number | null,
  jobMax: number | null,
  jobInterval: string | null
): number {
  // If user didn't set salary expectations, neutral
  if (!userMin && !userMax) return 60;
  
  // If job doesn't list salary, slightly negative (opaque = suspicious)
  if (!jobMin && !jobMax) return 45;
  
  // Normalize to annual salary
  const annualJobMin = normalizeToAnnual(jobMin || 0, jobInterval);
  const annualJobMax = normalizeToAnnual(jobMax || annualJobMin, jobInterval);
  const annualUserMin = userMin || 0;
  const annualUserMax = userMax || annualUserMin * 1.5;
  
  // Perfect overlap
  if (annualJobMax >= annualUserMin && annualJobMin <= annualUserMax) {
    // How much overlap?
    const overlapMin = Math.max(annualJobMin, annualUserMin);
    const overlapMax = Math.min(annualJobMax, annualUserMax);
    const overlapSize = overlapMax - overlapMin;
    const userRangeSize = annualUserMax - annualUserMin || 1;
    const overlapRatio = overlapSize / userRangeSize;
    
    return Math.min(100, Math.round(60 + overlapRatio * 40));
  }
  
  // Job pays more than user expects (good problem to have)
  if (annualJobMin > annualUserMax) return 80;
  
  // Job pays less than user minimum
  if (annualJobMax < annualUserMin) {
    const gap = (annualUserMin - annualJobMax) / annualUserMin;
    if (gap < 0.1) return 50;  // Within 10% = maybe negotiable
    if (gap < 0.25) return 30; // 10-25% below = stretch
    return 10;                  // 25%+ below = unlikely fit
  }
  
  return 50;
}

function normalizeToAnnual(amount: number, interval: string | null): number {
  switch (interval) {
    case 'hourly': return amount * 2080; // 40hr/week * 52 weeks
    case 'monthly': return amount * 12;
    case 'weekly': return amount * 52;
    case 'daily': return amount * 260;
    default: return amount; // Assume annual
  }
}
```

### 2.6 Job Type Scoring (10%)

```typescript
function scoreJobTypeFit(
  userRemotePref: RemotePreference,
  userJobTypes: JobType[],
  jobIsRemote: boolean,
  jobType: string | null
): number {
  let score = 50; // neutral base
  
  // Remote preference
  if (userRemotePref === 'remote' && jobIsRemote) score += 25;
  if (userRemotePref === 'onsite' && !jobIsRemote) score += 25;
  if (userRemotePref === 'any') score += 15; // Any is always okay
  
  // Job type (fulltime, parttime, etc.)
  if (jobType && userJobTypes.includes(jobType as JobType)) score += 25;
  if (!jobType) score += 10; // Unknown = neutral
  
  return Math.min(100, score);
}
```

### 2.7 Recency Scoring (5%)

```typescript
function scoreRecency(datePosted: Date | null): number {
  if (!datePosted) return 30; // Unknown date = low
  
  const hoursAgo = (Date.now() - datePosted.getTime()) / 3600000;
  
  if (hoursAgo <= 24) return 100;    // Today
  if (hoursAgo <= 72) return 85;     // Last 3 days
  if (hoursAgo <= 168) return 65;    // Last week
  if (hoursAgo <= 720) return 40;    // Last month
  return 15;                          // Older than a month
}
```

---

## 3. Combined Score Calculation

```typescript
interface MatchResult {
  overallScore: number;       // 0-100
  skillScore: number;
  experienceScore: number;
  locationScore: number;
  salaryScore: number;
  jobTypeScore: number;
  recencyScore: number;
  reasoning: string;          // AI-generated explanation
  isRecommended: boolean;     // score >= 60
}

function calculateMatchScore(profile: UserProfile, job: Job, weights?: Weights): MatchResult {
  const w = weights || DEFAULT_WEIGHTS;
  
  const skillScore = scoreSkillMatch(profile.skills, job.description, job.skills || []);
  const experienceScore = scoreExperienceMatch(profile.experienceLevel, job.job_level);
  const locationScore = scoreLocationFit(profile.desiredLocations, profile.remotePreference, job.location, job.is_remote);
  const salaryScore = scoreSalaryFit(profile.salaryMin, profile.salaryMax, job.salary_min, job.salary_max, job.salary_interval);
  const jobTypeScore = scoreJobTypeFit(profile.remotePreference, profile.jobTypes, job.is_remote, job.job_type);
  const recencyScore = scoreRecency(job.date_posted);
  
  const overallScore = Math.round(
    skillScore * w.skill +
    experienceScore * w.experience +
    locationScore * w.location +
    salaryScore * w.salary +
    jobTypeScore * w.jobType +
    recencyScore * w.recency
  );
  
  return {
    overallScore,
    skillScore,
    experienceScore,
    locationScore,
    salaryScore,
    jobTypeScore,
    recencyScore,
    reasoning: '', // Filled by AI in batch
    isRecommended: overallScore >= 60,
  };
}

const DEFAULT_WEIGHTS = {
  skill: 0.35,
  experience: 0.20,
  location: 0.15,
  salary: 0.15,
  jobType: 0.10,
  recency: 0.05,
};
```

---

## 4. AI-Generated Match Reasoning

After scoring, the AI generates a 1-2 sentence explanation for each recommended job:

### Prompt Template

```
Given this user profile and job posting, write a 1-2 sentence explanation of why this job is or isn't a good match.

User Profile:
- Desired role: {desiredRoles}
- Level: {experienceLevel} ({yearsOfExperience} years)
- Skills: {skills}
- Preferences: {remotePreference}, {desiredLocations}

Job:
- Title: {title}
- Company: {company}
- Location: {location} (Remote: {isRemote})
- Match Score: {overallScore}/100

Score Breakdown:
- Skills: {skillScore}/100
- Experience: {experienceScore}/100
- Location: {locationScore}/100
- Salary: {salaryScore}/100

Write a concise, honest explanation. Start with the strongest factor.
```

### Example Outputs

- **Score 85:** "Strong skill match -- 7 of your 10 skills are mentioned in the JD. Location and experience level align well. The salary range ($120-160k) fits your expectations."
- **Score 62:** "Good skill overlap with React and TypeScript, but this is a senior role and you're at mid-level. Location matches but salary range is unlisted."
- **Score 38:** "This role requires 8+ years of Java experience which doesn't match your Python/React background. Consider only if you're looking to pivot."

### Batch Processing

To avoid excessive API calls, match reasoning is generated in batches:

```typescript
async function generateMatchReasons(jobs: ScoredJob[]): Promise<void> {
  // Only generate for recommended jobs (score >= 60)
  const recommended = jobs.filter(j => j.isRecommended);
  
  // Batch into groups of 5 for a single API call
  for (let i = 0; i < recommended.length; i += 5) {
    const batch = recommended.slice(i, i + 5);
    const prompt = buildBatchReasoningPrompt(batch);
    const response = await openrouter.chat(prompt);
    // Parse and assign reasons to each job
    assignReasons(batch, response);
  }
}
```

---

## 5. Skill Extraction from Job Descriptions

Job descriptions often don't have structured skill lists. The system extracts skills using:

### Pattern-Based Extraction

```typescript
const TECH_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby',
  'react', 'angular', 'vue', 'svelte', 'next.js', 'node.js', 'express', 'django',
  'flask', 'spring', 'rails', '.net', 'laravel',
  'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform',
  'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
  'git', 'ci/cd', 'agile', 'scrum', 'jira',
  'figma', 'sketch', 'photoshop', 'illustrator',
  'sql', 'nosql', 'graphql', 'rest', 'grpc',
  'linux', 'bash', 'nginx', 'apache',
  'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn',
  // ... hundreds more
];

function extractSkillsFromText(text: string): string[] {
  const lowerText = text.toLowerCase();
  return TECH_SKILLS.filter(skill => {
    // Word boundary check to avoid partial matches
    const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i');
    return regex.test(lowerText);
  });
}
```

### AI-Based Extraction (For Non-Tech Jobs)

For non-tech specialties where pattern matching is insufficient:

```
Extract the required and preferred skills from this job description.
Return as JSON: { "required": ["skill1", ...], "preferred": ["skill1", ...] }

Job Description:
{description}
```

---

## 6. Database Schema

```sql
CREATE TABLE IF NOT EXISTS match_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  overall_score INTEGER NOT NULL,
  skill_score INTEGER NOT NULL,
  experience_score INTEGER NOT NULL,
  location_score INTEGER NOT NULL,
  salary_score INTEGER NOT NULL,
  job_type_score INTEGER NOT NULL,
  recency_score INTEGER NOT NULL,
  reasoning TEXT,             -- AI-generated explanation
  is_recommended INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_match_overall ON match_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_match_recommended ON match_scores(is_recommended);
```

---

## 7. User-Facing Match Display

### Job Card in Feed

```
┌──────────────────────────────────────────────┐
│ 🟢 85% Match              Posted 2 hours ago │
│                                              │
│ Senior Frontend Engineer                     │
│ Acme Corp · San Francisco, CA · Remote OK    │
│ $130,000 - $170,000/year                     │
│                                              │
│ Skills: React, TypeScript, Next.js, Node.js  │
│ ✓ 7/10 skills match                         │
│                                              │
│ "Strong skill match with React and TS.       │
│  Location and salary align well."            │
│                                              │
│ [Save]  [Apply]  [Dismiss]     [Details →]   │
└──────────────────────────────────────────────┘
```

### Match Score Color Coding

| Score Range | Color | Label |
|------------|-------|-------|
| 80-100 | Green | Excellent Match |
| 60-79 | Blue | Good Match |
| 40-59 | Yellow | Possible Match |
| 0-39 | Gray | Weak Match (hidden by default) |

### Match Detail Panel

When the user clicks "Details", a side panel shows:

```
Match Breakdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Skills          ████████████░░ 85%
Experience      █████████░░░░░ 70%
Location        ████████████░░ 90%
Salary          ██████████░░░░ 80%
Job Type        ████████████░░ 90%
Recency         ████████████████ 100%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall         ████████████░░ 85%

Matching Skills: React ✓, TypeScript ✓, Next.js ✓, 
                 Node.js ✓, SQL ✓, Git ✓, Docker ✓
Missing Skills:  GraphQL ✗, Kubernetes ✗, Go ✗

AI Assessment:
"Strong skill match -- 7 of your 10 skills are 
mentioned. This is a senior role matching your 
experience level. SF location and remote option 
both fit your preferences."
```

---

## Implementation Notes

- Scoring is **deterministic** (same inputs = same outputs) -- the algorithm doesn't use AI
- Only the **reasoning text** uses AI (OpenRouter) -- it's optional and gracefully degrades
- Scoring runs **immediately** after new jobs are inserted from scraping
- Match scores are **stored in SQLite** and not recomputed unless the user changes their profile
- When the **profile changes**, all existing match scores are invalidated and recomputed in batch
- The user can **re-score a single job** by clicking a refresh icon on the match detail panel

---

## References

- Scoring methodology inspired by [JobMatch-AI](https://github.com/FelixNg1022/JobMatch-AI)
- Skill synonym mapping informed by [LinkedIn Skills Taxonomy](https://linkedin.com)
- Salary normalization follows [Levels.fyi](https://levels.fyi) conventions
