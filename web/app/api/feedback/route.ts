import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

type FeedbackRequest = {
  category: string;
  questionId: string;
  prompt: string;
  rubricBullets: string[];
  modelAnswer: { structure: string[]; sample: string };
  userAnswer: string;
};

type FeedbackResponse = {
  overallScore: number;
  strengths: string[];
  gaps: string[];
  suggestedRewrite: string;
  followUpQuestions: string[];
  rubricCoverage: { bullet: string; covered: boolean; notes?: string }[];
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

async function generateFeedback(body: FeedbackRequest): Promise<FeedbackResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY. Add it to pm-mock-interviews/web/.env.local and restart dev server.",
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const system = [
    "You are a friendly product management interview coach.",
    "You will evaluate a candidate's written answer to a PM interview question.",
    "Return STRICT JSON only. No markdown, no extra text.",
    "Be constructive, specific, and practical. Avoid generic advice.",
  ].join("\n");

  const prompt = [
    system,
    "",
    "Question metadata:",
    `- category: ${body.category}`,
    `- questionId: ${body.questionId}`,
    "",
    "Interview question:",
    body.prompt,
    "",
    "What good looks like (rubric bullets):",
    ...body.rubricBullets.map((b) => `- ${b}`),
    "",
    "Model answer structure:",
    ...body.modelAnswer.structure.map((s) => `- ${s}`),
    "",
    "Model answer sample (for reference):",
    body.modelAnswer.sample,
    "",
    "Candidate answer:",
    body.userAnswer,
    "",
    "Return JSON with this exact shape:",
    "{",
    '  "overallScore": 0,',
    '  "strengths": ["..."],',
    '  "gaps": ["..."],',
    '  "suggestedRewrite": "...",',
    '  "followUpQuestions": ["..."],',
    '  "rubricCoverage": [{"bullet":"...","covered":true,"notes":"..."}]',
    "}",
  ].join("\n");

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonText = extractFirstJsonObject(text);
  if (!jsonText) throw new Error("Model did not return JSON.");

  return JSON.parse(jsonText) as FeedbackResponse;
}

export async function POST(req: Request) {
  let body: FeedbackRequest;
  try {
    body = (await req.json()) as FeedbackRequest;
  } catch {
    return jsonError("Invalid JSON body.");
  }

  if (!body?.prompt || !body?.userAnswer) {
    return jsonError("Missing required fields: prompt, userAnswer.");
  }
  if (!Array.isArray(body.rubricBullets)) {
    return jsonError("Missing required field: rubricBullets[].");
  }

  try {
    const feedback = await generateFeedback(body);
    return NextResponse.json(feedback);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return jsonError(msg, 500);
  }
}

