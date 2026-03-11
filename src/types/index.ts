// === ENUMS & TYPES ===

export type Specialty =
  | "software_engineering"
  | "data_science"
  | "machine_learning"
  | "devops"
  | "cybersecurity"
  | "product_management"
  | "ux_design"
  | "ui_design"
  | "graphic_design"
  | "marketing"
  | "sales"
  | "finance"
  | "accounting"
  | "healthcare"
  | "nursing"
  | "education"
  | "legal"
  | "hr"
  | "operations"
  | "customer_support"
  | "writing"
  | "journalism"
  | "architecture"
  | "mechanical_engineering"
  | "electrical_engineering"
  | "civil_engineering"
  | "project_management"
  | "consulting"
  | "research"
  | "copywriting"
  | "content_creation"
  | "real_estate"
  | "hospitality"
  | "manufacturing"
  | "social_work"
  | "administration"
  | "data_entry"
  | "logistics"
  | "other";

export type ExperienceLevel =
  | "student"
  | "entry"
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "executive";

export type RemotePreference = "remote" | "hybrid" | "onsite" | "any";

export type JobType = "fulltime" | "parttime" | "contract" | "internship" | "freelance";

export type CompanySizePreference = "startup" | "mid" | "enterprise" | "any";

export interface Education {
  level: "high_school" | "associate" | "bachelor" | "master" | "phd" | "bootcamp" | "self_taught" | "other";
  field?: string;
  school?: string;
  year?: number;
}

export interface UserProfile {
  name: string;
  email: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  languages: string[];

  specialty: Specialty;
  customSpecialty?: string;
  currentTitle: string;
  experienceLevel: ExperienceLevel;
  yearsOfExperience: number;
  education: Education;

  skills: string[];
  certifications: string[];
  tools: string[];

  desiredRoles: string[];
  desiredIndustries: string[];
  remotePreference: RemotePreference;
  desiredLocations: string[];
  willingToRelocate: boolean;
  sponsorshipNeeded: boolean;

  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryInterval: "yearly" | "monthly" | "weekly" | "daily" | "hourly";

  jobTypes: JobType[];
  companySize: CompanySizePreference;

  profileCompleteness: number;
  createdAt: string;
  updatedAt: string;
}

// === DATABASE ROW TYPES ===

export interface JobRow {
  id: number;
  external_id: string | null;
  source: string;
  hash: string;
  title: string;
  company: string | null;
  company_url: string | null;
  job_url: string;
  city: string | null;
  state: string | null;
  country: string | null;
  is_remote: number;
  description: string | null;
  job_type: string | null;
  job_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_interval: string | null;
  salary_currency: string | null;
  date_posted: string | null;
  date_scraped: string;
  skills: string | null;
  is_dismissed: number;
  created_at: string;
}

export interface MatchScoreRow {
  id: number;
  job_id: number;
  overall_score: number;
  skill_score: number;
  experience_score: number;
  location_score: number;
  salary_score: number;
  job_type_score: number;
  recency_score: number;
  reasoning: string | null;
  is_recommended: number;
  created_at: string;
}

export interface ApplicationRow {
  id: number;
  job_id: number;
  status: string;
  applied_date: string | null;
  resume_file: string | null;
  cover_letter: string | null;
  notes: string | null;
  rejection_reason: string | null;
  salary_offered: string | null;
  follow_up_date: string | null;
  interview_dates: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReminderRow {
  id: number;
  application_id: number;
  reminder_date: string;
  message: string;
  is_completed: number;
  created_at: string;
}

export interface ResumeRow {
  id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  raw_text: string | null;
  parsed_data: string | null;
  ai_review: string | null;
  ats_score: number | null;
  is_default: number;
  created_at: string;
  updated_at: string;
}

// === MATCH SCORING ===

export interface MatchResult {
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  locationScore: number;
  salaryScore: number;
  jobTypeScore: number;
  recencyScore: number;
  reasoning: string;
  isRecommended: boolean;
}

export interface MatchWeights {
  skill: number;
  experience: number;
  location: number;
  salary: number;
  jobType: number;
  recency: number;
}

export const DEFAULT_WEIGHTS: MatchWeights = {
  skill: 0.35,
  experience: 0.20,
  location: 0.15,
  salary: 0.15,
  jobType: 0.10,
  recency: 0.05,
};

// === APPLICATION STATUS ===

export const VALID_TRANSITIONS: Record<string, string[]> = {
  saved: ["applied", "withdrawn"],
  applied: ["screening", "interview", "rejected", "withdrawn"],
  screening: ["interview", "rejected", "withdrawn"],
  interview: ["offer", "rejected", "withdrawn"],
  offer: ["withdrawn"],
  rejected: [],
  withdrawn: [],
};

// === API RESPONSE CONTRACT ===

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
