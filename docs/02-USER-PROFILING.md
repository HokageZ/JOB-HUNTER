# 02 - User Profiling: Building the Job Seeker Profile

> Defines exactly what information we collect from the user, how we ask for it, and how the profile drives every downstream decision (search queries, job matching, resume review, interview prep).

---

## 1. Why Profiling Matters

The entire system depends on an accurate user profile. Without it:
- Job searches return irrelevant results
- Match scores are meaningless
- Resume review has no target to compare against
- Interview prep is generic and unhelpful

**Rule: The system MUST NOT perform any job search until a minimum viable profile exists.**

---

## 2. Profile Data Model

### 2.1 Complete Profile Schema

```typescript
interface UserProfile {
  // === BASIC INFO ===
  name: string;                          // "Jane Doe"
  email: string;                         // For follow-up reminders (local only)
  location: {
    city: string;                        // "San Francisco"
    state: string;                       // "CA"
    country: string;                     // "USA"
  };
  languages: string[];                   // ["English", "Spanish"]

  // === PROFESSIONAL IDENTITY ===
  specialty: Specialty;                  // See enum below
  customSpecialty?: string;              // If specialty is "other"
  currentTitle: string;                  // "Frontend Developer"
  experienceLevel: ExperienceLevel;      // See enum below
  yearsOfExperience: number;             // 0-40
  education: Education;                  // See type below

  // === SKILLS ===
  skills: string[];                      // ["React", "TypeScript", "Node.js"]
  certifications: string[];             // ["AWS Solutions Architect", "PMP"]
  tools: string[];                       // ["Figma", "Docker", "Jira"]

  // === JOB PREFERENCES ===
  desiredRoles: string[];                // ["Senior Frontend Engineer", "Full Stack Developer"]
  desiredIndustries: string[];           // ["Tech", "Finance", "Healthcare"]
  remotePreference: RemotePreference;    // remote | hybrid | onsite | any
  desiredLocations: string[];            // ["San Francisco, CA", "New York, NY", "Remote"]
  willingToRelocate: boolean;
  sponsorshipNeeded: boolean;            // Visa sponsorship required?

  // === COMPENSATION ===
  salaryMin: number;                     // Minimum acceptable salary
  salaryMax: number;                     // Target salary
  salaryCurrency: string;               // "USD", "EUR", "GBP"
  salaryInterval: "yearly" | "monthly" | "hourly";

  // === JOB TYPE ===
  jobTypes: JobType[];                   // Which types they're open to
  companySize: CompanySizePreference;    // startup | mid | enterprise | any
  
  // === META ===
  profileCompleteness: number;           // 0-100, computed
  createdAt: string;                     // ISO date
  updatedAt: string;                     // ISO date
}
```

### 2.2 Enums & Types

```typescript
type Specialty =
  | "software_engineering"
  | "data_science"
  | "machine_learning"
  | "devops"
  | "cybersecurity"
  | "product_management"
  | "ux_design"
  | "ui_design"
  | "graphic_design"
  | "marketing"
  | "sales"
  | "finance"
  | "accounting"
  | "healthcare"
  | "nursing"
  | "education"
  | "legal"
  | "hr"
  | "operations"
  | "customer_support"
  | "writing"
  | "journalism"
  | "architecture"
  | "mechanical_engineering"
  | "electrical_engineering"
  | "civil_engineering"
  | "project_management"
  | "consulting"
  | "research"
  | "other";

type ExperienceLevel =
  | "student"       // Currently in school, seeking internships
  | "entry"         // 0-1 years, new grad, career changer
  | "junior"        // 1-3 years
  | "mid"           // 3-6 years
  | "senior"        // 6-10 years
  | "lead"          // 10-15 years, team lead / staff level
  | "executive";    // 15+ years, director / VP / C-level

type RemotePreference = "remote" | "hybrid" | "onsite" | "any";

type JobType = "fulltime" | "parttime" | "contract" | "internship" | "freelance";

type CompanySizePreference = "startup" | "mid" | "enterprise" | "any";

interface Education {
  level: "high_school" | "associate" | "bachelor" | "master" | "phd" | "bootcamp" | "self_taught" | "other";
  field?: string;    // "Computer Science", "Business Administration"
  school?: string;   // "MIT", "State University"
  year?: number;     // Graduation year
}
```

---

## 3. The Onboarding Wizard (5 Steps)

### Step 1: Basic Info

**What we ask:**

| Field | Input Type | Required | Default |
|-------|-----------|----------|---------|
| Name | Text input | Yes | - |
| Email | Email input | No | - |
| City | Text with autocomplete | Yes | - |
| State/Province | Text | No | - |
| Country | Dropdown (ISO list) | Yes | - |
| Languages spoken | Tag input | Yes | "English" |

