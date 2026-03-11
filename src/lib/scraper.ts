import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

export interface ScrapeRequest {
  searchTerm: string;
  location?: string;
  sites?: string[];
  resultsWanted?: number;
  hoursOld?: number;
  countryIndeed?: string;
  isRemote?: boolean;
  jobType?: string;
}

export interface ScrapedJob {
  id: string | null;
  site: string;
  title: string;
  company: string | null;
  company_url: string | null;
  job_url: string;
  location: string | null;
  is_remote: boolean | null;
  description: string | null;
  job_type: string | null;
  min_amount: number | null;
  max_amount: number | null;
  interval: string | null;
  currency: string | null;
  date_posted: string | null;
  emails: string | null;
  [key: string]: unknown;
}

export async function scrapeJobs(request: ScrapeRequest): Promise<ScrapedJob[]> {
  const scriptPath = path.join(process.cwd(), "scraper", "scrape.py");

  const args: string[] = [
    scriptPath,
    "--search",
    request.searchTerm,
    "--sites",
    (request.sites ?? ["indeed"]).join(","),
    "--results",
    String(request.resultsWanted ?? 50),
    "--hours-old",
    String(request.hoursOld ?? 72),
  ];

  if (request.location) args.push("--location", request.location);
  if (request.countryIndeed) args.push("--country", request.countryIndeed);
  if (request.isRemote) args.push("--remote");
  if (request.jobType) args.push("--job-type", request.jobType);

  try {
    const { stdout, stderr } = await execFileAsync("python", args, {
      timeout: 120_000,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (stderr) {
      console.warn("[scraper] stderr:", stderr);
    }

    const parsed = JSON.parse(stdout);

    if (!Array.isArray(parsed)) {
      throw new Error("Scraper returned unexpected format");
    }

    return parsed as ScrapedJob[];
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === "ENOENT") {
      throw new Error(
        "Python not found. Install Python 3.10+ and ensure it's on PATH."
      );
    }
    throw err;
  }
}
