# 03 - Resume & Portfolio Review Workflow

> Defines how the system ingests, parses, analyzes, and provides actionable feedback on the user's resume and portfolio materials.

---

## 1. Supported Input Formats

| Format | Extension | Parsing Method |
|--------|-----------|---------------|
| PDF | `.pdf` | `pdf-parse` npm package (extracts text from PDF) |
| Word Document | `.docx` | `mammoth` npm package (extracts text from DOCX) |
| Plain Text | `.txt` | Direct read |

**Constraints:**
- Max file size: **10 MB**
- Max pages: **5** (flag resumes longer than 2 pages as a finding)
- Only text extraction -- no OCR for image-based PDFs (warn the user)
- Uploaded files stored in `uploads/` directory (gitignored)

---

## 2. Resume Processing Pipeline

```
User uploads file
  │
  ├─> 1. VALIDATE
  │     - Check file type (.pdf, .docx, .txt)
  │     - Check file size (<10MB)
  │     - Reject invalid files with clear error
  │
  ├─> 2. PARSE
  │     - Extract raw text from file
  │     - Detect and preserve section headers
  │     - Count pages / word count
  │     - Store raw text in database
  │
  ├─> 3. STRUCTURE EXTRACTION (AI)
  │     - Send text to OpenRouter with extraction prompt
  │     - Extract: name, contact, summary, experience, education,
  │       skills, certifications, projects
  │     - Return as structured JSON
  │
  ├─> 4. ANALYSIS (AI)
  │     - Compare structured resume against user profile
  │     - Score ATS compatibility
  │     - Identify strengths and weaknesses
  │     - Find missing keywords
  │     - Generate improvement suggestions
  │
  └─> 5. DISPLAY RESULTS
        - Show analysis in organized sections
        - Provide actionable, specific feedback
        - Allow user to re-upload improved version
```

---

## 3. AI Prompts for Resume Analysis

### 3.1 Structure Extraction Prompt

```
You are a resume parsing expert. Extract structured information from the following resume text.

Return a JSON object with these fields:
{
  "name": "Full name",
  "contact": {
    "email": "email if found",
    "phone": "phone if found",
    "linkedin": "LinkedIn URL if found",
    "github": "GitHub URL if found",
    "portfolio": "portfolio URL if found",
    "location": "location if found"
  },
  "summary": "Professional summary/objective if present, null if not",
  "experience": [
    {
      "title": "Job title",
      "company": "Company name",
      "location": "Location",
      "startDate": "Start date",
      "endDate": "End date or Present",
      "bullets": ["Achievement/responsibility 1", "..."]
    }
  ],
  "education": [
    {
      "degree": "Degree type",
      "field": "Field of study",
      "school": "School name",
      "year": "Graduation year",
      "gpa": "GPA if listed"
    }
  ],
  "skills": ["skill1", "skill2"],
  "certifications": ["cert1", "cert2"],
  "projects": [
    {
      "name": "Project name",
      "description": "What it does",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "languages": ["Language 1", "Language 2"],
  "totalYearsExperience": 5,
  "pageCount": 1,
  "wordCount": 450
}

If a field is not found in the resume, set it to null or empty array.

RESUME TEXT:
---
{resumeText}
---
```

### 3.2 Comprehensive Analysis Prompt

