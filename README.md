# PM Mock Interviews

A small full-stack-style project for **practicing Product Management mock interviews**: it serves questions from a structured YAML bank, lets you type answers, and returns **AI feedback** (Google Gemini) aligned with the same rubric as the bank. You can also suggest new Q&A pairs from the UI to grow the question bank over time.

## Repository layout

| Path | Purpose |
|------|--------|
| [`package.json`](package.json) | Monorepo root shim so platforms like **Railway** install Node/npm and run `web/` via `postinstall` / `build` / `start`. |
| [`question-bank/`](question-bank/) | YAML question files by category, schema, and notes on how to use the bank offline. |
| [`web/`](web/) | Next.js (App Router) app: category picker, random question, answer box, feedback API, optional suggestion flow. |

## Prerequisites

- **Node.js** 18+ (recommended) and **npm**.
- A **Google AI (Gemini) API key** for live feedback. The app reads it from environment variables (see below).

## Setup

1. **Clone** the repository and open the web app directory:

   ```bash
   cd pm-mock-interviews/web
   ```

2. **Install** dependencies:

   ```bash
   npm install
   ```

   If this repo clone does not include `package-lock.json`, `npm install` will still resolve dependencies and may create a local lockfile.

3. **Configure** the API key. Copy the example env file and add your key:

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:

   ```bash
   GEMINI_API_KEY=your_key_here
   ```

   Do not commit `.env.local`.

   Optional environment variables:

   - `USAGE_LOGGING_ENABLED=false` to disable per-request usage logging in production.
   - `LOG_WEBHOOK_URL=https://script.google.com/...` to forward lightweight usage events (timestamp, truncated IP, category, questionId, event type, prompt, answer) to an external endpoint such as a Google Sheets Apps Script.

4. **Run** the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## What you get in the app

- Pick a **category**, get a **random question**, answer in the textarea, and **submit** for structured feedback and rubric coverage.
- **Model answers** and follow-ups come from the YAML bank when present.
- Use **`/suggest`** to propose new entries; the YAML files remain the source of truth.

## More detail

- Question bank format and coverage: [`question-bank/README.md`](question-bank/README.md)
- Web-only commands and troubleshooting: [`web/README.md`](web/README.md)

## Security notes

- This app is designed to be **public on the internet**; all requests are treated as untrusted.
- API routes enforce **max input sizes** for prompts and answers and apply a simple **per-IP rate limit** to reduce abuse and accidental DoS.
- The feedback API uses a **hardened Gemini prompt** that explicitly forbids revealing secrets and tries to avoid generating harmful content.
- Usage logs (when enabled) are written as JSONL under `web/logs/usage.log`, with newlines stripped from content; in addition, if `LOG_WEBHOOK_URL` is set, a small sanitized JSON event is POSTed to that URL (for example, to append rows into a Google Sheet for longer-term analysis). Logging is best-effort and never affects user responses.
- The footer includes a lightweight **problem report** form. Problem reports log a short, non-sensitive description plus basic context (category and question) into the same external logging destination as usage events. Please avoid pasting sensitive data into the report field.
