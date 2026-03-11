import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { calculateMatchScore } from "@/lib/matching";
import { generateMatchReasons } from "@/lib/match-reasoning";
import { logger } from "@/lib/logger";
import type { UserProfile, JobRow, ApiResponse, MatchResult } from "@/types";

const matchRequestSchema = z.object({
  jobIds: z.array(z.number()).optional(),
  regenerate: z.boolean().optional().default(false),
});

interface MatchResponse {
  scored: number;
  recommended: number;
}

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<MatchResponse>>> {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = matchRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { jobIds, regenerate } = parsed.data;

    const db = getDb();

    // Load profile
    const profileRow = db
      .prepare("SELECT data FROM profile WHERE id = 1")
      .get() as { data: string } | undefined;

    if (!profileRow) {
      return NextResponse.json(
        { success: false, error: "No profile found. Create a profile first." },
        { status: 400 }
      );
    }

    const profile = JSON.parse(profileRow.data) as UserProfile;

    // Get target jobs
    let jobs: JobRow[];
    if (jobIds && jobIds.length > 0) {
      const placeholders = jobIds.map(() => "?").join(",");
      if (regenerate) {
        jobs = db
          .prepare(`SELECT * FROM jobs WHERE id IN (${placeholders})`)
          .all(...jobIds) as JobRow[];
      } else {
        jobs = db
          .prepare(
            `SELECT * FROM jobs WHERE id IN (${placeholders}) AND id NOT IN (SELECT job_id FROM match_scores)`
          )
          .all(...jobIds) as JobRow[];
      }
    } else {
      if (regenerate) {
        jobs = db.prepare("SELECT * FROM jobs").all() as JobRow[];
      } else {
        jobs = db
          .prepare(
            "SELECT * FROM jobs WHERE id NOT IN (SELECT job_id FROM match_scores)"
          )
          .all() as JobRow[];
      }
    }

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        data: { scored: 0, recommended: 0 },
      });
    }

    // Score all jobs
    const upsertStmt = db.prepare(`
      INSERT INTO match_scores (job_id, overall_score, skill_score, experience_score, location_score, salary_score, job_type_score, recency_score, reasoning, is_recommended)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(job_id) DO UPDATE SET
        overall_score = excluded.overall_score,
        skill_score = excluded.skill_score,
        experience_score = excluded.experience_score,
        location_score = excluded.location_score,
        salary_score = excluded.salary_score,
        job_type_score = excluded.job_type_score,
        recency_score = excluded.recency_score,
        reasoning = COALESCE(excluded.reasoning, match_scores.reasoning),
        is_recommended = excluded.is_recommended,
        created_at = datetime('now')
    `);

    const scoredJobs: { job: JobRow; result: MatchResult }[] = [];
    let recommended = 0;

    const insertAll = db.transaction(() => {
      for (const job of jobs) {
        const result = calculateMatchScore(profile, job);
        scoredJobs.push({ job, result });

        if (result.isRecommended) recommended++;

        upsertStmt.run(
          job.id,
          result.overallScore,
          result.skillScore,
          result.experienceScore,
          result.locationScore,
          result.salaryScore,
          result.jobTypeScore,
          result.recencyScore,
          null, // reasoning filled by AI below
          result.isRecommended ? 1 : 0
        );
      }
    });

    insertAll();

    // Generate AI reasoning for recommended jobs (best effort)
    try {
      const reasons = await generateMatchReasons(profile, scoredJobs);
      if (reasons.size > 0) {
        const updateReasonStmt = db.prepare(
          "UPDATE match_scores SET reasoning = ? WHERE job_id = ?"
        );
        const updateAll = db.transaction(() => {
          for (const [jobId, reason] of reasons) {
            updateReasonStmt.run(reason, jobId);
          }
        });
        updateAll();
      }
    } catch {
      logger.warn("api:match", "AI reasoning skipped (API unavailable)");
    }

    return NextResponse.json({
      success: true,
      data: { scored: jobs.length, recommended },
    });
  } catch (err) {
    logger.error("api:match", "Error", err);
    const message = err instanceof Error ? err.message : "Match scoring failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
