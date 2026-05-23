// LifeGO LLM proxy — pure JavaScript build for the Cloudflare Web Dashboard
// editor (which doesn't support TypeScript). Logic is identical to src/index.ts.

const SAFETY_SETTINGS = [
  "HARM_CATEGORY_HARASSMENT",
  "HARM_CATEGORY_HATE_SPEECH",
  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  "HARM_CATEGORY_DANGEROUS_CONTENT",
].map((category) => ({ category, threshold: "BLOCK_ONLY_HIGH" }));

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS ?? "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowAll = allowed.includes("*");
  const allow =
    origin && (allowAll || allowed.includes(origin))
      ? origin
      : allowAll
        ? "*"
        : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, cors);
    }

    // Collect all configured Gemini keys, in order of preference. Primary is
    // tried first; on quota / rate-limit failure we fall back to BACKUP, then
    // BACKUP2, etc. Add more keys with new secret names (GEMINI_API_KEY_BACKUP3 …).
    const keys = [
      env.GEMINI_API_KEY,
      env.GEMINI_API_KEY_BACKUP,
      env.GEMINI_API_KEY_BACKUP2,
    ].filter((k) => typeof k === "string" && k.length > 0);
    if (keys.length === 0) {
      return json(
        { error: "Server has no Gemini API key configured" },
        500,
        cors
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400, cors);
    }
    if (!body || typeof body.user !== "string" || body.user.length === 0) {
      return json({ error: "Missing 'user' field" }, 400, cors);
    }
    if (body.user.length > 20000 || (body.system?.length ?? 0) > 20000) {
      return json({ error: "Prompt too long" }, 413, cors);
    }

    const modelName =
      body.model === "pro" ? "gemini-2.5-pro" : "gemini-2.5-flash";

    const geminiBody = {
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

    // Try each key in order. Fall through to the next one only on signals
    // that strongly suggest quota / rate-limit exhaustion (429 or 403). For
    // other failures (400/500) the caller's prompt is the issue, retrying
    // with a different key won't help — return immediately.
    let lastFailure = null;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/` +
        `${modelName}:generateContent?key=${key}`;

      let geminiResp;
      try {
        geminiResp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiBody),
        });
      } catch (err) {
        return json(
          { error: `Upstream fetch failed: ${err.message}` },
          502,
          cors
        );
      }

      if (geminiResp.ok) {
        const data = await geminiResp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        return json({ text, keyIndex: i }, 200, cors);
      }

      const upstream = await geminiResp.text();
      const status = geminiResp.status;
      // 429 = quota / rate limit. 403 occasionally signals daily quota exhausted
      // (RESOURCE_EXHAUSTED). Both are worth retrying with another key.
      const shouldFallover = status === 429 || status === 403;
      lastFailure = { status, upstream, keyIndex: i };
      if (!shouldFallover) break;
    }

    return json(
      {
        error: `All ${keys.length} Gemini key(s) failed. Last: ${lastFailure.status}`,
        upstream: lastFailure.upstream,
        keyIndex: lastFailure.keyIndex,
      },
      lastFailure.status,
      cors
    );
  },
};
