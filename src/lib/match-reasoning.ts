import { chatWithRetry, type ChatMessage } from "@/lib/openrouter";
import { logger } from "@/lib/logger";
import type { UserProfile, JobRow, MatchResult } from "@/types";

interface ScoredJob {
  job: JobRow;
  result: MatchResult;
}

function buildBatchReasoningPrompt(
  profile: UserProfile,
  batch: ScoredJob[]
): ChatMessage[] {
  const jobSummaries = batch
    .map(
      (item, i) => `
Job ${i + 1}:
- Title: ${item.job.title}
- Company: ${item.job.company || "Unknown"}
- Location: ${[item.job.city, item.job.state, item.job.country].filter(Boolean).join(", ") || "Unknown"}
- Remote: ${item.job.is_remote ? "Yes" : "No"}
- Score: ${item.result.overallScore}/100
- Skills: ${item.result.skillScore}/100
- Experience: ${item.result.experienceScore}/100
- Location: ${item.result.locationScore}/100
- Salary: ${item.result.salaryScore}/100`
    )
    .join("\n");

  return [
    {
      role: "system" as const,
      content:
        "You are a job matching expert. Write concise, honest explanations for why each job matches or doesn't match a user's profile. Return valid JSON only.",
    },
    {
      role: "user" as const,
      content: `Given this user profile and job listings, write a 1-2 sentence explanation for each job.

User Profile:
- Desired roles: ${profile.desiredRoles.join(", ")}
- Level: ${profile.experienceLevel} (${profile.yearsOfExperience} years)
- Skills: ${profile.skills.slice(0, 10).join(", ")}
- Remote preference: ${profile.remotePreference}
- Desired locations: ${profile.desiredLocations.join(", ") || "Any"}

Jobs:
${jobSummaries}

Return JSON: { "reasons": ["reason for job 1", "reason for job 2", ...] }
Start each reason with the strongest factor.`,
    },
  ];
}

interface ReasonsResponse {
  reasons: string[];
}

export async function generateMatchReasons(
  profile: UserProfile,
  scoredJobs: ScoredJob[]
): Promise<Map<number, string>> {
  const reasonsMap = new Map<number, string>();

  // Only generate for recommended jobs (score >= 60)
  const recommended = scoredJobs.filter((j) => j.result.isRecommended);
  if (recommended.length === 0) return reasonsMap;

  // Batch into groups of 5
  for (let i = 0; i < recommended.length; i += 5) {
    const batch = recommended.slice(i, i + 5);

    try {
      const messages = buildBatchReasoningPrompt(profile, batch);
      const response = await chatWithRetry(messages, {
        temperature: 0.5,
        maxTokens: 1024,
      });

      // Parse JSON from response
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || [
        null,
        response,
      ];
      const jsonStr = jsonMatch[1]?.trim() || response.trim();
      const parsed = JSON.parse(jsonStr) as ReasonsResponse;

      if (parsed.reasons && Array.isArray(parsed.reasons)) {
        batch.forEach((item, idx) => {
          if (parsed.reasons[idx]) {
            reasonsMap.set(item.job.id, parsed.reasons[idx]);
          }
        });
      }
    } catch (err) {
      // Graceful degradation — deterministic scores still work
      logger.warn("match-reasoning", "Failed to generate batch reasons", err);
    }
  }

  return reasonsMap;
}
