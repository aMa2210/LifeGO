# LifeGO LLM proxy

A Cloudflare Worker that proxies LifeGO's Gemini calls so the API key never
ships in the client bundle. The mobile app calls this Worker; the Worker
holds the key as a Cloudflare secret and forwards to Gemini.

## One-time deploy

1. Make sure you have a Cloudflare account (free tier is enough).
2. Install deps and authenticate:

   ```bash
   cd workers/llm-proxy
   npm install
   npx wrangler login          # opens browser
   ```

3. Set the Gemini key as a **secret** (NOT in `wrangler.toml`):

   ```bash
   npx wrangler secret put GEMINI_API_KEY
   # paste key when prompted
   ```

4. Deploy:

   ```bash
   npx wrangler deploy
   ```

   Output gives you a URL like
   `https://lifego-llm-proxy.<your-subdomain>.workers.dev`.

5. Copy that URL into `mobile/.env`:

   ```env
   EXPO_PUBLIC_LLM_PROXY_URL=https://lifego-llm-proxy.<your-subdomain>.workers.dev
   ```

6. **Remove** `EXPO_PUBLIC_GEMINI_API_KEY` from `mobile/.env` — the client
   doesn't need it anymore. Restart `npx expo start --web` so the new env
   is picked up.

7. Rotate the old `GEMINI_API_KEY` at aistudio.google.com/apikey so any copy
   that may have leaked into a browser bundle is dead.

## Tighten security (recommended before sharing the app)

In `wrangler.toml`, set `ALLOWED_ORIGINS` to just your domains:

```toml
[vars]
ALLOWED_ORIGINS = "https://lifego.app,http://localhost:8085"
```

Then `npx wrangler deploy` again. The Worker will reject CORS preflights
from any other origin. (Note: this only stops browser-based abuse — a
script using `curl` ignores CORS. For stricter limits add a per-IP rate
limit rule in the Cloudflare dashboard.)

## Local dev

```bash
npx wrangler dev
```

Worker runs on `http://localhost:8787`. Point `EXPO_PUBLIC_LLM_PROXY_URL`
there during development if you want to iterate on the proxy code itself.

## How the client talks to it

Request body — same shape as `mobile/src/lib/llm.ts`'s `LLMRequest`:

```json
{
  "system": "...optional system prompt...",
  "user": "...required user prompt...",
  "model": "flash",
  "temperature": 1.2,
  "responseSchema": { ... optional JSON schema ... }
}
```

Response:

```json
{ "text": "...Gemini's output..." }
```

On error: `{ "error": "...", "upstream": "...optional Gemini body..." }` with
appropriate HTTP status.
