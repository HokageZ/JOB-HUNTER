import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { profileSchema } from "@/lib/schemas/profile";
import { computeCompleteness } from "@/lib/profile-completeness";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const db = getDb();
    const row = db
      .prepare("SELECT data FROM profile WHERE id = 1")
      .get() as { data: string } | undefined;

    if (!row) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: JSON.parse(row.data) });
  } catch (error) {
    console.error("[profile] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = profileSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const profile = result.data;
    const now = new Date().toISOString();
    profile.updatedAt = now;
    if (!profile.createdAt) {
      profile.createdAt = now;
    }

    // Check if resume exists for completeness bonus
    const db = getDb();
    const resumeExists = db.prepare("SELECT id FROM resumes LIMIT 1").get();
    let completeness = computeCompleteness(profile);
    if (resumeExists) completeness = Math.min(completeness + 10, 100);
    profile.profileCompleteness = completeness;

    // Upsert profile
    db.prepare(
      "INSERT OR REPLACE INTO profile (id, data, completeness, updated_at) VALUES (1, ?, ?, datetime('now'))"
    ).run(JSON.stringify(profile), completeness);

    // Sync skills to profile_skills table
    db.prepare("DELETE FROM profile_skills").run();
    const insertSkill = db.prepare("INSERT OR IGNORE INTO profile_skills (skill) VALUES (?)");
    for (const skill of profile.skills) {
      insertSkill.run(skill);
    }

    // Write human-readable backup
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(
      path.join(dataDir, "profile.json"),
      JSON.stringify(profile, null, 2)
    );

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("[profile] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
