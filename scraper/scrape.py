#!/usr/bin/env python3
"""
Job scraper using python-jobspy.
Called by Next.js API route via subprocess.
Uses CLI arguments, outputs JSON results on stdout.
"""

import argparse
import json
import sys
from jobspy import scrape_jobs


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
            is_remote=True if args.remote else None,
            job_type=args.job_type,
            verbose=0,
        )

        # Convert DataFrame to list of dicts
        results = jobs.to_dict(orient="records")

        # Clean NaN/NaT values for JSON serialization
        for row in results:
            for key, value in row.items():
                if isinstance(value, float) and (value != value):  # NaN check
                    row[key] = None

        print(json.dumps(results, default=str))

    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
