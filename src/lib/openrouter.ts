interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const DEFAULT_MODEL = "stepfun/step-3.5-flash:free";
const FALLBACK_MODELS = [
  "stepfun/step-3.5-flash:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "arcee-ai/trinity-mini:free",
];

export async function chat(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === "sk-or-replace-with-your-key") {
    throw new Error("OPENROUTER_API_KEY is not set in .env.local");
  }

  const model = options.model || DEFAULT_MODEL;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Job Hunter AI Agent",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function chatWithRetry(
  messages: ChatMessage[],
  options: ChatOptions = {},
  retries = 3
): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const model =
        attempt === 0
          ? options.model || DEFAULT_MODEL
          : FALLBACK_MODELS[attempt % FALLBACK_MODELS.length];

      return await chat(messages, { ...options, model });
    } catch (error) {
      console.error(`[openrouter] Attempt ${attempt + 1} failed:`, error);
      if (attempt === retries - 1) throw error;
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error("All OpenRouter retries exhausted");
}

export async function chatJSON<T>(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<T> {
  const response = await chatWithRetry(messages, options);
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || [
    null,
    response,
  ];
  const jsonStr = jsonMatch[1]?.trim() || response.trim();
  return JSON.parse(jsonStr) as T;
}

export type { ChatMessage, ChatOptions };
