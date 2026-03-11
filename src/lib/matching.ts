import { extractSkillsFromText } from "@/lib/skill-extraction";
import type {
  UserProfile,
  JobRow,
  MatchResult,
  MatchWeights,
  RemotePreference,
  JobType,
} from "@/types";
import { DEFAULT_WEIGHTS } from "@/types";

// === RELATED SKILLS MAP ===

const RELATED_SKILLS: Record<string, string[]> = {
  javascript: ["js", "ecmascript", "es6"],
  typescript: ["ts"],
  react: ["react.js", "reactjs"],
  "node.js": ["node", "nodejs"],
  python: ["python3", "py"],
  postgresql: ["postgres", "psql"],
  mongodb: ["mongo"],
  kubernetes: ["k8s"],
  docker: ["containers", "containerization"],
  aws: ["amazon web services"],
  gcp: ["google cloud", "google cloud platform"],
  "ci/cd": [
    "continuous integration",
    "continuous deployment",
    "github actions",
    "jenkins",
  ],
  "machine learning": ["ml", "deep learning", "ai"],
  "c#": ["csharp", "c sharp"],
  "c++": ["cpp"],
  ".net": ["dotnet"],
  "next.js": ["nextjs"],
  "vue": ["vue.js", "vuejs"],
  angular: ["angularjs"],
  "ruby on rails": ["rails"],
  sql: ["structured query language"],
  nosql: ["non-relational"],
  redis: ["redis cache"],
  elasticsearch: ["elastic"],
  terraform: ["iac", "infrastructure as code"],
  agile: ["scrum", "kanban"],
};

function hasRelatedSkill(skill: string, userSet: Set<string>): boolean {
  // Check if user has a related skill
  for (const [canonical, aliases] of Object.entries(RELATED_SKILLS)) {
    if (skill === canonical || aliases.includes(skill)) {
      if (userSet.has(canonical)) return true;
      for (const alias of aliases) {
        if (userSet.has(alias)) return true;
      }
    }
  }
  return false;
}

// === SCORING FUNCTIONS ===

export function scoreSkillMatch(
  userSkills: string[],
  jobDescription: string | null,
  jobSkillsRaw: string | null
): number {
  const userSet = new Set(userSkills.map((s) => s.toLowerCase()));

  const jobSkills = jobSkillsRaw
    ? jobSkillsRaw.split(",").map((s) => s.trim().toLowerCase())
    : [];

  const extracted = extractSkillsFromText(jobDescription || "");

  const jobSet = new Set([...jobSkills, ...extracted]);

  if (jobSet.size === 0) return 50;

  let matches = 0;
  for (const skill of jobSet) {
    if (userSet.has(skill) || hasRelatedSkill(skill, userSet)) {
      matches++;
    }
  }

  const matchRatio = matches / jobSet.size;
  return Math.min(100, Math.round(matchRatio * 120));
}

const LEVEL_ORDER = [
  "student",
  "entry",
  "junior",
  "mid",
  "senior",
  "lead",
  "executive",
];

function normalizeJobLevel(jobLevel: string): string {
  const text = jobLevel.toLowerCase();
  if (text.includes("intern") || text.includes("co-op")) return "student";
  if (
    text.includes("entry") ||
    text.includes("new grad") ||
    text.includes("associate")
  )
    return "entry";
  if (
    text.includes("junior") ||
    text.includes("jr") ||
    text.includes("i ") ||
    text.endsWith(" i")
  )
    return "junior";
  if (
    text.includes("senior") ||
    text.includes("sr") ||
    text.includes("iii") ||
    text.includes(" 3")
  )
    return "senior";
  if (
    text.includes("lead") ||
    text.includes("principal") ||
    text.includes("staff") ||
    text.includes("architect")
  )
    return "lead";
  if (
    text.includes("director") ||
    text.includes("vp") ||
    text.includes("head") ||
    text.includes("chief")
  )
    return "executive";
  if (text.includes("mid") || text.includes(" ii") || text.includes(" 2"))
    return "mid";
  return "mid";
}

export function scoreExperienceMatch(
  userLevel: string,
  jobLevel: string | null
): number {
  if (!jobLevel) return 60;

  const userIndex = LEVEL_ORDER.indexOf(userLevel);
  const jobIndex = LEVEL_ORDER.indexOf(normalizeJobLevel(jobLevel));

  if (jobIndex === -1) return 60;

  const diff = Math.abs(userIndex - jobIndex);

  switch (diff) {
    case 0:
      return 100;
    case 1:
      return 70;
    case 2:
      return 40;
    default:
      return 10;
  }
}

