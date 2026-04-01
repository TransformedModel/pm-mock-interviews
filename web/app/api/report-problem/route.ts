import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

type ReportBody = {
  description: string;
  category?: string;
  questionId?: string;
};

const MAX_DESC_LENGTH = 2000;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  return (
    xff?.split(",")[0].trim() ||
    realIp ||
    "unknown"
  );
}

export async function POST(req: Request) {
  let body: ReportBody;
  try {
    body = (await req.json()) as ReportBody;
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const description = body.description?.trim();
  if (!description) {
    return jsonError("Missing description.");
  }
  if (description.length > MAX_DESC_LENGTH) {
    return jsonError("Description is too long. Please shorten it.", 400);
  }

  const enabledVar = process.env.USAGE_LOGGING_ENABLED;
  if (enabledVar && enabledVar.toLowerCase() === "false") {
    return NextResponse.json({ ok: true });
  }

  const ip = getClientIp(req);

  const sanitize = (value: string) =>
    value.replace(/[\r\n]+/g, " ").slice(0, MAX_DESC_LENGTH);

  const entry = {
    timestamp: new Date().toISOString(),
    ip,
    category: body.category ?? null,
    questionId: body.questionId ?? null,
    eventType: "problem_reported",
    prompt: sanitize(description),
    answer: "",
  };

  try {
    const logDir = path.resolve(process.cwd(), "logs");
    const logPath = path.join(logDir, "usage.log");
    await fs.mkdir(logDir, { recursive: true });
    await fs.appendFile(logPath, JSON.stringify(entry) + "\n", "utf8");
  } catch {
    // Ignore local log failures.
  }

  const webhookUrl = process.env.LOG_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      void fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(entry),
      }).catch((e) => {
        console.error("Usage webhook error (problem_reported):", e);
      });
    } catch (e) {
      console.error("Usage webhook error (problem_reported):", e);
    }
  }

  return NextResponse.json({ ok: true });
}

