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

## Troubleshooting

- If you see an error about `GEMINI_API_KEY`, confirm `.env.local` exists and restart `npm run dev`.

## Notes

- Don’t commit `.env.local`.

