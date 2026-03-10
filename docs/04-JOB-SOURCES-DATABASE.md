# 04 - Job Sources Database

> A comprehensive catalog of 200+ job boards, platforms, and sources organized by category, specialty, region, and experience level. This document drives the source selection logic in `05-SEARCH-STRATEGY.md`.

---

## 1. How This Database Is Used

When the user sets up their profile, the system selects which job sources to search based on:

1. **Specialty** - Use general boards + specialty-specific boards
2. **Experience level** - Add entry-level boards for students/juniors
3. **Location** - Add regional boards for their target countries
4. **Remote preference** - Add remote-first boards if remote preferred
5. **Company size preference** - Add startup boards if startup preferred

The scraper then queries the selected sources using the user's desired roles and skills as search terms.

---

## 2. Source Categories

### Legend

| Column | Meaning |
|--------|---------|
| **Scraping** | How our tool accesses this source |
| **JobSpy** | Directly supported by python-jobspy library |
| **API** | Has a public or semi-public API |
| **Manual** | User needs to check manually (we provide the link + search URL) |
| **Level** | What experience levels this source is best for |

---

## 3. General-Purpose Job Boards

> Applicable to ALL specialties. These are always included in searches.

| # | Platform | URL | Scraping | Level | Notes |
|---|----------|-----|----------|-------|-------|
| 1 | **Indeed** | indeed.com | JobSpy | All | Best scraper, no rate limits, deepest data, 60+ countries |
| 2 | **LinkedIn** | linkedin.com/jobs | JobSpy | All | Largest professional network, rate limits apply, use proxies |
| 3 | **Glassdoor** | glassdoor.com | JobSpy | All | Salary data + reviews, moderate rate limits |
| 4 | **Google Jobs** | google.com/search?q=jobs | JobSpy | All | Aggregator, needs specific search syntax |
| 5 | **ZipRecruiter** | ziprecruiter.com | JobSpy | All | US/Canada only, AI matching built in |
| 6 | **Monster** | monster.com | Manual | All | Legacy but still has volume |
| 7 | **CareerBuilder** | careerbuilder.com | Manual | All | Legacy |
| 8 | **SimplyHired** | simplyhired.com | Manual | All | Indeed-owned aggregator |
| 9 | **Dice** | dice.com | Manual | Tech | Tech professionals |
| 10 | **The Muse** | themuse.com | Manual | Entry-Mid | Company profiles + jobs |
| 11 | **Adzuna** | adzuna.com | Manual | All | Multi-country aggregator |
| 12 | **Jora** | jora.com | Manual | All | Global aggregator |
| 13 | **Joblist** | joblist.com | Manual | All | US aggregator |
| 14 | **LinkUp** | linkup.com | Manual | All | Scrapes directly from company sites |
| 15 | **wellfound** | wellfound.com | Manual | All | Formerly AngelList, startup-heavy |
| 16 | **Levels.fyi** | levels.fyi/jobs | Manual | Tech | Best for comp data |

---

## 4. Startup & Emerging Company Boards

> Selected when `companySize == "startup"` or always included for tech specialties.

| # | Platform | URL | Scraping | Notes |
|---|----------|-----|----------|-------|
| 1 | **Y Combinator** | workatastartup.com | Manual | YC-backed companies, very high quality |
| 2 | **wellfound** | wellfound.com | Manual | Equity + salary, startup culture info |
| 3 | **Startup.jobs** | startup.jobs | Manual | Broad startup aggregator |
| 4 | **Techstars** | jobs.techstars.com | Manual | Accelerator-backed companies |
| 5 | **The Hub** | thehub.io | Manual | European startups |
| 6 | **f6s** | f6s.com/jobs | Manual | Global startup ecosystem |
| 7 | **StartUpers** | startupers.com | Manual | European + US startups |
| 8 | **WorkinStartups** | workinstartups.com | Manual | UK-focused startups |
| 9 | **Work in Biotech** | workinbiotech.com | Manual | Biotech/life sciences startups |
| 10 | **devtooljobs** | devtooljobs.com | Manual | Developer tooling companies |
| 11 | **Startups Gallery** | startups.gallery | Manual | Startup directory with jobs |

