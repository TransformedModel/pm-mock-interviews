import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import yaml from "js-yaml";

const ROOT = path.resolve(process.cwd(), "..");
const SUGGESTIONS_DIR = path.join(ROOT, "question-bank", "suggestions");
const CATEGORIES_DIR = path.join(ROOT, "question-bank", "categories");

const CATEGORY_FILES = {
  product_design: "product_design.yaml",
  estimation_analytical: "estimation_analytical.yaml",
  behavioral: "behavioral.yaml",
  strategy: "strategy.yaml",
  technical: "technical.yaml",
  execution: "execution.yaml",
};

const CATEGORY_LABELS = {
  product_design: "Product Design",
  estimation_analytical: "Estimation (Analytical)",
  behavioral: "Behavioral",
  strategy: "Strategy",
  technical: "Technical",
  execution: "Execution",
};

function idPrefix(categoryKey) {
  switch (categoryKey) {
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
    default:
      return "XX";
  }
}

function nextId(existingQuestions, prefix) {
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  let max = 0;
  for (const q of existingQuestions) {
    const m = re.exec(q.id);
    if (!m) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function extractSection(md, heading) {
  const re = new RegExp(`^##\\s+${heading}\\s*$`, "m");
  const m = re.exec(md);
  if (!m) return null;
  const startIdx = m.index + m[0].length;
  const rest = md.slice(startIdx);
  const nextHeading = rest.search(/^##\s+/m);
  const body = (nextHeading === -1 ? rest : rest.slice(0, nextHeading)).trim();
  return body.length ? body : null;
}

function extractBullets(md, subheading) {
  const re = new RegExp(`^###\\s+${subheading}\\s*$`, "m");
  const m = re.exec(md);
  if (!m) return [];
  const startIdx = m.index + m[0].length;
  const rest = md.slice(startIdx);
  const nextSub = rest.search(/^###\s+/m);
  const block = (nextSub === -1 ? rest : rest.slice(0, nextSub)).trim();
  return block
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim())
    .filter(Boolean);
}

function parseSuggestionMarkdown(md, fallbackName) {
  // Title line format: "# Suggested question for Product Design (product_design)"
  const title = md.split("\n")[0] ?? "";
  const catMatch = /\(([^)]+)\)\s*$/.exec(title);
  const categoryKey = catMatch?.[1]?.trim() || null;

  const diffMatch = md.match(/^- Difficulty:\s*(.+)\s*$/m);
  const difficulty = (diffMatch?.[1]?.trim() || "medium").toLowerCase();

  const prompt = extractSection(md, "Prompt");
  const modelAnswer = extractSection(md, "Model answer");

  const rubricBlock = extractSection(md, "Auto-derived rubric (draft)") ?? "";
  const whatGood = extractBullets(rubricBlock, "What good looks like");
  const structure = extractBullets(rubricBlock, "Suggested structure");
  const followUps = extractBullets(rubricBlock, "Follow-up questions");

  if (!categoryKey || !(categoryKey in CATEGORY_FILES)) {
    throw new Error(
      `Could not determine category key from ${fallbackName}. Expected title like "(product_design)".`,
    );
  }
  if (!prompt) throw new Error(`Missing "## Prompt" section in ${fallbackName}.`);
  if (!modelAnswer) throw new Error(`Missing "## Model answer" section in ${fallbackName}.`);

  const safeDifficulty =
    difficulty === "easy" || difficulty === "medium" || difficulty === "hard"
      ? difficulty
      : "medium";

  return {
    categoryKey,
    difficulty: safeDifficulty,
    prompt,
    modelAnswer,
    enrich:
      whatGood.length && structure.length && followUps.length
        ? { what_good_looks_like: whatGood, structure, follow_ups: followUps }
        : null,
  };
}

async function loadCategoryFile(categoryKey) {
  const fileName = CATEGORY_FILES[categoryKey];
  const filePath = path.join(CATEGORIES_DIR, fileName);
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = yaml.load(raw);
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.questions)) {
    throw new Error(`Category YAML is invalid: ${filePath}`);
  }
  return { filePath, parsed };
}

