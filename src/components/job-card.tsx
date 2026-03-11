"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Building2,
  Clock,
  DollarSign,
  ExternalLink,
  Bookmark,
  X,
} from "lucide-react";

export interface JobCardData {
  id: number;
  title: string;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  is_remote: number;
  job_url: string;
  job_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_interval: string | null;
  date_posted: string | null;
  date_scraped: string;
  source: string;
  overall_score: number | null;
  is_recommended: number | null;
}

function getScoreBadge(score: number | null) {
  if (score === null || score === undefined)
    return { color: "bg-[#e5e0d8] text-[#6b6560]", label: "Not Scored" };
  if (score >= 80)
    return { color: "bg-green-100 text-green-800 border-green-400", label: "Excellent" };
  if (score >= 60)
    return { color: "bg-blue-100 text-blue-800 border-blue-400", label: "Good" };
  if (score >= 40)
    return { color: "bg-yellow-100 text-yellow-800 border-yellow-400", label: "Possible" };
  return { color: "bg-gray-100 text-gray-500 border-gray-300", label: "Weak" };
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

function relativeDate(dateStr: string | null) {
  if (!dateStr) return "Recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface JobCardProps {
  job: JobCardData;
  onClick: () => void;
  onSave: () => void;
  onDismiss: () => void;
}

export function JobCard({ job, onClick, onSave, onDismiss }: JobCardProps) {
  const scoreBadge = getScoreBadge(job.overall_score);
  const salary = formatSalary(
    job.salary_min,
    job.salary_max,
    job.salary_currency,
    job.salary_interval
  );

  const location = [job.city, job.state, job.country].filter(Boolean).join(", ");

  return (
    <div
      className="border-2 border-[#2d2d2d] bg-white p-4 cursor-pointer transition-all duration-100 hover:-translate-y-0.5"
      style={{
        borderRadius: "var(--radius-wobbly)",
        boxShadow: "var(--shadow-sketch-subtle)",
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3
            className="text-lg font-bold text-[#2d2d2d] truncate"
            style={{ fontFamily: "'Kalam', cursive" }}
          >
            {job.title}
          </h3>

          {job.company && (
            <div className="flex items-center gap-1 text-[#6b6560] mt-1">
              <Building2 size={14} strokeWidth={2.5} />
              <span className="truncate">{job.company}</span>
            </div>
          )}
        </div>

        {/* Score badge */}
        <Badge
          className={`${scoreBadge.color} border text-xs px-2 py-0.5 shrink-0`}
          style={{ borderRadius: "var(--radius-wobbly-sm)" }}
        >
          {job.overall_score !== null ? `${job.overall_score}%` : "—"}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-[#6b6560]">
        {location && (
          <span className="flex items-center gap-1">
            <MapPin size={13} strokeWidth={2.5} />
            {location}
          </span>
        )}
        {job.is_remote === 1 && (
          <Badge
            variant="outline"
            className="border-[#2d5da1] text-[#2d5da1] text-xs"
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          >
            Remote
          </Badge>
        )}
        {salary && (
          <span className="flex items-center gap-1">
            <DollarSign size={13} strokeWidth={2.5} />
            {salary}
          </span>
        )}
        {job.date_posted && (
          <span className="flex items-center gap-1">
            <Clock size={13} strokeWidth={2.5} />
            {relativeDate(job.date_posted)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#e5e0d8]">
        <Badge
          variant="outline"
          className="text-xs capitalize border-[#e5e0d8]"
          style={{ borderRadius: "var(--radius-wobbly-sm)" }}
        >
          {job.source}
        </Badge>

        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:text-[#2d5da1]"
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            title="Save job"
          >
            <Bookmark size={16} strokeWidth={2.5} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:text-[#2d5da1]"
            onClick={(e) => {
              e.stopPropagation();
              window.open(job.job_url, "_blank", "noopener,noreferrer");
            }}
            title="Open original posting"
          >
            <ExternalLink size={16} strokeWidth={2.5} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:text-[#ff4d4d]"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            title="Dismiss job"
          >
            <X size={16} strokeWidth={2.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}
