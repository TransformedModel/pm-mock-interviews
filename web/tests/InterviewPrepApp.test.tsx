import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { InterviewPrepApp } from "@/components/InterviewPrepApp";
import type { QuestionBank, CategoryKey, Question } from "@/lib/types";

function makeQuestion(id: string): Question {
  return {
    id,
    difficulty: "medium",
    prompt: "Design a thing",
    what_good_looks_like: ["Is thoughtful"],
    answer: {
      structure: ["One", "Two"],
      sample: "Sample answer",
    },
    follow_ups: ["Follow up?"],
  };
}

const bank: QuestionBank = {
  product_design: [makeQuestion("PD-001"), makeQuestion("PD-002")],
  estimation_analytical: [makeQuestion("EA-001")],
  behavioral: [makeQuestion("BE-001")],
  strategy: [makeQuestion("ST-001")],
  technical: [makeQuestion("TE-001")],
  execution: [makeQuestion("EX-001")],
};

describe("InterviewPrepApp", () => {
  const initialCategory: CategoryKey = "product_design";
  const initialQuestion = bank.product_design[0];

  it("renders the initial question and your answer textarea", () => {
    render(<InterviewPrepApp bank={bank} initialCategory={initialCategory} initialQuestion={initialQuestion} />);

    expect(screen.getByText("Your answer")).toBeInTheDocument();
    expect(screen.getByText(initialQuestion.prompt)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Write your answer here…")).toBeInTheDocument();
  });

  it("lets the user type an answer", () => {
    render(<InterviewPrepApp bank={bank} initialCategory={initialCategory} initialQuestion={initialQuestion} />);

    const textarea = screen.getByPlaceholderText("Write your answer here…") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "My brilliant PM answer" } });

    expect(textarea.value).toBe("My brilliant PM answer");
  });
});

