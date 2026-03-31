import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

import type { CategoryKey, Difficulty } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";

type SuggestRequest = {
  category: CategoryKey;
  difficulty: Difficulty;
  prompt: string;
  modelAnswer: string;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function suggestionsDir(): string {
  return path.resolve(process.cwd(), "..", "question-bank", "suggestions");
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
  if (!category || !(category in CATEGORY_LABELS)) return jsonError("Invalid category.");
  if (!body.prompt?.trim()) return jsonError("Missing prompt.");
  if (!body.modelAnswer?.trim()) return jsonError("Missing modelAnswer.");
  try {
    // Ensure suggestions directory exists
    const dir = suggestionsDir();
    await fs.mkdir(dir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${category}-${timestamp}.md`;
    const filePath = path.join(dir, fileName);

    const enrich = await tryGenerateRubricAndFollowUps({
      prompt: body.prompt.trim(),
      modelAnswer: body.modelAnswer.trim(),
    });

    const lines: string[] = [
      `# Suggested question for ${CATEGORY_LABELS[category]} (${category})`,
      "",
      `- Difficulty: ${body.difficulty ?? "medium"}`,
      `- Submitted at: ${new Date().toISOString()}`,
      "",
      "## Prompt",
      "",
      body.prompt.trim(),
      "",
      "## Model answer",
      "",
      body.modelAnswer.trim(),
    ];

    if (enrich) {
      lines.push(
        "",
        "## Auto-derived rubric (draft)",
        "",
        "### What good looks like",
        "",
        ...enrich.what_good_looks_like.map((b) => `- ${b}`),
        "",
        "### Suggested structure",
        "",
        ...enrich.structure.map((s) => `- ${s}`),
        "",
        "### Follow-up questions",
        "",
        ...enrich.follow_ups.map((q) => `- ${q}`),
      );
    }

    await fs.writeFile(filePath, lines.join("\n"), "utf8");

    return NextResponse.json({ id: fileName, category: CATEGORY_LABELS[category] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return jsonError(msg, 500);
  }
}

