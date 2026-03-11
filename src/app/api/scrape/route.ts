import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { scrapeJobs } from "@/lib/scraper";
import { generateSearchQueries } from "@/lib/query-generator";
import { shouldScrape, updateScrapeCache } from "@/lib/scrape-cache";
import { insertScrapedJobs } from "@/lib/job-storage";
import { calculateMatchScore } from "@/lib/matching";
import type { UserProfile, JobRow, ApiResponse } from "@/types";

const scrapeRequestSchema = z.object({
  searchTerm: z.string().min(1).optional(),
  location: z.string().optional(),
  sites: z.array(z.string()).optional().default(["indeed"]),
  resultsWanted: z.number().optional().default(50),
  hoursOld: z.number().optional().default(72),
  isRemote: z.boolean().optional(),
  jobType: z.string().optional(),
});

interface ScrapeResult {
  newJobs: number;
  duplicatesSkipped: number;
  queriesRun: number;
  queriesSkipped: number;
}

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<ScrapeResult>>> {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = scrapeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { searchTerm, location, sites, resultsWanted, hoursOld, isRemote, jobType } =
      parsed.data;

    // Load profile
    const db = getDb();
    const profileRow = db
      .prepare("SELECT data FROM profile WHERE id = 1")
      .get() as { data: string } | undefined;

    let profile: UserProfile | null = null;
    if (profileRow) {
      profile = JSON.parse(profileRow.data) as UserProfile;
    }

    // Build queries
    interface QueryItem {
      term: string;
      loc: string;
    }
    const queries: QueryItem[] = [];

    if (searchTerm) {
      queries.push({ term: searchTerm, loc: location ?? "" });
    } else if (profile) {
      const generated = generateSearchQueries(profile);
      for (const q of generated) {
        const loc =
          location ??
          (profile.desiredLocations?.[0] ||
            (profile.location?.city
              ? `${profile.location.city}, ${profile.location.state}`
              : ""));
        queries.push({ term: q.term, loc });
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            "No search term provided and no profile found. Create a profile first or provide a searchTerm.",
        },
        { status: 400 }
      );
    }

    let totalNew = 0;
    let totalDuplicates = 0;
    let queriesRun = 0;
    let queriesSkipped = 0;
    const allInsertedIds: number[] = [];

    for (const query of queries) {
      // Check cache
      if (!shouldScrape(query.term, query.loc, sites)) {
        queriesSkipped++;
        continue;
      }

      const results = await scrapeJobs({
        searchTerm: query.term,
        location: query.loc || undefined,
        sites,
        resultsWanted,
        hoursOld,
        isRemote,
        jobType,
      });

      const { newJobs, duplicatesSkipped, insertedIds } = insertScrapedJobs(results);
      totalNew += newJobs;
      totalDuplicates += duplicatesSkipped;
      allInsertedIds.push(...insertedIds);
      queriesRun++;

      // Update cache
      updateScrapeCache(query.term, query.loc, sites, results.length);
    }

    // Auto-score new jobs if profile exists
    if (profile && allInsertedIds.length > 0) {
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
      } catch (err) {
        console.warn("[/api/scrape] Auto-scoring failed:", err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        newJobs: totalNew,
        duplicatesSkipped: totalDuplicates,
        queriesRun,
        queriesSkipped,
      },
    });
  } catch (err) {
    console.error("[/api/scrape] Error:", err);
    let message = err instanceof Error ? err.message : "Scrape failed";

    // Ensure no raw command output leaks to the user
    if (message.includes("Command failed:")) {
      message = "The job scraper encountered an error. Make sure Python and python-jobspy are installed.";
    } else if (message.includes("ETIMEDOUT") || message.includes("timed out")) {
      message = "The scraper timed out. Try reducing the number of results or sites.";
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
