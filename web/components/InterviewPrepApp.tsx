"use client";

import { useMemo, useState } from "react";

import type { CategoryKey, Question, QuestionBank } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { CategoryPicker } from "@/components/CategoryPicker";
import { PracticeCard } from "@/components/PracticeCard";
import { FeedbackPanel, type FeedbackResult } from "@/components/FeedbackPanel";
import Link from "next/link";

function pickRandom(list: Question[]): Question {
  return list[Math.floor(Math.random() * list.length)];
}

type Props = {
  bank: QuestionBank;
  initialCategory: CategoryKey;
  initialQuestion: Question;
};

export function InterviewPrepApp({ bank, initialCategory, initialQuestion }: Props) {
  const counts = useMemo(() => {
    return Object.fromEntries(
      Object.entries(bank).map(([k, v]) => [k, v.length]),
    ) as Record<CategoryKey, number>;
  }, [bank]);

  const [category, setCategory] = useState<CategoryKey>(initialCategory);
  const [question, setQuestion] = useState<Question>(initialQuestion);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);

  function changeCategory(next: CategoryKey) {
    setCategory(next);
    setQuestion(pickRandom(bank[next]));
    setShowFollowUps(false);
    setAnswer("");
    setFeedback(null);
    setError(null);
  }

  function newQuestionSameCategory() {
    setQuestion(pickRandom(bank[category]));
    setShowFollowUps(false);
    setAnswer("");
    setFeedback(null);
    setError(null);
  }

  async function submit() {
    setError(null);

    if (!answer.trim()) {
      setError("Write an answer first—rough notes are totally fine.");
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category,
          questionId: question.id,
          prompt: question.prompt,
          rubricBullets: question.what_good_looks_like,
          modelAnswer: question.answer,
          userAnswer: answer,
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

      const data = (await res.json()) as FeedbackResult;
      setFeedback(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-full bg-zinc-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium text-zinc-600">PM mock interviews</div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
                Practice one question at a time.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-zinc-600">
                Pick a category, write your answer, then submit for feedback and compare with a
                strong model answer.
              </p>
            </div>

            <Link
              href="/suggest"
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Suggest a question
            </Link>
          </div>

          <CategoryPicker selected={category} onSelect={changeCategory} counts={counts} />
        </header>

        <main className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="grid gap-6">
            <PracticeCard
              categoryLabel={CATEGORY_LABELS[category]}
              question={question}
              showFollowUps={showFollowUps}
              onToggleFollowUps={() => setShowFollowUps((v) => !v)}
              onNewQuestion={newQuestionSameCategory}
            />

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-zinc-950">Your answer</h3>
                <div className="text-xs text-zinc-500">
                  Tip: start with a structure, then fill it in.
                </div>
              </div>

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your answer here…"
                className="mt-3 h-56 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 placeholder:text-zinc-400 focus:ring-4"
              />

              {error ? <div className="mt-3 text-sm text-rose-700">{error}</div> : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={submit}
                  disabled={isSubmitting}
                  className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 hover:bg-zinc-800"
                >
                  {isSubmitting ? "Analyzing…" : "Submit"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAnswer("");
                    setFeedback(null);
                    setError(null);
                  }}
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={newQuestionSameCategory}
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                >
                  New question
                </button>
              </div>
            </section>
          </div>

          <div className="grid gap-6">
            <FeedbackPanel question={question} feedback={feedback} />
          </div>
        </main>

        <footer className="mt-10 text-xs text-zinc-500">
          Your answer is analyzed on submit. If you haven’t set `GEMINI_API_KEY`, you’ll see an error until you add it to
          `pm-mock-interviews/web/.env.local`.
        </footer>
      </div>
    </div>
  );
}

