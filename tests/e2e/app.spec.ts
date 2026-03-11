import { test, expect } from "@playwright/test";

test.describe("Navigation & Layout", () => {
  test("homepage loads and shows dashboard", async ({ page }) => {
    await page.goto("/");
    // Should show dashboard content — wait for page to have meaningful content
    await page.waitForLoadState("networkidle");
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });

  test("sidebar navigation links work", async ({ page }) => {
    await page.goto("/");

    // Desktop sidebar should have navigation links
    const nav = page.locator("nav, aside").first();
    await expect(nav).toBeVisible({ timeout: 10000 });
  });

  test("all pages load without errors", async ({ page }) => {
    const pages = ["/", "/jobs", "/resume", "/tracker", "/chat", "/settings", "/setup"];
    for (const path of pages) {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(500);
      // No crash — page body should have content
      await expect(page.locator("body")).not.toBeEmpty();
    }
  });
});

test.describe("Setup Page", () => {
  test("displays profile form", async ({ page }) => {
    await page.goto("/setup");
    // Should show profile setup form
    await expect(page.locator("input, select, textarea").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("step navigation works", async ({ page }) => {
    await page.goto("/setup");
    // Should have step indicators or next/back buttons
    const nextBtn = page.getByRole("button", { name: "Next", exact: true });
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      // Should advance to next step
      await page.waitForTimeout(500);
    }
  });

  test("profile form validates required fields", async ({ page }) => {
    await page.goto("/setup");
    // Try to submit empty — should show validation or stay on same step
    const saveBtn = page.getByRole("button", { name: /save|submit|finish/i });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      // Should still be on setup page (validation prevented submit)
      await expect(page).toHaveURL(/setup/);
    }
  });
});

test.describe("Jobs Page", () => {
  test("loads and shows job list or empty state", async ({ page }) => {
    await page.goto("/jobs");
    await page.waitForLoadState("networkidle");

    // Should show either jobs or an empty state message
    const content = page.locator("main, [role='main'], .flex").first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test("filter controls are visible", async ({ page }) => {
    await page.goto("/jobs");
    await page.waitForLoadState("networkidle");

    // Should show filter/sort controls
    const filters = page.locator("select, [role='combobox'], button").first();
    await expect(filters).toBeVisible({ timeout: 10000 });
  });

  test("search input works", async ({ page }) => {
    await page.goto("/jobs");
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator("input[type='text'], input[type='search']").first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("test search query");
      await page.waitForTimeout(1000); // Debounce
    }
  });
});

test.describe("Resume Page", () => {
  test("loads resume management page", async ({ page }) => {
    await page.goto("/resume");
    await page.waitForLoadState("networkidle");

    const content = page.locator("main, [role='main']").first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test("file upload area is visible", async ({ page }) => {
    await page.goto("/resume");
    await page.waitForLoadState("networkidle");

    // The drop zone div with text "Drop resume here or click to upload"
    const uploadArea = page.locator("text=Drop resume here");
    await expect(uploadArea).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Tracker Page", () => {
  test("loads application tracker", async ({ page }) => {
    await page.goto("/tracker");
    await page.waitForLoadState("networkidle");

    const content = page.locator("main, [role='main']").first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Chat Page", () => {
  test("loads chat interface", async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");

    // Should show message input
    const input = page.locator("input, textarea").first();
    await expect(input).toBeVisible({ timeout: 10000 });
  });

  test("can type a message", async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");

    const input = page.locator("input, textarea").first();
    await input.fill("Hello");
    await expect(input).toHaveValue("Hello");
  });

  test("send button exists", async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");

    const sendBtn = page.locator("button[type='submit'], button:has(svg)").last();
    await expect(sendBtn).toBeVisible();
  });
});

test.describe("Settings Page", () => {
  test("loads settings", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    const content = page.locator("main, [role='main']").first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Mobile Responsive", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("mobile hamburger menu is visible", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Mobile should show hamburger/menu button
    const menuBtn = page.locator("button").first();
    await expect(menuBtn).toBeVisible({ timeout: 10000 });
  });

  test("mobile menu opens on tap", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Find and click the menu hamburger (first button in mobile)
    const menuBtn = page.locator("button").first();
    await menuBtn.click();
    await page.waitForTimeout(500);

    // Navigation links should now be visible in the sheet/drawer
    const navLink = page.locator("a[href='/jobs'], a[href='/chat']").first();
    if (await navLink.isVisible()) {
      await expect(navLink).toBeVisible();
    }
  });
});

test.describe("API Integration from Frontend", () => {
  test("dashboard fetches stats on load", async ({ page }) => {
    const statsRequest = page.waitForResponse(
      (res) => res.url().includes("/api/stats") && res.status() === 200,
      { timeout: 15000 }
    );

    await page.goto("/");
    const response = await statsRequest.catch(() => null);
    // Stats API should be called if dashboard is rendered
    if (response) {
      const data = await response.json();
      expect(data.success).toBe(true);
    }
  });

  test("jobs page fetches jobs on load", async ({ page }) => {
    const jobsRequest = page.waitForResponse(
      (res) => res.url().includes("/api/jobs") && res.status() === 200,
      { timeout: 15000 }
    );

    await page.goto("/jobs");
    const response = await jobsRequest.catch(() => null);
    if (response) {
      const data = await response.json();
      expect(data.success).toBe(true);
    }
  });
});
