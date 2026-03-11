"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "@/components/tag-input";
import { toast } from "sonner";
import {
  SKILL_SUGGESTIONS,
  EXPERIENCE_DESCRIPTIONS,
  basicInfoSchema,
  professionalSchema,
  skillsSchema,
  preferencesSchema,
  type ProfileFormData,
} from "@/lib/schemas/profile";
import type { Specialty, ExperienceLevel } from "@/types";

const SPECIALTIES: { value: Specialty; label: string }[] = [
  { value: "software_engineering", label: "Software Engineering" },
  { value: "data_science", label: "Data Science" },
  { value: "machine_learning", label: "Machine Learning" },
  { value: "devops", label: "DevOps" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "product_management", label: "Product Management" },
  { value: "ux_design", label: "UX Design" },
  { value: "ui_design", label: "UI Design" },
  { value: "graphic_design", label: "Graphic Design" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "copywriting", label: "Copywriting" },
  { value: "content_creation", label: "Content Creation" },
  { value: "finance", label: "Finance" },
  { value: "accounting", label: "Accounting" },
  { value: "real_estate", label: "Real Estate" },
  { value: "healthcare", label: "Healthcare" },
  { value: "nursing", label: "Nursing" },
  { value: "social_work", label: "Social Work" },
  { value: "education", label: "Education" },
  { value: "legal", label: "Legal" },
  { value: "hr", label: "Human Resources" },
  { value: "operations", label: "Operations" },
  { value: "hospitality", label: "Hospitality" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "logistics", label: "Logistics" },
  { value: "administration", label: "Administration" },
  { value: "data_entry", label: "Data Entry" },
  { value: "customer_support", label: "Customer Support" },
  { value: "writing", label: "Writing" },
  { value: "journalism", label: "Journalism" },
  { value: "architecture", label: "Architecture" },
  { value: "mechanical_engineering", label: "Mechanical Engineering" },
  { value: "electrical_engineering", label: "Electrical Engineering" },
  { value: "civil_engineering", label: "Civil Engineering" },
  { value: "project_management", label: "Project Management" },
  { value: "consulting", label: "Consulting" },
  { value: "research", label: "Research" },
  { value: "other", label: "Other" },
];

const EDUCATION_LEVELS = [
  { value: "high_school", label: "High School" },
  { value: "associate", label: "Associate Degree" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "phd", label: "PhD / Doctorate" },
  { value: "bootcamp", label: "Bootcamp" },
  { value: "self_taught", label: "Self-Taught" },
  { value: "other", label: "Other" },
];

const COUNTRIES = [
  "Argentina", "Australia", "Austria", "Bahrain", "Bangladesh", "Belgium", "Brazil",
  "Canada", "Chile", "China", "Colombia", "Czech Republic", "Denmark",
  "Egypt", "Finland", "France", "Germany", "Ghana", "Greece", "Hungary",
  "India", "Indonesia", "Iraq", "Ireland", "Israel", "Italy", "Japan", "Jordan", "Kenya", "Kuwait",
  "Lebanon", "Malaysia", "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria",
  "Norway", "Oman", "Pakistan", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Saudi Arabia", "Singapore", "South Africa", "South Korea",
  "Spain", "Sweden", "Switzerland", "Thailand", "Tunisia", "Turkey", "UAE",
  "UK", "USA", "Vietnam", "Other",
];

const JOB_TYPES = [
  { value: "fulltime", label: "Full-time" },
  { value: "parttime", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
] as const;

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "entry", label: "Entry Level" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Staff" },
  { value: "executive", label: "Executive" },
];

