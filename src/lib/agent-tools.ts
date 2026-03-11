import { getDb } from "@/lib/db";

// === Tool Definitions ===

export interface ToolDef {
  name: string;
  description: string;
  args: string[];
  requiresPermission: boolean;
  permissionLabel: (args: string[]) => string;
}

export const TOOLS: ToolDef[] = [
  {
    name: "search_jobs",
    description: "Search the local jobs database by keyword. Returns matching jobs with title, company, and match score.",
    args: ["query"],
    requiresPermission: false,
    permissionLabel: () => "",
  },
  {
    name: "view_profile",
    description: "View the user's full profile including skills, experience, desired roles, and preferences.",
    args: [],
    requiresPermission: false,
    permissionLabel: () => "",
  },
  {
    name: "view_applications",
    description: "View the user's job applications and their statuses.",
    args: [],
    requiresPermission: false,
    permissionLabel: () => "",
  },
  {
    name: "view_resume",
    description: "View the user's default resume text.",
    args: [],
    requiresPermission: false,
    permissionLabel: () => "",
  },
  {
    name: "update_profile",
    description: "Update a field in the user's profile. Field can be: name, currentTitle, experienceLevel, desiredRoles (comma-separated), skills (comma-separated), remotePreference (remote/hybrid/onsite/any).",
    args: ["field", "value"],
    requiresPermission: true,
    permissionLabel: (args) => `Update your profile: set "${args[0]}" to "${args[1]}"`,
  },
  {
    name: "dismiss_job",
    description: "Dismiss/hide a job from the feed by its ID.",
    args: ["jobId"],
    requiresPermission: true,
    permissionLabel: (args) => `Dismiss job #${args[0]} from your feed`,
  },
  {
    name: "add_application_note",
    description: "Add a note to an existing application by its ID.",
    args: ["applicationId", "note"],
    requiresPermission: true,
    permissionLabel: (args) => `Add a note to application #${args[0]}`,
  },
  {
    name: "search_web",
    description: "Search the internet for information. Good for salary data, company info, interview tips, industry trends.",
    args: ["query"],
    requiresPermission: false,
    permissionLabel: () => "",
  },
];

export function getToolDef(name: string): ToolDef | undefined {
  return TOOLS.find((t) => t.name === name);
}

// === System prompt with tool instructions ===

export function buildToolInstructions(): string {
  const toolList = TOOLS.map(
    (t) =>
      `- ${t.name}(${t.args.join(", ")}): ${t.description}${t.requiresPermission ? " [REQUIRES PERMISSION]" : ""}`
  ).join("\n");

  return `You have access to these tools to help the user. To call a tool, respond with EXACTLY this format on its own line:

<tool>tool_name|arg1|arg2</tool>

Available tools:
${toolList}

RULES:
- Only call ONE tool per response
- After calling a tool, STOP and wait for the result. Do not add any other text.
- If you don't need a tool, respond normally with text
- For tools marked [REQUIRES PERMISSION], the user will be asked for approval first
- Never fabricate tool results — only use actual data returned to you
- When you receive tool results, incorporate them naturally into your response`;
}

// === Tool Execution ===

export interface ToolResult {
  success: boolean;
  data: string;
}

