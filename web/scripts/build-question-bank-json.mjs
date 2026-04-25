/**
 * Build-time generator: YAML question-bank -> JSON module.
 *
 * Cloudflare Pages/Workers runtime can't use Node `fs` at runtime, so we bundle
 * the bank into the build artifact and import it from server components.
 */
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { fileURLToPath } from "node:url";

// Keep in sync with `web/lib/types.ts` (`CATEGORY_FILES`).
const CATEGORY_FILES = {
  product_design: "product_design.yaml",
  estimation_analytical: "estimation_analytical.yaml",
  behavioral: "behavioral.yaml",
  strategy: "strategy.yaml",
  technical: "technical.yaml",
  execution: "execution.yaml",
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");

const GENERATED_DIR = path.join(webRoot, "lib", "generated");
const GENERATED_FILE = path.join(GENERATED_DIR, "questionBank.generated.json");

function resolveCategoriesDir() {
  // Prefer the synced copy inside web/ (created by sync-question-bank.mjs)
  const inWeb = path.join(webRoot, "question-bank", "categories");
  if (existsSync(inWeb)) return inWeb;

  // Fallback for local dev when running scripts manually
  const sibling = path.resolve(webRoot, "..", "question-bank", "categories");
  if (existsSync(sibling)) return sibling;

  throw new Error(
    [
      "build-question-bank-json: Could not find question bank categories directory.",
      `Tried: ${inWeb}`,
      `Tried: ${sibling}`,
      "Fix: run `node scripts/sync-question-bank.mjs` first, or use the repo root layout with `question-bank/` next to `web/`.",
    ].join("\n"),
  );
}

function coerceString(value) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function coerceStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((v) => {
    if (typeof v === "string") return v;
    // Common YAML pitfall: `- Label: details` becomes an object. Convert it back to a string.
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const entries = Object.entries(v);
      if (entries.length === 1) {
        const [k, val] = entries[0];
        if (typeof k === "string" && typeof val === "string") return `${k}: ${val}`;
        return `${String(k)}: ${coerceString(val)}`;
      }
    }
    return coerceString(v);
  });
}

function normalizeQuestion(q, context) {
  const fail = (msg) => {
    throw new Error(`build-question-bank-json: ${context}: ${msg}`);
  };
  if (!q || typeof q !== "object") fail("question is not an object");
  if (typeof q.id !== "string" || !q.id) fail("missing id");
  if (!["easy", "medium", "hard"].includes(q.difficulty)) fail("invalid difficulty");
  if (typeof q.prompt !== "string" || !q.prompt) fail("missing prompt");
  const what_good_looks_like = coerceStringArray(q.what_good_looks_like);
  if (!what_good_looks_like.length) fail("what_good_looks_like must be non-empty");
  if (!q.answer || typeof q.answer !== "object") fail("missing answer");
  const answer = {
    structure: coerceStringArray(q.answer.structure),
    sample: coerceString(q.answer.sample),
  };
  if (!answer.structure.length) fail("answer.structure must be non-empty");
  if (!answer.sample) fail("answer.sample must be a non-empty string");

  const follow_ups = coerceStringArray(q.follow_ups);
  if (!follow_ups.length) fail("follow_ups must be non-empty");

  const variants = q.variants == null ? undefined : coerceStringArray(q.variants);

  return {
    id: q.id,
    difficulty: q.difficulty,
    prompt: q.prompt,
    what_good_looks_like,
    answer,
    follow_ups,
    ...(variants?.length ? { variants } : {}),
  };
}

async function main() {
  const categoriesDir = resolveCategoriesDir();
  const out = {};

  for (const [key, filename] of Object.entries(CATEGORY_FILES)) {
    const filePath = path.join(categoriesDir, filename);
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = yaml.load(raw);
    if (!parsed || typeof parsed !== "object") {
      throw new Error(`build-question-bank-json: failed to parse YAML: ${filePath}`);
    }
    const questions = parsed.questions;
    if (!Array.isArray(questions)) {
      throw new Error(`build-question-bank-json: ${filePath} has no questions[]`);
    }

    out[key] = questions.map((q, idx) => normalizeQuestion(q, `${filename}[${idx}]`));
  }

  await fs.mkdir(GENERATED_DIR, { recursive: true });
  await fs.writeFile(GENERATED_FILE, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`build-question-bank-json: wrote ${path.relative(webRoot, GENERATED_FILE)}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
