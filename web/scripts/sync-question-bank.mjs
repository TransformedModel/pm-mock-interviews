/**
 * Runs before `next build` (chained in npm `build` script).
 * Copies monorepo `../question-bank` into `web/question-bank` so YAML is always
 * next to the app, even when process.cwd() is wrong during prerender workers.
 */
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const dest = path.join(webRoot, "question-bank");
const destCategories = path.join(dest, "categories");
const src = path.resolve(webRoot, "..", "question-bank");
const srcCategories = path.join(src, "categories");

async function hasYamlFiles(dir) {
  if (!existsSync(dir)) return false;
  const names = await fs.readdir(dir);
  return names.some((n) => n.endsWith(".yaml") || n.endsWith(".yml"));
}

async function main() {
  if (existsSync(srcCategories)) {
    await fs.rm(dest, { recursive: true, force: true });
    await fs.cp(src, dest, { recursive: true });
    console.log(`sync-question-bank: copied ${src} -> ${dest}`);
    return;
  }

  if (await hasYamlFiles(destCategories)) {
    console.log("sync-question-bank: using existing web/question-bank/categories");
    return;
  }

  console.error(
    [
      "sync-question-bank: No YAML question bank found.",
      `Expected monorepo sibling: ${srcCategories}`,
      `or an existing: ${destCategories}`,
      "",
      "Railway / Docker: set the service root to the Git repo root (folder that contains both",
      "`web/` and `question-bank/`), then build with `cd web && npm install && npm run build`,",
      "or use the repo-root Dockerfile.",
      "You can also set QUESTION_BANK_CATEGORIES_DIR to an absolute path to the categories folder.",
    ].join("\n"),
  );
  process.exit(1);
}

main().catch((e) => {
  console.error("sync-question-bank:", e);
  process.exit(1);
});
