"use client";

import { useState } from "react";

import type { CategoryKey, Difficulty } from "@/lib/types";

type Props = {
  categoryOptions: { key: string; label: string }[];
};

export function SuggestForm({ categoryOptions }: Props) {
  const [category, setCategory] = useState<CategoryKey>("product_design");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [prompt, setPrompt] = useState("");
  const [modelAnswer, setModelAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; category: string } | null>(null);

  async function submit() {
    setError(null);
    setSuccess(null);

    if (!prompt.trim()) {
      setError("Please add the question prompt.");
      return;
    }
    if (!modelAnswer.trim()) {
      setError("Please add a model answer.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category,
          difficulty,
          prompt,
          modelAnswer,
        }),
      });

      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const j = (await res.json()) as { error?: string };
          if (j?.error) msg = j.error;
        } catch {
          const text = await res.text();
          if (text) msg = text;
        }
        throw new Error(msg);
      }

      const j = (await res.json()) as { id: string; category: string };
      setSuccess(j);
      setPrompt("");
      setModelAnswer("");
      setDifficulty("medium");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4">
        <div className="grid gap-1">
          <label className="text-sm font-semibold text-zinc-900">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryKey)}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4"
          >
            {categoryOptions.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-semibold text-zinc-900">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-4"
          >
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-semibold text-zinc-900">Question prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., Design a product for…"
            className="h-28 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 placeholder:text-zinc-400 focus:ring-4"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-semibold text-zinc-900">Model answer</label>
          <textarea
            value={modelAnswer}
            onChange={(e) => setModelAnswer(e.target.value)}
            placeholder="Write a strong, structured model answer…"
            className="h-56 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 placeholder:text-zinc-400 focus:ring-4"
          />
          <div className="text-xs text-zinc-500">
            Keep it interview-style: assumptions, trade-offs, and success metrics.
          </div>
        </div>

        {error ? <div className="text-sm text-rose-700">{error}</div> : null}
        {success ? (
          <div className="text-sm text-emerald-700">
            Added <span className="font-semibold">{success.id}</span> to{" "}
            <span className="font-semibold">{success.category}</span>.
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={isSubmitting}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 hover:bg-zinc-800"
          >
            {isSubmitting ? "Submitting…" : "Submit"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPrompt("");
              setModelAnswer("");
              setError(null);
              setSuccess(null);
              setDifficulty("medium");
            }}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Clear
          </button>
        </div>
      </div>
    </section>
  );
}

