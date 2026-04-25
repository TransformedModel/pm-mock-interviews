import type { CategoryKey, QuestionBank } from "@/lib/types";

// Generated at build time by `scripts/build-question-bank-json.mjs`.
// Kept out of git; the `build` script creates it before `next build`.
import rawBank from "@/lib/generated/questionBank.generated.json";

let cached: QuestionBank | null = null;

export function invalidateQuestionBankCache() {
  cached = null;
}

export async function getQuestionBank(): Promise<QuestionBank> {
  if (cached) return cached;

  // Validate minimal shape so failures are loud and actionable.
  const bank = rawBank as unknown as Partial<QuestionBank>;
  const keys = Object.keys(bank) as CategoryKey[];
  if (!keys.length) throw new Error("Question bank is empty. Did the build step generate it?");

  for (const k of keys) {
    const list = bank[k];
    if (!Array.isArray(list) || !list.length) {
      throw new Error(`Question bank missing questions for category: ${k}`);
    }
  }

  cached = bank as QuestionBank;
  return cached;
}

export async function getRandomQuestion(categoryKey: CategoryKey) {
  const bank = await getQuestionBank();
  const list = bank[categoryKey];
  if (!list?.length) throw new Error(`No questions for category ${categoryKey}`);
  return list[Math.floor(Math.random() * list.length)];
}

