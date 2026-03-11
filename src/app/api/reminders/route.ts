import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import type { ApiResponse, ReminderRow } from "@/types";

export interface ReminderWithContext extends ReminderRow {
  job_title: string | null;
  job_company: string | null;
  app_status: string;
  is_overdue: number;
}

export async function GET(): Promise<
  NextResponse<ApiResponse<ReminderWithContext[]>>
> {
  try {
    const db = getDb();

    const rows = db
      .prepare(
        `SELECT
          r.*,
          j.title AS job_title,
          j.company AS job_company,
          a.status AS app_status,
          CASE WHEN r.reminder_date <= datetime('now') AND r.is_completed = 0 THEN 1 ELSE 0 END AS is_overdue
        FROM reminders r
        JOIN applications a ON r.application_id = a.id
        JOIN jobs j ON a.job_id = j.id
        WHERE r.is_completed = 0
        ORDER BY r.reminder_date ASC`
      )
      .all() as ReminderWithContext[];

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("[reminders GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}

const createReminderSchema = z.object({
  applicationId: z.number().int().positive(),
  reminderDate: z.string().min(1),
  message: z.string().min(1),
});

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<ReminderRow>>> {
  try {
    const db = getDb();
    const body = await request.json();
    const parsed = createReminderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { applicationId, reminderDate, message } = parsed.data;

    // Verify application exists
    const app = db
      .prepare("SELECT id FROM applications WHERE id = ?")
      .get(applicationId);
    if (!app) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    const result = db
      .prepare(
        `INSERT INTO reminders (application_id, reminder_date, message) VALUES (?, ?, ?)`
      )
      .run(applicationId, reminderDate, message);

    const created = db
      .prepare("SELECT * FROM reminders WHERE id = ?")
      .get(Number(result.lastInsertRowid)) as ReminderRow;

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("[reminders POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}
