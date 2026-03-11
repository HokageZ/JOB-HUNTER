import { getDb } from "@/lib/db";
import { scrapeJobs } from "@/lib/scraper";
import { generateSearchQueries } from "@/lib/query-generator";
import { shouldScrape, updateScrapeCache } from "@/lib/scrape-cache";
import { insertScrapedJobs } from "@/lib/job-storage";
import { calculateMatchScore } from "@/lib/matching";
import { logger } from "@/lib/logger";
import type { UserProfile, JobRow } from "@/types";

let schedulerRunning = false;
let intervalId: ReturnType<typeof setInterval> | null = null;

const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export function isSchedulerRunning(): boolean {
  return schedulerRunning;
}

export function getLastScrapeTime(): string | null {
  try {
    const db = getDb();
    const row = db
      .prepare(
        "SELECT MAX(last_scraped) as last_scraped FROM scrape_cache"
      )
      .get() as { last_scraped: string | null } | undefined;
    return row?.last_scraped ?? null;
  } catch {
    return null;
  }
}

export function startScheduler(intervalMs?: number) {
  if (schedulerRunning) return;
  schedulerRunning = true;

  const interval = intervalMs ?? DEFAULT_INTERVAL_MS;

  intervalId = setInterval(async () => {
    try {
      await scheduledScrape();
    } catch (error) {
      logger.error("scheduler", "Scheduled scrape error", error);
    }
  }, interval);

  logger.info("scheduler", `Started. Will scrape every ${Math.round(interval / 3_600_000)} hours.`);
}

export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  schedulerRunning = false;
  logger.info("scheduler", "Stopped.");
}

export async function scheduledScrape(): Promise<{
  newJobs: number;
  duplicatesSkipped: number;
  queriesRun: number;
}> {
  logger.info("scheduler", "Running scheduled scrape...");

  const db = getDb();
  const profileRow = db
    .prepare("SELECT data FROM profile WHERE id = 1")
    .get() as { data: string } | undefined;

  if (!profileRow) {
    logger.warn("scheduler", "No profile found. Skipping.");
    return { newJobs: 0, duplicatesSkipped: 0, queriesRun: 0 };
  }

  const profile = JSON.parse(profileRow.data) as UserProfile;
  const queries = generateSearchQueries(profile);

  let totalNew = 0;
  let totalDuplicates = 0;
  let queriesRun = 0;
  const allInsertedIds: number[] = [];

  for (const q of queries) {
    const loc =
      profile.desiredLocations?.[0] ||
      (profile.location?.city
        ? `${profile.location.city}, ${profile.location.state}`
        : "");

    const sites = ["indeed"];

    if (!shouldScrape(q.term, loc, sites)) {
      continue;
    }

    try {
      const results = await scrapeJobs({
        searchTerm: q.term,
        location: loc || undefined,
        sites,
        resultsWanted: 50,
        hoursOld: 72,
      });

      const { newJobs, duplicatesSkipped, insertedIds } =
        insertScrapedJobs(results);
      totalNew += newJobs;
      totalDuplicates += duplicatesSkipped;
      allInsertedIds.push(...insertedIds);
      queriesRun++;

      updateScrapeCache(q.term, loc, sites, results.length);
    } catch (error) {
      logger.error("scheduler", `Scrape failed for "${q.term}"`, error);
    }
  }

  // Auto-score new jobs
  if (allInsertedIds.length > 0) {
    try {
      const placeholders = allInsertedIds.map(() => "?").join(",");
      const newJobs = db
        .prepare(`SELECT * FROM jobs WHERE id IN (${placeholders})`)
        .all(...allInsertedIds) as JobRow[];

      const upsertStmt = db.prepare(`
        INSERT INTO match_scores (job_id, overall_score, skill_score, experience_score, location_score, salary_score, job_type_score, recency_score, is_recommended)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(job_id) DO UPDATE SET
          overall_score = excluded.overall_score,
          skill_score = excluded.skill_score,
          experience_score = excluded.experience_score,
          location_score = excluded.location_score,
          salary_score = excluded.salary_score,
          job_type_score = excluded.job_type_score,
          recency_score = excluded.recency_score,
          is_recommended = excluded.is_recommended,
          created_at = datetime('now')
      `);

      const scoreAll = db.transaction(() => {
        for (const job of newJobs) {
          const result = calculateMatchScore(profile, job);
          upsertStmt.run(
            job.id,
            result.overallScore,
            result.skillScore,
            result.experienceScore,
            result.locationScore,
            result.salaryScore,
            result.jobTypeScore,
            result.recencyScore,
            result.isRecommended ? 1 : 0
          );
        }
      });

      scoreAll();
    } catch (error) {
      logger.error("scheduler", "Auto-scoring failed", error);
    }
  }

  logger.info("scheduler", `Done. ${totalNew} new jobs, ${totalDuplicates} duplicates, ${queriesRun} queries.`);

  return {
    newJobs: totalNew,
    duplicatesSkipped: totalDuplicates,
    queriesRun,
  };
}
