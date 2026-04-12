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

function categoriesDir(): string {
  if (resolvedCategoriesDir) return resolvedCategoriesDir;

  const env = process.env.QUESTION_BANK_CATEGORIES_DIR?.trim();
  if (env) {
    resolvedCategoriesDir = path.resolve(env);
    return resolvedCategoriesDir;
  }

  const candidates = [
    path.resolve(process.cwd(), "question-bank", "categories"),
    path.resolve(process.cwd(), "..", "question-bank", "categories"),
  ];

  for (const dir of candidates) {
    if (existsSync(dir)) {
      resolvedCategoriesDir = dir;
      return dir;
    }
  }

  throw new Error(
    [
      "Could not find question-bank YAML directory.",
      "Tried:",
      ...candidates.map((d) => `  - ${d}`),
      "Fix: deploy the full repository (including question-bank/), or set QUESTION_BANK_CATEGORIES_DIR to the absolute path of question-bank/categories.",
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

