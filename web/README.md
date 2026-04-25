## PM Mock Interview Prep (web)

This is the frontend website for practicing PM mock interview questions from `../question-bank/`.

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Set your Gemini API key

Create `pm-mock-interviews/web/.env.local`:

```bash
GEMINI_API_KEY=your_key_here
```

### 3) Run the dev server

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` to use the app.

## How it works

- The question bank is loaded server-side from `../question-bank/categories/*.yaml` (YAML is the source of truth).
- Submitting an answer calls `POST /api/feedback`, which uses Gemini and returns strict JSON feedback.

## Deploying (Railway, Cloudflare, Docker, etc.)

The production build prerenders `/` and reads YAML from disk. The `build` script runs **`scripts/sync-question-bank.mjs` first**, which copies `../question-bank` into `web/question-bank/` (gitignored) so the bank is always next to the app.

### Railway (Nixpacks)

1. Set **Root Directory** to **empty** (repository root), *not* `web`, so `question-bank/` exists next to `web/` during the build.
2. The repo root has a **`package.json`** so Nixpacks installs **Node/npm** (without it, a custom `cd web && npm …` command can fail with `npm: not found`).
3. Prefer Railway’s defaults, or set explicitly:
   - **Build command**: `npm install && npm run build` (from repo root)
   - **Start command**: `npm start` (from repo root)  
   If you still use `cd web && …`, Node should now be available; root `postinstall` runs `npm ci --prefix web` so dependencies install correctly.

### Cloudflare Pages

Cloudflare runs Next.js API routes on an **edge runtime**, so:
- The question bank is **bundled into the build** (YAML → generated JSON).
- API routes **do not write local files**; use `LOG_WEBHOOK_URL` if you want persistent logs.

Pages settings:
- **Framework preset**: Next.js
- **Root directory**: `web`
- **Build command**: `npm run build:cf`
- **Build output directory**: `.vercel/output/static`

Environment variables (Pages → Settings → Variables):
- `GEMINI_API_KEY` (required for feedback)
- `LOG_WEBHOOK_URL` (optional but recommended)
- `USAGE_LOGGING_ENABLED=false` (optional)

### Docker

From the **repository root** (where this repo’s `Dockerfile` lives):

```bash
docker build -t pm-mock-interviews .
docker run -p 3000:3000 -e GEMINI_API_KEY=... pm-mock-interviews
```

### Custom layout

Set **`QUESTION_BANK_CATEGORIES_DIR`** to the absolute path of the `categories` directory (the one that contains `product_design.yaml`, etc.).

## Troubleshooting

- If you see an error about `GEMINI_API_KEY`, confirm `.env.local` exists and restart `npm run dev`.

## Notes

- Don’t commit `.env.local`.

