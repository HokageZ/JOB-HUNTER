import type { UserProfile } from "@/types";

export function computeCompleteness(profile: Partial<UserProfile>): number {
  let score = 0;

  // Name — 2 points
  if (profile.name) score += 2;

  // Location (city + country) — 5 points
  if (profile.location?.city && profile.location?.country) score += 5;

  // Specialty — 10 points
  if (profile.specialty) score += 10;

  // Experience level — 10 points
  if (profile.experienceLevel) score += 10;

  // Years of experience — 5 points
  if (profile.yearsOfExperience !== undefined && profile.yearsOfExperience >= 0)
    score += 5;

  // Skills (3+) — 15 points
  const skillCount = profile.skills?.length ?? 0;
  if (skillCount >= 3) score += 15;
  // Skills (5+) — +5 bonus
  if (skillCount >= 5) score += 5;
  // Skills (10+) — +5 bonus
  if (skillCount >= 10) score += 5;

  // Desired roles (1+) — 15 points
  if (profile.desiredRoles && profile.desiredRoles.length >= 1) score += 15;

  // Remote preference set — 5 points
  if (profile.remotePreference) score += 5;

  // Desired locations set — 5 points
  if (profile.desiredLocations && profile.desiredLocations.length > 0)
    score += 5;

  // Salary range set — 8 points
  if (profile.salaryMin != null || profile.salaryMax != null) score += 8;

  // Education set — 5 points
  if (profile.education?.level) score += 5;

  // Resume uploaded — 10 points (checked by caller if a resume exists in DB)
  // Not checked here — caller should add 10 if resume exists

  return Math.min(score, 100);
}