---

## 5. Entry-Level & Junior Boards

> Selected when `experienceLevel in ["student", "entry", "junior"]`.

| # | Platform | URL | Scraping | Notes |
|---|----------|-----|----------|-------|
| 1 | **Jr.DevJobs** | jrdevjobs.com | Manual | Junior dev roles specifically |
| 2 | **Entry Level Jobs** | entryleveljobs.me | Manual | All fields, no experience needed |
| 3 | **College Recruiter** | collegerecruiter.com | Manual | Recent graduates |
| 4 | **AfterCollege** | aftercollege.com | Manual | Post-graduation roles |
| 5 | **TalentEgg** | talentegg.ca | Manual | Canadian students/grads |
| 6 | **Newgrad-jobs.com** | newgrad-jobs.com | Manual | New grad aggregator |
| 7 | **CareerRookie** | careerrookie.com | Manual | Entry-level |
| 8 | **ErasmusIntern** | erasmusintern.org | Manual | European internships |

### GitHub Curated Lists (Updated Daily)

| # | Repository | Stars | Content |
|---|-----------|-------|---------|
| 1 | **SimplifyJobs/New-Grad-Positions** | 16.5k | 347+ new grad tech roles |
| 2 | **SimplifyJobs/Summer2026-Internships** | - | 1,112+ internship roles |
| 3 | **hanzili/canada_sde_junior_new_grad** | 124 | Canadian CS new grad/junior, daily |

---

## 6. Remote-First Boards

> Selected when `remotePreference in ["remote", "any"]`.

| # | Platform | URL | Scraping | Notes |
|---|----------|-----|----------|-------|
| 1 | **We Work Remotely** | weworkremotely.com | Manual | Premium remote jobs, all fields |
| 2 | **Remote OK** | remoteok.io | Manual | Tech-heavy remote jobs |
| 3 | **Remotive** | remotive.com | Manual | Curated remote jobs |
| 4 | **FlexJobs** | flexjobs.com | Manual | Vetted, some paid features |
| 5 | **JustRemote** | justremote.co | Manual | All-field remote |
| 6 | **DailyRemote** | dailyremote.com | Manual | Updated daily |
| 7 | **Working Nomads** | workingnomads.com | Manual | Digital nomad friendly |
| 8 | **remote.co** | remote.co | Manual | Company profiles + jobs |
| 9 | **Himalayas** | himalayas.app | Manual | Company culture data |
| 10 | **NODESK** | nodesk.co | Manual | Remote + resources |
| 11 | **Jobspresso** | jobspresso.co | Manual | Curated remote |
| 12 | **Devremote** | devremote.io | Manual | Dev-focused remote |
| 13 | **RemoteSource** | jobs.remotesource.com | Manual | All fields |
| 14 | **DynamiteJobs** | dynamitejobs.com | Manual | Remote community |
| 15 | **FlatWorld** | flatworld.co | Manual | Remote teams |
| 16 | **Remote Rocketship** | remoterocketship.com | Manual | Aggregator |
| 17 | **TrulyRemote** | trulyremote.co | Manual | Verified remote |
| 18 | **4DayJob** | 4dayjob.com | Manual | 4-day work week + remote |
| 19 | **Find My Remote** | findmyremote.ai | Manual | AI-powered remote matching |
| 20 | **hiring.lat** | hiring.lat | Manual | Remote for LATAM workers |

---

## 7. Specialty-Specific Boards

### 7.1 Software Engineering & Tech

| # | Platform | URL | Focus |
|---|----------|-----|-------|
| 1 | **HackerNews Who's Hiring** | news.ycombinator.com/jobs | Monthly thread, very high quality |
| 2 | **Stack Overflow Jobs** | stackoverflowjobs.com | Developer community |
| 3 | **GitHub Jobs** | github.careers | GitHub's own listings |
| 4 | **findwork.dev** | findwork.dev | Tech jobs |
| 5 | **Codersrank** | jobs.codersrank.io | Skill-verified devs |
| 6 | **HackerRank** | hackerrank.com/jobs | Challenge-based hiring |
| 7 | **GrepJob** | grepjob.com | High-paying tech companies |
| 8 | **Software Tech Jobs** | softwaretechjobs.com | US/Canada |
| 9 | **Full-Stack Developer Jobs** | fullstackjob.com | Full-stack specific |
| 10 | **EmbeddedJobs** | embedded.jobs | Embedded systems |

