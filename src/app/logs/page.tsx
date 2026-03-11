"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  RefreshCw,
  Pause,
  Play,
  Trash2,
  ArrowDown,
} from "lucide-react";

interface LogEntry {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  module: string;
  message: string;
  data?: unknown;
}

const LEVEL_COLORS: Record<string, string> = {
  debug: "bg-gray-200 text-gray-700 border-gray-400",
  info: "bg-[#d1e7ff] text-[#2d5da1] border-[#2d5da1]",
  warn: "bg-[#fff3cd] text-[#856404] border-[#856404]",
  error: "bg-[#f8d7da] text-[#721c24] border-[#721c24]",
};

const TEXT_COLORS: Record<string, string> = {
  debug: "text-[#9ca3af]",
  info: "text-[#e5e7eb]",
  warn: "text-[#fbbf24]",
  error: "text-[#f87171]",
};

const DATA_COLOR = "text-[#6b7280]";

export default function LogsPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [streaming, setStreaming] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current && autoScroll) {
      const el = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [autoScroll]);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ lines: "500" });
      if (levelFilter !== "all") params.set("level", levelFilter);
      if (moduleFilter !== "all") params.set("module", moduleFilter);

      const res = await fetch(`/api/logs?${params}`);
      const data = await res.json();
      setEntries(data.entries || []);
      setTimeout(scrollToBottom, 50);
    } catch {
      // ignore
    }
  }, [levelFilter, moduleFilter, scrollToBottom]);

  const fetchModules = useCallback(async () => {
    try {
      const res = await fetch("/api/logs?mode=modules");
      const data = await res.json();
      setModules(data.modules || []);
    } catch {
      // ignore
    }
  }, []);

  // Start SSE stream
  const startStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const params = new URLSearchParams();
    params.set("mode", "stream");
    if (levelFilter !== "all") params.set("level", levelFilter);
    if (moduleFilter !== "all") params.set("module", moduleFilter);

    const es = new EventSource(`/api/logs?${params}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "initial") {
          setEntries(data.entries);
        } else if (data.type === "update") {
          setEntries((prev) => [...prev, ...data.entries]);
        }
        setTimeout(scrollToBottom, 50);
      } catch {
        // ignore
      }
    };

    es.onerror = () => {
      es.close();
      setStreaming(false);
    };

    setStreaming(true);
  }, [levelFilter, moduleFilter, scrollToBottom]);

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStreaming(false);
  }, []);

  // Initial load — start streaming by default
  useEffect(() => {
    fetchModules();
    startStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchModules]);

  // Re-fetch when filters change (non-streaming mode)
  useEffect(() => {
    if (!streaming) {
      fetchLogs();
    } else {
      // Restart stream with new filters
      stopStream();
      startStream();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelFilter, moduleFilter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return ts;
    }
  };

  const formatDate = (ts: string) => {
    try {
      return new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-2rem)] p-4 md:p-6 gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold text-[#2d2d2d] -rotate-1"
            style={{ fontFamily: "'Kalam', cursive" }}
          >
            System Logs
          </h1>
          <p
            className="text-sm text-[#6b6560]"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            {entries.length} entries
            {streaming && (
              <span className="ml-2 inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Level filter */}
          <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v ?? "all")}>
            <SelectTrigger
              className="w-[120px] border-2 border-[#2d2d2d] bg-white"
              style={{ borderRadius: "var(--radius-wobbly-sm)" }}
            >
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warn">Warn</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          {/* Module filter */}
          <Select value={moduleFilter} onValueChange={(v) => setModuleFilter(v ?? "all")}>
            <SelectTrigger
              className="w-[140px] border-2 border-[#2d2d2d] bg-white"
              style={{ borderRadius: "var(--radius-wobbly-sm)" }}
            >
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modules</SelectItem>
              {modules.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* Stream controls */}
          {streaming ? (
            <Button
              variant="outline"
              size="sm"
              onClick={stopStream}
              className="border-2 border-[#2d2d2d] bg-[#fff9c4]"
              style={{ borderRadius: "var(--radius-wobbly-sm)" }}
            >
              <Pause size={14} className="mr-1" />
              Pause
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={startStream}
              className="border-2 border-[#2d2d2d] bg-white hover:bg-[#d1e7ff]"
              style={{ borderRadius: "var(--radius-wobbly-sm)" }}
            >
              <Play size={14} className="mr-1" />
              Live
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={streaming}
            className="border-2 border-[#2d2d2d] bg-white"
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          >
            <RefreshCw size={14} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setEntries([])}
            className="border-2 border-[#2d2d2d] bg-white hover:bg-[#f8d7da]"
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Log viewer */}
      <div
        className="flex-1 border-[3px] border-[#2d2d2d] bg-transparent shadow-[4px_4px_0px_0px_#2d2d2d] overflow-hidden"
        style={{ borderRadius: "var(--radius-wobbly)" }}
      >
        <ScrollArea ref={scrollRef} className="h-full">
          <div className="p-3 font-mono text-sm space-y-0.5">
            {entries.length === 0 ? (
              <p className="text-[#6b7280] text-center py-12">
                No log entries yet. Backend operations will appear here.
              </p>
            ) : (
              entries.map((entry, i) => (
                <div
                  key={`${entry.timestamp}-${i}`}
                  className="flex items-start gap-2 py-0.5 hover:bg-[#2a2a2a] px-1 rounded"
                >
                  <span className="text-[#6b7280] shrink-0 text-xs mt-0.5">
                    {formatDate(entry.timestamp)} {formatTime(entry.timestamp)}
                  </span>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] px-1.5 py-0 uppercase font-bold border ${LEVEL_COLORS[entry.level]}`}
                  >
                    {entry.level}
                  </Badge>
                  <span className="text-[#61afef] shrink-0 text-xs mt-0.5">
                    [{entry.module}]
                  </span>
                  <span className={`${TEXT_COLORS[entry.level]} text-xs break-all`}>
                    {entry.message}
                    {entry.data !== undefined && (
                      <span className={`${DATA_COLOR} ml-1`}>
                        {typeof entry.data === "string"
                          ? entry.data
                          : JSON.stringify(entry.data)}
                      </span>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between">
        <p
          className="text-xs text-[#6b6560]"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          Logs stored in data/logs/ — kept for 7 days
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setAutoScroll(!autoScroll);
            if (!autoScroll) scrollToBottom();
          }}
          className={`text-xs ${autoScroll ? "text-[#2d5da1]" : "text-gray-400"}`}
        >
          <ArrowDown size={12} className="mr-1" />
          Auto-scroll {autoScroll ? "on" : "off"}
        </Button>
      </div>
    </div>
  );
}
