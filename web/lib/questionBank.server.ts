import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

import type { CategoryFile, CategoryKey, QuestionBank } from "@/lib/types";
import { CATEGORY_FILES } from "@/lib/types";

/**
 * YAML files live in the repo under `question-bank/categories/`.
 * - Local dev: cwd is usually `web/`, so `../question-bank/categories` works.
 * - Some hosts (e.g. Railway with repo root as cwd): `question-bank/categories` under cwd.
 * - If only `web/` is copied into the image, set QUESTION_BANK_CATEGORIES_DIR to the real path.
 */
let resolvedCategoriesDir: string | null = null;

function parentIsFilesystemRoot(cwd: string): boolean {
  const parent = path.resolve(cwd, "..");
  return parent === path.parse(parent).root;
}

function categoriesDir(): string {
  if (resolvedCategoriesDir) return resolvedCategoriesDir;

  const env = process.env.QUESTION_BANK_CATEGORIES_DIR?.trim();
  if (env) {
    resolvedCategoriesDir = path.resolve(env);
    return resolvedCategoriesDir;
  }

  const cwd = process.cwd();
  const candidates: string[] = [
    // Filled by `npm run build` → sync-question-bank.mjs, or Docker COPY
    path.resolve(cwd, "question-bank", "categories"),
  ];
  // Avoid `/question-bank/...` when cwd is `/app` and `..` is `/` (web-only image).
  if (!parentIsFilesystemRoot(cwd)) {
    candidates.push(path.resolve(cwd, "..", "question-bank", "categories"));
  }

  const unique = [...new Set(candidates)];

  for (const dir of unique) {
    if (existsSync(dir)) {
      resolvedCategoriesDir = dir;
      return dir;
    }
  }

  throw new Error(
    [
      "Could not find question-bank YAML directory.",
      "Tried:",
      ...unique.map((d) => `  - ${d}`),
      "Fix: ensure `npm run build` runs the sync step (see package.json), use repo-root Dockerfile,",
      "or set QUESTION_BANK_CATEGORIES_DIR. On Railway, use the repository root as the service root so `question-bank/` is present at build time.",
    ].join("\n"),
  );
}

async function loadCategoryFile(categoryKey: CategoryKey): Promise<CategoryFile> {
  const filePath = path.join(categoriesDir(), CATEGORY_FILES[categoryKey]);
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = yaml.load(raw) as CategoryFile;

  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Failed to parse YAML for ${categoryKey}`);
  }
  if (!Array.isArray(parsed.questions)) {
    throw new Error(`Invalid category file: ${categoryKey} has no questions[]`);
  }

  return parsed;
}

let cached: QuestionBank | null = null;

export function invalidateQuestionBankCache() {
  cached = null;
}

export async function getQuestionBank(): Promise<QuestionBank> {
  if (cached) return cached;

  const keys = Object.keys(CATEGORY_FILES) as CategoryKey[];
  const entries = await Promise.all(
    keys.map(async (k) => {
      const cat = await loadCategoryFile(k);
      return [k, cat.questions] as const;
    }),
  );

  cached = Object.fromEntries(entries) as QuestionBank;
  return cached;
}

export async function getRandomQuestion(categoryKey: CategoryKey) {
  const bank = await getQuestionBank();
  const list = bank[categoryKey];
  if (!list?.length) throw new Error(`No questions for category ${categoryKey}`);
  return list[Math.floor(Math.random() * list.length)];
}

