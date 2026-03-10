# 07 - Application Preparation: Resume Tailoring & Cover Letters

> Defines how the system helps users prepare targeted application materials for specific jobs, maximizing their chances of getting an interview.

---

## 1. The Preparation Pipeline

When a user decides to apply to a specific job, the system helps them prepare:

```
User selects a job to apply to
  │
  ├─> 1. JOB ANALYSIS
  │     - Parse job description for requirements
  │     - Extract required skills, preferred skills, responsibilities
  │     - Identify experience level, must-haves, nice-to-haves
  │
  ├─> 2. GAP ANALYSIS
  │     - Compare job requirements against user's resume
  │     - Identify matching qualifications
  │     - Identify gaps (skills/experience they lack)
  │     - Flag deal-breakers vs. "apply anyway" situations
  │
  ├─> 3. RESUME TAILORING
  │     - Suggest keyword additions from the JD
  │     - Rewrite summary/objective for this specific role
  │     - Recommend bullet point adjustments
  │     - Reorder sections for relevance
  │
  ├─> 4. COVER LETTER GENERATION
  │     - Draft a tailored cover letter
  │     - Reference specific company/role details
  │     - Address how skills map to requirements
  │     - Keep to 3-4 paragraphs max
  │
  └─> 5. APPLICATION CHECKLIST
        - Resume tailored? ☐
        - Cover letter ready? ☐
        - Portfolio link included? ☐
        - Application URL opened? ☐
        - Applied date recorded? ☐
```

---

## 2. Job Description Analysis

### AI Prompt: Extract Job Requirements

```
Analyze this job description and extract structured requirements.

JOB TITLE: {title}
COMPANY: {company}
DESCRIPTION:
{description}

Return JSON:
{
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["skill1", "skill2"],
  "experience_years": "3-5 years",
  "education_requirement": "Bachelor's in CS or equivalent",
  "must_haves": ["requirement that's non-negotiable"],
  "nice_to_haves": ["preferred but not required"],
  "responsibilities": ["key responsibility 1", "..."],
  "company_values": ["value mentioned in JD"],
  "red_flags": ["any concerning language like 'wear many hats' or 'fast-paced'"],
  "salary_mentioned": "$120k-150k" or null,
  "remote_policy": "remote | hybrid | onsite | unclear",
  "team_size": "mentioned team size" or null,
  "tech_stack": ["specific technologies mentioned"],
  "application_tips": ["anything the JD says about how to apply"]
}
```

---

## 3. Gap Analysis

```typescript
interface GapAnalysis {
  matchingSkills: string[];      // Skills user has that job wants
  missingSkills: string[];       // Skills job wants that user lacks
  extraSkills: string[];         // Skills user has beyond job requirements
  experienceGap: string;         // "Meets requirement" | "1 year short" | etc.
  educationMatch: boolean;
  overallFit: 'strong' | 'moderate' | 'stretch' | 'unlikely';
  recommendation: string;        // "Apply with confidence" | "Apply but address gaps" | etc.
  dealBreakers: string[];        // Requirements user absolutely cannot meet
}
```

### Fit Categories

| Category | Criteria | Recommendation |
|----------|----------|---------------|
| **Strong Fit** | 80%+ skills match, experience matches, no deal-breakers | "Apply with confidence. Your background is well-aligned." |
| **Moderate Fit** | 60-79% skills match, minor gaps | "Apply and emphasize transferable experience. Address skill gaps in cover letter." |
| **Stretch** | 40-59% match, some gaps | "Consider applying if you can demonstrate rapid learning. This is a growth opportunity." |
| **Unlikely** | <40% match or has deal-breakers | "This role may not be a good fit right now. Focus on roles that better match your profile." |

---

## 4. Resume Tailoring Suggestions

### AI Prompt: Tailor Resume for Job

```
You are an expert resume consultant. Given the user's current resume and a specific 
job description, provide precise, actionable suggestions to tailor the resume for 
maximum impact.

RULES:
- Do NOT fabricate skills or experience the user doesn't have
- Only suggest emphasizing or rephrasing existing qualifications
- Suggest adding relevant keywords from the JD that honestly apply
- Provide specific before/after examples for bullet rewrites
- Keep suggestions realistic and ethical

USER'S RESUME (parsed):
{resumeJSON}

JOB DESCRIPTION:
{jobDescription}

Return JSON:
{
  "summary_rewrite": "A tailored summary/objective for this specific job...",
  
  "keyword_additions": [
    {
      "keyword": "microservices",
      "from_jd": true,
      "user_has_experience": true,
      "where_to_add": "Experience section, Acme Corp bullet points"
    }
  ],
  
  "bullet_rewrites": [
    {
      "section": "Experience - Acme Corp",
      "original": "Built frontend features",
      "tailored": "Architected and shipped 12 customer-facing React features, increasing user engagement by 25%",
      "reason": "JD emphasizes measurable impact and React experience"
    }
  ],
  
  "section_reordering": [
    "Move Projects section above Education -- your open source work is highly relevant"
  ],
  
  "skills_to_highlight": ["React", "TypeScript", "GraphQL"],
  "skills_to_add": ["CI/CD -- you mention GitHub Actions in your experience but not in skills"],
  
  "formatting_tips": [
    "Add a 'Technologies' line to each experience entry listing the specific stack used"
  ]
}
```

