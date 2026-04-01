"use client";

import { useMemo, useState } from "react";
import Confetti from "react-confetti";

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
  const [showReportProblem, setShowReportProblem] = useState(false);
  const [reportText, setReportText] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportStatus, setReportStatus] = useState<"idle" | "success" | "error">("idle");

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

  async function submitReport() {
    setReportStatus("idle");

    const description = reportText.trim();
    if (!description) return;

    setIsSubmittingReport(true);
    try {
      const res = await fetch("/api/report-problem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          description,
          category,
          questionId: question.id,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      setReportText("");
      setReportStatus("success");
    } catch {
      setReportStatus("error");
    } finally {
      setIsSubmittingReport(false);
    }
  }

  async function submit() {
    setError(null);

    if (!answer.trim()) {
      setError("Write an answer first—rough notes are totally fine.");
      return;
    }

    setIsSubmitting(true);

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
    <div className="relative min-h-full bg-zinc-50">
      {feedback ? (
        <Confetti
          recycle={false}
          numberOfPieces={220}
          className="pointer-events-none fixed inset-0"
        />
      ) : null}
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

        <footer className="mt-10 border-t border-zinc-200 pt-4 text-xs text-zinc-500">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-x-1">
              <span>
                Made by{" "}
                <a
                  href="https://github.com/TransformedModel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-zinc-700 hover:text-zinc-900 underline underline-offset-2"
                >
                  Niharika Kohli
                </a>
                .
              </span>
              <span>
                Built through vibe-coding with the valuable contributions of Cursor, Gemini and Render.
                This application is purely experimental; please don&apos;t input any sensitive data here.
                The app is using the Gemini free tier and may run out of credits at any time.
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                // Toggle problem report UI by updating local state
                setShowFollowUps(false);
                setShowReportProblem((v) => !v);
              }}
              className="mt-2 inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 sm:mt-0"
            >
              Report a problem
            </button>
          </div>

          {showReportProblem ? (
            <div className="mt-3 space-y-2 rounded-2xl border border-zinc-200 bg-white p-3 text-xs text-zinc-700">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Describe the problem (no sensitive data)
              </label>
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                className="h-20 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none ring-zinc-900/10 placeholder:text-zinc-400 focus:ring-4"
                placeholder="What went wrong? What were you trying to do?"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={submitReport}
                  disabled={isSubmittingReport || !reportText.trim()}
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 hover:bg-zinc-800"
                >
                  {isSubmittingReport ? "Sending…" : "Submit problem"}
                </button>
                {reportStatus === "success" ? (
                  <span className="text-[11px] text-emerald-700">
                    Thanks — your report was logged.
                  </span>
                ) : null}
                {reportStatus === "error" ? (
                  <span className="text-[11px] text-rose-700">
                    Couldn&apos;t send report. Please try again later.
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

