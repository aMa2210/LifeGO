// LifeGO LLM proxy — Cloudflare Worker.
//
// Sits between the LifeGO client and Google Gemini so the API key never
// touches the browser bundle. Mirrors the `LLMRequest` / response shape
// from mobile/src/lib/llm.ts.
//
// Deploy: `wrangler deploy`. Set the API key as a secret (NOT in
// wrangler.toml): `wrangler secret put GEMINI_API_KEY`.

type Env = {
  GEMINI_API_KEY: string;
  /** Comma-separated origins, e.g. "http://localhost:8085,https://lifego.app".
   *  "*" disables the origin check (dev only). */
  ALLOWED_ORIGINS?: string;
};

type ProxyRequest = {
  system?: string;
  user: string;
  model?: "flash" | "pro";
  temperature?: number;
  responseSchema?: unknown;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS ?? "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowAll = allowed.includes("*");
  const allow =
    origin && (allowAll || allowed.includes(origin)) ? origin : allowAll ? "*" : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

const SAFETY_SETTINGS = [
  "HARM_CATEGORY_HARASSMENT",
  "HARM_CATEGORY_HATE_SPEECH",
  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  "HARM_CATEGORY_DANGEROUS_CONTENT",
].map((category) => ({ category, threshold: "BLOCK_ONLY_HIGH" }));

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, cors);
    }
    if (!env.GEMINI_API_KEY) {
      return json({ error: "Server missing GEMINI_API_KEY secret" }, 500, cors);
    }

    let body: ProxyRequest;
    try {
      body = (await request.json()) as ProxyRequest;
    } catch {
      return json({ error: "Invalid JSON body" }, 400, cors);
    }
    if (!body || typeof body.user !== "string" || body.user.length === 0) {
      return json({ error: "Missing 'user' field" }, 400, cors);
    }
    // Cap input length so a leaked URL can't be used to send arbitrarily
    // large prompts (LLM cost / abuse defense).
    if (body.user.length > 20000 || (body.system?.length ?? 0) > 20000) {
      return json({ error: "Prompt too long" }, 413, cors);
    }

    const modelName =
      body.model === "pro" ? "gemini-2.5-pro" : "gemini-2.5-flash";
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${modelName}:generateContent?key=${env.GEMINI_API_KEY}`;

    const geminiBody: Record<string, unknown> = {
      contents: [{ role: "user", parts: [{ text: body.user }] }],
      generationConfig: {
        temperature: body.temperature ?? 0.7,
        ...(body.responseSchema
          ? {
              responseMimeType: "application/json",
              responseSchema: body.responseSchema,
            }
          : {}),
      },
      safetySettings: SAFETY_SETTINGS,
    };
    if (body.system) {
      geminiBody.systemInstruction = { parts: [{ text: body.system }] };
    }

    let geminiResp: Response;
    try {
      geminiResp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      });
    } catch (err) {
      return json(
        { error: `Upstream fetch failed: ${(err as Error).message}` },
        502,
        cors
      );
    }

    if (!geminiResp.ok) {
      const upstream = await geminiResp.text();
      return json(
        { error: `Gemini ${geminiResp.status}`, upstream },
        geminiResp.status,
        cors
      );
    }

    const data = (await geminiResp.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return json({ text }, 200, cors);
  },
};
