import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { ApiResponse, JobRow, MatchScoreRow, ApplicationRow } from "@/types";

interface JobDetail {
  job: JobRow;
  matchScore: MatchScoreRow | null;
  application: ApplicationRow | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<JobDetail>>> {
  try {
    const { id } = await params;
    const jobId = Number(id);
    if (isNaN(jobId)) {
      return NextResponse.json(
        { success: false, error: "Invalid job ID" },
        { status: 400 }
      );
    }

    const db = getDb();

    const job = db
      .prepare("SELECT * FROM jobs WHERE id = ?")
      .get(jobId) as JobRow | undefined;

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    const matchScore = (db
      .prepare("SELECT * FROM match_scores WHERE job_id = ?")
      .get(jobId) as MatchScoreRow | undefined) ?? null;

    const application = (db
      .prepare("SELECT * FROM applications WHERE job_id = ?")
      .get(jobId) as ApplicationRow | undefined) ?? null;

    return NextResponse.json({
      success: true,
      data: { job, matchScore, application },
    });
  } catch (err) {
    logger.error("api:jobs", "Detail error", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}
