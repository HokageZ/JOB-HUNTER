import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  isSchedulerRunning,
  getLastScrapeTime,
  startScheduler,
  stopScheduler,
  scheduledScrape,
} from "@/lib/scheduler";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        running: isSchedulerRunning(),
        lastScrapeTime: getLastScrapeTime(),
      },
    });
  } catch (error) {
    logger.error("api:scheduler", "GET error", error);
    return NextResponse.json(
      { success: false, error: "Failed to get scheduler status" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body as { action?: string };

    if (action === "start") {
      startScheduler();
      return NextResponse.json({ success: true, data: { running: true } });
    }

    if (action === "stop") {
      stopScheduler();
      return NextResponse.json({ success: true, data: { running: false } });
    }

    if (action === "run-now") {
      const result = await scheduledScrape();
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "start", "stop", or "run-now".' },
      { status: 400 }
    );
  } catch (error) {
    logger.error("api:scheduler", "POST error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Scheduler operation failed",
      },
      { status: 500 }
    );
  }
}
