# 12 - Agent Skills: Recommended Skills for the Coding Agent

> Lists all discovered agent skills from the skills.sh ecosystem that the coding agent should install before starting implementation. These skills provide domain-specific knowledge, best practices, and patterns for every technology in our stack.

---

## 1. Why Install Skills?

Agent skills are modular packages that inject specialized knowledge into the coding agent's context. Instead of relying on general training data (which may be outdated), skills provide:

- **Current API docs** for specific libraries
- **Best practices** vetted by framework maintainers
- **Common pitfalls** and how to avoid them
- **Code patterns** specific to our exact stack

**Install skills BEFORE starting any coding work.**

---

## 2. How to Install

```bash
# Install a single skill globally
npx skills add <owner/repo@skill> -g -y

# List installed skills
npx skills list

# Check for updates
npx skills check

# Update all installed skills
npx skills update
```

The `-g` flag installs user-level (available across projects). The `-y` flag skips confirmation.

---

## 3. Required Skills (Install All of These)

These skills directly map to our tech stack and should ALL be installed before coding begins.

### 3.1 Next.js App Router (CRITICAL)

Our entire frontend and API layer is Next.js 15 with App Router.

| Skill | Installs | Install Command |
|-------|----------|----------------|
| **nextjs-app-router-patterns** | 7,700 | `npx skills add wshobson/agents@nextjs-app-router-patterns -g -y` |
| **nextjs-app-router-fundamentals** | 1,600 | `npx skills add wsimmonds/claude-nextjs-skills@nextjs-app-router-fundamentals -g -y` |
| **nextjs** (jezweb) | 1,000 | `npx skills add jezweb/claude-skills@nextjs -g -y` |

**Why:** Next.js 15 App Router has significant differences from Pages Router (which older training data defaults to). These skills ensure correct usage of Server Components, `route.ts` API handlers, `layout.tsx` nesting, `loading.tsx`, `error.tsx`, metadata API, and the `use client` directive.

**Relevant to:** P0 (skeleton), P1 (profile wizard), P3 (job feed), P5 (tracker), and every page.

### 3.2 OpenRouter API (CRITICAL)

Our AI layer uses OpenRouter exclusively. The official skill is essential.

| Skill | Installs | Install Command |
|-------|----------|----------------|
| **openrouter-typescript-sdk** | 902 | `npx skills add openrouterteam/agent-skills@openrouter-typescript-sdk -g -y` |
| **create-agent** (OpenRouter) | 1,800 | `npx skills add openrouterteam/agent-skills@create-agent -g -y` |

**Why:** OpenRouter's API differs from OpenAI's in key ways (model routing, free tier limits, provider preferences, fallback models). The official skill provides the correct TypeScript SDK usage, model selection, error handling, and rate limit management.

**Relevant to:** P4 (match reasoning), P6 (resume review), P7 (AI chat), P8 (cover letters), P9 (interview prep).

### 3.3 shadcn/ui Components (CRITICAL)

Our entire UI component layer is shadcn/ui.

| Skill | Installs | Install Command |
|-------|----------|----------------|
| **shadcn-ui-expert** | 301 | `npx skills add majesteitbart/talentmatcher@shadcn-ui-expert -g -y` |
| **shadcn-ui** (bobmatnyc) | 213 | `npx skills add bobmatnyc/claude-mpm-skills@shadcn-ui -g -y` |
| **using-shadcn-ui** | 14 | `npx skills add nilecui/skillsbase@using-shadcn-ui -g -y` |

**Why:** shadcn/ui is NOT a component library you `npm install` — it's a code-generation CLI (`npx shadcn@latest add button`). Components are copied into `src/components/ui/`. The skill ensures the agent uses `npx shadcn@latest init` and `npx shadcn@latest add <component>` correctly, and knows all available primitives (Button, Input, Dialog, Select, Card, Toast, Tabs, Table, Badge, etc.).

**Relevant to:** Every page — all UI is built on shadcn/ui primitives.

### 3.4 Tailwind CSS (CRITICAL)

All styling uses Tailwind CSS utility classes.

