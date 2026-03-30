import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

import type { CategoryFile, CategoryKey, Difficulty, Question } from "@/lib/types";
import { CATEGORY_FILES, CATEGORY_LABELS } from "@/lib/types";
import { invalidateQuestionBankCache } from "@/lib/questionBank.server";

type SuggestRequest = {
  category: CategoryKey;
  difficulty: Difficulty;
  prompt: string;
  modelAnswer: string;
};

function categoriesDir(): string {
  return path.resolve(process.cwd(), "..", "question-bank", "categories");
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function idPrefix(category: CategoryKey) {
  switch (category) {
    case "product_design":
      return "PD";
    case "estimation_analytical":
      return "EA";
    case "behavioral":
      return "BE";
    case "strategy":
      return "ST";
    case "technical":
      return "TE";
    case "execution":
      return "EX";
  }
}

function nextId(existing: Question[], prefix: string) {
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  let max = 0;
  for (const q of existing) {
    const m = re.exec(q.id);
    if (!m) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

async function tryGenerateRubricAndFollowUps(input: {
  prompt: string;
  modelAnswer: string;
}): Promise<{
  what_good_looks_like: string[];
  structure: string[];
  follow_ups: string[];
} | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const instruction = [
    "Return STRICT JSON only. No markdown. No extra text.",
    "You are generating an interview question rubric and follow-ups.",
    "Keep bullets concise and practical.",
    "",
    "Return JSON with this exact shape:",
    "{",
    '  "what_good_looks_like": ["..."],',
    '  "structure": ["..."],',
    '  "follow_ups": ["..."]',
    "}",
  ].join("\n");

  const prompt = [
    instruction,
    "",
    "Interview question prompt:",
    input.prompt,
    "",
    "Model answer:",
    input.modelAnswer,
  ].join("\n");

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const jsonText = text.slice(start, end + 1);
  const parsed = JSON.parse(jsonText) as {
    what_good_looks_like?: unknown;
    structure?: unknown;
    follow_ups?: unknown;
  };

  const w = Array.isArray(parsed.what_good_looks_like)
    ? parsed.what_good_looks_like.filter(
        (x): x is string => typeof x === "string" && x.trim().length > 0,
      )
    : [];
  const s = Array.isArray(parsed.structure)
    ? parsed.structure.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];
  const f = Array.isArray(parsed.follow_ups)
    ? parsed.follow_ups.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];

  if (!w.length || !s.length || !f.length) return null;
  return { what_good_looks_like: w.slice(0, 6), structure: s.slice(0, 7), follow_ups: f.slice(0, 6) };
}

export async function POST(req: Request) {
  let body: SuggestRequest;
  try {
    body = (await req.json()) as SuggestRequest;
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const category = body?.category;
  if (!category || !(category in CATEGORY_FILES)) return jsonError("Invalid category.");
  if (!body.prompt?.trim()) return jsonError("Missing prompt.");
  if (!body.modelAnswer?.trim()) return jsonError("Missing modelAnswer.");

  // Note: In many hosted environments the filesystem is read-only. This feature targets local usage.
  const filePath = path.join(categoriesDir(), CATEGORY_FILES[category]);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = yaml.load(raw) as CategoryFile;
    if (!parsed || !Array.isArray(parsed.questions)) {
      return jsonError("Category file is invalid on disk.", 500);
    }

    const prefix = idPrefix(category);
    const id = nextId(parsed.questions, prefix);

    const enrich = await tryGenerateRubricAndFollowUps({
      prompt: body.prompt.trim(),
      modelAnswer: body.modelAnswer.trim(),
    });

    const newQuestion: Question = {
      id,
      difficulty: body.difficulty ?? "medium",
      prompt: body.prompt.trim(),
      what_good_looks_like:
        enrich?.what_good_looks_like ?? [
          "Clarifies scope, users, and constraints.",
          "Uses a clear structure and makes assumptions explicit.",
          "Explains trade-offs and defines success metrics.",
        ],
      answer: {
        structure:
          enrich?.structure ?? [
            "Clarify the goal, users, and constraints.",
            "Propose a structured approach and key decisions.",
            "Discuss trade-offs, risks, and success metrics.",
          ],
        sample: body.modelAnswer.trim(),
      },
      follow_ups:
        enrich?.follow_ups ?? [
          "What assumptions are you making?",
          "What trade-offs did you choose and why?",
          "How would you measure success?",
        ],
    };

    parsed.questions.push(newQuestion);

    const nextYaml = yaml.dump(parsed, {
      lineWidth: 100,
      noRefs: true,
      quotingType: '"',
    });
    await fs.writeFile(filePath, nextYaml, "utf8");

    invalidateQuestionBankCache();

    return NextResponse.json({ id, category: CATEGORY_LABELS[category] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return jsonError(msg, 500);
  }
}