### 7.2 By Programming Language / Framework

| Language/Framework | Board | URL |
|--------------------|-------|-----|
| Python | pyJobs | pyjobs.com |
| Python | Python Job Board | python.org/jobs |
| Python | PythonJobsHQ | pythonjobshq.com |
| JavaScript | Jobs in JS | jobsinjs.com |
| TypeScript | TypeScript Jobs | typescriptjobs.net |
| Go | Golangprojects | golangprojects.com |
| Go | Golang Cafe | golang.cafe |
| Rust | Rust Jobs | rust-jobs.com |
| Ruby | Ruby on Rails Jobs | ruby-on-rails-jobs.com |
| PHP/Laravel | LaraJobs | larajobs.com |
| Elixir | Elixir Jobs | elixirjobs.net |
| React | React Job Board | reactjobboard.com |
| React Native | React Native Jobs | reactnative-jobs.com |
| Vue | Vue.js Jobs | vuejobs.com |
| Angular | Angular Jobs | angularjobs.com |
| iOS | iOS Dev Jobs | iosdevjobs.com |
| Android | androidDev.careers | androiddev.careers |
| Django | Django Jobs | djangojobs.net |
| Scala | Scala Jobs | scalajobs.com |

### 7.3 AI & Machine Learning

| # | Platform | URL | Notes |
|---|----------|-----|-------|
| 1 | **AI Jobs (moai)** | moaijobs.com | AI companies, filter by role |
| 2 | **AI/ML Jobs** | aimljobs.fyi | AI companies + startups, daily updates |
| 3 | **AI Jobs** | ai-jobs.net | Broad AI job board |
| 4 | **AI Tech Suite** | aitechsuite.com/jobs | 5k+ AI jobs |
| 5 | **ExploreJobs.ai** | explorejobs.ai | Top AI startups |

### 7.4 Data Science & Analytics

| # | Platform | URL |
|---|----------|-----|
| 1 | **DataJobs** | datajobs.com |
| 2 | **KDnuggets** | kdnuggets.com/jobs |
| 3 | **DataScienceJobs** | datasciencejobs.com |
| 4 | **Data Engineering Jobs** | dataengjobs.com |
| 5 | **icrunchdata** | icrunchdata.com |
| 6 | **Data Yoshi** | datayoshi.com |
| 7 | **StatsJobs** | statsjobs.com |
| 8 | **Dataaxy** | dataaxy.com |

### 7.5 Design (UX/UI/Graphic)

| # | Platform | URL |
|---|----------|-----|
| 1 | **Dribbble** | dribbble.com/jobs |
| 2 | **Behance** | behance.net/joblist |
| 3 | **AIGA** | designjobs.aiga.org |
| 4 | **Coroflot** | coroflot.com/design-jobs |
| 5 | **UX Jobs Board** | uxjobsboard.com |
| 6 | **UI & UX Designer Jobs** | uiuxdesignerjobs.com |
| 7 | **Design Jobs Board** | designjobsboard.com |
| 8 | **Krop** | krop.com |
| 9 | **CreativeMornings** | creativemornings.com/jobs |

### 7.6 Cybersecurity / InfoSec

| # | Platform | URL |
|---|----------|-----|
| 1 | **NinjaJobs** | ninjajobs.org |
| 2 | **infosec-jobs** | infosec-jobs.com |
| 3 | **CyberSecurityJobs** | cybersecurityjobs.net |
| 4 | **YesWeHack** | jobs.yeswehack.com |
| 5 | **CareersInfoSecurity** | careersinfosecurity.com |

### 7.7 Blockchain & Web3

