# 09 - Interview Preparation Guide

> Defines how the AI agent helps users prepare for interviews at specific companies, generating tailored prep materials, practice questions, and research briefs.

---

## 1. When Interview Prep Activates

Interview prep is triggered when:
1. User moves an application to the **"Interview"** status
2. User clicks **"Prep for Interview"** on any application
3. User asks the **AI chat**: "Help me prepare for my interview at [company]"

---

## 2. Interview Prep Package

For each interview, the system generates a prep package with 5 sections:

```
Interview Prep: Senior Frontend Engineer @ Acme Corp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Company Research Brief
2. Role-Specific Questions (Technical)
3. Behavioral Questions (STAR Method)
4. Questions to Ask the Interviewer
5. Logistics & Tips
```

---

## 3. Company Research Brief

### AI Prompt: Company Research

```
Research and summarize key information about {company} for a job interview.

Company: {company}
Role: {jobTitle}
Job Description: {jobDescription}

Provide a concise research brief as JSON:
{
  "company_overview": "1-2 sentences about what the company does",
  "industry": "Primary industry/sector",
  "founded": "Year if known",
  "size": "Approximate employee count if known",
  "headquarters": "Location",
  "mission": "Company mission/vision statement if available",
  "products": ["Key products or services"],
  "recent_news": ["Any notable recent developments mentioned in JD or publicly known"],
  "culture_signals": ["Culture aspects mentioned in the job description"],
  "tech_stack": ["Technologies used, from JD"],
  "competitors": ["Known competitors in their space"],
  "interview_process": "If mentioned in JD or commonly known for this company",
  "glassdoor_tips": "General advice for interviewing at companies of this type/size"
}

Base your answers ONLY on information in the job description and commonly known facts.
If you don't have reliable information for a field, set it to null.
Do NOT fabricate specific details like revenue, stock price, or funding amounts.
```

### Display Format

```
┌──────────────────────────────────────────────┐
│ Company Brief: Acme Corp                     │
├──────────────────────────────────────────────┤
│                                              │
│ About: Acme Corp builds developer tools for  │
│ cloud-native applications. Based in SF.      │
│                                              │
│ Industry: Developer Tools / SaaS             │
│ Size: ~200 employees (Series B)              │
│ Tech Stack: React, TypeScript, Go, K8s, AWS  │
│                                              │
│ Culture Signals (from JD):                   │
│ • "Fast-moving, collaborative team"          │
│ • "Strong emphasis on code review"           │
│ • "Quarterly hackathons"                     │
│                                              │
│ Competitors: Vercel, Netlify, Railway        │
│                                              │
│ ⚠️ Based on job description analysis.        │
│ Do your own research on their website.       │
│ [Open Company Website →]                     │
└──────────────────────────────────────────────┘
```

---

## 4. Technical Interview Questions

### AI Prompt: Generate Technical Questions

```
Generate 15 practice interview questions for this specific role.

ROLE: {jobTitle}
REQUIRED SKILLS: {requiredSkills}
PREFERRED SKILLS: {preferredSkills}
EXPERIENCE LEVEL: {experienceLevel}
TECH STACK: {techStack}

Generate questions in these categories:

1. FUNDAMENTALS (3 questions)
   - Core concepts of the primary technologies
   - Should match the experience level

2. SYSTEM DESIGN (3 questions)
   - Architecture questions appropriate for {experienceLevel}
   - Related to the company's domain if possible

3. CODING/PROBLEM SOLVING (3 questions)
   - Practical coding challenges
   - Related to the tech stack

4. TECHNOLOGY-SPECIFIC (3 questions)
   - Deep-dive questions about specific tools/frameworks in the JD

5. EXPERIENCE-BASED TECHNICAL (3 questions)
   - "Tell me about a time you..." but technically focused

Return as JSON:
{
  "questions": [
    {
      "category": "fundamentals",
      "question": "The question text",
      "why_asked": "Why an interviewer would ask this for this role",
      "key_points": ["Point 1 to cover", "Point 2 to cover"],
      "difficulty": "easy | medium | hard"
    }
  ]
}

Tailor difficulty to {experienceLevel}:
- entry/junior: Focus on fundamentals, basic coding, simple system design
- mid: Balanced fundamentals + intermediate system design + real-world scenarios
- senior/lead: Complex system design, architecture decisions, trade-offs, mentoring
```

