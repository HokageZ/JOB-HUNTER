# 08 - Application Tracking & Follow-Up System

> Defines how the kanban board works, how application statuses are managed, and how the follow-up reminder system operates.

---

## 1. Application Lifecycle

Every job goes through this lifecycle from the user's perspective:

```
                    ┌──────────┐
          ┌────────>│ WITHDRAWN│
          │         └──────────┘
          │
┌──────┐  │  ┌─────────┐  ┌───────────┐  ┌───────────┐  ┌───────┐
│ SAVED├──┼─>│ APPLIED ├─>│ SCREENING ├─>│ INTERVIEW ├─>│ OFFER │
└──────┘  │  └────┬────┘  └─────┬─────┘  └─────┬─────┘  └───────┘
          │       │             │               │
          │       v             v               v
          │  ┌──────────┐ ┌──────────┐   ┌──────────┐
          └─>│ REJECTED │ │ REJECTED │   │ REJECTED │
             │(no reply)│ │(screened)│   │(after int)│
             └──────────┘ └──────────┘   └──────────┘
```

### Status Definitions

| Status | Meaning | Auto-Actions |
|--------|---------|-------------|
| **Saved** | User bookmarked the job, hasn't applied yet | None |
| **Applied** | User submitted an application | Set follow-up reminder (7 days) |
| **Screening** | Heard back from company, in initial review | Set follow-up reminder (5 days) |
| **Interview** | Scheduled or completed an interview | Log interview date, set follow-up |
| **Offer** | Received an offer | Prompt for salary details, compare |
| **Rejected** | Didn't move forward (at any stage) | Log rejection reason if known |
| **Withdrawn** | User decided not to continue | Log reason |

---

## 2. Kanban Board Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Application Tracker                              [Filter ▼] [Stats 📊]    │
├───────────┬───────────┬───────────┬───────────┬───────────┬────────────────┤
│  Saved    │  Applied  │ Screening │ Interview │  Offer    │   Archived     │
│  (12)     │  (8)      │  (3)      │  (2)      │  (1)      │   (15)         │
├───────────┼───────────┼───────────┼───────────┼───────────┼────────────────┤
│           │           │           │           │           │                │
│ ┌───────┐ │ ┌───────┐ │ ┌───────┐ │ ┌───────┐ │ ┌───────┐ │ ┌────────────┐│
│ │Acme   │ │ │Beta   │ │ │Delta  │ │ │Foxtrot│ │ │Hotel  │ │ │Rejected(12)││
│ │Corp   │ │ │Inc    │ │ │Labs   │ │ │AI     │ │ │Tech   │ │ │Withdrawn(3)││
│ │FE Eng │ │ │FS Dev │ │ │ML Eng │ │ │Sr Dev │ │ │Lead   │ │ └────────────┘│
│ │85%    │ │ │72%    │ │ │68%    │ │ │90%    │ │ │78%    │ │                │
│ │       │ │ │⏰ 2d  │ │ │⏰ tmrw│ │ │📅 3/15│ │ │💰comp │ │                │
│ └───────┘ │ └───────┘ │ └───────┘ │ └───────┘ │ └───────┘ │                │
│ ┌───────┐ │ ┌───────┐ │ ┌───────┐ │ ┌───────┐ │           │                │
│ │Gamma  │ │ │Epsilon│ │ │Gulf   │ │ │India  │ │           │                │
│ │Tech   │ │ │VC     │ │ │Sys    │ │ │Corp   │ │           │                │
│ └───────┘ │ └───────┘ │ └───────┘ │ └───────┘ │           │                │
│   ...     │    ...    │           │           │           │                │
└───────────┴───────────┴───────────┴───────────┴───────────┴────────────────┘
```

### Card Content

Each card shows:
- Company name
- Job title (truncated)
- Match score (colored badge)
- Follow-up indicator (⏰ if follow-up is due/overdue)
- Interview date (📅 if scheduled)
- Salary (💰 if offer stage)

### Interactions
- **Drag & drop** between columns to change status
- **Click** to open detail panel
- **Right-click** for quick actions (archive, add note, set reminder)

---

## 3. Application Detail Panel

When clicking a card, a side panel opens:

```
┌──────────────────────────────────────────────┐
│ Senior Frontend Engineer                  [X]│
│ Acme Corp · San Francisco · Remote OK        │
│ Match: 85%  │  Status: Applied  │  Applied: 3/5│
├──────────────────────────────────────────────┤
│                                              │
│ Timeline                                     │
│ ─────────────────────────────────────────    │
│ 📌 3/5  - Applied via company website        │
│ ⏰ 3/12 - Follow-up due                      │
│                                              │
│ Notes                               [+ Add]  │
│ ─────────────────────────────────────────    │
│ "Applied through referral from John. He's    │
│  on the team and said they're hiring fast."   │
│                                              │
│ Resume Used: resume_v3_tailored.pdf          │
│ Cover Letter: [View] [Edit]                  │
│                                              │
│ Actions                                      │
│ ─────────────────────────────────────────    │
│ [Update Status ▼]  [Set Reminder]            │
│ [Prep for Interview]  [View Job Posting]     │
│ [Archive]  [Delete]                          │
│                                              │
│ Job Description                    [Expand ▼]│
│ ─────────────────────────────────────────    │
│ We're looking for a Senior Frontend...       │
└──────────────────────────────────────────────┘
```

---

## 4. Follow-Up Reminder System

### 4.1 Automatic Reminders

| Trigger | Reminder Set For | Message |
|---------|-----------------|---------|
| Status changed to "Applied" | 7 days later | "Follow up on your application to {company}" |
| Status changed to "Screening" | 5 days later | "Check in on screening progress at {company}" |
| Interview completed | 2 days later | "Send a thank-you note to {company}" |
| Offer received | 3 days later | "Review and respond to offer from {company}" |

### 4.2 Custom Reminders

Users can set custom reminders from the detail panel:

```typescript
interface Reminder {
  id: number;
  applicationId: number;
  reminderDate: string;       // ISO date
  message: string;
  isCompleted: boolean;
  createdAt: string;
}
```

### 4.3 Dashboard Follow-Up Widget

The dashboard shows upcoming and overdue follow-ups:

```
Upcoming Follow-Ups
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 OVERDUE (2)
   Beta Inc - FS Developer (3 days overdue)
   Epsilon VC - Backend Eng (1 day overdue)

