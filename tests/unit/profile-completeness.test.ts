import { describe, it, expect } from "vitest";
import { computeCompleteness } from "@/lib/profile-completeness";

describe("profile-completeness", () => {
  it("returns 0 for empty profile", () => {
    expect(computeCompleteness({})).toBe(0);
  });

  it("scores name (2 pts)", () => {
    expect(computeCompleteness({ name: "John" })).toBe(2);
  });

  it("scores location (5 pts)", () => {
    const score = computeCompleteness({
      location: { city: "Dubai", state: "", country: "UAE" },
    });
    expect(score).toBe(5);
  });

  it("does not score partial location", () => {
    const score = computeCompleteness({
      location: { city: "Dubai", state: "", country: "" },
    });
    expect(score).toBe(0);
  });

  it("scores specialty (10 pts)", () => {
    expect(computeCompleteness({ specialty: "software_engineering" })).toBe(10);
  });

  it("scores experience level (10 pts)", () => {
    expect(computeCompleteness({ experienceLevel: "senior" })).toBe(10);
  });

  it("scores skills with tiers", () => {
    // 3 skills = 15pts
    expect(
      computeCompleteness({ skills: ["JS", "TS", "React"] })
    ).toBe(15);

    // 5 skills = 15 + 5 = 20pts
    expect(
      computeCompleteness({ skills: ["JS", "TS", "React", "Node", "CSS"] })
    ).toBe(20);

    // 10 skills = 15 + 5 + 5 = 25pts
    expect(
      computeCompleteness({
        skills: Array.from({ length: 10 }, (_, i) => `skill${i}`),
      })
    ).toBe(25);
  });

  it("scores desired roles (15 pts)", () => {
    expect(
      computeCompleteness({ desiredRoles: ["Frontend Developer"] })
    ).toBe(15);
  });

  it("scores remote preference (5 pts)", () => {
    expect(computeCompleteness({ remotePreference: "remote" })).toBe(5);
  });

  it("scores salary range (8 pts)", () => {
    expect(computeCompleteness({ salaryMin: 50000 })).toBe(8);
  });

  it("scores education (5 pts)", () => {
    expect(
      computeCompleteness({ education: { level: "bachelor" } })
    ).toBe(5);
  });

  it("caps at 100", () => {
    const full = computeCompleteness({
      name: "Test",
      specialty: "software_engineering",
      experienceLevel: "senior",
      yearsOfExperience: 10,
      skills: Array.from({ length: 15 }, (_, i) => `s${i}`),
      desiredRoles: ["Dev"],
      remotePreference: "remote",
      desiredLocations: ["US"],
      salaryMin: 100000,
      education: { level: "master" },
      location: { city: "NYC", state: "NY", country: "US" },
    });
    expect(full).toBeLessThanOrEqual(100);
  });
});
