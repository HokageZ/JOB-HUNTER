import { NextRequest, NextResponse } from "next/server";
import { readLogs, getLogModules, type LogLevel } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("mode"); // "stream" | "modules" | default

  if (mode === "modules") {
    return NextResponse.json({ modules: getLogModules() });
  }

  if (mode === "stream") {
    return streamLogs(request);
  }

  // Regular log read
  const lines = Math.min(
    parseInt(searchParams.get("lines") || "200", 10) || 200,
    2000
  );
  const level = searchParams.get("level") as LogLevel | null;
  const module = searchParams.get("module");

  const entries = readLogs({
    lines,
    level: level || undefined,
    module: module || undefined,
  });

  return NextResponse.json({ entries, total: entries.length });
}

function streamLogs(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const level = searchParams.get("level") as LogLevel | null;
  const module = searchParams.get("module");

  let lastCount = 0;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial batch
      const initial = readLogs({
        lines: 100,
        level: level || undefined,
        module: module || undefined,
      });
      lastCount = initial.length;

      const initData = `data: ${JSON.stringify({ entries: initial, type: "initial" })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initData));

      // Poll for new entries every 2 seconds
      const interval = setInterval(() => {
        if (closed) {
          clearInterval(interval);
          return;
        }

        try {
          const current = readLogs({
            lines: 500,
            level: level || undefined,
            module: module || undefined,
          });

          if (current.length > lastCount) {
            const newEntries = current.slice(lastCount);
            lastCount = current.length;

            const data = `data: ${JSON.stringify({ entries: newEntries, type: "update" })}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 2000);

      // Clean up when connection closes
      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