const DEFAULT_PROFILE: ProfileFormData = {
  name: "",
  email: "",
  location: { city: "", state: "", country: "" },
  languages: ["English"],
  specialty: "software_engineering",
  customSpecialty: "",
  currentTitle: "",
  experienceLevel: "mid",
  yearsOfExperience: 3,
  education: { level: "bachelor" },
  skills: [],
  certifications: [],
  tools: [],
  desiredRoles: [],
  desiredIndustries: [],
  remotePreference: "any",
  desiredLocations: [],
  willingToRelocate: false,
  sponsorshipNeeded: false,
  salaryMin: null,
  salaryMax: null,
  salaryCurrency: "USD",
  salaryInterval: "yearly",
  jobTypes: ["fulltime"],
  companySize: "any",
  profileCompleteness: 0,
};

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<ProfileFormData>(DEFAULT_PROFILE);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setProfile({ ...DEFAULT_PROFILE, ...res.data });
          setIsEdit(true);
        }
      })
      .catch(() => {});
  }, []);

  function update<K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K]
  ) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    // Clear error for this field when user updates it
    setStepErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validateStep(currentStep: number): boolean {
    const schemas = [null, basicInfoSchema, professionalSchema, skillsSchema, preferencesSchema];
    const schema = schemas[currentStep];
    if (!schema) return true;

    const result = schema.safeParse(profile);
    if (result.success) {
      setStepErrors({});
      return true;
    }

    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".");
      if (!errors[key]) {
        errors[key] = issue.message;
      }
    }
    setStepErrors(errors);
    return false;
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep((s) => s + 1);
      setStepErrors({});
    }
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile saved!");
        router.push("/");
      } else {
        toast.error(data.error || "Failed to save profile");
      }
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  const stepProgress = (step / 5) * 100;

  return (
    <div>
      <h1
        className="text-4xl md:text-5xl font-bold text-[#2d2d2d] -rotate-1 mb-4"
        style={{ fontFamily: "'Kalam', cursive" }}
      >
        {isEdit ? "Edit Profile" : "Profile Setup"}
      </h1>

      <div className="mb-8">
        <div className="flex justify-between text-sm text-[#6b6560] mb-2">
          <span>Step {step} of 5</span>
          <span>{Math.round(stepProgress)}%</span>
        </div>
        <Progress value={stepProgress} className="h-3 border-2 border-[#2d2d2d]" />
        <div className="flex justify-between mt-2">
          {["Basics", "Experience", "Skills", "Preferences", "Review"].map(
            (name, i) => (
              <span
                key={name}
                className={`text-xs ${
                  i + 1 === step
                    ? "font-bold text-[#2d2d2d]"
                    : i + 1 < step
                      ? "text-[#2d5da1]"
                      : "text-[#d1cdc7]"
                }`}
              >
                {name}
              </span>
            )
          )}
        </div>
      </div>

      <div
        className="border-2 border-[#2d2d2d] bg-white p-6 md:p-8"
        style={{
          borderRadius: "var(--radius-wobbly)",
          boxShadow: "var(--shadow-sketch-subtle)",
        }}
      >
        {step === 1 && (
          <BasicInfoStep profile={profile} update={update} errors={stepErrors} />
        )}
        {step === 2 && (
          <ProfessionalStep profile={profile} update={update} errors={stepErrors} />
        )}
        {step === 3 && (
          <SkillsStep profile={profile} update={update} errors={stepErrors} />
        )}
        {step === 4 && (
          <PreferencesStep profile={profile} update={update} errors={stepErrors} />
        )}
        {step === 5 && (
          <ReviewStep profile={profile} />
        )}
      </div>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
          className="border-2 border-[#2d2d2d] text-lg h-12 px-6 sketch-btn"
          style={{ borderRadius: "var(--radius-wobbly-sm)" }}
        >
          Back
        </Button>

        {step < 5 ? (
          <Button
            onClick={handleNext}
            className="bg-[#2d2d2d] text-white text-lg h-12 px-6 sketch-btn"
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#ff4d4d] text-white text-lg h-12 px-6 sketch-btn hover:bg-[#ff4d4d]"
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          >
            {saving ? "Saving..." : "Finish & Save"}
          </Button>
        )}
      </div>
    </div>
  );
}

// === STEP COMPONENTS ===