| # | Platform | URL |
|---|----------|-----|
| 1 | **Crypto Jobs List** | cryptojobslist.com |
| 2 | **Web3 Jobs** | web3.career |
| 3 | **Remote3** | remote3.co |
| 4 | **CryptoJobs** | crypto.jobs |
| 5 | **Jobstash** | jobstash.xyz |

### 7.8 DevOps & Cloud

| # | Platform | URL |
|---|----------|-----|
| 1 | **Kube Careers** | kube.careers |
| 2 | **CNCF Job Board** | jobs.cncf.io |

### 7.9 Finance & Quantitative

| # | Platform | URL |
|---|----------|-----|
| 1 | **eFinancialCareers** | efinancialcareers.com |
| 2 | **OpenQuant** | openquant.co |

### 7.10 Healthcare

| # | Platform | URL |
|---|----------|-----|
| 1 | **Health eCareers** | healthecareers.com |

### 7.11 Sustainability & Climate

| # | Platform | URL |
|---|----------|-----|
| 1 | **ClimateTechList** | climatetechlist.com |
| 2 | **Rejobs** | rejobs.org |
| 3 | **GreenLever** | greenlever.co |

### 7.12 Open Source

| # | Platform | URL |
|---|----------|-----|
| 1 | **FOSS Jobs** | fossjobs.net |
| 2 | **Fossfox** | fossfox.com |

### 7.13 QA & Testing

| # | Platform | URL |
|---|----------|-----|
| 1 | **QA Jobs** | qajobs.co |
| 2 | **testdevjobs** | testdevjobs.com |

---

## 8. Freelance & Contract Platforms

> Selected when `jobTypes includes "freelance" or "contract"`.

| # | Platform | URL | Type | Notes |
|---|----------|-----|------|-------|
| 1 | **Upwork** | upwork.com | Marketplace | Largest, all fields |
| 2 | **Toptal** | toptal.com | Vetted | Top 3%, high rates |
| 3 | **Fiverr** | fiverr.com | Gig | Task-based |
| 4 | **Freelancer** | freelancer.com | Marketplace | Competitive bidding |
| 5 | **Gun.io** | gun.io | Vetted | Developers only |
| 6 | **Guru** | guru.com | Marketplace | All fields |
| 7 | **PeoplePerHour** | peopleperhour.com | Marketplace | UK-based |
| 8 | **YunoJuno** | yunojuno.com | Vetted | UK creative/tech |

---

## 9. Regional Boards

### United States
| Platform | URL |
|----------|-----|
| US.jobs | us.jobs |
| DallasJobs | dallasjobs.io |
| Built In (by city) | builtin.com |

### Canada
| Platform | URL |
|----------|-----|
| WorkInTech.ca | workintech.ca |
| Jobboom | jobboom.com |
| Jobbank (Gov) | jobbank.gc.ca |
| MapleStack | maplestack.ca |

### United Kingdom
| Platform | URL |
|----------|-----|
| reed.co.uk | reed.co.uk |
| CV-Library | cv-library.co.uk |
| CWJobs | cwjobs.co.uk |
| DevITjobs UK | devitjobs.uk |
| Jobsite | jobsite.co.uk |
| Hunt UK Visa Sponsors | huntukvisasponsors.com |
| UK Visa Jobs | ukvisajobs.com |

### Germany
| Platform | URL |
|----------|-----|
| GermanTechJobs | germantechjobs.de |
| Berlin Startup Jobs | berlinstartupjobs.com |
| StepStone | stepstone.de |
| Jobware | jobware.de |

### Netherlands
| Platform | URL |
|----------|-----|
| Jobs in Amsterdam | jobinamsterdam.com |
| Together Abroad | togetherabroad.nl |

### Poland
| Platform | URL |
|----------|-----|
| Just Join IT | justjoin.it |
| Bulldogjob | bulldogjob.com |
| Crossweb | crossweb.pl |

### Switzerland
| Platform | URL |
|----------|-----|
| SwissDevJobs | swissdevjobs.ch |
| WeJob.ch | wejob.ch |

### Denmark
| Platform | URL |
|----------|-----|
| DanishTech | danishtech.co |
| Jobindex | jobindex.dk |

