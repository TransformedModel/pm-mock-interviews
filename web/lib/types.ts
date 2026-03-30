export type Difficulty = "easy" | "medium" | "hard";

export type CategoryKey =
  | "product_design"
  | "estimation_analytical"
  | "behavioral"
  | "strategy"
  | "technical"
  | "execution";

export type CategoryLabel =
  | "Product Design"
  | "Estimation (Analytical)"
  | "Behavioral"
  | "Strategy"
  | "Technical"
  | "Execution";

export type Question = {
  id: string;
  difficulty: Difficulty;
  prompt: string;
  what_good_looks_like: string[];
  answer: {
    structure: string[];
    sample: string;
  };
  follow_ups: string[];
  variants?: string[];
};

export type CategoryFile = {
  version: number;
  category: string;
  questions: Question[];
};

export type QuestionBank = Record<CategoryKey, Question[]>;

export const CATEGORY_LABELS: Record<CategoryKey, CategoryLabel> = {
  product_design: "Product Design",
  estimation_analytical: "Estimation (Analytical)",
  behavioral: "Behavioral",
  strategy: "Strategy",
  technical: "Technical",
  execution: "Execution",
};

export const CATEGORY_FILES: Record<CategoryKey, string> = {
  product_design: "product_design.yaml",
  estimation_analytical: "estimation_analytical.yaml",
  behavioral: "behavioral.yaml",
  strategy: "strategy.yaml",
  technical: "technical.yaml",
  execution: "execution.yaml",
};

