import type { Question } from "@/lib/types";

function DifficultyPill({ difficulty }: { difficulty: Question["difficulty"] }) {
  const cls =
    difficulty === "easy"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : difficulty === "medium"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-rose-50 text-rose-700 ring-rose-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${cls}`}>
      {difficulty}
    </span>
  );
}

export function PracticeCard({
  categoryLabel,
  question,
  showFollowUps,
  onToggleFollowUps,
  onNewQuestion,
}: {
  categoryLabel: string;
  question: Question;
  showFollowUps: boolean;
  onToggleFollowUps: () => void;
  onNewQuestion: () => void;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-zinc-800">{categoryLabel}</span>
            <DifficultyPill difficulty={question.difficulty} />
            <span className="text-xs text-zinc-500">{question.id}</span>
          </div>
          <h2 className="text-lg font-semibold leading-7 text-zinc-950">{question.prompt}</h2>
        </div>

        <button
          type="button"
          onClick={onNewQuestion}
          className="rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          New question
        </button>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={onToggleFollowUps}
          className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
        >
          {showFollowUps ? "Hide follow-ups" : "Show follow-ups"}
        </button>

        {showFollowUps ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
            {question.follow_ups.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