### Example Output (Frontend Engineer)

```
Fundamentals:
1. Explain the virtual DOM in React and why it improves performance.
2. What is the difference between useEffect and useLayoutEffect?
3. How does TypeScript's type system help prevent bugs at scale?

System Design:
4. Design a real-time collaborative text editor (like Google Docs).
5. How would you architect a component library used by 10 teams?
6. Design the frontend for an infinite-scroll social media feed.

Coding:
7. Implement a debounce function from scratch.
8. Write a custom React hook that manages pagination state.
9. Given an array of async tasks, implement a concurrency limiter.

Tech-Specific:
10. How does Next.js handle server-side rendering vs static generation?
11. Explain React Server Components and when you'd use them.
12. How would you optimize a React app's bundle size?

Experience-Based:
13. Tell me about a performance optimization you made. What was the impact?
14. Describe a time you had to refactor a large codebase. How did you approach it?
15. How do you handle disagreements about technical decisions in a team?
```

---

## 5. Behavioral Questions (STAR Method)

### AI Prompt: Behavioral Questions

```
Generate 10 behavioral interview questions relevant to {jobTitle} at {company}.
For each question, provide a STAR method template the user can fill in.

STAR Method:
- Situation: Set the context
- Task: What was your responsibility
- Action: What specific steps you took
- Result: What was the outcome (quantified if possible)

Return as JSON:
{
  "questions": [
    {
      "question": "Tell me about a time you had to deal with a tight deadline.",
      "why_asked": "Tests time management and prioritization",
      "star_template": {
        "situation": "Describe the project and the deadline pressure...",
        "task": "What was your specific role and what needed to be done...",
        "action": "What steps did you take to meet the deadline...",
        "result": "What was the outcome? Did you meet the deadline? What did you learn..."
      },
      "tips": "Focus on the specific actions YOU took, not the team. Quantify the result."
    }
  ]
}
```

### Common Behavioral Categories

| Category | Example Question |
|----------|-----------------|
| **Leadership** | "Tell me about a time you led a project or initiative." |
| **Conflict** | "Describe a disagreement with a coworker. How did you resolve it?" |
| **Failure** | "Tell me about a time something went wrong. What did you do?" |
| **Teamwork** | "Give an example of successful collaboration." |
| **Problem-solving** | "Describe a complex problem you solved." |
| **Growth** | "Tell me about a skill you learned on the job." |
| **Pressure** | "How do you handle tight deadlines?" |
| **Initiative** | "Give an example where you went above and beyond." |

---

## 6. Questions to Ask the Interviewer

### AI Prompt

```
Generate 8-10 thoughtful questions this candidate should ask the interviewer.

Role: {jobTitle}
Company: {company}
Candidate Level: {experienceLevel}

Generate questions that:
1. Show genuine interest in the role and team
2. Help the candidate evaluate if this is the right fit
3. Are NOT easily answerable by reading the website
4. Cover: team structure, day-to-day work, growth, challenges, culture

Return as JSON array of strings.
```

### Default Questions (Always Good)

```
1. "What does a typical day/week look like for someone in this role?"
2. "What are the biggest challenges the team is facing right now?"
3. "How is success measured for this position in the first 6 months?"
4. "Can you tell me about the team I'd be working with?"
5. "What's the onboarding process like?"
6. "How does the team handle code review and technical decisions?"
7. "What opportunities are there for growth and learning?"
8. "What do you personally enjoy most about working here?"
9. "What's the timeline for the hiring decision?"
10. "Is there anything about my background that gives you hesitation?"
```

---

## 7. Logistics & Tips

