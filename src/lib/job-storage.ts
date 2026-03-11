import { getDb } from "@/lib/db";
import { jobHash } from "@/lib/dedup";
import type { ScrapedJob } from "@/lib/scraper";

interface LocationParts {
  city: string | null;
  state: string | null;
  country: string | null;
}

function parseLocation(location: string | null): LocationParts {
  if (!location) return { city: null, state: null, country: null };

  const parts = location.split(",").map((p) => p.trim());

  if (parts.length >= 3) {
    return { city: parts[0], state: parts[1], country: parts[2] };
  }
  if (parts.length === 2) {
    return { city: parts[0], state: parts[1], country: null };
  }
  return { city: parts[0], state: null, country: null };
}

export interface InsertResult {
  newJobs: number;
  duplicatesSkipped: number;
  insertedIds: number[];
}

export function insertScrapedJobs(
  jobs: ScrapedJob[],
  source?: string
): InsertResult {
  const db = getDb();
  let newJobs = 0;
  let duplicatesSkipped = 0;
  const insertedIds: number[] = [];

  const insertStmt = db.prepare(`
    INSERT INTO jobs (
      external_id, source, hash, title, company, company_url, job_url,
      city, state, country, is_remote, description, job_type,
      salary_min, salary_max, salary_interval, salary_currency,
      date_posted, skills
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?
    )
  `);

  const checkStmt = db.prepare("SELECT id FROM jobs WHERE hash = ?");

  const insertAll = db.transaction(() => {
    for (const job of jobs) {
      if (!job.title || !job.job_url) continue;

      const loc = parseLocation(job.location ?? null);
      const hash = jobHash(
        job.title ?? "",
        job.company ?? "",
        loc.city ?? "",
        loc.state ?? ""
      );

      // Check for duplicate
      const existing = checkStmt.get(hash);
      if (existing) {
        duplicatesSkipped++;
        continue;
      }

      insertStmt.run(
        job.id ?? null,
        source ?? job.site ?? "unknown",
        hash,
        job.title,
        job.company ?? null,
        job.company_url ?? null,
        job.job_url,
        loc.city,
        loc.state,
        loc.country,
        job.is_remote ? 1 : 0,
        job.description ?? null,
        job.job_type ?? null,
        job.min_amount ?? null,
        job.max_amount ?? null,
        job.interval ?? null,
        job.currency ?? null,
        job.date_posted ?? null,
        null // skills extracted later by matching engine
      );

      const info = db.prepare("SELECT last_insert_rowid() as id").get() as { id: number };
      insertedIds.push(info.id);
      newJobs++;
    }
  });

  insertAll();

  return { newJobs, duplicatesSkipped, insertedIds };
}