---

## 5. Cover Letter Generation

### AI Prompt: Generate Cover Letter

```
Write a professional cover letter for this specific job application. 

RULES:
- 3-4 paragraphs, under 400 words
- Open with WHY you're interested in THIS company (not generic)
- Middle paragraphs map YOUR specific skills to THEIR requirements
- Close with enthusiasm and a call to action
- Professional but personable tone
- Do NOT repeat the resume -- add context and narrative
- Do NOT use cliches like "I am excited to apply" or "I believe I would be a great fit"
- Reference specific things about the company if available

USER PROFILE:
- Name: {name}
- Current role: {currentTitle}
- Years of experience: {yearsOfExperience}
- Top skills: {skills}

USER'S KEY EXPERIENCE (from resume):
{topExperienceBullets}

JOB:
- Title: {jobTitle}
- Company: {company}
- Key requirements: {requirements}
- Company values/culture: {companyValues}

Write the cover letter:
```

### Cover Letter Template Structure

```
Paragraph 1 (Hook):
- Why this company specifically
- How you discovered the role
- 1 sentence connecting your background to their mission

Paragraph 2 (Skills Match):
- Your most relevant experience for this role
- Specific achievements that map to their requirements
- Technologies/tools you share

Paragraph 3 (Value Add):
- What you'd bring beyond the minimum requirements
- Relevant project or achievement that shows initiative
- How your background gives you unique perspective

Paragraph 4 (Close):
- Reiterate enthusiasm
- Mention availability
- Thank them
```

---

## 6. Application Checklist

Before marking a job as "Applied", the system presents a checklist:

```typescript
interface ApplicationChecklist {
  resumeTailored: boolean;        // Did user review tailoring suggestions?
  coverLetterReady: boolean;      // Did user generate/write cover letter?
  portfolioIncluded: boolean;     // Did user include portfolio link (if applicable)?
  applicationUrlOpened: boolean;  // Did user open the application link?
  customAnswers: boolean;         // Some apps have custom questions - reminded?
  referralChecked: boolean;       // Did user check if they know anyone at the company?
}
```

### UI: Pre-Apply Checklist

```
Before you apply to "Senior Frontend Engineer" at Acme Corp:

☐ Resume reviewed (tailoring suggestions available)
☐ Cover letter prepared (draft generated)
☐ Portfolio link ready (if applicable)
☐ Application URL: https://acme.com/careers/123 [Open →]
☐ Know anyone at Acme Corp? Check LinkedIn connections

[Mark as Applied]  [Save for Later]
```

---

## 7. Application Notes & Metadata

When the user marks a job as "Applied", the system captures:

```sql
INSERT INTO applications (job_id, status, applied_date, resume_version, cover_letter, notes, follow_up_date)
VALUES (?, 'applied', datetime('now'), ?, ?, ?, datetime('now', '+7 days'));
```

| Field | Purpose |
|-------|---------|
| `applied_date` | When the user applied (auto-set) |
| `resume_version` | Which resume file was used |
| `cover_letter` | Text of the cover letter used |
| `notes` | Freeform notes ("Applied via company site", "Referred by John") |
| `follow_up_date` | Auto-set to 7 days after apply date |

---

## 8. Batch Application Prep

For users applying to multiple similar roles, the system supports batch operations:

```
User selects 5 jobs to apply to
  │
  ├─> Generate gap analysis for all 5
  ├─> Group by similar requirements
  ├─> Generate 1 base resume version for the cluster
  ├─> Generate 5 individual cover letters
  └─> Present as a prep queue
```

---

## 9. Ethical Guidelines

- **Never fabricate** skills, experience, or qualifications the user doesn't have
- **Never auto-apply** on the user's behalf without explicit action
- **Always disclose** that cover letters are AI-generated (suggest user reviews/edits)
- **Suggest honesty** when gaps exist: "Consider addressing this gap directly rather than hiding it"
- **Flag scam jobs** if detected (no company name, unrealistic pay, vague descriptions)

---

## Implementation Notes

- Resume tailoring and cover letter generation are **on-demand features** triggered from the job detail panel
- The AI calls go through `/api/ai` route which proxies to OpenRouter
- Generated cover letters are **stored with the application record** in SQLite
- Users can **edit the generated cover letter** before saving
- The checklist is **not enforced** -- users can skip items and mark as applied anyway
- All AI-generated content includes a small note: "AI-generated. Review before submitting."

---

## References

- Cover letter best practices from [Ask A Manager](https://www.askamanager.org/)
- Resume tailoring methodology from [JobScan](https://www.jobscan.co/) principles
- Ethical AI guidelines aligned with responsible AI use in job applications
