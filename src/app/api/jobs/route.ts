import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { ApiResponse } from "@/types";

interface JobWithScore {
  id: number;
  external_id: string | null;
  source: string;
  title: string;
  company: string | null;
  company_url: string | null;
  job_url: string;
  city: string | null;
  state: string | null;
  country: string | null;
  is_remote: number;
  description: string | null;
  job_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_interval: string | null;
  salary_currency: string | null;
  date_posted: string | null;
  date_scraped: string;
  skills: string | null;
  is_dismissed: number;
  overall_score: number | null;
  is_recommended: number | null;
}

interface JobsListResponse {
  jobs: JobWithScore[];
  total: number;
  page: number;
  totalPages: number;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<JobsListResponse>>> {
  try {
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const search = searchParams.get("search")?.trim() || "";
    const source = searchParams.get("source")?.trim() || "";
    const minScore = Number(searchParams.get("minScore")) || 0;
    const isRemote = searchParams.get("isRemote");
    const jobType = searchParams.get("jobType")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "date";
    const showDismissed = searchParams.get("showDismissed") === "true";

    const db = getDb();
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (!showDismissed) {
      conditions.push("j.is_dismissed = 0");
    }

    if (search) {
      conditions.push("(j.title LIKE ? OR j.company LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (source) {
      conditions.push("j.source = ?");
      params.push(source);
    }

    if (minScore > 0) {
      conditions.push("COALESCE(m.overall_score, 0) >= ?");
      params.push(minScore);
    }

    if (isRemote === "true") {
      conditions.push("j.is_remote = 1");
    } else if (isRemote === "false") {
      conditions.push("j.is_remote = 0");
    }

    if (jobType) {
      conditions.push("j.job_type = ?");
      params.push(jobType);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    let orderClause: string;
    switch (sortBy) {
      case "score":
        orderClause = "ORDER BY COALESCE(m.overall_score, 0) DESC, j.date_scraped DESC";
        break;
      case "salary":
        orderClause = "ORDER BY COALESCE(j.salary_max, j.salary_min, 0) DESC, j.date_scraped DESC";
        break;
      case "date":
      default:
        orderClause = "ORDER BY j.date_scraped DESC";
        break;
    }

    const offset = (page - 1) * limit;

    // Count total
    const countRow = db
      .prepare(
        `SELECT COUNT(*) as total
         FROM jobs j
         LEFT JOIN match_scores m ON m.job_id = j.id
         ${whereClause}`
      )
      .get(...params) as { total: number };

    const total = countRow.total;
    const totalPages = Math.ceil(total / limit);

    // Fetch page
    const jobs = db
      .prepare(
        `SELECT j.*, m.overall_score, m.is_recommended
         FROM jobs j
         LEFT JOIN match_scores m ON m.job_id = j.id
         ${whereClause}
         ${orderClause}
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as JobWithScore[];

    return NextResponse.json({
      success: true,
      data: { jobs, total, page, totalPages },
    });
  } catch (err) {
    logger.error("api:jobs", "Error", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
