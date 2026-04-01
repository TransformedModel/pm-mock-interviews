import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { SuggestForm } from "@/components/SuggestForm";

const categoryOptions = [
  { key: "product_design", label: "Product Design" },
  { key: "technical", label: "Technical" },
];

describe("SuggestForm", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("shows validation errors when fields are empty", async () => {
    render(<SuggestForm categoryOptions={categoryOptions} />);

    const submit = screen.getByText("Submit");
    fireEvent.click(submit);

    expect(screen.getByText("Please add the question prompt.")).toBeInTheDocument();
  });

  it("submits to /api/suggestions and shows success message", async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "product_design-123.md", category: "Product Design" }),
    });

    render(<SuggestForm categoryOptions={categoryOptions} />);

    const prompt = screen.getByPlaceholderText("E.g., Design a product for…");
    const modelAnswer = screen.getByPlaceholderText(
      "Write a strong, structured model answer…",
    );

    fireEvent.change(prompt, { target: { value: "Design a better onboarding." } });
    fireEvent.change(modelAnswer, { target: { value: "Great answer here." } });

    const submit = screen.getByText("Submit");
    fireEvent.click(submit);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/suggestions",
      expect.objectContaining({
        method: "POST",
      }),
    );

    await waitFor(() => {
      expect(screen.getByText(/Added/i)).toBeInTheDocument();
      expect(screen.getByText("product_design-123.md")).toBeInTheDocument();
    });
  });
});

