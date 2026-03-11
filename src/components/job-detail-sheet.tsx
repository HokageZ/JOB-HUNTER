"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MapPin,
  Building2,
  DollarSign,
  Clock,
  ExternalLink,
  Bookmark,
  X,
  FileText,
  Wand2,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { JobRow, MatchScoreRow, ApplicationRow } from "@/types";

interface JobDetailSheetProps {
  jobId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (jobId: number) => void;
  onDismiss: (jobId: number) => void;
}

interface JobDetail {
  job: JobRow;
  matchScore: MatchScoreRow | null;
  application: ApplicationRow | null;
}

interface TailoringResult {
  summary_rewrite?: string;
  keyword_additions?: { keyword: string; where_to_add: string }[];
  bullet_rewrites?: {
    section: string;
    original: string;
    tailored: string;
    reason: string;
  }[];
  section_reordering?: string[];
  skills_to_highlight?: string[];
  skills_to_add?: string[];
  formatting_tips?: string[];
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return "bg-green-500";
    if (s >= 60) return "bg-blue-500";
    if (s >= 40) return "bg-yellow-500";
    return "bg-gray-400";
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[#6b6560] w-24 shrink-0">{label}</span>
      <div className="flex-1 h-3 bg-[#e5e0d8] rounded-full overflow-hidden border border-[#d5d0c8]">
        <div
          className={`h-full ${getColor(score)} transition-all duration-300`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-bold text-[#2d2d2d] w-10 text-right">
        {score}%
      </span>
    </div>
  );
}

function getOverallBadge(score: number | null | undefined) {
  if (score === null || score === undefined)
    return { color: "bg-[#e5e0d8] text-[#6b6560]", label: "Not Scored" };
  if (score >= 80)
    return { color: "bg-green-100 text-green-800 border-green-400", label: "Excellent Match" };
  if (score >= 60)
    return { color: "bg-blue-100 text-blue-800 border-blue-400", label: "Good Match" };
  if (score >= 40)
    return { color: "bg-yellow-100 text-yellow-800 border-yellow-400", label: "Possible Match" };
  return { color: "bg-gray-100 text-gray-500 border-gray-300", label: "Weak Match" };
}

export function JobDetailSheet({
  jobId,
  open,
  onOpenChange,
  onSave,
  onDismiss,
}: JobDetailSheetProps) {
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [tailoring, setTailoring] = useState<TailoringResult | null>(null);
  const [tailoringLoading, setTailoringLoading] = useState(false);
  const [showPrep, setShowPrep] = useState(false);
  const [checklist, setChecklist] = useState({
    resumeTailored: false,
    coverLetterReady: false,
    applicationUrlOpened: false,
  });

  useEffect(() => {
    if (!jobId || !open) {
      setDetail(null);
      setCoverLetter("");
      setTailoring(null);
      setShowPrep(false);
      setChecklist({
        resumeTailored: false,
        coverLetterReady: false,
        applicationUrlOpened: false,
      });
      return;
    }

    setLoading(true);
    fetch(`/api/jobs/${jobId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setDetail(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [jobId, open]);

  async function generateCoverLetter() {
    if (!detail?.job) return;
    setCoverLetterLoading(true);
    try {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: detail.job.id }),
      });
      const data = await res.json();
      if (data.success) {
        setCoverLetter(data.data.coverLetter);
        setChecklist((prev) => ({ ...prev, coverLetterReady: true }));
        toast.success("Cover letter generated!");
      } else {
        toast.error(data.error || "Failed to generate cover letter");
      }
    } catch {
      toast.error("Network error generating cover letter");
    } finally {
      setCoverLetterLoading(false);
    }
  }

  async function generateTailoring() {
    if (!detail?.job) return;
    setTailoringLoading(true);
    try {
      const res = await fetch("/api/ai/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: detail.job.id }),
      });
      const data = await res.json();
      if (data.success) {
        setTailoring(data.data);
        setChecklist((prev) => ({ ...prev, resumeTailored: true }));
        toast.success("Tailoring suggestions ready!");
      } else {
        toast.error(data.error || "Failed to generate suggestions");
      }
    } catch {
      toast.error("Network error generating suggestions");
    } finally {
      setTailoringLoading(false);
    }
  }

  async function markAsApplied() {
    if (!detail?.job) return;
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: detail.job.id,
          status: "applied",
          coverLetter: coverLetter || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Marked as Applied!");
        onOpenChange(false);
      } else {
        toast.error(data.error || "Failed to mark as applied");
      }
    } catch {
      toast.error("Network error");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  }

  const job = detail?.job;
  const match = detail?.matchScore;
  const application = detail?.application;
  const overallBadge = getOverallBadge(match?.overall_score);

  const location = job
    ? [job.city, job.state, job.country].filter(Boolean).join(", ")
    : "";

  const salary = job
    ? formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_interval)
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-lg border-l-2 border-[#2d2d2d] p-0"
        style={{ borderRadius: 0 }}
      >
        <SheetHeader className="p-6 pb-0">
          <SheetTitle
            className="text-2xl font-bold text-[#2d2d2d] text-left"
            style={{ fontFamily: "'Kalam', cursive" }}
          >
            {loading ? (
              <Skeleton className="h-8 w-3/4" />
            ) : (
              job?.title ?? "Job Details"
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)] px-6 pb-6">
          {loading ? (
            <div className="space-y-4 mt-4">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : job ? (
            <div className="space-y-5 mt-4">
              {/* Meta */}
              <div className="space-y-2 text-[#6b6560]">
                {job.company && (
                  <div className="flex items-center gap-2">
                    <Building2 size={16} strokeWidth={2.5} />
                    <span className="text-lg">{job.company}</span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} strokeWidth={2.5} />
                    <span>{location}</span>
                    {job.is_remote === 1 && (
                      <Badge
                        variant="outline"
                        className="border-[#2d5da1] text-[#2d5da1] text-xs"
                        style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                      >
                        Remote
                      </Badge>
                    )}
                  </div>
                )}
                {salary && (
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} strokeWidth={2.5} />
                    <span>{salary}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock size={16} strokeWidth={2.5} />
                  <span>
                    {job.date_posted
                      ? new Date(job.date_posted).toLocaleDateString()
                      : "Date unknown"}
                  </span>
                </div>
              </div>

              {/* Application status */}
              {application && (
                <Badge
                  className="bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] capitalize"
                  style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                >
                  {application.status}
                </Badge>
              )}

              {/* Match Score */}
              {match && (
                <>
                  <Separator className="border-[#e5e0d8]" />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3
                        className="text-xl font-bold text-[#2d2d2d]"
                        style={{ fontFamily: "'Kalam', cursive" }}
                      >
                        Match Breakdown
                      </h3>
                      <Badge
                        className={`${overallBadge.color} border text-sm px-3 py-1`}
                        style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                      >
                        {match.overall_score}% — {overallBadge.label}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <ScoreBar label="Skills" score={match.skill_score} />
                      <ScoreBar label="Experience" score={match.experience_score} />
                      <ScoreBar label="Location" score={match.location_score} />
                      <ScoreBar label="Salary" score={match.salary_score} />
                      <ScoreBar label="Job Type" score={match.job_type_score} />
                      <ScoreBar label="Recency" score={match.recency_score} />
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  {match.reasoning && (
                    <div
                      className="bg-[#fff9c4] border-2 border-[#e5e0d8] p-4"
                      style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                    >
                      <h4 className="font-bold text-sm text-[#2d2d2d] mb-1">
                        AI Assessment
                      </h4>
                      <p className="text-sm text-[#2d2d2d] italic">
                        &quot;{match.reasoning}&quot;
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Description */}
              <Separator className="border-[#e5e0d8]" />
              <div>
                <h3
                  className="text-xl font-bold text-[#2d2d2d] mb-2"
                  style={{ fontFamily: "'Kalam', cursive" }}
                >
                  Description
                </h3>
                <div
                  className="prose prose-sm max-w-none text-[#2d2d2d] whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeDescription(job.description ?? "No description available."),
                  }}
                />
              </div>

              {/* Application Prep */}
              <Separator className="border-[#e5e0d8]" />
              <div>
                <button
                  onClick={() => setShowPrep(!showPrep)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3
                    className="text-xl font-bold text-[#2d2d2d]"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    Application Prep
                  </h3>
                  {showPrep ? (
                    <ChevronUp className="w-5 h-5 text-[#6b6560]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#6b6560]" />
                  )}
                </button>

                {showPrep && (
                  <div className="mt-4 space-y-4">
                    {/* Cover Letter */}
                    <div
                      className="border-2 border-[#d4cfc9] p-4"
                      style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm text-[#2d2d2d] flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Cover Letter
                        </h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={generateCoverLetter}
                          disabled={coverLetterLoading}
                          className="border-2 border-[#2d2d2d] text-xs"
                          style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                        >
                          {coverLetterLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Wand2 className="w-3 h-3 mr-1" />
                          )}
                          Generate
                        </Button>
                      </div>
                      {coverLetter ? (
                        <div>
                          <textarea
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            className="w-full min-h-[200px] p-3 text-sm text-[#2d2d2d] bg-[#fdfbf7] border-2 border-[#e5e0d8] resize-y"
                            style={{
                              borderRadius: "var(--radius-wobbly-sm)",
                              fontFamily: "'Patrick Hand', cursive",
                            }}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-[#a09890] italic">
                              AI-generated. Review before submitting.
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(coverLetter)}
                              className="text-xs"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-[#a09890]">
                          Generate a tailored cover letter for this position.
                        </p>
                      )}
                    </div>

                    {/* Resume Tailoring */}
                    <div
                      className="border-2 border-[#d4cfc9] p-4"
                      style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm text-[#2d2d2d] flex items-center gap-2">
                          <Wand2 className="w-4 h-4" />
                          Resume Tailoring
                        </h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={generateTailoring}
                          disabled={tailoringLoading}
                          className="border-2 border-[#2d2d2d] text-xs"
                          style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                        >
                          {tailoringLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Wand2 className="w-3 h-3 mr-1" />
                          )}
                          Tailor
                        </Button>
                      </div>
                      {tailoring ? (
                        <TailoringSuggestions
                          data={tailoring}
                          onCopy={copyToClipboard}
                        />
                      ) : (
                        <p className="text-sm text-[#a09890]">
                          Get AI suggestions to tailor your resume for this job.
                        </p>
                      )}
                    </div>

                    {/* Pre-Apply Checklist */}
                    <div
                      className="bg-[#fff9c4] border-2 border-[#e5e0d8] p-4"
                      style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                    >
                      <h4 className="font-bold text-sm text-[#2d2d2d] mb-3">
                        Pre-Apply Checklist
                      </h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={checklist.resumeTailored}
                            onCheckedChange={(v) =>
                              setChecklist((prev) => ({
                                ...prev,
                                resumeTailored: !!v,
                              }))
                            }
                          />
                          <span className="text-sm text-[#2d2d2d]">
                            Resume reviewed / tailored
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={checklist.coverLetterReady}
                            onCheckedChange={(v) =>
                              setChecklist((prev) => ({
                                ...prev,
                                coverLetterReady: !!v,
                              }))
                            }
                          />
                          <span className="text-sm text-[#2d2d2d]">
                            Cover letter prepared
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={checklist.applicationUrlOpened}
                            onCheckedChange={(v) => {
                              setChecklist((prev) => ({
                                ...prev,
                                applicationUrlOpened: !!v,
                              }));
                              if (v && job?.job_url) {
                                window.open(
                                  job.job_url,
                                  "_blank",
                                  "noopener,noreferrer"
                                );
                              }
                            }}
                          />
                          <span className="text-sm text-[#2d2d2d]">
                            Application URL opened
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <Separator className="border-[#e5e0d8]" />
              <div className="flex flex-wrap gap-2 pb-6">
                {!application && (
                  <Button
                    className="flex-1 bg-[#ff4d4d] text-white sketch-btn hover:bg-[#e04444] border-2 border-[#2d2d2d]"
                    style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                    onClick={markAsApplied}
                  >
                    <Check size={16} className="mr-2" />
                    Mark as Applied
                  </Button>
                )}
                <Button
                  className="flex-1 bg-[#2d5da1] text-white sketch-btn hover:bg-[#2d5da1]"
                  style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                  onClick={() => window.open(job.job_url, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink size={16} className="mr-2" />
                  View Original
                </Button>
                <Button
                  variant="outline"
                  className="border-2 border-[#2d2d2d] sketch-btn"
                  style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                  onClick={() => onSave(job.id)}
                >
                  <Bookmark size={16} className="mr-2" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  className="border-2 border-[#ff4d4d] text-[#ff4d4d] sketch-btn"
                  style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                  onClick={() => onDismiss(job.id)}
                >
                  <X size={16} className="mr-2" />
                  Dismiss
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-[#6b6560]">Job not found.</p>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null,
  interval: string | null
) {
  const cur = currency || "USD";
  const fmt = (n: number) =>
    n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
  if (min && max) return `${cur} ${fmt(min)}–${fmt(max)}/${interval || "yr"}`;
  if (min) return `${cur} ${fmt(min)}+/${interval || "yr"}`;
  if (max) return `${cur} up to ${fmt(max)}/${interval || "yr"}`;
  return null;
}

function sanitizeDescription(html: string): string {
  // Strip script tags and event handlers for safety
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");
}

function TailoringSuggestions({
  data,
  onCopy,
}: {
  data: TailoringResult;
  onCopy: (text: string) => void;
}) {
  return (
    <div className="space-y-3 text-sm">
      {/* Summary Rewrite */}
      {data.summary_rewrite && (
        <div>
          <h5 className="font-bold text-[#2d2d2d] mb-1">Tailored Summary</h5>
          <div className="bg-[#fdfbf7] border border-[#e5e0d8] p-2 rounded text-[#2d2d2d]">
            {data.summary_rewrite}
            <button
              onClick={() => onCopy(data.summary_rewrite!)}
              className="ml-2 text-[#2d5da1] hover:underline text-xs"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Skills to Highlight */}
      {data.skills_to_highlight && data.skills_to_highlight.length > 0 && (
        <div>
          <h5 className="font-bold text-[#2d2d2d] mb-1">
            Skills to Highlight
          </h5>
          <div className="flex flex-wrap gap-1">
            {data.skills_to_highlight.map((s) => (
              <Badge
                key={s}
                className="bg-green-100 text-green-800 border border-green-300 text-xs"
                style={{ borderRadius: "var(--radius-wobbly-sm)" }}
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Keywords to Add */}
      {data.keyword_additions && data.keyword_additions.length > 0 && (
        <div>
          <h5 className="font-bold text-[#2d2d2d] mb-1">Keywords to Add</h5>
          <ul className="space-y-1">
            {data.keyword_additions.map((k, i) => (
              <li key={i} className="text-[#6b6560]">
                <span className="font-semibold text-[#2d5da1]">
                  {k.keyword}
                </span>{" "}
                → {k.where_to_add}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bullet Rewrites */}
      {data.bullet_rewrites && data.bullet_rewrites.length > 0 && (
        <div>
          <h5 className="font-bold text-[#2d2d2d] mb-1">Bullet Rewrites</h5>
          <div className="space-y-2">
            {data.bullet_rewrites.map((b, i) => (
              <div
                key={i}
                className="bg-[#fdfbf7] border border-[#e5e0d8] p-2 rounded"
              >
                <p className="text-[#a09890] line-through text-xs">
                  {b.original}
                </p>
                <p className="text-green-700 text-xs mt-1">{b.tailored}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-[#a09890] italic">
                    {b.reason}
                  </p>
                  <button
                    onClick={() => onCopy(b.tailored)}
                    className="text-[#2d5da1] hover:underline text-[10px]"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Reordering */}
      {data.section_reordering && data.section_reordering.length > 0 && (
        <div>
          <h5 className="font-bold text-[#2d2d2d] mb-1">Section Order</h5>
          <ul className="list-disc list-inside text-[#6b6560]">
            {data.section_reordering.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Formatting Tips */}
      {data.formatting_tips && data.formatting_tips.length > 0 && (
        <div>
          <h5 className="font-bold text-[#2d2d2d] mb-1">Formatting Tips</h5>
          <ul className="list-disc list-inside text-[#6b6560]">
            {data.formatting_tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
