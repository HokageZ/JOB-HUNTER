import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import type { ApiResponse, ReminderRow } from "@/types";

const updateReminderSchema = z.object({
  isCompleted: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ReminderRow>>> {
  try {
    const db = getDb();
    const { id } = await params;
    const reminderId = parseInt(id, 10);

    if (isNaN(reminderId)) {
      return NextResponse.json(
        { success: false, error: "Invalid reminder ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateReminderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = db
      .prepare("SELECT id FROM reminders WHERE id = ?")
      .get(reminderId);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Reminder not found" },
        { status: 404 }
      );
    }

    db.prepare("UPDATE reminders SET is_completed = ? WHERE id = ?").run(
      parsed.data.isCompleted ? 1 : 0,
      reminderId
    );

    const updated = db
      .prepare("SELECT * FROM reminders WHERE id = ?")
      .get(reminderId) as ReminderRow;

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[reminders PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update reminder" },
      { status: 500 }
    );
  }
}
