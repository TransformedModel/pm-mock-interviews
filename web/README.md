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

The build prerenders `/` and must read the YAML files on disk. **Use the monorepo root** as the service root (the directory that contains both `web/` and `question-bank/`), then set:

- **Root directory**: repository root (not only `web/`)
- **Install / build**: e.g. `cd web && npm install && npm run build`
- **Start**: e.g. `cd web && npm run start`

If the host runs commands with cwd at repo root, the app resolves `question-bank/categories` automatically. If you keep cwd inside `web/` only, that still works. If your layout is custom, set **`QUESTION_BANK_CATEGORIES_DIR`** to the absolute path of the `categories` folder (the one that contains `product_design.yaml`, etc.).

## Troubleshooting

- If you see an error about `GEMINI_API_KEY`, confirm `.env.local` exists and restart `npm run dev`.

## Notes

- Don’t commit `.env.local`.