interface StepProps {
  profile: ProfileFormData;
  update: <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => void;
  errors: Record<string, string>;
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-sm text-[#ff4d4d] mt-1">{error}</p>;
}

function BasicInfoStep({ profile, update, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <h2
        className="text-2xl font-bold text-[#2d2d2d]"
        style={{ fontFamily: "'Kalam', cursive" }}
      >
        Basic Info
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-lg">Name *</Label>
          <Input
            value={profile.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Your full name"
            className={`border-2 ${errors.name ? "border-[#ff4d4d]" : "border-[#2d2d2d]"} text-lg h-12 mt-1`}
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          />
          <FieldError error={errors.name} />
        </div>

        <div>
          <Label className="text-lg">Email</Label>
          <Input
            type="email"
            value={profile.email || ""}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@email.com"
            className="border-2 border-[#2d2d2d] text-lg h-12 mt-1"
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-lg">City *</Label>
          <Input
            value={profile.location.city}
            onChange={(e) =>
              update("location", { ...profile.location, city: e.target.value })
            }
            placeholder="Your city"
            className={`border-2 ${errors["location.city"] ? "border-[#ff4d4d]" : "border-[#2d2d2d]"} text-lg h-12 mt-1`}
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          />
          <FieldError error={errors["location.city"]} />
        </div>

        <div>
          <Label className="text-lg">State / Province</Label>
          <Input
            value={profile.location.state}
            onChange={(e) =>
              update("location", { ...profile.location, state: e.target.value })
            }
            placeholder="Region (optional)"
            className="border-2 border-[#2d2d2d] text-lg h-12 mt-1"
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          />
        </div>

        <div>
          <Label className="text-lg">Country *</Label>
          <Select
            value={profile.location.country}
            onValueChange={(v) =>
              update("location", { ...profile.location, country: v ?? "" })
            }
          >
            <SelectTrigger
              className={`border-2 ${errors["location.country"] ? "border-[#ff4d4d]" : "border-[#2d2d2d]"} text-lg h-12 mt-1`}
              style={{ borderRadius: "var(--radius-wobbly-sm)" }}
            >
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError error={errors["location.country"]} />
        </div>
      </div>

      <div>
        <Label className="text-lg">Languages *</Label>
        <TagInput
          value={profile.languages}
          onChange={(v) => update("languages", v)}
          suggestions={[
            "English", "Spanish", "French", "German", "Portuguese",
            "Chinese", "Japanese", "Korean", "Arabic", "Hindi",
            "Russian", "Italian", "Dutch", "Swedish", "Turkish",
          ]}
          placeholder="Add a language..."
        />
        <FieldError error={errors.languages} />
      </div>
    </div>
  );
}

function ProfessionalStep({ profile, update, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <h2
        className="text-2xl font-bold text-[#2d2d2d]"
        style={{ fontFamily: "'Kalam', cursive" }}
      >
        Professional Identity
      </h2>

      <div>
        <Label className="text-lg">What field are you in? *</Label>
        <Select
          value={profile.specialty}
          onValueChange={(v) => update("specialty", (v ?? "software_engineering") as Specialty)}
        >
          <SelectTrigger
            className="border-2 border-[#2d2d2d] text-lg h-12 mt-1"
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          >
            <SelectValue placeholder="Select your field" />
          </SelectTrigger>
          <SelectContent>
            {SPECIALTIES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {profile.specialty === "other" && (
        <div>
          <Label className="text-lg">Custom Specialty</Label>
          <Input
            value={profile.customSpecialty || ""}
            onChange={(e) => update("customSpecialty", e.target.value)}
            placeholder="Your field..."
            className="border-2 border-[#2d2d2d] text-lg h-12 mt-1"
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          />
        </div>
      )}

      <div>
        <Label className="text-lg">Current / Most Recent Job Title *</Label>
        <Input
          value={profile.currentTitle}
          onChange={(e) => update("currentTitle", e.target.value)}
          placeholder="Your current or most recent title"
          className={`border-2 ${errors.currentTitle ? "border-[#ff4d4d]" : "border-[#2d2d2d]"} text-lg h-12 mt-1`}
          style={{ borderRadius: "var(--radius-wobbly-sm)" }}
        />
        <FieldError error={errors.currentTitle} />
      </div>

      <div>
        <Label className="text-lg mb-3 block">Experience Level *</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {EXPERIENCE_LEVELS.map((el) => (
            <button
              key={el.value}
              type="button"
              onClick={() => update("experienceLevel", el.value)}
              className={`text-left p-3 border-2 transition-all duration-100 ${
                profile.experienceLevel === el.value
                  ? "border-[#2d2d2d] bg-[#fff9c4] shadow-[3px_3px_0px_0px_#2d2d2d]"
                  : "border-[#e5e0d8] hover:border-[#2d2d2d]"
              }`}
              style={{ borderRadius: "var(--radius-wobbly-sm)" }}
            >
              <span className="font-bold text-lg">{el.label}</span>
              <p className="text-sm text-[#6b6560]">
                {EXPERIENCE_DESCRIPTIONS[el.value]}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-lg">
          Years of Experience: {profile.yearsOfExperience}
        </Label>
        <Slider
          value={[profile.yearsOfExperience]}
          onValueChange={(v) => update("yearsOfExperience", Array.isArray(v) ? v[0] : v)}
          min={0}
          max={40}
          step={1}
          className="mt-3"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-lg">Highest Education *</Label>
          <Select
            value={profile.education.level}
            onValueChange={(v) =>
              update("education", {
                ...profile.education,
                level: (v ?? "bachelor") as ProfileFormData["education"]["level"],
              })
            }
          >
            <SelectTrigger
              className="border-2 border-[#2d2d2d] text-lg h-12 mt-1"
              style={{ borderRadius: "var(--radius-wobbly-sm)" }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EDUCATION_LEVELS.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-lg">Field of Study</Label>
          <Input
            value={profile.education.field || ""}
            onChange={(e) =>
              update("education", { ...profile.education, field: e.target.value })
            }
            placeholder="Your field of study"
            className="border-2 border-[#2d2d2d] text-lg h-12 mt-1"
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          />
        </div>
      </div>
    </div>
  );
}

function SkillsStep({ profile, update, errors }: StepProps) {
  const suggestions = SKILL_SUGGESTIONS[profile.specialty] || [];

  return (
    <div className="space-y-6">
      <h2
        className="text-2xl font-bold text-[#2d2d2d]"
        style={{ fontFamily: "'Kalam', cursive" }}
      >
        Skills & Expertise
      </h2>

      <div>
        <Label className="text-lg">
          Core Skills * (min 3) — {profile.skills.length} added
        </Label>
        <TagInput
          value={profile.skills}
          onChange={(v) => update("skills", v)}
          suggestions={suggestions}
          placeholder="Type a skill and press Enter..."
        />
        <FieldError error={errors.skills} />
      </div>

      <div>
        <Label className="text-lg">Tools & Software</Label>
        <TagInput
          value={profile.tools}
          onChange={(v) => update("tools", v)}
          placeholder="Tools you use daily..."
        />
      </div>

      <div>
        <Label className="text-lg">Certifications</Label>
        <TagInput
          value={profile.certifications}
          onChange={(v) => update("certifications", v)}
          placeholder="Your certifications..."
        />
      </div>
    </div>
  );
}

function PreferencesStep({ profile, update, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <h2
        className="text-2xl font-bold text-[#2d2d2d]"
        style={{ fontFamily: "'Kalam', cursive" }}
      >
        Job Preferences
      </h2>

      <div>
        <Label className="text-lg">Desired Job Titles * (min 1)</Label>
        <TagInput
          value={profile.desiredRoles}
          onChange={(v) => update("desiredRoles", v)}
          maxTags={5}
          placeholder="Your target job title..."
        />
        <FieldError error={errors.desiredRoles} />
      </div>

      <div>
        <Label className="text-lg mb-3 block">Remote Preference *</Label>
        <div className="flex flex-wrap gap-2">
          {(["remote", "hybrid", "onsite", "any"] as const).map((pref) => (
            <button
              key={pref}
              type="button"
              onClick={() => update("remotePreference", pref)}
              className={`px-4 py-2 border-2 text-lg capitalize transition-all duration-100 ${
                profile.remotePreference === pref
                  ? "border-[#2d2d2d] bg-[#fff9c4] shadow-[3px_3px_0px_0px_#2d2d2d]"
                  : "border-[#e5e0d8] hover:border-[#2d2d2d]"
              }`}
              style={{ borderRadius: "var(--radius-wobbly-sm)" }}
            >
              {pref}
            </button>
          ))}
        </div>
      </div>

      {profile.remotePreference !== "remote" && (
        <div>
          <Label className="text-lg">Desired Locations</Label>
          <TagInput
            value={profile.desiredLocations}
            onChange={(v) => update("desiredLocations", v)}
            placeholder="City, Country..."
          />
        </div>
      )}

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            checked={profile.willingToRelocate}
            onCheckedChange={(v) => update("willingToRelocate", v)}
          />
          <Label className="text-lg">Open to relocation</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={profile.sponsorshipNeeded}
            onCheckedChange={(v) => update("sponsorshipNeeded", v)}
          />
          <Label className="text-lg">Need visa sponsorship</Label>
        </div>
      </div>

      <div>
        <Label className="text-lg mb-3 block">Job Types * (select all that apply)</Label>
        <div className="flex flex-wrap gap-3">
          {JOB_TYPES.map((jt) => (
            <label
              key={jt.value}
              className="flex items-center gap-2 text-lg cursor-pointer"
            >
              <Checkbox
                checked={profile.jobTypes.includes(jt.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    update("jobTypes", [...profile.jobTypes, jt.value]);
                  } else {
                    update(
                      "jobTypes",
                      profile.jobTypes.filter((t) => t !== jt.value)
                    );
                  }
                }}
              />
              {jt.label}
            </label>
          ))}
        </div>
        <FieldError error={errors.jobTypes} />
      </div>

      <div>
        <Label className="text-lg mb-3 block">Company Size</Label>
        <div className="flex flex-wrap gap-2">
          {(["startup", "mid", "enterprise", "any"] as const).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => update("companySize", size)}
              className={`px-4 py-2 border-2 text-lg capitalize transition-all duration-100 ${
                profile.companySize === size
                  ? "border-[#2d2d2d] bg-[#fff9c4] shadow-[3px_3px_0px_0px_#2d2d2d]"
                  : "border-[#e5e0d8] hover:border-[#2d2d2d]"
              }`}
              style={{ borderRadius: "var(--radius-wobbly-sm)" }}
            >
              {size === "mid" ? "Mid-size" : size}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label className="text-lg">Min Salary</Label>
          <Input
            type="number"
            value={profile.salaryMin ?? ""}
            onChange={(e) =>
              update("salaryMin", e.target.value ? Number(e.target.value) : null)
            }
            placeholder="50000"
            className="border-2 border-[#2d2d2d] text-lg h-12 mt-1"
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          />
        </div>
        <div>
          <Label className="text-lg">Target Salary</Label>
          <Input
            type="number"
            value={profile.salaryMax ?? ""}
            onChange={(e) =>
              update("salaryMax", e.target.value ? Number(e.target.value) : null)
            }
            placeholder="80000"
            className="border-2 border-[#2d2d2d] text-lg h-12 mt-1"
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          />
        </div>
        <div>
          <Label className="text-lg">Currency</Label>
          <Select
            value={profile.salaryCurrency}
            onValueChange={(v) => update("salaryCurrency", v ?? "USD")}
          >
            <SelectTrigger
              className="border-2 border-[#2d2d2d] text-lg h-12 mt-1"
              style={{ borderRadius: "var(--radius-wobbly-sm)" }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY", "CHF", "SEK", "NOK", "BRL", "SGD", "AED", "KRW", "MXN", "PLN", "ZAR", "TRY", "NZD", "PHP", "MYR", "THB", "IDR", "EGP", "NGN", "KES"].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-lg">Pay Period</Label>
          <Select
            value={profile.salaryInterval}
            onValueChange={(v) => update("salaryInterval", (v ?? "yearly") as ProfileFormData["salaryInterval"])}
          >
            <SelectTrigger
              className="border-2 border-[#2d2d2d] text-lg h-12 mt-1"
              style={{ borderRadius: "var(--radius-wobbly-sm)" }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                { value: "yearly", label: "Yearly" },
                { value: "monthly", label: "Monthly" },
                { value: "weekly", label: "Weekly" },
                { value: "daily", label: "Daily" },
                { value: "hourly", label: "Hourly" },
              ].map((i) => (
                <SelectItem key={i.value} value={i.value}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-xs text-[#b5b0a8] -mt-2">
        Optional — helps filter and match jobs by salary range
      </p>
    </div>
  );
}

function ReviewStep({ profile }: { profile: ProfileFormData }) {
  return (
    <div className="space-y-6">
      <h2
        className="text-2xl font-bold text-[#2d2d2d]"
        style={{ fontFamily: "'Kalam', cursive" }}
      >
        Review & Finish
      </h2>

      <div className="space-y-4">
        <ReviewSection title="Basic Info">
          <p><strong>Name:</strong> {profile.name || "—"}</p>
          <p><strong>Location:</strong> {[profile.location.city, profile.location.state, profile.location.country].filter(Boolean).join(", ") || "—"}</p>
          <p><strong>Languages:</strong> {profile.languages.join(", ") || "—"}</p>
        </ReviewSection>

        <ReviewSection title="Professional">
          <p><strong>Field:</strong> {SPECIALTIES.find((s) => s.value === profile.specialty)?.label}</p>
          <p><strong>Title:</strong> {profile.currentTitle || "—"}</p>
          <p><strong>Experience:</strong> {profile.experienceLevel} ({profile.yearsOfExperience} years)</p>
          <p><strong>Education:</strong> {EDUCATION_LEVELS.find((e) => e.value === profile.education.level)?.label}{profile.education.field ? ` in ${profile.education.field}` : ""}</p>
        </ReviewSection>

        <ReviewSection title="Skills">
          <p><strong>Skills:</strong> {profile.skills.join(", ") || "—"}</p>
          <p><strong>Tools:</strong> {profile.tools.join(", ") || "—"}</p>
          <p><strong>Certs:</strong> {profile.certifications.join(", ") || "—"}</p>
        </ReviewSection>

        <ReviewSection title="Preferences">
          <p><strong>Desired Roles:</strong> {profile.desiredRoles.join(", ") || "—"}</p>
          <p><strong>Remote:</strong> {profile.remotePreference}</p>
          <p><strong>Job Types:</strong> {profile.jobTypes.join(", ")}</p>
          {(profile.salaryMin || profile.salaryMax) && (
            <p><strong>Salary:</strong> {profile.salaryMin ?? "?"} – {profile.salaryMax ?? "?"} {profile.salaryCurrency}/{profile.salaryInterval}</p>
          )}
        </ReviewSection>
      </div>

      <p className="text-[#6b6560] text-lg">
        Click &quot;Finish & Save&quot; to save your profile. You can always come back and edit it later.
      </p>
    </div>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="border-2 border-[#e5e0d8] p-4"
      style={{ borderRadius: "var(--radius-wobbly-sm)" }}
    >
      <h3
        className="text-xl font-bold text-[#2d2d2d] mb-2"
        style={{ fontFamily: "'Kalam', cursive" }}
      >
        {title}
      </h3>
      <div className="space-y-1 text-lg">{children}</div>
    </div>
  );
}
