import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { chatWithRetry } from "@/lib/openrouter";
import type { ApplicationRow } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, interviewerName, topicsDiscussed } = body;

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "applicationId is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    const app = db
      .prepare(
        `SELECT a.*, j.title, j.company
         FROM applications a
         JOIN jobs j ON a.job_id = j.id
         WHERE a.id = ?`
      )
      .get(applicationId) as
      | (ApplicationRow & { title: string; company: string | null })
      | undefined;

    if (!app) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    // Load user name from profile
    const profileRow = db
      .prepare("SELECT data FROM profile WHERE id = 1")
      .get() as { data: string } | undefined;

    let userName = "Your Name";
    if (profileRow) {
      try {
        const p = JSON.parse(profileRow.data);
        userName = p.fullName || "Your Name";
      } catch {
        // use default
      }
    }

    const prompt = `Write a brief thank-you email for a job interview.

Interviewer name: ${interviewerName || "the team"}
Company: ${app.company || "the company"}
Role: ${app.title}
Interview topics discussed: ${topicsDiscussed || "the role and team"}

Rules:
- Keep it under 150 words
- Reference something specific from the conversation
- Reiterate interest in the role
- Professional but warm tone
- No cliches
- Include a subject line starting with "Subject: "
- Sign off with the candidate name: ${userName}`;

    const email = await chatWithRetry(
      [{ role: "user", content: prompt }],
      { maxTokens: 512, temperature: 0.7 }
    );

    // Mark thank you as sent
    db.prepare(
      "UPDATE interview_prep SET thank_you_sent = 1, updated_at = datetime('now') WHERE application_id = ?"
    ).run(applicationId);

    return NextResponse.json({
      success: true,
      data: { email },
    });
  } catch (error) {
    console.error("[ai/thank-you] Error:", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to generate thank-you email";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
