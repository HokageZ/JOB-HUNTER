/**
 * API E2E Tests — tests all backend routes against a running dev server.
 *
 * Run with: npm run test:api
 * Requires: dev server running on localhost:3000
 */

const BASE = "http://localhost:3000";

async function api(
  path: string,
  opts?: RequestInit & { expectStatus?: number }
) {
  const { expectStatus = 200, ...fetchOpts } = opts ?? {};
  const res = await fetch(`${BASE}${path}`, fetchOpts);
  const body = res.headers.get("content-type")?.includes("json")
    ? await res.json()
    : await res.text();
  if (res.status !== expectStatus) {
    throw new Error(
      `${fetchOpts.method ?? "GET"} ${path}: expected ${expectStatus}, got ${res.status}\n${JSON.stringify(body, null, 2)}`
    );
  }
  return { status: res.status, body, headers: res.headers };
}

function json(data: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

function patch(data: unknown): RequestInit {
  return {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

function del(data?: unknown): RequestInit {
  return {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: data ? JSON.stringify(data) : undefined,
  };
}

// ── Test results tracking ──────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures: string[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: unknown) {
    failed++;
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`${name}: ${msg}`);
    console.error(`  ✗ ${name}`);
    console.error(`    ${msg}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

// ── Profile Tests ──────────────────────────────────────────────────
async function testProfile() {
  console.log("\n─── Profile API ───");

  await test("GET /api/profile returns null initially or existing", async () => {
    const { body } = await api("/api/profile");
    assert(body.success === true, "expected success: true");
  });

  await test("POST /api/profile creates profile", async () => {
    const profile = {
      name: "Test User",
      email: "test@example.com",
      currentTitle: "Software Engineer",
      yearsOfExperience: 5,
      experienceLevel: "mid",
      specialty: "software_engineering",
      languages: ["English"],
      desiredRoles: ["Frontend Developer", "Full Stack"],
      skills: ["JavaScript", "React", "TypeScript"],
      tools: ["VS Code", "Git"],
      certifications: [],
      location: { city: "Dubai", state: "", country: "UAE" },
      remotePreference: "remote",
      desiredLocations: ["UAE", "Remote"],
      education: { level: "bachelor", field: "Computer Science" },
      jobTypes: ["fulltime"],
    };
    const { body } = await api("/api/profile", json(profile));
    assert(body.success === true, "expected success: " + JSON.stringify(body));
    assert(body.data.name === "Test User", "name mismatch");
  });

  await test("GET /api/profile returns saved profile", async () => {
    const { body } = await api("/api/profile");
    assert(body.success === true, "expected success");
    assert(body.data !== null, "profile should exist");
    assert(body.data.name === "Test User", "name should match");
  });
}

// ── Jobs Tests ─────────────────────────────────────────────────────
async function testJobs() {
  console.log("\n─── Jobs API ───");

  await test("GET /api/jobs returns paginated list", async () => {
    const { body } = await api("/api/jobs");
    assert(body.success === true, "expected success");
    assert(Array.isArray(body.data.jobs), "jobs should be array");
    assert(typeof body.data.total === "number", "total should be number");
    assert(typeof body.data.page === "number", "page should be number");
  });

  await test("GET /api/jobs with query params", async () => {
    const { body } = await api("/api/jobs?page=1&limit=10&sortBy=date");
    assert(body.success === true, "expected success");
    assert(body.data.jobs.length <= 10, "should respect limit");
  });

  await test("GET /api/jobs with search filter", async () => {
    const { body } = await api("/api/jobs?search=nonexistentxyz123");
    assert(body.success === true, "expected success");
    assert(body.data.jobs.length === 0, "should return empty for nonsense search");
  });
}

// ── Stats Tests ────────────────────────────────────────────────────
async function testStats() {
  console.log("\n─── Stats API ───");

  await test("GET /api/stats returns dashboard stats", async () => {
    const { body } = await api("/api/stats");
    assert(body.success === true, "expected success");
    assert(typeof body.data.totalJobs === "number", "totalJobs should be number");
    assert(typeof body.data.applicationsSent === "number", "applicationsSent");
    assert(typeof body.data.responseRate === "number", "responseRate");
    assert(Array.isArray(body.data.funnel), "funnel should be array");
    assert(Array.isArray(body.data.weeklyApps), "weeklyApps should be array");
  });
}

// ── Resume Tests ───────────────────────────────────────────────────
async function testResume() {
  console.log("\n─── Resume API ───");

  await test("GET /api/resume returns list", async () => {
    const { body } = await api("/api/resume");
    assert(body.success === true, "expected success");
    assert(Array.isArray(body.data), "data should be array");
  });

  await test("POST /api/resume/upload rejects no file", async () => {
    const form = new FormData();
    const { body } = await api("/api/resume/upload", {
      method: "POST",
      body: form,
      expectStatus: 400,
    });
    assert(body.success === false, "should fail without file");
  });

  await test("POST /api/resume/upload accepts text file", async () => {
    const form = new FormData();
    const blob = new Blob(
      ["Test resume content\nSkills: JavaScript, Python\nExperience: 5 years"],
      { type: "text/plain" }
    );
    form.append("file", blob, "resume.txt");
    const { body } = await api("/api/resume/upload", {
      method: "POST",
      body: form,
      expectStatus: 201,
    });
    assert(body.success === true, "upload should succeed");
    assert(typeof body.data.id === "number", "should return id");
    assert(body.data.wordCount > 0, "should have word count");
  });
}

// ── Applications Tests ─────────────────────────────────────────────
async function testApplications() {
  console.log("\n─── Applications API ───");

  await test("GET /api/applications returns list", async () => {
    const { body } = await api("/api/applications");
    assert(body.success === true, "expected success");
    assert(Array.isArray(body.data), "data should be array");
  });

  // We need a job to create an application — check if any exist
  const { body: jobsBody } = await api("/api/jobs?limit=1");
  if (jobsBody.data.jobs.length > 0) {
    const jobId = jobsBody.data.jobs[0].id;

    await test("POST /api/applications creates application", async () => {
      // First dismiss and un-dismiss to ensure clean state
      const { body } = await api(
        "/api/applications",
        json({ jobId, status: "saved", notes: "Test application" })
      );
      // May fail if already exists (UNIQUE constraint), which is fine
      assert(body.success === true || body.error?.includes("UNIQUE"), "should create or already exist");
    });

    await test("GET /api/applications?status=saved returns filtered", async () => {
      const { body } = await api("/api/applications?status=saved");
      assert(body.success === true, "expected success");
    });
  } else {
    console.log("  ⊘ Skipping application create (no jobs in DB)");
  }
}

// ── Reminders Tests ────────────────────────────────────────────────
async function testReminders() {
  console.log("\n─── Reminders API ───");

  await test("GET /api/reminders returns list", async () => {
    const { body } = await api("/api/reminders");
    assert(body.success === true, "expected success");
    assert(Array.isArray(body.data), "data should be array");
  });
}

// ── Jobs Dismiss Tests ─────────────────────────────────────────────
async function testJobDismiss() {
  console.log("\n─── Job Dismiss API ───");

  const { body: jobsBody } = await api("/api/jobs?limit=1");
  if (jobsBody.data.jobs.length > 0) {
    const jobId = jobsBody.data.jobs[0].id;

    await test("POST /api/jobs/dismiss toggles dismissed state", async () => {
      const { body } = await api("/api/jobs/dismiss", json({ jobId }));
      assert(body.success === true, "expected success");
      assert(typeof body.data.dismissed === "boolean", "should return dismissed boolean");
    });

    // Toggle back
    await api("/api/jobs/dismiss", json({ jobId }));
  } else {
    console.log("  ⊘ Skipping dismiss (no jobs in DB)");
  }
}

// ── Match/Score Tests ──────────────────────────────────────────────
async function testMatch() {
  console.log("\n─── Match API ───");

  await test("POST /api/match scores jobs (requires profile)", async () => {
    // Ensure profile exists first
    const { body: profileBody } = await api("/api/profile");
    if (!profileBody.data) {
      console.log("    ⊘ Skipping match (no profile)");
      return;
    }
    const { body } = await api("/api/match", json({}));
    assert(body.success === true, "expected success");
    assert(typeof body.data.scored === "number", "scored count");
    assert(typeof body.data.recommended === "number", "recommended count");
  });
}

// ── Scraper Tests ─────────────────────────────────────────────────
async function testScraper() {
  console.log("\n─── Scraper API ───");

  await test("GET /api/scrape/scheduler returns status", async () => {
    const { body } = await api("/api/scrape/scheduler");
    assert(body.success === true, "expected success");
    assert(typeof body.data.running === "boolean", "running should be boolean");
  });
}

// ── Chat API Tests ─────────────────────────────────────────────────
async function testChat() {
  console.log("\n─── Chat API ───");

  await test("GET /api/ai/chat returns history", async () => {
    const { body } = await api("/api/ai/chat");
    assert(body.success === true, "expected success");
    assert(Array.isArray(body.data), "data should be array");
  });

  await test("DELETE /api/ai/chat clears history", async () => {
    const { body } = await api("/api/ai/chat", del());
    assert(body.success === true, "expected success");
  });
}

// ── Export Tests ────────────────────────────────────────────────────
async function testExport() {
  console.log("\n─── Export API ───");

  await test("POST /api/export JSON format", async () => {
    const res = await fetch(`${BASE}/api/export`, {
      ...json({ format: "json" }),
    });
    assert(res.status === 200, `expected 200, got ${res.status}`);
    const ct = res.headers.get("content-type") ?? "";
    assert(ct.includes("json"), "should be JSON content type");
  });

  await test("POST /api/export CSV format (or 400 if no apps)", async () => {
    const res = await fetch(`${BASE}/api/export`, {
      ...json({ format: "csv" }),
    });
    // Returns 200 with CSV data if apps exist, 400 if no applications
    assert(
      res.status === 200 || res.status === 400,
      `expected 200 or 400, got ${res.status}`
    );
  });
}

// ── Run All ────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   Job Hunter Agent — API E2E Tests      ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`\nTarget: ${BASE}`);

  // Verify server is running
  try {
    await fetch(BASE, { signal: AbortSignal.timeout(5000) });
  } catch {
    console.error("\n✗ Dev server is not running. Start it with: npm run dev");
    process.exit(1);
  }

  await testProfile();
  await testJobs();
  await testStats();
  await testResume();
  await testApplications();
  await testReminders();
  await testJobDismiss();
  await testMatch();
  await testScraper();
  await testChat();
  await testExport();

  console.log("\n══════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log("\n  Failures:");
    failures.forEach((f) => console.log(`    • ${f}`));
  }
  console.log("══════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

main();