export async function executeTool(
  name: string,
  args: string[]
): Promise<ToolResult> {
  const db = getDb();

  switch (name) {
    case "search_jobs": {
      const query = args[0] || "";
      const jobs = db
        .prepare(
          `SELECT j.id, j.title, j.company, j.city, j.country, j.is_remote, j.job_type,
                  ms.overall_score
           FROM jobs j
           LEFT JOIN match_scores ms ON ms.job_id = j.id
           WHERE j.is_dismissed = 0
             AND (j.title LIKE ? OR j.company LIKE ? OR j.description LIKE ?)
           ORDER BY ms.overall_score DESC NULLS LAST
           LIMIT 10`
        )
        .all(`%${query}%`, `%${query}%`, `%${query}%`) as {
        id: number;
        title: string;
        company: string | null;
        city: string | null;
        country: string | null;
        is_remote: number;
        job_type: string | null;
        overall_score: number | null;
      }[];

      if (jobs.length === 0) {
        return { success: true, data: `No jobs found matching "${query}".` };
      }

      const lines = jobs.map(
        (j) =>
          `[#${j.id}] ${j.title} at ${j.company || "Unknown"} | ${j.city || ""} ${j.country || ""} ${j.is_remote ? "(Remote)" : ""} | ${j.job_type || ""} | Match: ${j.overall_score ?? "unscored"}`
      );
      return { success: true, data: `Found ${jobs.length} jobs:\n${lines.join("\n")}` };
    }

    case "view_profile": {
      const row = db
        .prepare("SELECT data FROM profile WHERE id = 1")
        .get() as { data: string } | undefined;

      if (!row) return { success: true, data: "No profile set up yet." };

      try {
        const p = JSON.parse(row.data);
        const loc = p.location;
        const locationStr = loc
          ? [loc.city, loc.state, loc.country].filter(Boolean).join(", ")
          : "Not set";
        const lines = [
          `Name: ${p.name || p.fullName || "Not set"}`,
          `Specialty: ${p.specialty || "Not set"}`,
          `Current Title: ${p.currentTitle || "Not set"}`,
          `Experience: ${p.experienceLevel || "?"} (${p.yearsOfExperience ?? "?"} years)`,
          `Skills: ${(p.skills || []).join(", ") || "None"}`,
          `Tools: ${(p.tools || []).join(", ") || "None"}`,
          `Certifications: ${(p.certifications || []).join(", ") || "None"}`,
          `Location: ${locationStr}`,
          `Languages: ${(p.languages || []).join(", ") || "Not set"}`,
          `Desired Roles: ${(p.desiredRoles || []).join(", ") || "Not set"}`,
          `Remote Preference: ${p.remotePreference || "any"}`,
          `Desired Locations: ${(p.desiredLocations || []).join(", ") || "Any"}`,
          `Salary: ${p.salaryCurrency || ""} ${p.salaryMin || "?"}-${p.salaryMax || "?"} ${p.salaryInterval || ""}`,
          `Job Types: ${(p.jobTypes || []).join(", ") || "Any"}`,
          `Education: ${p.education?.level || "?"} ${p.education?.field ? `in ${p.education.field}` : ""}`,
          `Willing to Relocate: ${p.willingToRelocate ? "Yes" : "No"}`,
          `Needs Sponsorship: ${p.sponsorshipNeeded ? "Yes" : "No"}`,
        ];
        return { success: true, data: lines.join("\n") };
      } catch {
        return { success: false, data: "Could not parse profile data." };
      }
    }

    case "view_applications": {
      const apps = db
        .prepare(
          `SELECT a.id, a.status, a.applied_date, a.notes, j.title, j.company
           FROM applications a
           JOIN jobs j ON a.job_id = j.id
           ORDER BY a.applied_date DESC LIMIT 15`
        )
        .all() as {
        id: number;
        status: string;
        applied_date: string | null;
        notes: string | null;
        title: string;
        company: string;
      }[];

      if (apps.length === 0) return { success: true, data: "No applications yet." };

      const lines = apps.map(
        (a) =>
          `[#${a.id}] ${a.title} at ${a.company} — ${a.status} (${a.applied_date?.slice(0, 10) || "?"})`
      );
      return { success: true, data: `${apps.length} applications:\n${lines.join("\n")}` };
    }

    case "view_resume": {
      const resume = db
        .prepare(
          "SELECT raw_text FROM resumes WHERE is_default = 1 ORDER BY created_at DESC LIMIT 1"
        )
        .get() as { raw_text: string } | undefined;

      if (!resume?.raw_text) return { success: true, data: "No resume uploaded yet." };
      return { success: true, data: resume.raw_text.slice(0, 2000) };
    }

    case "update_profile": {
      const [field, value] = args;
      const row = db
        .prepare("SELECT data FROM profile WHERE id = 1")
        .get() as { data: string } | undefined;

      if (!row) return { success: false, data: "No profile exists to update." };

      try {
        const profile = JSON.parse(row.data);
        const arrayFields = ["desiredRoles", "skills", "tools", "certifications", "desiredLocations", "jobTypes", "languages"];

        if (arrayFields.includes(field)) {
          profile[field] = value.split(",").map((s: string) => s.trim()).filter(Boolean);
        } else if (field === "yearsOfExperience") {
          profile[field] = parseInt(value, 10);
        } else if (field === "willingToRelocate" || field === "sponsorshipNeeded") {
          profile[field] = value.toLowerCase() === "true" || value === "yes";
        } else {
          profile[field] = value;
        }

        db.prepare("UPDATE profile SET data = ? WHERE id = 1").run(
          JSON.stringify(profile)
        );
        return { success: true, data: `Profile updated: ${field} = ${value}` };
      } catch {
        return { success: false, data: "Failed to update profile." };
      }
    }

    case "dismiss_job": {
      const jobId = parseInt(args[0], 10);
      if (isNaN(jobId)) return { success: false, data: "Invalid job ID." };

      const result = db
        .prepare("UPDATE jobs SET is_dismissed = 1 WHERE id = ?")
        .run(jobId);

      return result.changes > 0
        ? { success: true, data: `Job #${jobId} dismissed.` }
        : { success: false, data: `Job #${jobId} not found.` };
    }

    case "add_application_note": {
      const appId = parseInt(args[0], 10);
      const note = args[1] || "";
      if (isNaN(appId)) return { success: false, data: "Invalid application ID." };

      const app = db
        .prepare("SELECT notes FROM applications WHERE id = ?")
        .get(appId) as { notes: string | null } | undefined;

      if (!app) return { success: false, data: `Application #${appId} not found.` };

      const updated = app.notes ? `${app.notes}\n${note}` : note;
      db.prepare("UPDATE applications SET notes = ? WHERE id = ?").run(
        updated,
        appId
      );
      return { success: true, data: `Note added to application #${appId}.` };
    }

    case "search_web": {
      const query = args[0] || "";
      try {
        const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`;
        const res = await fetch(url);
        const data = await res.json();

        const results: string[] = [];
        if (data.AbstractText) {
          results.push(`Summary: ${data.AbstractText}`);
        }
        if (data.RelatedTopics?.length > 0) {
          const topics = data.RelatedTopics.slice(0, 5);
          for (const t of topics) {
            if (t.Text) results.push(`- ${t.Text}`);
          }
        }
        if (results.length === 0) {
          return { success: true, data: `No instant results found for "${query}". Try a more specific search.` };
        }
        return { success: true, data: results.join("\n") };
      } catch {
        return { success: false, data: "Web search failed. Try again later." };
      }
    }

    default:
      return { success: false, data: `Unknown tool: ${name}` };
  }
}

// === Parse tool calls from AI response ===

export interface ParsedToolCall {
  name: string;
  args: string[];
}

export function parseToolCall(text: string): ParsedToolCall | null {
  const match = text.match(/<tool>([^<]+)<\/tool>/);
  if (!match) return null;

  const parts = match[1].split("|");
  const name = parts[0]?.trim();
  const args = parts.slice(1).map((a) => a.trim());

  if (!name || !getToolDef(name)) return null;
  return { name, args };
}
