import type { UserProfile, ExperienceLevel } from "@/types";

export interface SearchQuery {
  term: string;
  priority: number;
}

const LEVEL_PREFIX_MAP: Record<ExperienceLevel, string[]> = {
  student: ["intern", "internship", "co-op"],
  entry: ["junior", "entry level", "new grad", "associate"],
  junior: ["junior", "jr"],
  mid: [],
  senior: ["senior", "sr", "staff"],
  lead: ["lead", "principal", "staff", "architect"],
  executive: ["director", "vp", "head of", "chief"],
};

function deduplicateQueries(queries: SearchQuery[]): SearchQuery[] {
  const seen = new Set<string>();
  return queries.filter((q) => {
    const key = q.term.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function generateSearchQueries(profile: UserProfile): SearchQuery[] {
  const queries: SearchQuery[] = [];

  // 1. Direct role queries
  for (const role of profile.desiredRoles) {
    queries.push({ term: role, priority: 1 });
  }

  // 2. Level-prefixed role queries
  const levelPrefixes = LEVEL_PREFIX_MAP[profile.experienceLevel] ?? [];
  for (const role of profile.desiredRoles) {
    for (const prefix of levelPrefixes) {
      if (!role.toLowerCase().includes(prefix.toLowerCase())) {
        queries.push({ term: `${prefix} ${role}`, priority: 2 });
      }
    }
  }

  // 3. Skill-based queries (top 3 skills)
  const topSkills = profile.skills.slice(0, 3);
  for (const skill of topSkills) {
    queries.push({ term: `${skill} developer`, priority: 3 });
    queries.push({ term: `${skill} engineer`, priority: 3 });
  }

  // 4. Industry-specific modifiers
  if (profile.desiredIndustries && profile.desiredIndustries.length > 0) {
    for (const role of profile.desiredRoles.slice(0, 2)) {
      for (const industry of profile.desiredIndustries.slice(0, 2)) {
        queries.push({ term: `${role} ${industry}`, priority: 4 });
      }
    }
  }

  // Deduplicate and sort by priority, then cap at 8
  return deduplicateQueries(queries)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 8);
}

export function buildIndeedQuery(profile: UserProfile): string {
  const parts: string[] = [];

  if (profile.desiredRoles.length > 0) {
    parts.push(`"${profile.desiredRoles[0]}"`);
  }

  if (profile.skills.length > 0) {
    const skillGroup = profile.skills.slice(0, 3).join(" OR ");
    parts.push(`(${skillGroup})`);
  }

  if (
    profile.experienceLevel === "entry" ||
    profile.experienceLevel === "junior"
  ) {
    parts.push('(junior OR "entry level" OR "new grad")');
    parts.push("-senior -lead -principal -director");
  }

  if (profile.remotePreference === "remote") {
    parts.push("remote");
  }

  return parts.join(" ");
}

export function buildGoogleQuery(profile: UserProfile): string {
  const role = profile.desiredRoles[0] ?? profile.currentTitle;
  const location =
    profile.desiredLocations[0] ??
    (profile.location.city
      ? `${profile.location.city}, ${profile.location.country || profile.location.state}`
      : profile.location.country || "");

  return `${role} jobs near ${location}`;
}
