import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { logger } from "@/lib/logger";

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
    (request.sites ?? ["indeed", "linkedin", "glassdoor", "google", "zip_recruiter"]).join(","),
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
      timeout: 90_000,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (stderr) {
      // Only treat stderr as error if it contains our JSON error object
      // python-jobspy writes its own log messages to stderr — those are fine
      try {
        const errObj = JSON.parse(stderr);
        if (errObj.error) {
          throw new Error(errObj.error);
        }
      } catch (parseErr) {
        // Not JSON — just JobSpy log output, ignore
        if (!(parseErr instanceof SyntaxError)) throw parseErr;
      }
    }

    const parsed = JSON.parse(stdout);

    if (!Array.isArray(parsed)) {
      // Check if Python returned an error object on stdout
      if (parsed?.error) {
        throw new Error(parsed.error);
      }
      throw new Error("Scraper returned unexpected format");
    }

    return parsed as ScrapedJob[];
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException & { stderr?: string; stdout?: string };

    if (error.code === "ENOENT") {
      throw new Error(
        "Python not found. Install Python 3.10+ and ensure it's on PATH."
      );
    }

    // Sometimes python-jobspy exits non-zero but still produced valid results on stdout
    if (error.stdout) {
      try {
        const parsed = JSON.parse(error.stdout);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as ScrapedJob[];
        }
        // Empty array is also valid
        if (Array.isArray(parsed)) {
          return [];
        }
      } catch {
        // stdout wasn't valid JSON, continue to error handling
      }
    }

    // Check for our structured error in stderr
    if (error.stderr) {
      try {
        const errObj = JSON.parse(error.stderr);
        if (errObj.error) {
          throw new Error(errObj.error);
        }
      } catch (parseErr) {
        if (!(parseErr instanceof SyntaxError)) throw parseErr;
      }

      // Try to extract a readable error from raw stderr
      const stderr = error.stderr;
      if (stderr.includes("ModuleNotFoundError") || stderr.includes("No module named")) {
        throw new Error(
          "python-jobspy is not installed. Run: pip install python-jobspy"
        );
      }
      if (stderr.includes("validation error")) {
        throw new Error(
          "Scraper configuration error. Try updating python-jobspy: pip install -U python-jobspy"
        );
      }

      // If stderr just contains JobSpy log messages (INFO, WARNING), not real errors
      if (!stderr.includes("Error") && !stderr.includes("Traceback") && !stderr.includes("Exception")) {
        // JobSpy succeeded but maybe found nothing — return empty
        return [];
      }
    }

    // Re-throw with cleaned message
    const msg = error.message || String(err);
    if (msg.includes("Command failed:")) {
      // Strip the raw command line from the error
      const cleanMsg = msg
        .replace(/Command failed:.*?\n/, "")
        .replace(/\{.*\}/, "")
        .trim();
      throw new Error(
        cleanMsg || "The job scraper encountered an error. Check your Python environment and try again."
      );
    }

    throw err;
  }
}
