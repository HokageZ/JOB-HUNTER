import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const format = body.format || "json";

    const db = getDb();

    if (format === "csv") {
      // Export applications as CSV
      const apps = db
        .prepare(
          `SELECT a.id, a.status, a.applied_date, a.notes, a.follow_up_date,
                  a.created_at, a.updated_at,
                  j.title, j.company, j.job_url, j.city, j.state, j.is_remote,
                  ms.overall_score
           FROM applications a
           JOIN jobs j ON a.job_id = j.id
           LEFT JOIN match_scores ms ON j.id = ms.job_id
           ORDER BY a.created_at DESC`
        )
        .all() as Record<string, unknown>[];

      if (apps.length === 0) {
        return NextResponse.json(
          { success: false, error: "No applications to export" },
          { status: 400 }
        );
      }

      const headers = Object.keys(apps[0]);
      const csvRows = [headers.join(",")];

      for (const row of apps) {
        const values = headers.map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = String(val);
          // Escape CSV values containing commas, quotes, or newlines
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        });
        csvRows.push(values.join(","));
      }

      const csv = csvRows.join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="applications-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // JSON export — dump all tables
    const profile = db.prepare("SELECT * FROM profile WHERE id = 1").get();
    const jobs = db.prepare("SELECT * FROM jobs ORDER BY id DESC").all();
    const applications = db
      .prepare("SELECT * FROM applications ORDER BY id DESC")
      .all();
    const matchScores = db
      .prepare("SELECT * FROM match_scores ORDER BY job_id DESC")
      .all();
    const resumes = db
      .prepare(
        "SELECT id, file_name, file_type, file_size, ats_score, is_default, created_at FROM resumes ORDER BY id DESC"
      )
      .all();
    const interviewPrep = db
      .prepare("SELECT * FROM interview_prep ORDER BY id DESC")
      .all();
    const chatHistory = db
      .prepare("SELECT * FROM chat_history ORDER BY id ASC")
      .all();

    const data = {
      exportedAt: new Date().toISOString(),
      profile,
      jobs,
      applications,
      matchScores,
      resumes,
      interviewPrep,
      chatHistory,
    };

    const json = JSON.stringify(data, null, 2);

    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="job-hunter-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    logger.error("api:export", "Error", error);
    return NextResponse.json(
      { success: false, error: "Failed to export data" },
      { status: 500 }
    );
  }
}
