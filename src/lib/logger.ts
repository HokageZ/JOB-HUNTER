import fs from "fs";
import path from "path";

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOGS_DIR = path.join(process.cwd(), "data", "logs");
const MAX_LOG_FILES = 7;

function getMinLevel(): LogLevel {
  const env = process.env.LOG_LEVEL?.toLowerCase();
  if (env && env in LEVEL_PRIORITY) return env as LogLevel;
  return "info";
}

function getLogFilePath(): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(LOGS_DIR, `app-${date}.log`);
}

function ensureLogsDir(): void {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function rotateOldLogs(): void {
  try {
    if (!fs.existsSync(LOGS_DIR)) return;
    const files = fs
      .readdirSync(LOGS_DIR)
      .filter((f) => f.startsWith("app-") && f.endsWith(".log"))
      .sort()
      .reverse();

    for (const file of files.slice(MAX_LOG_FILES)) {
      fs.unlinkSync(path.join(LOGS_DIR, file));
    }
  } catch {
    // best-effort cleanup
  }
}

function formatForConsole(entry: LogEntry): string {
  const levelTag = entry.level.toUpperCase().padEnd(5);
  const dataStr =
    entry.data !== undefined ? ` ${JSON.stringify(entry.data)}` : "";
  return `${entry.timestamp} ${levelTag} [${entry.module}] ${entry.message}${dataStr}`;
}

function formatForFile(entry: LogEntry): string {
  return JSON.stringify(entry);
}

function writeToFile(line: string): void {
  try {
    ensureLogsDir();
    fs.appendFileSync(getLogFilePath(), line + "\n", "utf-8");
  } catch {
    // don't crash app if logging fails
  }
}

// Rotate once on startup
let rotated = false;

function log(level: LogLevel, module: string, message: string, data?: unknown): void {
  const minLevel = getMinLevel();
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[minLevel]) return;

  if (!rotated) {
    rotated = true;
    rotateOldLogs();
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    ...(data !== undefined && { data }),
  };

  // Console output (human-readable)
  const consoleLine = formatForConsole(entry);
  if (level === "error") {
    console.error(consoleLine);
  } else if (level === "warn") {
    console.warn(consoleLine);
  } else {
    console.log(consoleLine);
  }

  // File output (JSON, one entry per line for easy parsing)
  writeToFile(formatForFile(entry));
}

export const logger = {
  debug: (module: string, message: string, data?: unknown) =>
    log("debug", module, message, data),
  info: (module: string, message: string, data?: unknown) =>
    log("info", module, message, data),
  warn: (module: string, message: string, data?: unknown) =>
    log("warn", module, message, data),
  error: (module: string, message: string, data?: unknown) =>
    log("error", module, message, data),
};

/** Read log entries from log files. */
export function readLogs(options?: {
  lines?: number;
  level?: LogLevel;
  module?: string;
}): LogEntry[] {
  const maxLines = options?.lines ?? 200;

  try {
    if (!fs.existsSync(LOGS_DIR)) return [];

    const files = fs
      .readdirSync(LOGS_DIR)
      .filter((f) => f.startsWith("app-") && f.endsWith(".log"))
      .sort()
      .reverse(); // most recent first

    const entries: LogEntry[] = [];

    for (const file of files) {
      if (entries.length >= maxLines) break;

      const content = fs.readFileSync(path.join(LOGS_DIR, file), "utf-8");
      const lines = content.trim().split("\n").filter(Boolean).reverse();

      for (const line of lines) {
        if (entries.length >= maxLines) break;

        try {
          const entry = JSON.parse(line) as LogEntry;

          if (options?.level && entry.level !== options.level) continue;
          if (
            options?.module &&
            !entry.module.toLowerCase().includes(options.module.toLowerCase())
          )
            continue;

          entries.push(entry);
        } catch {
          // skip malformed lines
        }
      }
    }

    return entries.reverse(); // chronological order
  } catch {
    return [];
  }
}

/** List distinct modules from recent logs */
export function getLogModules(): string[] {
  const entries = readLogs({ lines: 1000 });
  const modules = new Set(entries.map((e) => e.module));
  return [...modules].sort();
}
