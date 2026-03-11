"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard, type JobCardData } from "@/components/job-card";
import { JobFilters, type FilterState } from "@/components/job-filters";
import { JobDetailSheet } from "@/components/job-detail-sheet";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

const DEFAULT_FILTERS: FilterState = {
  search: "",
  source: "all",
  isRemote: "all",
  jobType: "all",
  sortBy: "date",
  showDismissed: false,
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "50");
      if (filters.search) params.set("search", filters.search);
      if (filters.source !== "all") params.set("source", filters.source);
      if (filters.isRemote !== "all") params.set("isRemote", filters.isRemote);
      if (filters.jobType !== "all") params.set("jobType", filters.jobType);
      params.set("sortBy", filters.sortBy);
      if (filters.showDismissed) params.set("showDismissed", "true");

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data.jobs);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      }
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Reset to page 1 when filters change
  function handleFilterChange(newFilters: FilterState) {
    setPage(1);
    setFilters(newFilters);
  }

  async function handleScrape() {
    setScraping(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        const { newJobs, duplicatesSkipped, queriesFailed, warnings } = data.data;
        if (newJobs > 0) {
          toast.success(`Found ${newJobs} new jobs! (${duplicatesSkipped} duplicates skipped)`);
        } else if (duplicatesSkipped > 0) {
          toast.info(`No new jobs found (${duplicatesSkipped} duplicates skipped). Try again later for fresh results.`);
        } else {
          toast.info("No jobs found this time. Try adjusting your profile or search criteria.");
        }
        if (queriesFailed > 0 && warnings?.length) {
          toast.warning(`${queriesFailed} search(es) failed — some job boards may be temporarily unavailable.`);
        }
        fetchJobs();
      } else {
        toast.error(data.error || "Scrape failed");
      }
    } catch {
      toast.error("Couldn't reach the scraper. Check your connection and try again.");
    } finally {
      setScraping(false);
    }
  }

  async function handleSave(jobId: number) {
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, status: "saved" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Job saved!");
      } else {
        // Application may already exist
        toast.info(data.error || "Could not save job");
      }
    } catch {
      toast.error("Failed to save job");
    }
  }

  async function handleDismiss(jobId: number) {
    try {
      const res = await fetch("/api/jobs/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
        setTotal((prev) => prev - 1);
        toast.success("Job dismissed");
        if (sheetOpen && selectedJobId === jobId) {
          setSheetOpen(false);
        }
      }
    } catch {
      toast.error("Failed to dismiss job");
    }
  }

  const recommendedCount = jobs.filter(
    (j) => j.is_recommended === 1
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-4xl md:text-5xl font-bold text-[#2d2d2d] -rotate-1"
          style={{ fontFamily: "'Kalam', cursive" }}
        >
          Job Feed
        </h1>

        <Button
          onClick={handleScrape}
          disabled={scraping}
          className="bg-[#2d5da1] text-white h-12 px-5 text-lg sketch-btn hover:bg-[#2d5da1]"
          style={{ borderRadius: "var(--radius-wobbly-sm)" }}
        >
          <RefreshCw
            size={18}
            className={`mr-2 ${scraping ? "animate-spin" : ""}`}
          />
          {scraping ? "Searching..." : "Search for Jobs"}
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <JobFilters filters={filters} onChange={handleFilterChange} />
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-2 mb-4 text-[#6b6560]">
        <span className="text-lg">
          Found <strong className="text-[#2d2d2d]">{total}</strong> jobs
        </span>
        {recommendedCount > 0 && (
          <span>
            · <strong className="text-[#2d5da1]">{recommendedCount}</strong>{" "}
            recommended
          </span>
        )}
      </div>

      {/* Job list */}
      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-32 border-2 border-[#e5e0d8]"
              style={{ borderRadius: "var(--radius-wobbly)" }}
            />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div
          className="border-2 border-[#2d2d2d] bg-white p-8 text-center"
          style={{
            borderRadius: "var(--radius-wobbly)",
            boxShadow: "var(--shadow-sketch-subtle)",
          }}
        >
          <p
            className="text-2xl font-bold text-[#2d2d2d] mb-2"
            style={{ fontFamily: "'Kalam', cursive" }}
          >
            No jobs yet
          </p>
          <p className="text-lg text-[#6b6560] mb-4">
            Click &quot;Search for Jobs&quot; to find matching positions from
            Google Jobs based on your profile.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onClick={() => {
                setSelectedJobId(job.id);
                setSheetOpen(true);
              }}
              onSave={() => handleSave(job.id)}
              onDismiss={() => handleDismiss(job.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-2 border-[#2d2d2d] sketch-btn"
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          >
            Previous
          </Button>
          <span className="text-lg text-[#6b6560]">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="border-2 border-[#2d2d2d] sketch-btn"
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          >
            Next
          </Button>
        </div>
      )}

      {/* Detail Sheet */}
      <JobDetailSheet
        jobId={selectedJobId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleSave}
        onDismiss={handleDismiss}
      />
    </div>
  );
}
