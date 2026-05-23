// LLM abstraction layer.
//
// Calls Gemini via the LifeGO LLM proxy (Cloudflare Worker). The proxy holds
// the API key as a server-side secret, so the key never lands in the client
// bundle. Set `EXPO_PUBLIC_LLM_PROXY_URL` to your deployed Worker URL.
//
// To swap providers, replace the body of `llm()` and bump the deps —
// the LLMRequest / LLMResponse contract stays stable.

function getProxyUrl(): string | undefined {
  return process.env.EXPO_PUBLIC_LLM_PROXY_URL;
}

/** Lets callers branch to mock-data path without forcing an error. */
export function hasApiKey(): boolean {
  const u = getProxyUrl();
  return typeof u === "string" && u.length > 0;
}

export type LLMTier = "flash" | "pro";

export type LLMRequest = {
  /** System prompt — sets the persona/behavior. */
  system?: string;
  /** User-side content. */
  user: string;
  /** flash = cheap+fast (gemini-2.5-flash), pro = creative (gemini-2.5-pro). */
  model?: LLMTier;
  /** Sampling temperature, 0–2 (Gemini accepts up to 2). */
  temperature?: number;
  /** OpenAPI-style schema for structured JSON output (Gemini responseSchema). */
  responseSchema?: object;
};

export async function llm(req: LLMRequest): Promise<string> {
  const proxyUrl = getProxyUrl();
  if (!proxyUrl) {
    throw new Error(
      "EXPO_PUBLIC_LLM_PROXY_URL is not set. Deploy the worker in workers/llm-proxy/ and put its URL in mobile/.env."
    );
  }

  const r = await fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: req.system,
      user: req.user,
      model: req.model ?? "flash",
      temperature: req.temperature ?? 0.7,
      responseSchema: req.responseSchema,
    }),
  });

  if (!r.ok) {
    const errBody = await r.text();
    throw new Error(`LLM proxy ${r.status}: ${errBody}`);
  }

  const data = (await r.json()) as { text?: string; error?: string };
  if (data.error) throw new Error(data.error);
  return data.text ?? "";
}

export async function llmJson<T>(req: LLMRequest): Promise<T> {
  const text = await llm(req);
  return JSON.parse(text) as T;
}
