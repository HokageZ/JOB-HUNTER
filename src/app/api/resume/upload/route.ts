import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { parseResume } from "@/lib/resume-parser";
import { logger } from "@/lib/logger";
import type { ApiResponse, ResumeRow } from "@/types";
import path from "path";
import fs from "fs";

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<ResumeRow>>> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = ALLOWED_TYPES[file.type];
    if (!fileType) {
      return NextResponse.json(
        { success: false, error: "Supported formats: PDF, DOCX, TXT, PNG, JPG, WEBP" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File must be under 10MB" },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save file with timestamp prefix
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${timestamp}_${safeName}`;
    const filePath = path.join(uploadsDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Parse resume text
    let rawText = "";
    try {
      rawText = await parseResume(filePath, fileType);
    } catch {
      return NextResponse.json(
        { success: false, error: "Could not read this file. Please try a different file." },
        { status: 400 }
      );
    }

    const wordCount = rawText.trim().split(/\s+/).length;

    // Insert into database
    const db = getDb();
    const result = db
      .prepare(
        `INSERT INTO resumes (file_name, file_path, file_type, file_size, raw_text)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(file.name, fileName, fileType, file.size, rawText);

    const resumeId = Number(result.lastInsertRowid);

    // Check if this is the first resume — make it default
    const count = db
      .prepare("SELECT count(*) as c FROM resumes")
      .get() as { c: number };
    if (count.c === 1) {
      db.prepare("UPDATE resumes SET is_default = 1 WHERE id = ?").run(resumeId);
    }

    const created = db
      .prepare("SELECT * FROM resumes WHERE id = ?")
      .get(resumeId) as ResumeRow;

    const response: ApiResponse<ResumeRow & { wordCount: number; warning?: string }> = {
      success: true,
      data: {
        ...created,
        wordCount,
        ...(wordCount < 50
          ? { warning: "This doesn't look like a full resume. Upload your complete resume for a thorough review." }
          : {}),
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    logger.error("api:resume-upload", "Upload error", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload resume" },
      { status: 500 }
    );
  }
}
