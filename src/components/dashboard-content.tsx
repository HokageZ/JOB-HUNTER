"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Briefcase,
  Send,
  TrendingUp,
  Award,
  Bookmark,
  Clock,
  AlertCircle,
  Search,
  FileText,
  LayoutGrid,
} from "lucide-react";

interface DashboardStats {
  totalJobs: number;
  applicationsSent: number;
  responseRate: number;
  interviews: number;
  offers: number;
  saved: number;
  funnel: { status: string; count: number }[];
  weeklyApps: { week: string; count: number }[];
  reminders: {
    id: number;
    reminder_date: string;
    message: string;
    job_title: string;
    job_company: string | null;
    is_overdue: number;
  }[];
  recommendations: {
    id: number;
    title: string;
    company: string | null;
    city: string | null;
    state: string | null;
    is_remote: number;
    overall_score: number;
  }[];
}

export function DashboardContent({
  completeness,
}: {
  completeness: number;
}) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStats(res.data);
      })
      .catch(() => toast.error("Failed to load dashboard stats"))
      .finally(() => setLoading(false));
  }, []);

  const overdueReminders =
    stats?.reminders.filter((r) => r.is_overdue) ?? [];
  const upcomingReminders =
    stats?.reminders.filter((r) => !r.is_overdue) ?? [];

  return (
    <div>
      <h1
        className="text-4xl md:text-5xl font-bold text-[#2d2d2d] -rotate-1 mb-6"
        style={{ fontFamily: "'Kalam', cursive" }}
      >
        Dashboard
      </h1>

      {completeness < 60 && (
        <div
          className="border-2 border-[#ff4d4d] bg-[#fff9c4] p-4 mb-6"
          style={{
            borderRadius: "var(--radius-wobbly-sm)",
            boxShadow: "var(--shadow-sketch)",
          }}
        >
          <p className="text-lg">
            Your profile is {completeness}% complete.{" "}
            <Link
              href="/setup"
              className="text-[#2d5da1] underline font-bold"
            >
              Complete your profile
            </Link>{" "}
            for better job matches.
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              icon={<Briefcase className="w-5 h-5" />}
              label="Total Jobs"
              value={stats.totalJobs}
              color="#2d5da1"
            />
            <StatCard
              icon={<Send className="w-5 h-5" />}
              label="Applied"
              value={stats.applicationsSent}
              color="#ff4d4d"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Response Rate"
              value={`${stats.responseRate}%`}
              color="#16a34a"
            />
            <StatCard
              icon={<Award className="w-5 h-5" />}
              label="Interviews"
              value={stats.interviews}
              color="#d97706"
            />
            <StatCard
              icon={<Bookmark className="w-5 h-5" />}
              label="Offers"
              value={stats.offers}
              color="#7c3aed"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Follow-up Widget */}
            <div
              className="border-2 border-[#2d2d2d] bg-white p-5"
              style={{
                borderRadius: "var(--radius-wobbly)",
                boxShadow: "var(--shadow-sketch-subtle)",
              }}
            >
              <h2
                className="text-xl font-bold text-[#2d2d2d] mb-3"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                Follow-ups
              </h2>

              {stats.reminders.length === 0 ? (
                <p className="text-sm text-[#6b6560]">
                  No pending follow-ups. Apply to some jobs to get started!
                </p>
              ) : (
                <div className="space-y-2">
                  {overdueReminders.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-[#ff4d4d] flex items-center gap-1 mb-1">
                        <AlertCircle className="w-3 h-3" />
                        Overdue ({overdueReminders.length})
                      </span>
                      {overdueReminders.map((r) => (
                        <ReminderItem key={r.id} reminder={r} variant="overdue" />
                      ))}
                    </div>
                  )}
                  {upcomingReminders.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-[#16a34a] flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3" />
                        Upcoming ({upcomingReminders.length})
                      </span>
                      {upcomingReminders.map((r) => (
                        <ReminderItem
                          key={r.id}
                          reminder={r}
                          variant="upcoming"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Application Funnel */}
            <div
              className="border-2 border-[#2d2d2d] bg-white p-5"
              style={{
                borderRadius: "var(--radius-wobbly)",
                boxShadow: "var(--shadow-sketch-subtle)",
              }}
            >
              <h2
                className="text-xl font-bold text-[#2d2d2d] mb-3"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                Application Funnel
              </h2>

              {stats.funnel.length === 0 ? (
                <p className="text-sm text-[#6b6560]">
                  No applications yet. Start applying!
                </p>
              ) : (
                <FunnelChart funnel={stats.funnel} total={stats.applicationsSent || 1} />
              )}
            </div>
          </div>

          {/* Recommendations */}
          {stats.recommendations.length > 0 && (
            <div
              className="border-2 border-[#2d2d2d] bg-white p-5"
              style={{
                borderRadius: "var(--radius-wobbly)",
                boxShadow: "var(--shadow-sketch-subtle)",
              }}
            >
              <h2
                className="text-xl font-bold text-[#2d2d2d] mb-3"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                Top Recommendations
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.recommendations.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs`}
                    className="border-2 border-[#d4cfc9] hover:border-[#2d2d2d] p-3 transition-colors"
                    style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                  >
                    <p className="font-bold text-sm text-[#2d2d2d] truncate">
                      {job.title}
                    </p>
                    <p className="text-xs text-[#6b6560] truncate">
                      {job.company ?? "Unknown"}
                      {job.city && ` · ${job.city}`}
                      {job.is_remote ? " · Remote" : ""}
                    </p>
                    <Badge
                      className={`mt-2 text-[10px] ${getScoreColor(job.overall_score)}`}
                      style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                    >
                      {job.overall_score}% match
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link href="/jobs">
              <Button
                className="bg-[#2d5da1] text-white border-2 border-[#2d2d2d] sketch-btn hover:bg-[#1e4a8a]"
                style={{ borderRadius: "var(--radius-wobbly-sm)" }}
              >
                <Search className="w-4 h-4 mr-2" />
                Search Jobs
              </Button>
            </Link>
            <Link href="/resume">
              <Button
                variant="outline"
                className="border-2 border-[#2d2d2d] sketch-btn"
                style={{ borderRadius: "var(--radius-wobbly-sm)" }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Review Resume
              </Button>
            </Link>
            <Link href="/tracker">
              <Button
                variant="outline"
                className="border-2 border-[#2d2d2d] sketch-btn"
                style={{ borderRadius: "var(--radius-wobbly-sm)" }}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Open Tracker
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-[#6b6560]">Failed to load dashboard stats.</p>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      className="border-2 border-[#2d2d2d] bg-white p-4 text-center"
      style={{
        borderRadius: "var(--radius-wobbly)",
        boxShadow: "var(--shadow-sketch-subtle)",
      }}
    >
      <div
        className="flex justify-center mb-2"
        style={{ color }}
      >
        {icon}
      </div>
      <p
        className="text-2xl font-bold text-[#2d2d2d]"
        style={{ fontFamily: "'Kalam', cursive" }}
      >
        {value}
      </p>
      <p className="text-xs text-[#6b6560]">{label}</p>
    </div>
  );
}

function ReminderItem({
  reminder,
  variant,
}: {
  reminder: {
    id: number;
    reminder_date: string;
    message: string;
    job_title: string;
    job_company: string | null;
  };
  variant: "overdue" | "upcoming";
}) {
  const borderColor = variant === "overdue" ? "#ff4d4d" : "#16a34a";

  return (
    <div
      className="border-l-4 pl-3 py-1 mb-1"
      style={{ borderColor }}
    >
      <p className="text-xs font-bold text-[#2d2d2d]">
        {reminder.job_title}
        {reminder.job_company && (
          <span className="font-normal text-[#6b6560]">
            {" "}
            at {reminder.job_company}
          </span>
        )}
      </p>
      <p className="text-[11px] text-[#6b6560]">{reminder.message}</p>
      <p className="text-[10px] text-[#a09890]">
        {new Date(reminder.reminder_date).toLocaleDateString()}
      </p>
    </div>
  );
}

function FunnelChart({
  funnel,
  total,
}: {
  funnel: { status: string; count: number }[];
  total: number;
}) {
  const statusColors: Record<string, string> = {
    applied: "#2d5da1",
    screening: "#d97706",
    interview: "#16a34a",
    offer: "#7c3aed",
    rejected: "#ff4d4d",
    withdrawn: "#6b6560",
  };

  return (
    <div className="space-y-2">
      {funnel.map((item) => {
        const pct = Math.round((item.count / total) * 100);
        return (
          <div key={item.status}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="capitalize font-bold text-[#2d2d2d]">
                {item.status}
              </span>
              <span className="text-[#6b6560]">
                {item.count} ({pct}%)
              </span>
            </div>
            <Progress
              value={pct}
              className="h-3"
              style={
                {
                  "--progress-color":
                    statusColors[item.status] || "#2d2d2d",
                } as React.CSSProperties
              }
            />
          </div>
        );
      })}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-800 border-green-400";
  if (score >= 60) return "bg-blue-100 text-blue-800 border-blue-400";
  if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-400";
  return "bg-red-100 text-red-800 border-red-400";
}
