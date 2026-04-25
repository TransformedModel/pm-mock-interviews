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

## Deploying (Cloudflare Pages)

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

## Troubleshooting

- If you see an error about `GEMINI_API_KEY`, confirm `.env.local` exists and restart `npm run dev`.

## Notes

- Don’t commit `.env.local`.

