import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { chatJSON } from "@/lib/openrouter";
import { logger } from "@/lib/logger";
import type { JobRow } from "@/types";

interface TailoringResult {
  summary_rewrite: string;
  keyword_additions: {
    keyword: string;
    where_to_add: string;
  }[];
  bullet_rewrites: {
    section: string;
    original: string;
    tailored: string;
    reason: string;
  }[];
  section_reordering: string[];
  skills_to_highlight: string[];
  skills_to_add: string[];
  formatting_tips: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, resumeId } = body;

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

    // Load resume
    let resumeText = "";
    if (resumeId) {
      const resume = db
        .prepare("SELECT raw_text, parsed_data FROM resumes WHERE id = ?")
        .get(resumeId) as
        | { raw_text: string; parsed_data: string | null }
        | undefined;
      if (resume) {
        resumeText = resume.parsed_data || resume.raw_text || "";
      }
    } else {
      // Use default resume
      const resume = db
        .prepare(
          "SELECT raw_text, parsed_data FROM resumes WHERE is_default = 1 ORDER BY created_at DESC LIMIT 1"
        )
        .get() as
        | { raw_text: string; parsed_data: string | null }
        | undefined;
      if (resume) {
        resumeText = resume.parsed_data || resume.raw_text || "";
      }
    }

    if (!resumeText) {
      return NextResponse.json(
        {
          success: false,
          error: "No resume found. Upload a resume first.",
        },
        { status: 400 }
      );
    }

    const prompt = `You are an expert resume consultant. Given the user's current resume and a specific job description, provide precise, actionable suggestions to tailor the resume for maximum impact.

RULES:
- Do NOT fabricate skills or experience the user doesn't have
- Only suggest emphasizing or rephrasing existing qualifications
- Suggest adding relevant keywords from the JD that honestly apply
- Provide specific before/after examples for bullet rewrites
- Keep suggestions realistic and ethical

USER'S RESUME:
${resumeText.slice(0, 4000)}

JOB DESCRIPTION:
Title: ${job.title}
Company: ${job.company || "Unknown"}
${(job.description || "").slice(0, 3000)}

Return JSON (no markdown wrapping):
{
  "summary_rewrite": "A tailored summary/objective for this specific job...",
  "keyword_additions": [
    { "keyword": "example keyword", "where_to_add": "Which section to add it" }
  ],
  "bullet_rewrites": [
    {
      "section": "Experience section name",
      "original": "Original bullet text",
      "tailored": "Improved bullet text with keywords and metrics",
      "reason": "Why this change helps"
    }
  ],
  "section_reordering": ["Suggestion about section order"],
  "skills_to_highlight": ["skill1", "skill2"],
  "skills_to_add": ["skill user has but didn't list"],
  "formatting_tips": ["Formatting improvement suggestion"]
}`;

    const suggestions = await chatJSON<TailoringResult>(
      [{ role: "user", content: prompt }],
      { maxTokens: 2048, temperature: 0.5 }
    );

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    logger.error("api:tailor-resume", "Error", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to generate tailoring suggestions";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
