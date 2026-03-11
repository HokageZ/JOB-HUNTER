import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import type { ApiResponse } from "@/types";

const dismissSchema = z.object({
  jobId: z.number().int().positive(),
});

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<{ dismissed: boolean }>>> {
  try {
    const body = await request.json();
    const parsed = dismissSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const db = getDb();
    const result = db
      .prepare("UPDATE jobs SET is_dismissed = 1 WHERE id = ?")
      .run(parsed.data.jobId);

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { dismissed: true },
    });
  } catch (err) {
    console.error("[/api/jobs/dismiss] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to dismiss job" },
      { status: 500 }
    );
  }
}
