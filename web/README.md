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

## Deploying (Railway, Docker, etc.)

The production build prerenders `/` and reads YAML from disk. The `build` script runs **`scripts/sync-question-bank.mjs` first**, which copies `../question-bank` into `web/question-bank/` (gitignored) so the bank is always next to the app.

### Railway (Nixpacks)

1. In the service settings, set **Root Directory** to **empty** (repository root), *not* `web`. If the root is only `web`, the build often has no `question-bank/` folder and the sync step fails.
2. **Build command**: `cd web && npm install && npm run build`
3. **Start command**: `cd web && npm run start`

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