```
You are an expert career advisor and resume reviewer. Analyze the following resume against the target profile and provide detailed, actionable feedback.

TARGET PROFILE:
- Desired roles: {desiredRoles}
- Experience level: {experienceLevel}
- Years of experience: {yearsOfExperience}
- Target skills: {skills}
- Target industry: {desiredIndustries}
- Location preference: {remotePreference}, {desiredLocations}

PARSED RESUME:
{structuredResumeJSON}

RAW RESUME TEXT:
{resumeText}

Provide your analysis as a JSON object with the following structure:

{
  "atsScore": 75,  // 0-100, how well this resume would pass ATS systems
  
  "overallAssessment": "2-3 sentence summary of the resume's effectiveness for the target roles",
  
  "strengths": [
    {
      "category": "Experience | Skills | Education | Formatting | Achievements",
      "finding": "Specific strength identified",
      "impact": "Why this matters for job applications"
    }
  ],
  
  "weaknesses": [
    {
      "category": "Experience | Skills | Education | Formatting | Achievements | Missing Sections",
      "finding": "Specific weakness identified",
      "suggestion": "Concrete, actionable fix",
      "priority": "high | medium | low"
    }
  ],
  
  "missingKeywords": [
    {
      "keyword": "Docker",
      "reason": "Common requirement in Senior Frontend Engineer roles",
      "whereToAdd": "Skills section or relevant experience bullet"
    }
  ],
  
  "sectionFeedback": {
    "summary": {
      "exists": true,
      "score": 70,
      "feedback": "Your summary is too generic. Mention specific technologies and quantified achievements.",
      "rewriteSuggestion": "Results-driven Frontend Engineer with 4 years of experience building high-performance React applications serving 100k+ users..."
    },
    "experience": {
      "score": 80,
      "feedback": "Good use of action verbs. Some bullets lack quantification.",
      "weakBullets": [
        {
          "original": "Worked on the frontend team",
          "improved": "Led frontend development of customer-facing dashboard used by 50k+ monthly active users, reducing page load time by 40%"
        }
      ]
    },
    "skills": {
      "score": 65,
      "feedback": "Skills section is a flat list. Consider grouping by category.",
      "suggestion": "Group as: Languages (JS, TS, Python), Frameworks (React, Next.js, Node.js), Tools (Docker, AWS, Git)"
    },
    "education": {
      "score": 90,
      "feedback": "Education section is well-formatted."
    },
    "projects": {
      "exists": false,
      "feedback": "Adding 1-2 notable projects would strengthen your application, especially for senior roles."
    }
  },
  
  "formattingIssues": [
    "Resume is 3 pages - should be 1-2 pages maximum",
    "Inconsistent date formats (some use MM/YYYY, others use Month YYYY)",
    "Missing professional summary section"
  ],
  
  "tailoringTips": [
    {
      "targetRole": "Senior Frontend Engineer",
      "adjustments": [
        "Add Next.js and TypeScript to your summary",
        "Emphasize performance optimization experience",
        "Include any team leadership or mentoring experience"
      ]
    }
  ]
}

Be specific and constructive. Never give vague advice like "improve your resume." 
Every piece of feedback must include a concrete action the user can take.
Do NOT fabricate experience or skills not present in the resume.
```

### 3.3 Job-Specific Resume Tailoring Prompt

When the user wants to tailor their resume for a specific job:

```
You are an expert resume tailor. Given the user's resume and a specific job description, suggest precise changes to maximize their chances of getting an interview.

USER'S RESUME (parsed):
{structuredResumeJSON}

JOB DESCRIPTION:
{jobDescription}

JOB TITLE: {jobTitle}
COMPANY: {company}

Provide your suggestions as JSON:

{
  "matchScore": 72,  // How well the current resume matches this specific job
  
  "summaryRewrite": "A tailored professional summary for this specific job",
  
  "keywordsToAdd": [
    {
      "keyword": "GraphQL",
      "foundInJD": true,
      "inResume": false,
      "suggestion": "Add to skills section if you have experience with it"
    }
  ],
  
  "bulletRewrites": [
    {
      "section": "Experience - Company X",
      "original": "Built web applications",
      "tailored": "Architected and deployed 3 full-stack web applications using React and Node.js, aligning with the team's microservices architecture",
      "reason": "JD emphasizes microservices experience"
    }
  ],
  
  "sectionsToEmphasize": ["Projects section - your open source work is highly relevant"],
  "sectionsToDeemphasize": ["Certifications - not mentioned in JD requirements"],
  
  "coverLetterDraft": "A 3-paragraph cover letter tailored to this specific job..."
}
```

---

## 4. ATS Compatibility Scoring

ATS (Applicant Tracking System) scoring checks for machine-readability:

| Check | Points | What We Look For |
|-------|--------|-----------------|
| Standard section headers | 15 | "Experience", "Education", "Skills" (not creative alternatives) |
| No tables/columns | 10 | ATS can't parse multi-column layouts |
| No images/graphics | 10 | ATS ignores images |
| No headers/footers | 5 | Some ATS skip these |
| Contact info at top | 10 | Name, email, phone, location visible |
| Consistent date format | 5 | Same format throughout |
| Keyword density | 20 | % of target job keywords found in resume |
| File format | 10 | PDF or DOCX (not image-PDF) |
| Length appropriate | 5 | 1-2 pages |
| Action verbs | 10 | "Built", "Led", "Designed" vs "Responsible for" |
| **Total** | **100** | |

---

## 5. Portfolio Review (For Designers, Developers, Writers)

If the user provides a portfolio URL, the AI can review it. This is handled via the chat agent:

### Developer Portfolio Review Prompts

```
Given this developer's portfolio site, evaluate:
1. Does it clearly showcase projects with descriptions, tech stacks, and links?
2. Is the code on GitHub well-documented with READMEs?
3. Are there live demos?
4. Does the portfolio match the seniority level they're targeting?
5. Is the site itself well-built (performance, responsiveness, accessibility)?
```

### Designer Portfolio Review Prompts

