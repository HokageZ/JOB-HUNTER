import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { ApiResponse, ApplicationRow, JobRow } from "@/types";

export interface ApplicationWithJob extends ApplicationRow {
  job_title: string;
  job_company: string | null;
  job_url: string;
  city: string | null;
  state: string | null;
  is_remote: number;
  overall_score: number | null;
}

export async function GET(
  request: Request
): Promise<NextResponse<ApiResponse<ApplicationWithJob[]>>> {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = `
      SELECT
        a.*,
        j.title AS job_title,
        j.company AS job_company,
        j.job_url,
        j.city,
        j.state,
        j.is_remote,
        ms.overall_score
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN match_scores ms ON j.id = ms.job_id
    `;
    const params: string[] = [];

    if (status) {
      query += " WHERE a.status = ?";
      params.push(status);
    }

    query += " ORDER BY a.updated_at DESC";

    const rows = db.prepare(query).all(...params) as ApplicationWithJob[];

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    logger.error("api:applications", "GET error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

const createApplicationSchema = z.object({
  jobId: z.number().int().positive(),
  status: z.enum(["saved", "applied"]).default("saved"),
  notes: z.string().optional(),
  coverLetter: z.string().optional(),
});

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<ApplicationRow>>> {
  try {
    const db = getDb();
    const body = await request.json();
    const parsed = createApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { jobId, status, notes, coverLetter } = parsed.data;

    // Check job exists
    const job = db
      .prepare("SELECT id, company, title FROM jobs WHERE id = ?")
      .get(jobId) as Pick<JobRow, "id" | "company" | "title"> | undefined;

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if application already exists for this job
    const existing = db
      .prepare("SELECT id FROM applications WHERE job_id = ?")
      .get(jobId) as { id: number } | undefined;

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Application already exists for this job" },
        { status: 409 }
      );
    }

    const appliedDate = status === "applied" ? new Date().toISOString() : null;

    const result = db
      .prepare(
        `INSERT INTO applications (job_id, status, applied_date, notes, cover_letter)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(jobId, status, appliedDate, notes ?? null, coverLetter ?? null);

    const applicationId = Number(result.lastInsertRowid);

    // If applied, set follow-up reminder for 7 days
    if (status === "applied") {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 7);
      const followUpISO = followUpDate.toISOString();

      db.prepare(
        "UPDATE applications SET follow_up_date = ? WHERE id = ?"
      ).run(followUpISO, applicationId);

      db.prepare(
        `INSERT INTO reminders (application_id, reminder_date, message)
         VALUES (?, ?, ?)`
      ).run(
        applicationId,
        followUpISO,
        `Follow up on your application to ${job.company ?? job.title}`
      );
    }

    const created = db
      .prepare("SELECT * FROM applications WHERE id = ?")
      .get(applicationId) as ApplicationRow;

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    logger.error("api:applications", "POST error", error);
    return NextResponse.json(
      { success: false, error: "Failed to create application" },
      { status: 500 }
    );
  }
}
