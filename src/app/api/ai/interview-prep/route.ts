import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { chatJSON, chatWithRetry } from "@/lib/openrouter";
import type { JobRow, ApplicationRow } from "@/types";

interface InterviewPrepPackage {
  company_brief: Record<string, unknown>;
  technical_questions: {
    category: string;
    question: string;
    why_asked: string;
    key_points: string[];
    difficulty: string;
  }[];
  behavioral_questions: {
    question: string;
    why_asked: string;
    star_template: {
      situation: string;
      task: string;
      action: string;
      result: string;
    };
    tips: string;
  }[];
  questions_to_ask: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, interviewType, interviewDate } = body;

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "applicationId is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Load application + job
    const app = db
      .prepare(
        `SELECT a.*, j.title, j.company, j.description, j.skills, j.job_level, j.job_url, j.company_url
         FROM applications a
         JOIN jobs j ON a.job_id = j.id
         WHERE a.id = ?`
      )
      .get(applicationId) as
      | (ApplicationRow & {
          title: string;
          company: string | null;
          description: string | null;
          skills: string | null;
          job_level: string | null;
          job_url: string;
          company_url: string | null;
        })
      | undefined;

    if (!app) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    // Load profile
    const profileRow = db
      .prepare("SELECT data FROM profile WHERE id = 1")
      .get() as { data: string } | undefined;

    let profileContext = "";
    if (profileRow) {
      try {
        const p = JSON.parse(profileRow.data);
        const loc = p.location;
        const locationStr = loc
          ? [loc.city, loc.state, loc.country].filter(Boolean).join(", ")
          : "";
        profileContext = `
Candidate Profile:
- Experience Level: ${p.experienceLevel || "mid"}
- Years: ${p.yearsOfExperience ?? "?"}
- Skills: ${(p.skills || []).join(", ")}
- Tools: ${(p.tools || []).join(", ")}
- Certifications: ${(p.certifications || []).join(", ") || "None"}
- Desired Roles: ${(p.desiredRoles || []).join(", ")}
- Location: ${locationStr}
- Education: ${p.education?.level || ""} ${p.education?.field ? `in ${p.education.field}` : ""}`;
      } catch {
        // skip
      }
    }

    // Load default resume for grounding behavioral examples
    const resumeRow = db
      .prepare("SELECT raw_text FROM resumes WHERE is_default = 1 ORDER BY created_at DESC LIMIT 1")
      .get() as { raw_text: string } | undefined;

    const resumeContext = resumeRow?.raw_text
      ? `\nCandidate Resume (excerpt):\n${resumeRow.raw_text.slice(0, 1500)}`
      : "";

    // Check for existing prep
    const existing = db
      .prepare("SELECT * FROM interview_prep WHERE application_id = ?")
      .get(applicationId) as Record<string, unknown> | undefined;

    if (existing && existing.company_brief) {
      // Return cached prep
      return NextResponse.json({
        success: true,
        data: {
          id: existing.id,
          applicationId: existing.application_id,
          companyBrief: safeParseJSON(existing.company_brief as string),
          technicalQuestions: safeParseJSON(
            existing.technical_questions as string
          ),
          behavioralQuestions: safeParseJSON(
            existing.behavioral_questions as string
          ),
          questionsToAsk: safeParseJSON(existing.questions_to_ask as string),
          userNotes: existing.user_notes || "",
          interviewDate: existing.interview_date,
          interviewType: existing.interview_type,
          interviewerName: existing.interviewer_name,
          outcome: existing.outcome,
          thankYouSent: existing.thank_you_sent === 1,
        },
      });
    }

    const description = (app.description || "").slice(0, 3000);
    const skills = app.skills || "";
    const level = app.job_level || "mid";

    // Single combined AI prompt for all sections
    const prompt = `You are an expert interview coach. Generate a complete interview prep package.

JOB DETAILS:
- Title: ${app.title}
- Company: ${app.company || "Unknown Company"}
- Level: ${level}
- Skills: ${skills}
- Description: ${description}
${profileContext}
${resumeContext}

Generate ALL of the following in a single JSON response (no markdown wrapping):

{
  "company_brief": {
    "company_overview": "1-2 sentences about what the company does",
    "industry": "Primary industry",
    "culture_signals": ["Culture aspects from the JD"],
    "tech_stack": ["Technologies mentioned"],
    "interview_process": "General process if known, or null"
  },
  "technical_questions": [
    {
      "category": "fundamentals|system_design|coding|tech_specific|experience",
      "question": "The question",
      "why_asked": "Why this is relevant",
      "key_points": ["Key point 1", "Key point 2"],
      "difficulty": "easy|medium|hard"
    }
  ],
  "behavioral_questions": [
    {
      "question": "Tell me about a time...",
      "why_asked": "What this tests",
      "star_template": {
        "situation": "Prompt for situation",
        "task": "Prompt for task",
        "action": "Prompt for action",
        "result": "Prompt for result"
      },
      "tips": "Tips for answering"
    }
  ],
  "questions_to_ask": [
    "Question 1 to ask interviewer",
    "Question 2"
  ]
}

Generate exactly:
- 15 technical questions (3 per category: fundamentals, system_design, coding, tech_specific, experience)
- 10 behavioral questions covering leadership, conflict, failure, teamwork, problem-solving
- 8 questions to ask the interviewer

Tailor difficulty to ${level} level. Be specific to the role and tech stack.`;

    const prepPackage = await chatJSON<InterviewPrepPackage>(
      [{ role: "user", content: prompt }],
      { maxTokens: 4096, temperature: 0.6 }
    );

    // Save to DB
    if (existing) {
      db.prepare(
        `UPDATE interview_prep SET
          company_brief = ?, technical_questions = ?, behavioral_questions = ?,
          questions_to_ask = ?, interview_date = ?, interview_type = ?,
          updated_at = datetime('now')
         WHERE application_id = ?`
      ).run(
        JSON.stringify(prepPackage.company_brief),
        JSON.stringify(prepPackage.technical_questions),
        JSON.stringify(prepPackage.behavioral_questions),
        JSON.stringify(prepPackage.questions_to_ask),
        interviewDate || null,
        interviewType || null,
        applicationId
      );
    } else {
      db.prepare(
        `INSERT INTO interview_prep (application_id, company_brief, technical_questions, behavioral_questions, questions_to_ask, interview_date, interview_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        applicationId,
        JSON.stringify(prepPackage.company_brief),
        JSON.stringify(prepPackage.technical_questions),
        JSON.stringify(prepPackage.behavioral_questions),
        JSON.stringify(prepPackage.questions_to_ask),
        interviewDate || null,
        interviewType || null
      );
    }

    const row = db
      .prepare("SELECT * FROM interview_prep WHERE application_id = ?")
      .get(applicationId) as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      data: {
        id: row.id,
        applicationId: row.application_id,
        companyBrief: prepPackage.company_brief,
        technicalQuestions: prepPackage.technical_questions,
        behavioralQuestions: prepPackage.behavioral_questions,
        questionsToAsk: prepPackage.questions_to_ask,
        userNotes: "",
        interviewDate: row.interview_date,
        interviewType: row.interview_type,
        interviewerName: row.interviewer_name,
        outcome: row.outcome,
        thankYouSent: row.thank_you_sent === 1,
      },
    });
  } catch (error) {
    console.error("[ai/interview-prep] Error:", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to generate interview prep";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// PATCH - update notes, interviewer name, outcome, etc.
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, userNotes, interviewerName, outcome, interviewDate, interviewType } = body;

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "applicationId is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = db
      .prepare("SELECT id FROM interview_prep WHERE application_id = ?")
      .get(applicationId) as { id: number } | undefined;

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Interview prep not found" },
        { status: 404 }
      );
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (userNotes !== undefined) {
      updates.push("user_notes = ?");
      values.push(userNotes);
    }
    if (interviewerName !== undefined) {
      updates.push("interviewer_name = ?");
      values.push(interviewerName);
    }
    if (outcome !== undefined) {
      updates.push("outcome = ?");
      values.push(outcome);
    }
    if (interviewDate !== undefined) {
      updates.push("interview_date = ?");
      values.push(interviewDate);
    }
    if (interviewType !== undefined) {
      updates.push("interview_type = ?");
      values.push(interviewType);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    updates.push("updated_at = datetime('now')");
    values.push(applicationId);

    db.prepare(
      `UPDATE interview_prep SET ${updates.join(", ")} WHERE application_id = ?`
    ).run(...values);

    return NextResponse.json({
      success: true,
      data: { message: "Updated" },
    });
  } catch (error) {
    console.error("[ai/interview-prep] PATCH Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update interview prep" },
      { status: 500 }
    );
  }
}

function safeParseJSON(str: string | null): unknown {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
