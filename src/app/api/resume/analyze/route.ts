import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { chatJSON } from "@/lib/openrouter";
import { logger } from "@/lib/logger";
import type { ApiResponse, ResumeRow, UserProfile } from "@/types";

const analyzeSchema = z.object({
  resumeId: z.number().int().positive(),
});

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<{ parsedData: unknown; aiReview: unknown; atsScore: number }>>> {
  try {
    const body = await request.json();
    const parsed = analyzeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const db = getDb();
    const resume = db
      .prepare("SELECT * FROM resumes WHERE id = ?")
      .get(parsed.data.resumeId) as ResumeRow | undefined;

    if (!resume) {
      return NextResponse.json(
        { success: false, error: "Resume not found" },
        { status: 404 }
      );
    }

    if (!resume.raw_text) {
      return NextResponse.json(
        { success: false, error: "Resume has no extracted text" },
        { status: 400 }
      );
    }

    // Load profile for context
    const profileRow = db
      .prepare("SELECT data FROM profile WHERE id = 1")
      .get() as { data: string } | undefined;

    const profile: UserProfile | null = profileRow
      ? JSON.parse(profileRow.data)
      : null;

    // Step 1: Structure extraction
    const extractionPrompt = `You are a resume parsing expert. Extract structured information from the following resume text.

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
      "bullets": ["Achievement/responsibility 1"]
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
${resume.raw_text}
---`;

    // Step 1: Structure extraction — best-effort
    let parsedData: unknown = null;
    try {
      parsedData = await chatJSON(
        [{ role: "user", content: extractionPrompt }],
        { maxTokens: 3000 }
      );
    } catch (extractErr) {
      logger.warn("api:resume-analyze", "Structure extraction failed, proceeding with analysis only", extractErr);
    }

    // Step 2: Comprehensive analysis
    const analysisPrompt = `You are an expert career advisor and resume reviewer. Analyze the following resume against the target profile and provide detailed, actionable feedback.

${profile ? `TARGET PROFILE:
- Desired roles: ${profile.desiredRoles.join(", ")}
- Experience level: ${profile.experienceLevel}
- Years of experience: ${profile.yearsOfExperience}
- Target skills: ${profile.skills.join(", ")}
- Location preference: ${profile.remotePreference}, ${profile.desiredLocations.join(", ")}` : "No target profile available — provide general resume feedback."}

${parsedData ? `PARSED RESUME:\n${JSON.stringify(parsedData, null, 2)}\n\n` : ""}RAW RESUME TEXT:
${resume.raw_text}

Provide your analysis as a JSON object with the following structure:

{
  "atsScore": 75,
  "overallAssessment": "2-3 sentence summary",
  "strengths": [
    {
      "category": "Experience | Skills | Education | Formatting | Achievements",
      "finding": "Specific strength",
      "impact": "Why this matters"
    }
  ],
  "weaknesses": [
    {
      "category": "Category",
      "finding": "Specific weakness",
      "suggestion": "Concrete fix",
      "priority": "high | medium | low"
    }
  ],
  "missingKeywords": [
    {
      "keyword": "Keyword",
      "reason": "Why important",
      "whereToAdd": "Where to add it"
    }
  ],
  "sectionFeedback": {
    "summary": { "exists": true, "score": 70, "feedback": "...", "rewriteSuggestion": "..." },
    "experience": { "score": 80, "feedback": "...", "weakBullets": [{ "original": "...", "improved": "..." }] },
    "skills": { "score": 65, "feedback": "...", "suggestion": "..." },
    "education": { "score": 90, "feedback": "..." },
    "projects": { "exists": false, "feedback": "..." }
  },
  "formattingIssues": ["issue1", "issue2"],
  "tailoringTips": [
    {
      "targetRole": "Role",
      "adjustments": ["tip1", "tip2"]
    }
  ]
}

Be specific and constructive. Every piece of feedback must include a concrete action.
Do NOT fabricate experience or skills not present in the resume.`;

    const aiReview = await chatJSON<{ atsScore: number }>(
      [{ role: "user", content: analysisPrompt }],
      { maxTokens: 4000 }
    );

    const atsScore = aiReview.atsScore ?? 0;

    // Save results
    db.prepare(
      `UPDATE resumes SET parsed_data = ?, ai_review = ?, ats_score = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      JSON.stringify(parsedData),
      JSON.stringify(aiReview),
      atsScore,
      parsed.data.resumeId
    );

    return NextResponse.json({
      success: true,
      data: { parsedData, aiReview, atsScore },
    });
  } catch (error) {
    logger.error("api:resume-analyze", "Error", error);
    return NextResponse.json(
      {
        success: false,
        error: "AI review unavailable. Your resume has been saved and can be analyzed later.",
      },
      { status: 500 }
    );
  }
}