```
Pre-Interview Checklist
━━━━━━━━━━━━━━━━━━━━━━━━

Before the Interview:
☐ Research the company website and recent blog posts
☐ Review the job description one more time
☐ Prepare your STAR stories (at least 3-5)
☐ Practice technical questions out loud
☐ Prepare your "Tell me about yourself" (2 min version)
☐ Test your video/audio setup (if remote)
☐ Have a glass of water ready
☐ Prepare a notepad for taking notes

During the Interview:
☐ Listen carefully, don't rush to answer
☐ Ask for clarification if a question is unclear
☐ Think out loud during technical questions
☐ Use specific examples, not generalizations
☐ Ask your prepared questions when prompted

After the Interview:
☐ Send a thank-you email within 24 hours
☐ Note down questions that were asked (for future prep)
☐ Update application status in the tracker
☐ Set a follow-up reminder if no response in 5-7 days
```

---

## 8. Thank-You Email Template

### AI Prompt

```
Write a brief thank-you email for a job interview.

Interviewer name: {interviewerName} (or "the team" if unknown)
Company: {company}
Role: {jobTitle}
Interview topics discussed: {topicsDiscussed}

Rules:
- Keep it under 150 words
- Reference something specific from the conversation
- Reiterate interest in the role
- Professional but warm tone
- No cliches
```

### Template (Fallback)

```
Subject: Thank you - {jobTitle} Interview

Hi {interviewerName},

Thank you for taking the time to speak with me today about the 
{jobTitle} role. I enjoyed learning about {specific topic discussed} 
and how the team approaches {challenge/project mentioned}.

Our conversation reinforced my enthusiasm for this opportunity. 
I'm particularly excited about {specific aspect of the role} and 
believe my experience with {relevant skill} would allow me to 
contribute meaningfully from day one.

Please don't hesitate to reach out if you need any additional 
information. I look forward to hearing about next steps.

Best regards,
{userName}
```

---

## 9. Database Schema

```sql
CREATE TABLE IF NOT EXISTS interview_prep (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  company_brief TEXT,           -- JSON: company research
  technical_questions TEXT,     -- JSON: array of questions
  behavioral_questions TEXT,    -- JSON: array of STAR questions
  questions_to_ask TEXT,        -- JSON: array of strings
  user_notes TEXT,              -- User's own prep notes
  interview_date TEXT,          -- Scheduled date
  interview_type TEXT,          -- phone, video, onsite, technical, behavioral
  interviewer_name TEXT,
  outcome TEXT,                 -- passed, failed, pending, cancelled
  thank_you_sent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);
```

---

## 10. Multi-Round Interview Support

Many companies have multi-round processes:

```
Round 1: Phone Screen (30 min)
  → Prep: Company brief + behavioral questions
  
Round 2: Technical Screen (60 min)
  → Prep: Coding questions + fundamentals
  
Round 3: System Design (60 min)
  → Prep: System design questions
  
Round 4: Team/Culture Fit (45 min)
  → Prep: Behavioral + questions to ask
  
Round 5: Hiring Manager (30 min)
  → Prep: Experience-based + career goals
```

Users can add multiple interview entries per application, each with its own prep material and notes.

---

## Implementation Notes

- Interview prep is generated **on-demand** when the user clicks "Prep for Interview"
- Prep materials are **cached in SQLite** -- regenerate only if user clicks "Refresh"
- The prep page is accessible from the application detail panel in the tracker
- AI generation uses a **single OpenRouter call** with all sections in one prompt (to minimize API calls)
- If OpenRouter is unavailable, show the **default questions** (hardcoded) with a "AI prep unavailable" note
- Users can **edit and add their own notes** alongside AI-generated content
- Interview dates appear on the **dashboard calendar widget**

---

## References

- STAR method framework from [Harvard Business Review](https://hbr.org/)
- Question banks informed by [Glassdoor interview reviews](https://glassdoor.com)
- Thank-you email best practices from [Ask A Manager](https://askamanager.org)
- Technical interview patterns from [interviewing.io](https://interviewing.io) research
