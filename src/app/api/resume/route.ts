import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { ApiResponse, ResumeRow } from "@/types";

export async function GET(): Promise<NextResponse<ApiResponse<ResumeRow[]>>> {
  try {
    const db = getDb();
    const resumes = db
      .prepare(
        "SELECT * FROM resumes ORDER BY is_default DESC, created_at DESC"
      )
      .all() as ResumeRow[];

    return NextResponse.json({ success: true, data: resumes });
  } catch (error) {
    logger.error("api:resume", "GET error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch resumes" },
      { status: 500 }
    );
  }
}
