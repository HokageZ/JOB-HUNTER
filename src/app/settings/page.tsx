"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Trash2,
  AlertTriangle,
  FileJson,
  FileText,
  Loader2,
  Play,
  Clock,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [lastScrapeTime, setLastScrapeTime] = useState<string | null>(null);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [togglingScheduler, setTogglingScheduler] = useState(false);

  const loadSchedulerStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/scrape/scheduler");
      const data = await res.json();
      if (data.success) {
        setSchedulerRunning(data.data.running);
        setLastScrapeTime(data.data.lastScrapeTime);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadSchedulerStatus();
  }, [loadSchedulerStatus]);

  async function handleToggleScheduler(enabled: boolean) {
    setTogglingScheduler(true);
    try {
      const res = await fetch("/api/scrape/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: enabled ? "start" : "stop" }),
      });
      const data = await res.json();
      if (data.success) {
        setSchedulerRunning(data.data.running);
        toast.success(
          enabled ? "Scheduler started" : "Scheduler stopped"
        );
      }
    } catch {
      toast.error("Failed to toggle scheduler");
    } finally {
      setTogglingScheduler(false);
    }
  }

  async function handleRunNow() {
    setScrapeLoading(true);
    try {
      const res = await fetch("/api/scrape/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run-now" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          `Scrape complete: ${data.data.newJobs} new jobs, ${data.data.queriesRun} queries`
        );
        loadSchedulerStatus();
      } else {
        toast.error(data.error || "Scrape failed");
      }
    } catch {
      toast.error("Scrape failed");
    } finally {
      setScrapeLoading(false);
    }
  }

  async function handleExport(format: "json" | "csv") {
    setExportLoading(format);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Export failed");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] || `export.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExportLoading(null);
    }
  }

  async function handleDeleteAll() {
    setDeleting(true);
    try {
      const res = await fetch("/api/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("All data deleted");
        setDeleteDialogOpen(false);
        router.push("/setup");
      } else {
        toast.error(data.error || "Failed to delete data");
      }
    } catch {
      toast.error("Failed to delete data");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <h1
        className="text-4xl md:text-5xl font-bold text-[#2d2d2d] -rotate-1 mb-6"
        style={{ fontFamily: "'Kalam', cursive" }}
      >
        Settings
      </h1>

      <div className="space-y-6 max-w-2xl">
        {/* API Key Status */}
        <SettingsSection title="API Configuration">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-[#2d2d2d]">
              OpenRouter API key is configured via{" "}
              <code className="bg-[#f5f0eb] px-1 py-0.5 rounded text-xs">
                .env.local
              </code>
            </span>
          </div>
          <p className="text-xs text-[#6b6560] mt-2">
            To change your API key, edit the{" "}
            <code className="bg-[#f5f0eb] px-1 py-0.5 rounded text-xs">
              OPENROUTER_API_KEY
            </code>{" "}
            value in your .env.local file and restart the server.
          </p>
        </SettingsSection>

        {/* Scheduled Scraping */}
        <SettingsSection title="Scheduled Scraping">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-[#2d2d2d]">
                Auto-scrape every 6 hours
              </p>
              <p className="text-xs text-[#a09890]">
                Automatically searches for new jobs using your profile
              </p>
            </div>
            <Switch
              checked={schedulerRunning}
              onCheckedChange={handleToggleScheduler}
              disabled={togglingScheduler}
            />
          </div>
          {lastScrapeTime && (
            <div className="flex items-center gap-2 text-xs text-[#6b6560] mb-3">
              <Clock className="w-3 h-3" />
              Last scrape: {new Date(lastScrapeTime).toLocaleString()}
            </div>
          )}
          <Button
            variant="outline"
            className="border-2 border-[#2d2d2d] sketch-btn"
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
            onClick={handleRunNow}
            disabled={scrapeLoading}
          >
            {scrapeLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Run Scrape Now
          </Button>
        </SettingsSection>

        {/* Scraping Info */}
        <SettingsSection title="Scraping Configuration">
          <p className="text-sm text-[#6b6560]">
            Job scraping uses python-jobspy. Supported sites: Indeed, LinkedIn,
            Glassdoor, Google, ZipRecruiter. Configure search terms and
            preferences on the{" "}
            <a href="/jobs" className="text-[#2d5da1] underline">
              Jobs page
            </a>
            .
          </p>
          <p className="text-xs text-[#a09890] mt-1">
            Requires Python 3.10+ with jobspy installed.
          </p>
        </SettingsSection>

        {/* Data Export */}
        <SettingsSection title="Data Export">
          <p className="text-sm text-[#6b6560] mb-3">
            Download your data for backup or analysis.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-2 border-[#2d2d2d] sketch-btn"
              style={{ borderRadius: "var(--radius-wobbly-sm)" }}
              onClick={() => handleExport("json")}
              disabled={exportLoading !== null}
            >
              {exportLoading === "json" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileJson className="w-4 h-4 mr-2" />
              )}
              Export as JSON
            </Button>
            <Button
              variant="outline"
              className="border-2 border-[#2d2d2d] sketch-btn"
              style={{ borderRadius: "var(--radius-wobbly-sm)" }}
              onClick={() => handleExport("csv")}
              disabled={exportLoading !== null}
            >
              {exportLoading === "csv" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Export as CSV
            </Button>
          </div>
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection title="Danger Zone" danger>
          <p className="text-sm text-[#6b6560] mb-3">
            Permanently delete all your data. This action cannot be undone.
          </p>
          <Button
            variant="destructive"
            className="border-2 border-[#ff4d4d] sketch-btn"
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete All Data
          </Button>
        </SettingsSection>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#ff4d4d]">
              <AlertTriangle className="w-5 h-5" />
              Delete All Data
            </DialogTitle>
            <DialogDescription>
              This will permanently delete:
            </DialogDescription>
          </DialogHeader>
          <ul className="text-sm text-[#2d2d2d] space-y-1 ml-4 list-disc">
            <li>Your profile and preferences</li>
            <li>All saved and scraped jobs</li>
            <li>All applications and tracking data</li>
            <li>All match scores and AI analysis</li>
            <li>All uploaded resumes and files</li>
            <li>Interview prep materials</li>
            <li>Chat history</li>
          </ul>
          <p className="text-sm font-bold text-[#ff4d4d] mt-2">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Yes, Delete Everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsSection({
  title,
  danger,
  children,
}: {
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`border-2 bg-white p-5 ${
        danger ? "border-[#ff4d4d]" : "border-[#2d2d2d]"
      }`}
      style={{
        borderRadius: "var(--radius-wobbly)",
        boxShadow: "var(--shadow-sketch-subtle)",
      }}
    >
      <h2
        className={`text-xl font-bold mb-3 ${
          danger ? "text-[#ff4d4d]" : "text-[#2d2d2d]"
        }`}
        style={{ fontFamily: "'Kalam', cursive" }}
      >
        {title}
      </h2>
      <Separator className="mb-3" />
      {children}
    </div>
  );
}