**UI Notes:**
- Country dropdown with search/filter
- Languages as a tag input with common suggestions (English, Spanish, French, etc.)
- Minimal form -- don't overwhelm on step 1

### Step 2: Professional Identity

**What we ask:**

| Field | Input Type | Required |
|-------|-----------|----------|
| What field are you in? | Searchable dropdown (Specialty enum) | Yes |
| Current/most recent job title | Text input | Yes |
| Experience level | Radio buttons with descriptions | Yes |
| Years of experience | Number slider (0-40) | Yes |
| Highest education | Dropdown | Yes |
| Field of study | Text input | No |
| School name | Text input | No |
| Graduation year | Year picker | No |

**UI Notes:**
- Experience level radio buttons include descriptions:
  - Student: "Currently in school, looking for internships"
  - Entry: "0-1 years, new grad or career changer"
  - Junior: "1-3 years of experience"
  - Mid: "3-6 years of experience"
  - Senior: "6-10 years of experience"
  - Lead: "10-15 years, team/tech lead level"
  - Executive: "15+ years, director/VP/C-level"

### Step 3: Skills & Expertise

**What we ask:**

| Field | Input Type | Required |
|-------|-----------|----------|
| Core skills | Tag input with suggestions | Yes (min 3) |
| Tools & software | Tag input with suggestions | No |
| Certifications | Tag input | No |

**Skill suggestions are specialty-aware:**

| Specialty | Suggested Skills |
|-----------|-----------------|
| software_engineering | JavaScript, TypeScript, Python, React, Node.js, SQL, Git, AWS, Docker, etc. |
| data_science | Python, R, SQL, Pandas, TensorFlow, Statistics, Tableau, etc. |
| ux_design | Figma, Sketch, User Research, Wireframing, Prototyping, A/B Testing, etc. |
| marketing | SEO, SEM, Content Strategy, Google Analytics, HubSpot, Social Media, etc. |
| finance | Excel, Financial Modeling, Bloomberg, Risk Analysis, etc. |
| healthcare | EMR Systems, Patient Care, Clinical Research, HIPAA, etc. |
| (other) | Freeform input only, no suggestions |

**UI Notes:**
- Tag input with typeahead suggestions based on selected specialty
- Allow freeform tags (user can type any skill not in the list)
- Show count: "5 skills added" to encourage adding more
- Minimum 3 skills required to proceed

### Step 4: Job Preferences

**What we ask:**

| Field | Input Type | Required |
|-------|-----------|----------|
| Desired job titles | Tag input (up to 5) | Yes (min 1) |
| Desired industries | Multi-select checkboxes | No |
| Remote preference | Radio: Remote / Hybrid / Onsite / Any | Yes |
| Desired locations | Tag input with city autocomplete | Yes (unless remote-only) |
| Open to relocation? | Toggle | No (default: No) |
| Need visa sponsorship? | Toggle | No (default: No) |
| Job types open to | Checkbox group | Yes (min 1) |
| Company size preference | Radio: Startup / Mid / Enterprise / Any | No (default: Any) |
| Minimum salary | Number input | No |
| Target salary | Number input | No |
| Salary currency | Dropdown (USD, EUR, GBP, CAD, AUD, INR) | Only if salary entered |
| Salary interval | Radio: Yearly / Monthly / Hourly | Only if salary entered |

**UI Notes:**
- If remote preference is "remote", location field becomes optional
- Salary fields are optional but strongly recommended (affects matching)
- Job types shown with icons for visual clarity

### Step 5: Resume Upload (Optional)

**What we show:**
- Drag & drop zone for PDF or DOCX
- Max file size: 10MB
- Preview of uploaded file name
- "Skip for now" button (can always upload later from /resume page)
- If uploaded: show a brief "We'll analyze this after setup" message

**After Step 5:**
1. Save profile to `data/profile.json` AND SQLite `profile` table
2. Compute `profileCompleteness` score
3. Trigger initial job scrape based on profile
4. Redirect to `/jobs` with a toast: "Profile saved! Searching for jobs..."

---

## 4. Profile Completeness Scoring

The profile completeness score determines how confident the system is in its matches.

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

| Score | Label | System Behavior |
|-------|-------|----------------|
| 0-30 | Incomplete | Block job search, show warning, redirect to /setup |
| 31-60 | Basic | Allow search, but show "Complete your profile for better results" |
| 61-85 | Good | Full functionality, occasional suggestion to add more |
| 86-100 | Excellent | Full functionality, no prompts |

---

## 5. Clarifying Questions (AI Chat Agent)

When the user interacts with the AI chat agent, it should ask follow-up questions if the profile is incomplete or when the user asks for help. Here are the question templates:

### Initial Profiling Questions

