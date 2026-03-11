#!/usr/bin/env python3
"""
Job scraper using python-jobspy.
Called by Next.js API route via subprocess.
Uses CLI arguments, outputs JSON results on stdout.
"""

import argparse
import json
import logging
import sys

# Suppress python-jobspy's internal logging to prevent stderr pollution
logging.getLogger("jobspy").setLevel(logging.CRITICAL)
logging.getLogger().setLevel(logging.CRITICAL)

try:
    from jobspy import scrape_jobs
except ImportError:
    print(
        json.dumps(
            {
                "error": "python-jobspy is not installed. Run: pip install python-jobspy"
            }
        ),
        file=sys.stderr,
    )
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Scrape jobs from multiple boards")
    parser.add_argument("--search", required=True, help="Search term")
    parser.add_argument("--location", default=None, help="Location filter")
    parser.add_argument(
        "--sites",
        default="indeed,linkedin,glassdoor,google,zip_recruiter",
        help="Comma-separated list of sites",
    )
    parser.add_argument("--results", type=int, default=50, help="Results per site")
    parser.add_argument(
        "--hours-old", type=int, default=72, help="Max hours since posted"
    )
    parser.add_argument(
        "--country", default="USA", help="Country for Indeed/Glassdoor"
    )
    parser.add_argument("--remote", action="store_true", help="Remote jobs only")
    parser.add_argument(
        "--job-type",
        default=None,
        help="fulltime|parttime|internship|contract",
    )

    args = parser.parse_args()

    try:
        site_list = args.sites.split(",")

        google_search_term = None
        if "google" in site_list:
            loc_part = args.location or "United States"
            google_search_term = f"{args.search} jobs near {loc_part}"

        jobs = scrape_jobs(
            site_name=site_list,
            search_term=args.search,
            google_search_term=google_search_term,
            location=args.location,
            results_wanted=args.results,
            hours_old=args.hours_old,
            country_indeed=args.country,
            is_remote=args.remote,
            job_type=args.job_type,
            verbose=0,
        )

        if jobs is None or jobs.empty:
            print(json.dumps([]))
            return

        # Convert DataFrame to list of dicts
        results = jobs.to_dict(orient="records")

        # Clean NaN/NaT values for JSON serialization
        for row in results:
            for key, value in row.items():
                if isinstance(value, float) and (value != value):  # NaN check
                    row[key] = None

        print(json.dumps(results, default=str))

    except Exception as e:
        error_msg = str(e)

        # Translate common errors to user-friendly messages
        if "validation error" in error_msg.lower():
            error_msg = (
                f"Scraper configuration error: {error_msg}. "
                "Try updating python-jobspy: pip install -U python-jobspy"
            )
        elif "no results" in error_msg.lower() or "empty" in error_msg.lower():
            error_msg = "No jobs found matching your search criteria. Try different keywords or broaden your search."
        elif "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
            error_msg = "The job board took too long to respond. Try again in a few minutes."
        elif "403" in error_msg or "blocked" in error_msg.lower():
            error_msg = "The job board is temporarily blocking requests. Try again later or use a different source."
        elif "connection" in error_msg.lower() or "network" in error_msg.lower():
            error_msg = "Network error — couldn't reach the job board. Check your internet connection."

        print(json.dumps({"error": error_msg}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