| Skill | Installs | Install Command |
|-------|----------|----------------|
| **tailwindcss** (blencorp) | 41 | `npx skills add blencorp/claude-code-kit@tailwindcss -g -y` |
| **tailwind** (oakoss) | 30 | `npx skills add oakoss/agent-skills@tailwind -g -y` |

**Why:** Ensures correct Tailwind class naming, responsive breakpoints (`sm:`, `md:`, `lg:`), dark mode (`dark:` variant), arbitrary values, and proper `tailwind.config.ts` extension. Prevents the agent from writing custom CSS when Tailwind classes exist.

**Relevant to:** Every component and page.

### 3.5 SQLite / better-sqlite3 (CRITICAL)

Our database is SQLite accessed via better-sqlite3.

| Skill | Installs | Install Command |
|-------|----------|----------------|
| **sqlite-database-expert** | 467 | `npx skills add martinholovsky/claude-skills-generator@sqlite-database-expert -g -y` |

**Why:** `better-sqlite3` is synchronous (unlike most DB drivers). The agent needs to know: `db.prepare().run()`, `db.prepare().get()`, `db.prepare().all()`, `db.pragma()`, transaction handling, and WAL mode. This skill prevents async/await mistakes with the synchronous API.

**Relevant to:** P0 (DB setup), P1 (profile storage), P2 (job storage), P4 (match scores), P5 (applications), and all data operations.

### 3.6 Zod Validation (HIGH)

All API request/response validation uses Zod.

| Skill | Installs | Install Command |
|-------|----------|----------------|
| **zod** | 107 | `npx skills add secondsky/claude-skills@zod -g -y` |

**Why:** Every API route must validate incoming request bodies with Zod schemas. The skill provides patterns for `z.object()`, `z.enum()`, `z.coerce`, `.parse()` vs `.safeParse()`, and error formatting for our `{ success: false, error: "..." }` response contract.

**Relevant to:** Every API route (P1-P12).

---

## 4. Recommended Skills (Install for Specific Tasks)

These skills help with specific features. Install them when working on the corresponding priority.

### 4.1 Drag & Drop / Kanban (for P5: Application Tracker)

| Skill | Installs | Install Command |
|-------|----------|----------------|
| **implementing-drag-drop** | 90 | `npx skills add ancoleman/ai-design-components@implementing-drag-drop -g -y` |
| **drag-and-drop** (wodsmith) | 28 | `npx skills add wodsmith/thewodapp@drag-and-drop -g -y` |

**Why:** The kanban board needs drag-and-drop between columns. These skills cover `@dnd-kit/core` or native HTML drag events, both valid approaches for our use case.

**Relevant to:** P5 (Application Tracker kanban board).

### 4.2 Web Scraping (for P2: Python Scraper)

| Skill | Installs | Install Command |
|-------|----------|----------------|
| **web-scraping-automation** | 167 | `npx skills add aaaaqwq/claude-code-skills@web-scraping-automation -g -y` |

**Why:** While our scraper is Python-based (python-jobspy), this skill provides context on scraping best practices: rate limiting, proxy rotation, error handling, and anti-detection — all relevant when configuring JobSpy parameters.

**Relevant to:** P2 (Python scraper integration).

### 4.3 Document Parsing (for P6: Resume Upload)

| Skill | Installs | Install Command |
|-------|----------|----------------|
| **document-parsers** | 15 | `npx skills add vanman2024/ai-dev-marketplace@document-parsers -g -y` |

**Why:** Resume upload requires PDF and DOCX parsing. This skill covers document extraction patterns.

**Relevant to:** P6 (Resume upload + AI review).

### 4.4 AI/LLM Integration Patterns (for P4, P7-P9)

| Skill | Installs | Install Command |
|-------|----------|----------------|
| **ai-engineer-expert** | 55 | `npx skills add personamanagmentlayer/pcl@ai-engineer-expert -g -y` |

**Why:** Provides patterns for prompt engineering, response parsing, streaming, retries, and token management — all needed for our OpenRouter integration across match reasoning, chat, cover letters, and interview prep.