async function saveCategoryFile(filePath, parsed) {
  const nextYaml = yaml.dump(parsed, {
    lineWidth: 100,
    noRefs: true,
    quotingType: '"',
  });
  await fs.writeFile(filePath, nextYaml, "utf8");
}

function printDivider() {
  output.write("\n" + "-".repeat(72) + "\n");
}

async function main() {
  let entries;
  try {
    entries = await fs.readdir(SUGGESTIONS_DIR, { withFileTypes: true });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "ENOENT") {
      output.write(`No suggestions directory found at ${SUGGESTIONS_DIR}\n`);
      return;
    }
    throw e;
  }

  const files = entries
    .filter((d) => d.isFile() && d.name.endsWith(".md"))
    .map((d) => d.name)
    .sort();

  if (!files.length) {
    output.write("No suggestion markdown files found.\n");
    return;
  }

  const rl = readline.createInterface({ input, output });
  let approved = 0;
  let rejected = 0;
  let skipped = 0;

  try {
    for (const name of files) {
      const fullPath = path.join(SUGGESTIONS_DIR, name);
      const md = await fs.readFile(fullPath, "utf8");

      let parsed;
      try {
        parsed = parseSuggestionMarkdown(md, name);
      } catch (err) {
        printDivider();
        output.write(`File: ${name}\n`);
        output.write(`Could not parse this suggestion: ${err instanceof Error ? err.message : String(err)}\n`);
        const ans = (await rl.question("Skip (s) or delete (d)? ")).trim().toLowerCase();
        if (ans === "d" || ans === "delete") {
          await fs.unlink(fullPath);
          rejected += 1;
          output.write("Deleted.\n");
        } else {
          skipped += 1;
          output.write("Skipped.\n");
        }
        continue;
      }

      printDivider();
      output.write(`File: ${name}\n`);
      output.write(`Category: ${CATEGORY_LABELS[parsed.categoryKey]} (${parsed.categoryKey})\n`);
      output.write(`Difficulty: ${parsed.difficulty}\n\n`);
      output.write("PROMPT\n");
      output.write(parsed.prompt.trim() + "\n\n");
      output.write("MODEL ANSWER\n");
      output.write(parsed.modelAnswer.trim() + "\n");

      const ans = (await rl
        .question("\nApprove (a) / Reject+delete (r) / Skip (s)? ")
        .catch(() => "s"))
        .trim()
        .toLowerCase();

      if (ans === "r" || ans === "reject") {
        await fs.unlink(fullPath);
        rejected += 1;
        output.write("Rejected and deleted.\n");
        continue;
      }
      if (ans !== "a" && ans !== "approve") {
        skipped += 1;
        output.write("Skipped.\n");
        continue;
      }

      const { filePath, parsed: categoryFile } = await loadCategoryFile(parsed.categoryKey);
      const prefix = idPrefix(parsed.categoryKey);
      const id = nextId(categoryFile.questions, prefix);

      const enrich = parsed.enrich;
      const newQuestion = {
        id,
        difficulty: parsed.difficulty,
        prompt: parsed.prompt.trim(),
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
          sample: parsed.modelAnswer.trim(),
        },
        follow_ups:
          enrich?.follow_ups ?? [
            "What assumptions are you making?",
            "What trade-offs did you choose and why?",
            "How would you measure success?",
          ],
      };

      categoryFile.questions.push(newQuestion);
      await saveCategoryFile(filePath, categoryFile);
      await fs.unlink(fullPath);
      approved += 1;

      output.write(`Approved → added as ${id} to ${path.relative(ROOT, filePath)}\n`);
      output.write("Deleted suggestion file.\n");
    }
  } finally {
    rl.close();
  }

  printDivider();
  output.write(`Done. Approved: ${approved}, Rejected: ${rejected}, Skipped: ${skipped}\n`);
  output.write("If the dev server is running, restart it to reload the updated YAML.\n");
}

main().catch((e) => {
  output.write(`\nError: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exitCode = 1;
});

