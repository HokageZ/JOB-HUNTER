import { describe, it, expect } from "vitest";
import { jobHash, queryHash } from "@/lib/dedup";

describe("dedup — jobHash", () => {
  it("produces consistent hash for same inputs", () => {
    const h1 = jobHash("Software Engineer", "Google", "NYC", "NY");
    const h2 = jobHash("Software Engineer", "Google", "NYC", "NY");
    expect(h1).toBe(h2);
  });

  it("is case-insensitive", () => {
    const h1 = jobHash("SOFTWARE ENGINEER", "GOOGLE", "nyc", "ny");
    const h2 = jobHash("software engineer", "google", "NYC", "NY");
    expect(h1).toBe(h2);
  });

  it("ignores special characters", () => {
    const h1 = jobHash("Sr. Engineer!", "Google, Inc.", "NYC", "NY");
    const h2 = jobHash("Sr Engineer", "Google Inc", "NYC", "NY");
    expect(h1).toBe(h2);
  });

  it("produces different hashes for different jobs", () => {
    const h1 = jobHash("Software Engineer", "Google", "NYC", "NY");
    const h2 = jobHash("Product Manager", "Meta", "SF", "CA");
    expect(h1).not.toBe(h2);
  });

  it("returns 16-char hex string", () => {
    const h = jobHash("Test", "Co", "City", "ST");
    expect(h).toHaveLength(16);
    expect(h).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe("dedup — queryHash", () => {
  it("produces consistent hash", () => {
    const h1 = queryHash("frontend developer", "remote", ["indeed"]);
    const h2 = queryHash("frontend developer", "remote", ["indeed"]);
    expect(h1).toBe(h2);
  });

  it("is order-insensitive for sites", () => {
    const h1 = queryHash("dev", "us", ["indeed", "linkedin"]);
    const h2 = queryHash("dev", "us", ["linkedin", "indeed"]);
    expect(h1).toBe(h2);
  });
});
