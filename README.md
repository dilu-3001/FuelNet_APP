# NetFuel

NZ and AU fuel cost analyser. Single static HTML page with a Vercel serverless function for the AI lookup.

## Files

- `index.html` — the website (no API key, no build step)
- `api/fuel-lookup.js` — Vercel serverless function that proxies to Gemini using the env-stored key
- `vercel.json` — minimal config

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Go to vercel.com/new and import the repo. Vercel auto-detects the static site and the `/api` function.
3. **Set the Gemini API key**:
   - Go to Project → Settings → Environment Variables
   - Add `GEMINI_API_KEY` with your key from https://aistudio.google.com/apikey
   - Apply to Production, Preview, and Development
4. Hit Redeploy (env vars take effect on next deploy).

## How it works

- The browse mode (dropdowns) uses a built-in dataset, no AI call needed.
- The "Search any vehicle" mode posts `{ brand, model, year }` to `/api/fuel-lookup`.
- The serverless function reads `GEMINI_API_KEY` from Vercel env, calls Gemini server-side, and returns the structured data.
- The key never reaches the browser.

## Local testing

The static page works by opening `index.html` directly in a browser, but the AI search will fail (no `/api` endpoint when serving from the file system).

To test the full flow locally, install Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

This simulates the env vars and serverless functions on `localhost:3000`. Set the env var with:

```bash
vercel env add GEMINI_API_KEY
```
