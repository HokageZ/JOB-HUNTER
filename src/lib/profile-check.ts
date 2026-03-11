import { getDb } from "@/lib/db";

export function hasProfile(): boolean {
  const db = getDb();
  const row = db.prepare("SELECT id FROM profile WHERE id = 1").get();
  return !!row;
}

export function getProfileCompleteness(): number {
  const db = getDb();
  const row = db
    .prepare("SELECT completeness FROM profile WHERE id = 1")
    .get() as { completeness: number } | undefined;
  return row?.completeness ?? 0;
}