```
1. "What field or industry do you work in? (e.g., software engineering, marketing, healthcare)"
2. "How would you describe your experience level? Are you a student, entry-level, junior, mid-level, senior, or executive?"
3. "How many years of professional experience do you have?"
4. "What are your top 5-10 skills? List the ones you're most confident in."
5. "What job titles are you looking for? (e.g., 'Frontend Developer', 'Marketing Manager')"
6. "Where are you located, and where are you willing to work? (cities, countries, or remote)"
7. "Do you prefer remote, hybrid, or onsite work?"
8. "What's your target salary range? (optional but helps with matching)"
9. "Do you have a resume you'd like me to review?"
10. "Are there specific companies or industries you're particularly interested in?"
```

### Follow-Up Questions (When Profile Exists But Needs Depth)

```
- "I see you listed React and TypeScript as skills. Do you also have experience with Node.js, Next.js, or other backend technologies?"
- "You mentioned you're open to relocation. Are there specific cities or countries you'd prefer?"
- "Your profile doesn't have a salary range. Would you like to set one? It helps filter out jobs that don't meet your expectations."
- "I notice you haven't uploaded a resume yet. Would you like to upload one so I can provide tailored feedback?"
- "You're looking for senior roles but listed 3 years of experience. Would junior or mid-level roles also be acceptable?"
```

### Validation Questions (Catching Mismatches)

```
- "You've selected 'executive' level but list 5 years of experience. Did you mean 'mid-level' instead?"
- "Your desired salary of $200k+ with 2 years of experience may limit results significantly. Would you like to also see jobs in the $100-150k range?"
- "You want on-site work but listed 3 different countries. Are you willing to relocate, or should I only search in your current country?"
```

---

## 6. Profile Update Triggers

The profile should be updated when:

| Trigger | Action |
|---------|--------|
| User visits `/setup` | Show current profile in editable wizard |
| User tells AI chat "I learned React" | AI asks: "Should I add React to your skills?" -> update profile |
| User applies to a job outside their stated preferences | Ask: "You applied to a remote role but your preference is onsite. Should I update your preference?" |
| 30 days since last profile review | Dashboard prompt: "It's been a month. Has anything changed in your job search?" |
| User exports profile | JSON download of complete profile |

---

## 7. Profile Storage

### JSON File (Primary, Human-Readable)

Stored at `data/profile.json`:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "location": {
    "city": "San Francisco",
    "state": "CA",
    "country": "USA"
  },
  "languages": ["English", "Spanish"],
  "specialty": "software_engineering",
  "currentTitle": "Frontend Developer",
  "experienceLevel": "mid",
  "yearsOfExperience": 4,
  "education": {
    "level": "bachelor",
    "field": "Computer Science",
    "school": "UC Berkeley",
    "year": 2021
  },
  "skills": ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "SQL", "Git", "Tailwind CSS"],
  "certifications": ["AWS Cloud Practitioner"],
  "tools": ["VS Code", "Figma", "Docker", "Jira"],
  "desiredRoles": ["Senior Frontend Engineer", "Full Stack Developer"],
  "desiredIndustries": ["Tech", "Finance"],
  "remotePreference": "hybrid",
  "desiredLocations": ["San Francisco, CA", "New York, NY"],
  "willingToRelocate": true,
  "sponsorshipNeeded": false,
  "salaryMin": 120000,
  "salaryMax": 180000,
  "salaryCurrency": "USD",
  "salaryInterval": "yearly",
  "jobTypes": ["fulltime"],
  "companySize": "any",
  "profileCompleteness": 92,
  "createdAt": "2026-03-10T12:00:00Z",
  "updatedAt": "2026-03-10T12:00:00Z"
}
```

### SQLite (For Queries)

The same data is mirrored to a `profile` table in SQLite for use in SQL joins (e.g., matching jobs against profile skills).

```sql
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data TEXT NOT NULL,  -- JSON blob of the full profile
  completeness INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Skills stored separately for efficient matching
CREATE TABLE IF NOT EXISTS profile_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill TEXT NOT NULL UNIQUE
);
```

---

## Implementation Notes

- The profile wizard is built as a **multi-step form** using React state (no form library needed for 5 steps)
- Each step validates before allowing "Next"
- "Back" button preserves entered data
- Final step submits everything in one API call: `POST /api/profile`
- Profile completeness is **computed on save**, not in real-time (avoid flicker)
- The `/setup` page loads existing profile data if it exists (edit mode)

---

## References

- Profile schema inspired by [JobSync](https://github.com/Gsync/jobsync) and [LinkedIn profile fields](https://linkedin.com)
- Specialty taxonomy covers [Bureau of Labor Statistics SOC codes](https://www.bls.gov/soc/) simplified
- Skill suggestions sourced from [awesome-job-boards](https://github.com/emredurukn/awesome-job-boards) category analysis
