# PM Mock Interviews

A small full-stack-style project for **practicing Product Management mock interviews**: it serves questions from a structured YAML bank, lets you type answers, and returns **AI feedback** (Google Gemini) aligned with the same rubric as the bank. You can also suggest new Q&A pairs from the UI to grow the question bank over time.

## Repository layout

| Path | Purpose |
|------|--------|
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
