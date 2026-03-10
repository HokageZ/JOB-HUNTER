# 01 - Research Findings: Job Hunting Landscape

> Comprehensive research on how job hunting works, what tools exist, what platforms matter, and how AI agents can automate the process.

---

## 1. How Job Hunting Actually Works (The Reality)

Job hunting is a pipeline problem. Most people fail not because they lack skills, but because they lack **volume**, **targeting**, and **follow-through**. The data backs this up:

| Metric | Industry Average |
|--------|-----------------|
| Applications needed per offer | 100-200 (entry level), 50-100 (mid), 20-50 (senior) |
| Resume-to-interview conversion rate | 2-5% on job boards, 10-20% via referrals |
| Interview-to-offer conversion rate | 10-25% |
| Average job search duration | 3-6 months |
| % of jobs filled via networking/referrals | 60-80% |
| % of jobs never publicly posted ("hidden market") | 40-70% |

### The Typical Job Seeker's Workflow (Manual)

```
1. Update resume (1-2 days)
2. Pick 2-3 job boards (LinkedIn, Indeed)
3. Search with broad terms ("software engineer")
4. Browse listings, open tabs (30-60 min/day)
5. Apply to 5-10 jobs per day
6. Copy-paste same resume everywhere
7. Wait for responses
8. Get ghosted on 95% of applications
9. Repeat for 3-6 months
10. Get demoralized, take breaks, lose momentum
```

### Why This Fails

- **Too few sources** - most people only use 2-3 job boards
- **No targeting** - applying to everything instead of matching to strengths
- **No customization** - same generic resume for every application
- **No tracking** - losing track of where they applied
- **No follow-up** - never following up on applications
- **No feedback loop** - not learning what works and what doesn't

### What This Tool Fixes

| Problem | Solution |
|---------|----------|
| Too few sources | Scrapes 6+ major boards simultaneously via JobSpy |
| No targeting | AI matches jobs against detailed user profile |
| No customization | AI suggests resume tweaks per specific job |
| No tracking | Kanban board tracks every application |
| No follow-up | Automated reminders at 7-day intervals |
| No feedback loop | Dashboard shows conversion rates and trends |

---

## 2. Job Board Ecosystem Map

### 2.1 Major General-Purpose Boards

These are the high-volume platforms where most jobs are posted:

| Platform | Monthly Users | Best For | Scraping Support |
|----------|--------------|----------|-----------------|
| **LinkedIn** | 1B+ profiles | All levels, networking, referrals | JobSpy (rate-limited, needs proxies) |
| **Indeed** | 350M+ | Volume, entry-mid level, all industries | JobSpy (best scraper, no rate limits) |
| **Glassdoor** | 55M+ | Salary data, company reviews | JobSpy (moderate rate limits) |
| **ZipRecruiter** | 25M+ | AI matching, US/Canada | JobSpy (supported) |
| **Google Jobs** | Aggregator | Aggregates from all boards | JobSpy (needs specific search syntax) |
| **Monster** | Legacy | Declining but still has volume | No JobSpy support |
| **CareerBuilder** | Legacy | Declining | No JobSpy support |
| **SimplyHired** | Aggregator | Aggregates Indeed + others | No JobSpy support |
| **Dice** | Tech-focused | IT/tech professionals | No JobSpy support |

### 2.2 Startup & Tech-Specific Boards