### Australia
| Platform | URL |
|----------|-----|
| SEEK | seek.com.au |
| CareerOne | careerone.com.au |

### UAE
| Platform | URL |
|----------|-----|
| RemoteDXB | remotedxb.com |
| Zero Tax Jobs | zerotaxjobs.com |

### India
| Platform | URL |
|----------|-----|
| Naukri | naukri.com |

### LATAM
| Platform | URL |
|----------|-----|
| hiring.lat | hiring.lat |
| Findjobit | findjobit.com |

---

## 10. Meta-Aggregators & Search Tools

These search across multiple boards. Use as supplementary discovery:

| # | Platform | URL | What It Aggregates |
|---|----------|-----|-------------------|
| 1 | **Google Jobs** | google.com (search "X jobs") | Company sites, Indeed, LinkedIn, etc. |
| 2 | **JobBoardSearch** | jobboardsearch.com | Search engine for job boards themselves |
| 3 | **whoishiring.io** | whoishiring.io | Hacker News hiring threads |
| 4 | **HNHIRING** | hnhiring.com | HN Who's Hiring, searchable |
| 5 | **HiringCafe** | hiring.cafe | AI-powered aggregator |
| 6 | **Jobright.ai** | jobright.ai | AI matching aggregator |
| 7 | **Getwork** | getwork.com | Aggregates company career pages |
| 8 | **Joblift** | joblift.com | European aggregator |

---

## 11. Source Selection Algorithm

```typescript
function selectSources(profile: UserProfile): JobSource[] {
  const sources: JobSource[] = [];
  
  // 1. Always include general boards (JobSpy handles these)
  sources.push(...GENERAL_BOARDS); // Indeed, LinkedIn, Glassdoor, Google, ZipRecruiter
  
  // 2. Add specialty-specific boards
  const specialtyBoards = SPECIALTY_MAP[profile.specialty] || [];
  sources.push(...specialtyBoards);
  
  // 3. Add language/framework-specific boards (for tech specialties)
  if (isTechSpecialty(profile.specialty)) {
    for (const skill of profile.skills) {
      const langBoard = LANGUAGE_BOARDS[skill.toLowerCase()];
      if (langBoard) sources.push(langBoard);
    }
  }
  
  // 4. Add entry-level boards if applicable
  if (["student", "entry", "junior"].includes(profile.experienceLevel)) {
    sources.push(...ENTRY_LEVEL_BOARDS);
  }
  
  // 5. Add remote boards if preference is remote or any
  if (["remote", "any"].includes(profile.remotePreference)) {
    sources.push(...REMOTE_BOARDS);
  }
  
  // 6. Add startup boards if preference is startup
  if (profile.companySize === "startup") {
    sources.push(...STARTUP_BOARDS);
  }
  
  // 7. Add regional boards for target countries
  for (const location of profile.desiredLocations) {
    const country = extractCountry(location);
    const regionalBoards = REGIONAL_MAP[country] || [];
    sources.push(...regionalBoards);
  }
  
  // 8. Add freelance boards if applicable
  if (profile.jobTypes.includes("freelance") || profile.jobTypes.includes("contract")) {
    sources.push(...FREELANCE_BOARDS);
  }
  
  // Deduplicate
  return [...new Set(sources)];
}
```

---

## Implementation Notes

- **JobSpy sources** (Indeed, LinkedIn, Glassdoor, Google, ZipRecruiter) are scraped automatically
- **Manual sources** are presented to the user as a curated list of links with pre-filled search URLs
- The `/jobs` page has a "More Sources" section showing relevant manual boards for the user's profile
- Each source has a pre-built search URL template: `https://example.com/search?q={role}&l={location}`
- Sources are stored in a TypeScript constant map in `src/lib/sources.ts`, not in the database

---

## References

- Primary source: [awesome-job-boards](https://github.com/emredurukn/awesome-job-boards) (913 stars)
- Supplemented with research from [GitHub Topics: job-search](https://github.com/topics/job-search) (788 repos)
- JobSpy supported sites: [speedyapply/JobSpy](https://github.com/speedyapply/JobSpy)
- Regional boards verified via direct site visits (March 2026)
