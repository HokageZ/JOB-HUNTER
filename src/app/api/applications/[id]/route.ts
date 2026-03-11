import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { VALID_TRANSITIONS } from "@/types";
import type { ApiResponse, ApplicationRow, JobRow } from "@/types";

const AUTO_REMINDERS: Record<string, { days: number; message: (company: string) => string }> = {
  applied: {
    days: 7,
    message: (company) => `Follow up on your application to ${company}`,
  },
  screening: {
    days: 5,
    message: (company) => `Check in on screening progress at ${company}`,
  },
  interview: {
    days: 2,
    message: (company) => `Send a thank-you note to ${company}`,
  },
  offer: {
    days: 3,
    message: (company) => `Review and respond to offer from ${company}`,
  },
};

const updateApplicationSchema = z.object({
  status: z.string().optional(),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
  salaryOffered: z.string().optional(),
  followUpDate: z.string().optional(),
  interviewDates: z.array(z.string()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ApplicationRow>>> {
  try {
    const db = getDb();
    const { id } = await params;
    const appId = parseInt(id, 10);

    if (isNaN(appId)) {
      return NextResponse.json(
        { success: false, error: "Invalid application ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = db
      .prepare(
        `SELECT a.*, j.company, j.title AS job_title
         FROM applications a JOIN jobs j ON a.job_id = j.id
         WHERE a.id = ?`
      )
      .get(appId) as (ApplicationRow & { company: string | null; job_title: string }) | undefined;

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    const updates = parsed.data;

    // Validate status transition
    if (updates.status && updates.status !== existing.status) {
      const allowed = VALID_TRANSITIONS[existing.status];
      if (!allowed || !allowed.includes(updates.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot transition from "${existing.status}" to "${updates.status}"`,
          },
          { status: 400 }
        );
      }
    }

    // Build dynamic update
    const sets: string[] = ["updated_at = datetime('now')"];
    const values: unknown[] = [];

    if (updates.status) {
      sets.push("status = ?");
      values.push(updates.status);

      if (updates.status === "applied" && !existing.applied_date) {
        sets.push("applied_date = ?");
        values.push(new Date().toISOString());
      }
    }

    if (updates.notes !== undefined) {
      sets.push("notes = ?");
      values.push(updates.notes);
    }
    if (updates.rejectionReason !== undefined) {
      sets.push("rejection_reason = ?");
      values.push(updates.rejectionReason);
    }
    if (updates.salaryOffered !== undefined) {
      sets.push("salary_offered = ?");
      values.push(updates.salaryOffered);
    }
    if (updates.followUpDate !== undefined) {
      sets.push("follow_up_date = ?");
      values.push(updates.followUpDate);
    }
    if (updates.interviewDates !== undefined) {
      sets.push("interview_dates = ?");
      values.push(JSON.stringify(updates.interviewDates));
    }

    values.push(appId);

    db.prepare(`UPDATE applications SET ${sets.join(", ")} WHERE id = ?`).run(
      ...values
    );

    // Create auto-reminder for new status
    if (updates.status && updates.status in AUTO_REMINDERS) {
      const reminder = AUTO_REMINDERS[updates.status];
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + reminder.days);
      const company = existing.company ?? existing.job_title;

      db.prepare(
        `INSERT INTO reminders (application_id, reminder_date, message)
         VALUES (?, ?, ?)`
      ).run(appId, reminderDate.toISOString(), reminder.message(company));

      // Also update follow_up_date on the application
      db.prepare(
        "UPDATE applications SET follow_up_date = ? WHERE id = ?"
      ).run(reminderDate.toISOString(), appId);
    }

    const updated = db
      .prepare("SELECT * FROM applications WHERE id = ?")
      .get(appId) as ApplicationRow;

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.error("api:applications", "PATCH error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update application" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const db = getDb();
    const { id } = await params;
    const appId = parseInt(id, 10);

    if (isNaN(appId)) {
      return NextResponse.json(
        { success: false, error: "Invalid application ID" },
        { status: 400 }
      );
    }

    const existing = db
      .prepare("SELECT id FROM applications WHERE id = ?")
      .get(appId);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    // Cascade will handle reminders
    db.prepare("DELETE FROM applications WHERE id = ?").run(appId);

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    logger.error("api:applications", "DELETE error", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete application" },
      { status: 500 }
    );
  }
}
