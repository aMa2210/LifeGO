// LLM abstraction layer.
// Current provider: Google Gemini. To swap to Claude, replace the body of `llm()`
// and bump dependencies — public interface stays stable.

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

let _client: GoogleGenerativeAI | null = null;
function client(): GoogleGenerativeAI {
  if (_client) return _client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey"
    );
  }
  _client = new GoogleGenerativeAI(apiKey);
  return _client;
}

export type LLMTier = "flash" | "pro";

export type LLMRequest = {
  /** System prompt — sets the persona/behavior. */
  system?: string;
  /** User-side content. */
  user: string;
  /** flash = cheap+fast (gemini-2.5-flash), pro = creative (gemini-2.5-pro). */
  model?: LLMTier;
  /** Sampling temperature, 0–1. */
  temperature?: number;
  /** OpenAPI-style schema for structured JSON output (Gemini responseSchema). */
  responseSchema?: object;
};

// Loosen safety filters so persona prose ("midnight soul", "solo") doesn't get blocked.
const RELAXED_SAFETY = [
  HarmCategory.HARM_CATEGORY_HARASSMENT,
  HarmCategory.HARM_CATEGORY_HATE_SPEECH,
  HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
  HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
].map((category) => ({ category, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }));

function modelName(tier: LLMTier): string {
  return tier === "pro" ? "gemini-2.5-pro" : "gemini-2.5-flash";
}

export async function llm(req: LLMRequest): Promise<string> {
  const tier = req.model ?? "flash";
  const m = client().getGenerativeModel({
    model: modelName(tier),
    systemInstruction: req.system,
    safetySettings: RELAXED_SAFETY,
    generationConfig: {
      temperature: req.temperature ?? 0.7,
      ...(req.responseSchema && {
        responseMimeType: "application/json",
        responseSchema: req.responseSchema as never,
      }),
    },
  });
  const result = await m.generateContent(req.user);
  return result.response.text();
}

export async function llmJson<T>(req: LLMRequest): Promise<T> {
  const text = await llm(req);
  return JSON.parse(text) as T;
}