🟡 DUE TODAY (1)
   Delta Labs - ML Engineer

🟢 UPCOMING (3)
   Gulf Systems - DevOps (in 2 days)
   Foxtrot AI - Sr Developer (in 4 days)
   India Corp - Tech Lead (in 6 days)
```

---

## 5. Statistics & Analytics

### 5.1 Dashboard Stats

| Metric | Calculation |
|--------|------------|
| **Total Jobs Found** | Count of all jobs in database |
| **Applications Sent** | Count of applications with status != 'saved' |
| **Response Rate** | (screening + interview + offer) / applied * 100 |
| **Interview Rate** | (interview + offer) / applied * 100 |
| **Offer Rate** | offer / applied * 100 |
| **Active Applications** | applied + screening + interview |
| **Avg. Days to Response** | Average days between applied_date and first status change |

### 5.2 Funnel Visualization

```
Applications Funnel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Applied        ████████████████████████  48
Screening      ████████████░░░░░░░░░░░░  12  (25%)
Interview      ██████░░░░░░░░░░░░░░░░░░   6  (12.5%)
Offer          ██░░░░░░░░░░░░░░░░░░░░░░   2  (4.2%)
```

### 5.3 Weekly Activity Chart

```
Applications per Week (last 8 weeks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
W1  ████████  8
W2  ██████████████  14
W3  ████████████  12
W4  ██████  6
W5  ██████████████████  18
W6  ████████████████  16
W7  ██████████  10
W8  ████████████  12
```

---

## 6. Database Schema

```sql
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'saved',
    -- saved, applied, screening, interview, offer, rejected, withdrawn
  applied_date TEXT,
  resume_file TEXT,              -- filename of resume used
  cover_letter TEXT,             -- full text of cover letter
  notes TEXT,                    -- freeform notes (JSON array of note objects)
  rejection_reason TEXT,         -- if rejected, why (if known)
  salary_offered TEXT,           -- if offer stage, salary details
  follow_up_date TEXT,           -- next follow-up reminder date
  interview_dates TEXT,          -- JSON array of interview date strings
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  reminder_date TEXT NOT NULL,
  message TEXT NOT NULL,
  is_completed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_app_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_app_follow_up ON applications(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_reminder_date ON reminders(reminder_date);
```

---

## 7. Status Transition Rules

```typescript
const VALID_TRANSITIONS: Record<string, string[]> = {
  'saved':      ['applied', 'withdrawn'],
  'applied':    ['screening', 'interview', 'rejected', 'withdrawn'],
  'screening':  ['interview', 'rejected', 'withdrawn'],
  'interview':  ['offer', 'rejected', 'withdrawn'],
  'offer':      ['withdrawn'],  // Offer is a terminal positive state
  'rejected':   [],              // Terminal state
  'withdrawn':  [],              // Terminal state
};

function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

---

## 8. Data Export

Users can export their tracking data from `/settings`:

### CSV Export

```csv
Company,Title,Status,Applied Date,Match Score,Salary Range,Location,Follow-Up,Notes
Acme Corp,Senior Frontend Engineer,applied,2026-03-05,85,$130k-170k,San Francisco,2026-03-12,"Referred by John"
Beta Inc,Full Stack Developer,screening,2026-03-01,72,$100k-140k,Remote,2026-03-08,""
```

### JSON Export

Full data dump including all notes, cover letters, and timeline entries.

---

## Implementation Notes

- Kanban board built with **drag-and-drop** using a lightweight library (e.g., `@dnd-kit/core`) or native HTML drag events
- **Status changes are optimistic** -- update UI immediately, persist to SQLite async
- **Notes are stored as a JSON array** within the `notes` column for simplicity
- **Follow-up checking** runs on page load: query `WHERE follow_up_date <= datetime('now') AND status IN ('applied', 'screening', 'interview')`
- **No email notifications** (localhost tool) -- reminders are shown in-app on dashboard
- **Archived applications** (rejected/withdrawn) are hidden from the kanban by default, shown in a separate "Archived" tab

---

## References

- Kanban board pattern inspired by [Trello](https://trello.com) and [job-ops](https://github.com/DaKheera47/job-ops)
- Application funnel metrics based on industry averages from [Jobvite Recruiter Nation Survey](https://www.jobvite.com/)
- Follow-up timing based on career coaching best practices
