import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const db = getDb();

    // Total jobs (not dismissed)
    const totalJobs =
      (
        db
          .prepare("SELECT count(*) as c FROM jobs WHERE is_dismissed = 0")
          .get() as { c: number }
      ).c;

    // Applications sent (not "saved")
    const applicationsSent =
      (
        db
          .prepare(
            "SELECT count(*) as c FROM applications WHERE status != 'saved'"
          )
          .get() as { c: number }
      ).c;

    // Response rate
    const responseRate =
      (
        db
          .prepare(
            `SELECT
              CAST(count(CASE WHEN status IN ('screening','interview','offer') THEN 1 END) AS FLOAT) /
              NULLIF(count(CASE WHEN status != 'saved' THEN 1 END), 0) * 100
              as rate
            FROM applications`
          )
          .get() as { rate: number | null }
      ).rate ?? 0;

    // Interview count
    const interviews =
      (
        db
          .prepare(
            "SELECT count(*) as c FROM applications WHERE status = 'interview'"
          )
          .get() as { c: number }
      ).c;

    // Offers
    const offers =
      (
        db
          .prepare(
            "SELECT count(*) as c FROM applications WHERE status = 'offer'"
          )
          .get() as { c: number }
      ).c;

    // Application funnel
    const funnel = db
      .prepare(
        `SELECT status, count(*) as count
         FROM applications
         WHERE status NOT IN ('saved')
         GROUP BY status
         ORDER BY CASE status
           WHEN 'applied' THEN 1
           WHEN 'screening' THEN 2
           WHEN 'interview' THEN 3
           WHEN 'offer' THEN 4
           WHEN 'rejected' THEN 5
           WHEN 'withdrawn' THEN 6
         END`
      )
      .all() as { status: string; count: number }[];

    // Weekly application counts (last 8 weeks)
    const weeklyApps = db
      .prepare(
        `SELECT
          strftime('%Y-W%W', applied_date) as week,
          count(*) as count
         FROM applications
         WHERE applied_date IS NOT NULL
           AND applied_date >= datetime('now', '-56 days')
         GROUP BY week
         ORDER BY week ASC`
      )
      .all() as { week: string; count: number }[];

    // Overdue/upcoming reminders
    const reminders = db
      .prepare(
        `SELECT r.*, a.status as app_status,
                j.title as job_title, j.company as job_company,
                CASE WHEN r.reminder_date < datetime('now') THEN 1 ELSE 0 END as is_overdue
         FROM reminders r
         JOIN applications a ON r.application_id = a.id
         JOIN jobs j ON a.job_id = j.id
         WHERE r.is_completed = 0
         ORDER BY r.reminder_date ASC
         LIMIT 10`
      )
      .all() as {
      id: number;
      reminder_date: string;
      message: string;
      job_title: string;
      job_company: string | null;
      is_overdue: number;
    }[];

    // Recent recommended jobs (top 5 by score, not saved/applied)
    const recommendations = db
      .prepare(
        `SELECT j.id, j.title, j.company, j.city, j.state, j.is_remote,
                j.salary_min, j.salary_max, j.salary_currency,
                ms.overall_score
         FROM jobs j
         JOIN match_scores ms ON j.id = ms.job_id
         LEFT JOIN applications a ON j.id = a.job_id
         WHERE j.is_dismissed = 0 AND a.id IS NULL
         ORDER BY ms.overall_score DESC
         LIMIT 5`
      )
      .all() as {
      id: number;
      title: string;
      company: string | null;
      city: string | null;
      state: string | null;
      is_remote: number;
      salary_min: number | null;
      salary_max: number | null;
      salary_currency: string | null;
      overall_score: number;
    }[];

    // Saved count
    const saved =
      (
        db
          .prepare(
            "SELECT count(*) as c FROM applications WHERE status = 'saved'"
          )
          .get() as { c: number }
      ).c;

    return NextResponse.json({
      success: true,
      data: {
        totalJobs,
        applicationsSent,
        responseRate: Math.round(responseRate * 10) / 10,
        interviews,
        offers,
        saved,
        funnel,
        weeklyApps,
        reminders,
        recommendations,
      },
    });
  } catch (error) {
    logger.error("api:stats", "GET error", error);
    return NextResponse.json(
      { success: false, error: "Failed to load stats" },
      { status: 500 }
    );
  }
}