**Relevant to:** P4 (match scoring), P7 (AI chat), P8 (cover letters), P9 (interview prep).

---

## 5. Installation Script

Run this single block to install ALL required and recommended skills:

```bash
# === REQUIRED (install all before coding) ===

# Next.js App Router
npx skills add wshobson/agents@nextjs-app-router-patterns -g -y
npx skills add wsimmonds/claude-nextjs-skills@nextjs-app-router-fundamentals -g -y
npx skills add jezweb/claude-skills@nextjs -g -y

# OpenRouter (official)
npx skills add openrouterteam/agent-skills@openrouter-typescript-sdk -g -y
npx skills add openrouterteam/agent-skills@create-agent -g -y

# shadcn/ui
npx skills add majesteitbart/talentmatcher@shadcn-ui-expert -g -y
npx skills add bobmatnyc/claude-mpm-skills@shadcn-ui -g -y

# Tailwind CSS
npx skills add blencorp/claude-code-kit@tailwindcss -g -y

# SQLite
npx skills add martinholovsky/claude-skills-generator@sqlite-database-expert -g -y

# Zod
npx skills add secondsky/claude-skills@zod -g -y

# === RECOMMENDED (install for specific tasks) ===

# Drag & Drop (for P5)
npx skills add ancoleman/ai-design-components@implementing-drag-drop -g -y

# Web Scraping (for P2)
npx skills add aaaaqwq/claude-code-skills@web-scraping-automation -g -y

# Document Parsing (for P6)
npx skills add vanman2024/ai-dev-marketplace@document-parsers -g -y

# AI/LLM Patterns (for P4, P7-P9)
npx skills add personamanagmentlayer/pcl@ai-engineer-expert -g -y
```

---

## 6. Skills-to-Priority Mapping

Quick reference: which skills matter for which implementation priority.

| Priority | Feature | Required Skills | Recommended Skills |
|----------|---------|----------------|--------------------|
| **P0** | Project skeleton | nextjs-app-router-patterns, shadcn-ui-expert, tailwindcss, sqlite-database-expert | - |
| **P1** | Profile wizard | nextjs-app-router-patterns, shadcn-ui-expert, zod, sqlite-database-expert | - |
| **P2** | Python scraper | nextjs-app-router-fundamentals | web-scraping-automation |
| **P3** | Job feed | nextjs-app-router-patterns, shadcn-ui-expert, tailwindcss | - |
| **P4** | Match scoring | openrouter-typescript-sdk, sqlite-database-expert | ai-engineer-expert |
| **P5** | Application tracker | shadcn-ui-expert, tailwindcss | implementing-drag-drop |
| **P6** | Resume review | openrouter-typescript-sdk, zod | document-parsers |
| **P7** | AI chat | openrouter-typescript-sdk, create-agent | ai-engineer-expert |
| **P8** | Cover letters | openrouter-typescript-sdk | ai-engineer-expert |
| **P9** | Interview prep | openrouter-typescript-sdk | ai-engineer-expert |
| **P10** | Dashboard stats | shadcn-ui-expert, tailwindcss, sqlite-database-expert | - |
| **P11** | Settings/export | nextjs-app-router-patterns, shadcn-ui-expert, zod | - |
| **P12** | Scheduled scraping | nextjs-app-router-fundamentals | web-scraping-automation |

---

## 7. Skill Verification

After installing, verify skills are loaded:

```bash
# List all installed skills
npx skills list

# Expected output should show 14 skills installed
```

If a skill fails to install (network issue, repo moved), skip it and proceed — the agent can still code without skills, they just provide optimization.

---

## 8. Keeping Skills Updated

Skills are versioned and may receive updates as libraries evolve:

```bash
# Check for available updates
npx skills check

# Update all installed skills
npx skills update
```

Run `npx skills check` periodically, especially before starting a new priority phase.

---

## References

- Skills ecosystem: https://skills.sh/
- Skills CLI: `npx skills --help`
- All skills discovered via `npx skills find <query>` on 2026-03-10
