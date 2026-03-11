import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { ApiResponse, ResumeRow } from "@/types";
import fs from "fs";
import path from "path";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ResumeRow>>> {
  try {
    const { id } = await params;
    const resumeId = parseInt(id, 10);
    if (isNaN(resumeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid resume ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const db = getDb();

    // Set as default
    if (body.is_default === true) {
      db.prepare("UPDATE resumes SET is_default = 0").run();
      db.prepare("UPDATE resumes SET is_default = 1 WHERE id = ?").run(resumeId);
      logger.info("api:resume", `Set resume ${resumeId} as default`);
    }

    const updated = db
      .prepare("SELECT * FROM resumes WHERE id = ?")
      .get(resumeId) as ResumeRow | undefined;

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Resume not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.error("api:resume", "PATCH error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update resume" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ deleted: true }>>> {
  try {
    const { id } = await params;
    const resumeId = parseInt(id, 10);
    if (isNaN(resumeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid resume ID" },
        { status: 400 }
      );
    }

    const db = getDb();
    const resume = db
      .prepare("SELECT * FROM resumes WHERE id = ?")
      .get(resumeId) as ResumeRow | undefined;

    if (!resume) {
      return NextResponse.json(
        { success: false, error: "Resume not found" },
        { status: 404 }
      );
    }

    // Delete the file from disk
    if (resume.file_path) {
      const filePath = path.join(process.cwd(), "uploads", resume.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    db.prepare("DELETE FROM resumes WHERE id = ?").run(resumeId);

    // If this was the default, set the next one as default
    if (resume.is_default === 1) {
      const next = db
        .prepare("SELECT id FROM resumes ORDER BY created_at DESC LIMIT 1")
        .get() as { id: number } | undefined;
      if (next) {
        db.prepare("UPDATE resumes SET is_default = 1 WHERE id = ?").run(next.id);
      }
    }

    logger.info("api:resume", `Deleted resume ${resumeId} (${resume.file_name})`);

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    logger.error("api:resume", "DELETE error", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete resume" },
      { status: 500 }
    );
  }
}
