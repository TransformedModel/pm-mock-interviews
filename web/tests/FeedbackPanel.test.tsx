import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { FeedbackPanel, type FeedbackResult } from "@/components/FeedbackPanel";
import type { Question } from "@/lib/types";

const baseQuestion: Question = {
  id: "PD-001",
  difficulty: "medium",
  prompt: "Design a product for X.",
  what_good_looks_like: ["Is thoughtful"],
  answer: {
    structure: ["One", "Two"],
    sample: "Sample answer",
  },
  follow_ups: ["Follow up?"],
};

const sampleFeedback: FeedbackResult = {
  strengths: ["Clear structure"],
  gaps: ["Needs more metrics"],
  suggestedRewrite: "A shorter, clearer answer.",
  followUpQuestions: ["How would you measure success?"],
  rubricCoverage: [
    { bullet: "Talks about users", covered: true },
    { bullet: "Defines success metrics", covered: false, notes: "Add KPIs" },
  ],
};

describe("FeedbackPanel", () => {
  it("shows hint text when no feedback yet", () => {
    render(<FeedbackPanel question={baseQuestion} feedback={null} />);

    expect(
      screen.getByText("Submit your answer to get feedback and see the model answer."),
    ).toBeInTheDocument();
  });

  it("renders strengths, gaps, rubric coverage and model answer when feedback is present", () => {
    render(<FeedbackPanel question={baseQuestion} feedback={sampleFeedback} />);

    // Strengths & gaps headings
    expect(screen.getByText("Strengths")).toBeInTheDocument();
    expect(screen.getByText("Gaps")).toBeInTheDocument();

    // One of the strength bullets
    expect(screen.getByText("Clear structure")).toBeInTheDocument();

    // Rubric bullets
    expect(screen.getByText("Talks about users")).toBeInTheDocument();
    expect(screen.getByText("Defines success metrics")).toBeInTheDocument();
    expect(screen.getByText("Add KPIs")).toBeInTheDocument();

    // Suggested rewrite
    expect(screen.getByText("A shorter, clearer answer.")).toBeInTheDocument();

    // Model answer structure + sample
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Sample answer")).toBeInTheDocument();
  });
});