export function scoreLocationFit(
  userLocations: string[],
  userRemotePref: RemotePreference,
  jobCity: string | null,
  jobState: string | null,
  jobCountry: string | null,
  jobIsRemote: boolean
): number {
  if (
    jobIsRemote &&
    (userRemotePref === "remote" || userRemotePref === "any")
  ) {
    return 100;
  }

  if (jobIsRemote && userRemotePref === "onsite") return 20;
  if (!jobIsRemote && userRemotePref === "remote") return 20;

  for (const userLoc of userLocations) {
    const normalizedUserLoc = userLoc.toLowerCase();
    const city = (jobCity || "").toLowerCase();
    const state = (jobState || "").toLowerCase();
    const country = (jobCountry || "").toLowerCase();

    if (city.length > 0 && normalizedUserLoc.includes(city)) return 100;
    if (state.length > 0 && normalizedUserLoc.includes(state)) return 80;
    if (country.length > 0 && normalizedUserLoc.includes(country)) return 60;
  }

  return 30;
}

function normalizeToAnnual(amount: number, interval: string | null): number {
  switch (interval) {
    case "hourly":
      return amount * 2080;
    case "monthly":
      return amount * 12;
    case "weekly":
      return amount * 52;
    case "daily":
      return amount * 260;
    default:
      return amount;
  }
}

export function scoreSalaryFit(
  userMin: number | null,
  userMax: number | null,
  jobMin: number | null,
  jobMax: number | null,
  jobInterval: string | null
): number {
  if (!userMin && !userMax) return 60;
  if (!jobMin && !jobMax) return 45;

  const annualJobMin = normalizeToAnnual(jobMin || 0, jobInterval);
  const annualJobMax = normalizeToAnnual(
    jobMax || annualJobMin,
    jobInterval
  );
  const annualUserMin = userMin || 0;
  const annualUserMax = userMax || annualUserMin * 1.5;

  if (annualJobMax >= annualUserMin && annualJobMin <= annualUserMax) {
    const overlapMin = Math.max(annualJobMin, annualUserMin);
    const overlapMax = Math.min(annualJobMax, annualUserMax);
    const overlapSize = overlapMax - overlapMin;
    const userRangeSize = annualUserMax - annualUserMin || 1;
    const overlapRatio = overlapSize / userRangeSize;

    return Math.min(100, Math.round(60 + overlapRatio * 40));
  }

  if (annualJobMin > annualUserMax) return 80;

  if (annualJobMax < annualUserMin) {
    const gap = (annualUserMin - annualJobMax) / annualUserMin;
    if (gap < 0.1) return 50;
    if (gap < 0.25) return 30;
    return 10;
  }

  return 50;
}

export function scoreJobTypeFit(
  userRemotePref: RemotePreference,
  userJobTypes: JobType[],
  jobIsRemote: boolean,
  jobType: string | null
): number {
  let score = 50;

  if (userRemotePref === "remote" && jobIsRemote) score += 25;
  if (userRemotePref === "onsite" && !jobIsRemote) score += 25;
  if (userRemotePref === "any") score += 15;

  if (jobType && userJobTypes.includes(jobType as JobType)) score += 25;
  if (!jobType) score += 10;

  return Math.min(100, score);
}

export function scoreRecency(datePosted: string | null): number {
  if (!datePosted) return 30;

  const hoursAgo =
    (Date.now() - new Date(datePosted).getTime()) / 3_600_000;

  if (hoursAgo <= 24) return 100;
  if (hoursAgo <= 72) return 85;
  if (hoursAgo <= 168) return 65;
  if (hoursAgo <= 720) return 40;
  return 15;
}

// === COMBINED SCORE ===

export function calculateMatchScore(
  profile: UserProfile,
  job: JobRow,
  weights?: MatchWeights
): MatchResult {
  const w = weights || DEFAULT_WEIGHTS;

  const skillScore = scoreSkillMatch(
    profile.skills,
    job.description,
    job.skills
  );
  const experienceScore = scoreExperienceMatch(
    profile.experienceLevel,
    job.job_level
  );
  const locationScore = scoreLocationFit(
    profile.desiredLocations,
    profile.remotePreference,
    job.city,
    job.state,
    job.country,
    job.is_remote === 1
  );
  const salaryScore = scoreSalaryFit(
    profile.salaryMin,
    profile.salaryMax,
    job.salary_min,
    job.salary_max,
    job.salary_interval
  );
  const jobTypeScore = scoreJobTypeFit(
    profile.remotePreference,
    profile.jobTypes,
    job.is_remote === 1,
    job.job_type
  );
  const recencyScore = scoreRecency(job.date_posted);

  const overallScore = Math.round(
    skillScore * w.skill +
      experienceScore * w.experience +
      locationScore * w.location +
      salaryScore * w.salary +
      jobTypeScore * w.jobType +
      recencyScore * w.recency
  );

  return {
    overallScore,
    skillScore,
    experienceScore,
    locationScore,
    salaryScore,
    jobTypeScore,
    recencyScore,
    reasoning: "",
    isRecommended: overallScore >= 60,
  };
}
