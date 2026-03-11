import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { scrapeJobs } from "@/lib/scraper";
import { generateSearchQueries } from "@/lib/query-generator";
import { shouldScrape, updateScrapeCache } from "@/lib/scrape-cache";
import { insertScrapedJobs } from "@/lib/job-storage";
import { calculateMatchScore } from "@/lib/matching";
import { logger } from "@/lib/logger";
import type { UserProfile, JobRow, ApiResponse } from "@/types";

const ALL_JOBSPY_SITES = ["indeed", "linkedin", "glassdoor", "google", "zip_recruiter"];

const scrapeRequestSchema = z.object({
  searchTerm: z.string().min(1).optional(),
  location: z.string().optional(),
  sites: z.array(z.string()).optional().default(ALL_JOBSPY_SITES),
  resultsWanted: z.number().optional().default(15),
  hoursOld: z.number().optional().default(72),
  isRemote: z.boolean().optional(),
  jobType: z.string().optional(),
});

// Map common country names to Indeed country codes
const COUNTRY_TO_INDEED: Record<string, string> = {
  USA: "USA", "United States": "USA", US: "USA",
  UK: "UK", "United Kingdom": "UK",
  Canada: "Canada", Australia: "Australia",
  India: "India", Germany: "Germany", France: "France",
  Netherlands: "Netherlands", Singapore: "Singapore",
  UAE: "UAE", Japan: "Japan", Brazil: "Brazil",
  Mexico: "Mexico", Spain: "Spain", Italy: "Italy",
  Ireland: "Ireland", Sweden: "Sweden", Norway: "Norway",
  Switzerland: "Switzerland", Poland: "Poland",
  "South Korea": "South Korea", "New Zealand": "New Zealand",
  Philippines: "Philippines", Malaysia: "Malaysia",
  "South Africa": "South Africa", Nigeria: "Nigeria",
  Egypt: "Egypt", "Saudi Arabia": "Saudi Arabia",
  Qatar: "Qatar", Bahrain: "Bahrain", Kuwait: "Kuwait",
  Oman: "Oman", Jordan: "Jordan", Iraq: "Iraq",
  Lebanon: "Lebanon", Morocco: "Morocco", Tunisia: "Tunisia",
  Turkey: "Turkey", Pakistan: "Pakistan", Bangladesh: "Bangladesh",
  Kenya: "Kenya", Ghana: "Ghana",
};

interface ScrapeResult {
  newJobs: number;
  duplicatesSkipped: number;
  queriesRun: number;
  queriesSkipped: number;
  queriesFailed?: number;
  warnings?: string[];
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
      isRemote?: boolean;
      countryIndeed?: string;
    }
    const queries: QueryItem[] = [];

    if (searchTerm) {
      queries.push({ term: searchTerm, loc: location ?? "" });
    } else if (profile) {
      const generated = generateSearchQueries(profile);

      // Build location list from profile
      const locations: string[] = [];

      // Add desired locations
      if (profile.desiredLocations?.length) {
        locations.push(...profile.desiredLocations);
      }

      // Add home city if not already included
      if (profile.location?.city) {
        const homeCity = profile.location.state
          ? `${profile.location.city}, ${profile.location.state}`
          : `${profile.location.city}, ${profile.location.country || ""}`;
        if (!locations.some((l) => l.toLowerCase().includes(profile.location.city!.toLowerCase()))) {
          locations.push(homeCity);
        }
      }

      // Fallback: if no locations at all, use country
      if (locations.length === 0 && profile.location?.country) {
        locations.push(profile.location.country);
      }

      // Determine Indeed country code
      const countryCode = profile.location?.country
        ? COUNTRY_TO_INDEED[profile.location.country] ?? "USA"
        : "USA";

      // Generate query × location combinations
      for (const q of generated) {
        // Run each query in each location
        for (const loc of locations) {
          queries.push({ term: q.term, loc, countryIndeed: countryCode });
        }

        // Always run a broad no-location query to find jobs anywhere
        // (dedup will prevent duplicates from location-specific queries)
        queries.push({ term: q.term, loc: "", countryIndeed: countryCode });

        // If user wants remote, also flag the broad query as remote
        if (profile.remotePreference === "remote" || profile.remotePreference === "any") {
          queries.push({ term: q.term, loc: "", isRemote: true, countryIndeed: countryCode });
        }
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
    let queriesFailed = 0;
    const allInsertedIds: number[] = [];
    const errors: string[] = [];

    for (const query of queries) {
      // Check cache
      if (!shouldScrape(query.term, query.loc, sites)) {
        queriesSkipped++;
        continue;
      }

      logger.info("api:scrape", `Scraping "${query.term}" in "${query.loc || 'remote/any'}" via ${sites.join(",")}`);

      try {
        const results = await scrapeJobs({
          searchTerm: query.term,
          location: query.loc || undefined,
          sites,
          resultsWanted,
          hoursOld,
          isRemote: query.isRemote || isRemote,
          jobType,
          countryIndeed: query.countryIndeed,
        });

        const { newJobs, duplicatesSkipped, insertedIds } = insertScrapedJobs(results);
        totalNew += newJobs;
        totalDuplicates += duplicatesSkipped;
        allInsertedIds.push(...insertedIds);
        queriesRun++;

        // Update cache
        updateScrapeCache(query.term, query.loc, sites, results.length);
      } catch (queryErr) {
        queriesFailed++;
        const msg = queryErr instanceof Error ? queryErr.message : String(queryErr);
        errors.push(`"${query.term}": ${msg}`);
        logger.warn("api:scrape", `Query "${query.term}" failed: ${msg}`);
      }
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
        logger.warn("api:scrape", "Auto-scoring failed", err);
      }
    }

    // If ALL queries failed and we got nothing, return error
    if (queriesRun === 0 && queriesFailed > 0) {
      return NextResponse.json(
        {
          success: false,
          error: errors.length === 1
            ? errors[0]
            : `All ${queriesFailed} searches failed. The job boards may be temporarily unavailable. Try again in a few minutes.`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        newJobs: totalNew,
        duplicatesSkipped: totalDuplicates,
        queriesRun,
        queriesSkipped,
        queriesFailed,
        ...(errors.length > 0 && { warnings: errors }),
      },
    });
  } catch (err) {
    logger.error("api:scrape", "Scrape error", err);
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