| Platform | Focus | Best For |
|----------|-------|----------|
| **wellfound (AngelList)** | Startups | Early-stage startup roles, equity-based compensation |
| **Y Combinator (workatastartup.com)** | YC companies | High-growth startups, engineering-heavy |
| **Hacker News (Who's Hiring)** | Tech | Monthly thread, very high quality leads |
| **Levels.fyi** | Tech | Compensation benchmarks + job board |
| **Built In** | Tech by city | Local tech scenes (NYC, Chicago, LA, etc.) |
| **Techstars** | Startup ecosystem | Accelerator-backed companies |
| **Startup.jobs** | Startups | Broad startup job aggregator |
| **The Hub** | European startups | EU-focused startup roles |

### 2.3 Remote-First Boards

| Platform | Specialty |
|----------|-----------|
| **We Work Remotely** | Premium remote jobs, all fields |
| **Remote OK** | Tech-heavy remote jobs |
| **Remotive** | Curated remote jobs |
| **FlexJobs** | Vetted remote/flexible (paid) |
| **JustRemote** | All-field remote |
| **DailyRemote** | Updated daily |
| **Working Nomads** | Digital nomad friendly |
| **Remote.co** | Company profiles + remote jobs |
| **Himalayas** | Remote jobs with company culture data |
| **Arc.dev** | Remote developer jobs |

### 2.4 Entry-Level & Junior Boards

| Platform | Best For |
|----------|----------|
| **Jr.DevJobs** | Junior developers specifically |
| **Entry Level Jobs** | All fields, no experience required |
| **College Recruiter** | Recent graduates |
| **AfterCollege** | New grads |
| **TalentEgg** | Canadian students/grads |
| **Newgrad-jobs.com** | Tech new grad positions |
| **SimplifyJobs/New-Grad-Positions** | GitHub repo, 16.5k stars, updated daily, 347+ roles |
| **SimplifyJobs/Summer2026-Internships** | GitHub repo, 1,112+ internship roles |

### 2.5 Freelance & Contract Boards

| Platform | Best For |
|----------|----------|
| **Upwork** | All freelance, largest marketplace |
| **Toptal** | Top 3% vetted freelancers |
| **Fiverr** | Task-based gig work |
| **Freelancer** | Competitive bid projects |
| **Gun.io** | Vetted developer freelancing |
| **YunoJuno** | UK-focused freelancing |

### 2.6 Industry-Specific Boards

| Industry | Platforms |
|----------|----------|
| **AI/ML** | moaijobs.com, aimljobs.fyi, ai-jobs.net |
| **Data Science** | DataJobs.com, KDnuggets, DataScienceJobs.com, DataEngJobs.com |
| **Design** | Dribbble Jobs, Behance Jobs, AIGA, Coroflot, UX Jobs Board |
| **InfoSec** | NinjaJobs, infosec-jobs.com, CyberSecurityJobs |
| **Blockchain/Web3** | CryptoJobsList, Web3.career, Remote3 |
| **DevOps** | Kube.careers |
| **Finance** | eFinancialCareers, OpenQuant |
| **Healthcare** | Health eCareers |
| **Sustainability** | ClimateTechList, Rejobs.org |
| **Gaming** | gamesjobsdirect |

### 2.7 By Programming Language

| Language | Dedicated Board |
|----------|----------------|
| Python | pyJobs, PythonJobsHQ, PythonJob.xyz |
| JavaScript/TypeScript | JobsInJS, TypeScriptJobs.net |
| Go | Golangprojects, GolangCafe |
| Rust | Rust-Jobs.com |
| Ruby | Ruby-on-Rails-Jobs |
| PHP | LaraJobs (Laravel) |
| Elixir | ElixirJobs.net |
| React | ReactJobBoard |
| Vue | VueJobs.com |
| iOS/Android | iOSDevJobs, androidDev.careers |

### 2.8 Regional Boards

| Region | Platforms |
|--------|----------|
| **USA** | US.jobs, DallasJobs.io |
| **Canada** | WorkInTech.ca, Jobboom, MapleStack |
| **UK** | reed.co.uk, CV-Library, CWJobs, DevITjobs UK |
| **Germany** | GermanTechJobs, Berlin Startup Jobs, StepStone |
| **Netherlands** | Jobs in Amsterdam |
| **Denmark** | DanishTech, Jobindex |
| **Poland** | JustJoinIT, Bulldogjob |
| **Switzerland** | SwissDevJobs |
| **Australia** | SEEK, CareerOne |
| **UAE** | RemoteDXB, ZeroTaxJobs |
| **LATAM** | hiring.lat, Findjobit |

---

## 3. Existing Open-Source Tools

### 3.1 Job Scrapers

| Tool | Stars | What It Does | Tech |
|------|-------|-------------|------|
| **[JobSpy](https://github.com/speedyapply/JobSpy)** | 2.9k | Scrapes LinkedIn, Indeed, Glassdoor, Google, ZipRecruiter, Bayt, Naukri concurrently. Outputs to DataFrame/CSV. | Python |
| **[JobFunnel](https://github.com/PaulMcInnis/JobFunnel)** | 2.1k | Scrapes into a single spreadsheet with deduplication using TF-IDF similarity. | Python |

**We are using JobSpy** because:
- More actively maintained (last update Feb 2026)
- Supports more platforms (7 vs 2)
- Simpler API (`scrape_jobs()` returns a pandas DataFrame)
- Better proxy support
- Indeed scraper has no rate limiting

### JobSpy Usage Reference

```python
from jobspy import scrape_jobs
import json

jobs = scrape_jobs(
    site_name=["indeed", "linkedin", "glassdoor", "google", "zip_recruiter"],
    search_term="software engineer",
    google_search_term="software engineer jobs near San Francisco since yesterday",
    location="San Francisco, CA",
    results_wanted=50,
    hours_old=72,
    country_indeed="USA",
    # is_remote=True,
    # job_type="fulltime",  # fulltime, parttime, internship, contract
    # linkedin_fetch_description=True,  # slower but gets full descriptions
    # proxies=["user:pass@host:port"],
)

# Convert to JSON for Node.js consumption
print(json.dumps(jobs.to_dict(orient="records"), default=str))
```

### JobSpy Output Schema

```
JobPost
├── title (str)
├── company (str)
├── company_url (str)
├── job_url (str) ← direct link to apply
├── location
│   ├── country (str)
│   ├── city (str)
│   └── state (str)
├── is_remote (bool)
├── description (str) ← markdown or HTML
├── job_type (str) ← fulltime, parttime, internship, contract
├── salary
│   ├── interval (str) ← yearly, monthly, hourly
│   ├── min_amount (float)
│   ├── max_amount (float)
│   ├── currency (str)
│   └── salary_source (str) ← direct_data or description
├── date_posted (date)
├── emails (list[str])
├── job_level (str) ← LinkedIn only
└── company_industry (str) ← LinkedIn & Indeed
```

### 3.2 Job Application Automation

| Tool | Stars | What It Does |
|------|-------|-------------|
| **[Auto_job_applier_linkedIn](https://github.com/GodsScion/Auto_job_applier_linkedIn)** | 1.9k | Automates LinkedIn Easy Apply with Selenium |
| **[Job_search_agent](https://github.com/surapuramakhil-org/Job_search_agent)** | 127 | AI agent that searches AND applies to jobs on your behalf |

> **Note:** We are NOT auto-applying. This tool helps you FIND and TRACK jobs.
> Auto-applying is spam-like behavior and often backfires. Quality > quantity.

### 3.3 Job Tracking / Career Management

| Tool | Stars | What It Does |
|------|-------|-------------|
| **[job-ops](https://github.com/DaKheera47/job-ops)** | 1k | Self-hosted pipeline to track and analyze applications. Next.js + Docker. |
| **[JobSync](https://github.com/Gsync/jobsync)** | 280 | AI-powered tracker with resume review, job matching. Next.js + Prisma + Ollama. |
| **[jobseeker-analytics](https://github.com/JustAJobApp/jobseeker-analytics)** | 180 | Gmail integration to auto-detect job search emails and build dashboard. |

### 3.4 Curated Job Lists (GitHub)

These are community-maintained, updated daily:

| Repo | Stars | Content |
|------|-------|---------|
| **[SimplifyJobs/New-Grad-Positions](https://github.com/SimplifyJobs/New-Grad-Positions)** | 16.5k | 347+ entry-level/new-grad roles, updated daily |
| **[SimplifyJobs/Summer2026-Internships](https://github.com/SimplifyJobs/Summer2026-Internships)** | 44+ | 1,112+ internship roles across 5 categories |
| **[tech-jobs-with-relocation](https://github.com/AndrewStetsenko/tech-jobs-with-relocation)** | 4.3k | Guide to getting tech jobs abroad |
| **[awesome-job-boards](https://github.com/emredurukn/awesome-job-boards)** | 913 | Curated list of 200+ job boards by category |
| **[canada_sde_junior_new_grad](https://github.com/hanzili/canada_sde_junior_new_grad_position)** | 124 | Canadian CS new grad/junior jobs, updated daily |

### 3.5 Companion Tools & Services

| Tool | Purpose | Cost |
|------|---------|------|
| **[Simplify Copilot](https://simplify.jobs)** | Browser extension that auto-fills job applications | Free |
| **[SWEList](https://swelist.com)** | Email alerts for new roles from GitHub job repos | Free |
| **[Jobright.ai](https://jobright.ai)** | AI-powered job matching | Free tier |
| **[HiringCafe](https://hiring.cafe)** | Aggregator with AI matching | Free |

---

## 4. Job Hunting Best Practices (What Works)

### 4.1 The Volume + Quality Balance

The goal is NOT to spray and pray. It's to:

1. **Cast a wide net for discovery** (scrape many sources)
2. **Filter aggressively** (AI matching against your profile)
3. **Apply selectively** (only to 60+ match score jobs)
4. **Customize per application** (tailored resume + cover letter)
5. **Follow up systematically** (7-day, 14-day reminders)

### 4.2 The 4-Channel Strategy

Top job hunters use four channels simultaneously:

| Channel | % of Effort | Method |
|---------|-------------|--------|
| **Job boards** | 30% | Automated scraping + AI matching (what this tool does) |
| **Networking** | 30% | LinkedIn outreach, meetups, referrals |
| **Direct applications** | 20% | Company career pages of target companies |
| **Recruiters/Agencies** | 20% | Staffing firms, recruiting agencies |

This tool focuses on **Channel 1 (job boards)** and **Channel 3 (direct applications)**, but the tracker supports ALL channels.

### 4.3 Timing Matters

| Insight | Data |
|---------|------|
| Best day to apply | Monday-Tuesday (HR reviews early in the week) |
| Best time to apply | 6-10 AM local time (be early in the pile) |
| Apply within | 24-48 hours of posting (early applicants get 8x more interviews) |
| Follow up after | 7 days (polite check-in) |
| Hiring cycles | Jan-March (Q1 budget), Sept-Oct (Q4 planning) are peak |

### 4.4 Resume Rules That Actually Matter

1. **One page** for <10 years experience, two pages max for senior
2. **ATS-friendly format** - no tables, columns, graphics, headers/footers
3. **Keywords from the job description** mirrored in your resume
4. **Quantified achievements** - "Increased revenue by 30%" not "Responsible for revenue"
5. **Tailored per application** - adjust the summary/skills section for each job
6. **PDF format** - universal rendering, no formatting surprises

### 4.5 The Hidden Job Market

40-70% of jobs are never posted publicly. To access them:

1. **LinkedIn networking** - connect with hiring managers directly
2. **Company career pages** - some companies only post there
3. **Industry conferences/meetups** - in-person connections
4. **Alumni networks** - university career services
5. **Referral programs** - ask contacts at target companies
6. **Cold outreach** - email/message with value proposition

Our tool can't replace networking, but it maximizes the **public job market** channel so the user has more time and energy for networking.

---

## 5. Key Insights for Our Tool's Design

Based on all research, these are the non-obvious insights that shaped the design:

1. **Indeed is the best scraping target** - no rate limits, deepest job data, works internationally
2. **LinkedIn is the most restricted** - rate limits after ~10 pages, proxies essential
3. **Google Jobs is an aggregator** - captures jobs from company sites that aren't on other boards
4. **Job descriptions contain more info than structured fields** - AI extraction of skills/level/salary from description text is essential
5. **Deduplication is harder than it seems** - same job posted on 3+ platforms with slightly different titles
6. **Recency is the #1 filter** - jobs older than 72 hours have dramatically lower response rates
7. **Match quality > application volume** - 20 targeted applications beat 200 spray-and-pray
8. **Follow-up is the most neglected step** - automated reminders are a force multiplier
9. **Entry-level is the hardest segment** - needs the most sources, most volume, most support
10. **Every specialty has niche boards** - the universal approach must include specialty-specific source selection

---

## References

- [awesome-job-boards](https://github.com/emredurukn/awesome-job-boards) - 913 stars, 200+ boards cataloged
- [JobSpy](https://github.com/speedyapply/JobSpy) - 2.9k stars, primary scraping library
- [SimplifyJobs/New-Grad-Positions](https://github.com/SimplifyJobs/New-Grad-Positions) - 16.5k stars
- [SimplifyJobs/Summer2026-Internships](https://github.com/SimplifyJobs/Summer2026-Internships) - 1,112+ roles
- [JobSync](https://github.com/Gsync/jobsync) - Reference architecture for AI job tracker
- [job-ops](https://github.com/DaKheera47/job-ops) - Reference architecture for job pipeline
