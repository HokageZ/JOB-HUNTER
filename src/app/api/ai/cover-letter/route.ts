import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { chatWithRetry } from "@/lib/openrouter";
import type { JobRow } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const jobId = body.jobId;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "jobId is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Load job
    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId) as
      | JobRow
      | undefined;
    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Load profile
    const profileRow = db
      .prepare("SELECT data FROM profile WHERE id = 1")
      .get() as { data: string } | undefined;

    let profileContext = {
      name: "Job Seeker",
      currentTitle: "",
      yearsOfExperience: "",
      skills: "",
    };

    if (profileRow) {
      try {
        const p = JSON.parse(profileRow.data);
        profileContext = {
          name: p.fullName || "Job Seeker",
          currentTitle: p.currentTitle || p.desiredRoles?.[0] || "",
          yearsOfExperience: String(p.yearsOfExperience ?? ""),
          skills: (p.skills || []).join(", "),
        };
      } catch {
        // use defaults
      }
    }

    // Load default resume text if available
    const resume = db
      .prepare(
        "SELECT raw_text FROM resumes WHERE is_default = 1 ORDER BY created_at DESC LIMIT 1"
      )
      .get() as { raw_text: string } | undefined;

    const resumeContext = resume?.raw_text
      ? `\nUSER'S KEY EXPERIENCE (from resume):\n${resume.raw_text.slice(0, 2000)}`
      : "";

    // Build requirements summary
    const requirements = [
      job.job_level && `Level: ${job.job_level}`,
      job.skills && `Skills: ${job.skills}`,
      job.job_type && `Type: ${job.job_type}`,
    ]
      .filter(Boolean)
      .join(", ");

    const prompt = `Write a professional cover letter for this specific job application. 

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
- Name: ${profileContext.name}
- Current role: ${profileContext.currentTitle}
- Years of experience: ${profileContext.yearsOfExperience}
- Top skills: ${profileContext.skills}
${resumeContext}

JOB:
- Title: ${job.title}
- Company: ${job.company || "Unknown Company"}
- Key requirements: ${requirements || "See description"}
- Description: ${(job.description || "").slice(0, 3000)}

Write the cover letter:`;

    const coverLetter = await chatWithRetry(
      [{ role: "user", content: prompt }],
      { maxTokens: 1024, temperature: 0.7 }
    );

    return NextResponse.json({
      success: true,
      data: { coverLetter },
    });
  } catch (error) {
    console.error("[ai/cover-letter] Error:", error);
    const msg =
      error instanceof Error ? error.message : "Failed to generate cover letter";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