```
Given this designer's portfolio:
1. Does it show the design process (research, wireframes, final)?
2. Are case studies detailed with problem/solution/impact?
3. Is the portfolio itself well-designed?
4. Does the work match the level they're targeting?
5. Is there variety in project types?
```

> **Note:** Portfolio review is a **chat-only feature**, not a dedicated page. The user pastes their portfolio URL in the chat, and the AI agent reviews it using the OpenRouter API.

---

## 6. Resume Database Schema

```sql
CREATE TABLE IF NOT EXISTS resumes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,          -- relative path in uploads/
  file_type TEXT NOT NULL,          -- 'pdf', 'docx', 'txt'
  file_size INTEGER NOT NULL,       -- bytes
  raw_text TEXT,                    -- extracted text content
  parsed_data TEXT,                 -- JSON: structured extraction result
  ai_review TEXT,                   -- JSON: full analysis result
  ats_score INTEGER,                -- 0-100
  is_default INTEGER DEFAULT 0,     -- 1 = primary resume
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

---

## 7. UI Layout: Resume Review Page (`/resume`)

```
┌──────────────────────────────────────────────────────────┐
│  Resume Review                                   [Upload]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────────────────────────┐  │
│  │              │  │ ATS Score: 75/100  ████████░░░░░  │  │
│  │   Resume     │  │                                    │  │
│  │   Preview    │  │ Overall: "Strong resume with good  │  │
│  │   (PDF       │  │ experience section. Missing key    │  │
│  │    viewer)   │  │ skills for target roles."          │  │
│  │              │  ├──────────────────────────────────┤  │
│  │              │  │ Strengths (3)                      │  │
│  │              │  │  ✓ Strong quantified achievements  │  │
│  │              │  │  ✓ Relevant tech stack              │  │
│  │              │  │  ✓ Clean formatting                │  │
│  │              │  ├──────────────────────────────────┤  │
│  │              │  │ Improvements (5)           Priority│  │
│  │              │  │  ✗ Add Docker to skills     HIGH   │  │
│  │              │  │  ✗ Rewrite summary          HIGH   │  │
│  │              │  │  ✗ Add projects section      MED   │  │
│  │              │  │  ✗ Fix date formatting       LOW   │  │
│  │              │  │  ✗ Trim to 1 page            LOW   │  │
│  │              │  ├──────────────────────────────────┤  │
│  │              │  │ Missing Keywords                   │  │
│  │              │  │  [Docker] [K8s] [GraphQL] [CI/CD]  │  │
│  └──────────────┘  └──────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │ Bullet Rewrites                                      ││
│  │                                                      ││
│  │ Original: "Worked on the frontend team"              ││
│  │ Improved: "Led frontend development of customer-     ││
│  │ facing dashboard used by 50k+ MAU, reducing page     ││
│  │ load time by 40%"                                    ││
│  │                                          [Copy]      ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  [Tailor for specific job...]  [Re-analyze]  [Download]  │
└──────────────────────────────────────────────────────────┘
```

---

## 8. Error Handling

| Scenario | Handling |
|----------|---------|
| File too large (>10MB) | Reject with "File must be under 10MB" |
| Unsupported format | Reject with "Only PDF, DOCX, and TXT files are supported" |
| Image-only PDF (no text) | Warn: "This PDF appears to contain only images. Text extraction may be incomplete." |
| OpenRouter API fails | Show: "AI review unavailable. Your resume has been saved and can be analyzed later." |
| Empty/corrupt file | Reject with "Could not read this file. Please try a different file." |
| Resume text too short (<50 words) | Warn: "This doesn't look like a full resume. Upload your complete resume for a thorough review." |

---

## Implementation Notes

- **File upload** uses Next.js API route with `formidable` or `multer` for multipart parsing
- **PDF parsing** via `pdf-parse` package (pure JS, no native deps)
- **DOCX parsing** via `mammoth` package (pure JS)
- **AI calls** are made sequentially: first extraction, then analysis (analysis depends on extraction)
- **Results cached** in SQLite -- re-analysis only when user clicks "Re-analyze"
- **Multiple resumes** supported -- user can upload versions and mark one as default
- **Resume text is sent to OpenRouter** -- UI includes a disclosure: "Your resume content will be sent to OpenRouter's AI service for analysis"

---

## References

- [pdf-parse](https://www.npmjs.com/package/pdf-parse) - PDF text extraction
- [mammoth](https://www.npmjs.com/package/mammoth) - DOCX to text/HTML
- ATS scoring methodology based on industry recruiter interviews and [JobScan](https://www.jobscan.co/) principles
- Resume best practices from [Harvard OCS Resume Guide](https://hwpi.harvard.edu/files/ocs/files/hes-resume-cover-letter-guide.pdf)
