import type { Question } from "@/lib/types";
import sanitizeHtml from "sanitize-html";

export type FeedbackResult = {
  strengths: string[];
  gaps: string[];
  suggestedRewrite: string;
  followUpQuestions: string[];
  rubricCoverage: { bullet: string; covered: boolean; notes?: string }[];
};

const RICH_TEXT_SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: ["strong", "em", "b", "i", "br", "p", "span"],
  allowedAttributes: {
    span: ["style"],
  },
};

/** Decode entities; repeat passes so `&amp;lt;strong&amp;gt;` becomes real tags. */
function decodeHtmlEntities(input: string): string {
  let s = input;
  for (let pass = 0; pass < 8; pass++) {
    const prev = s;
    s = s
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&#(\d+);/g, (_, code) => {
        const n = parseInt(code, 10);
        return Number.isFinite(n) && n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : _;
      })
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
        const n = parseInt(hex, 16);
        return Number.isFinite(n) && n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : _;
      });
    if (s === prev) break;
  }
  return s;
}

function richTextHtml(raw: string): string {
  return sanitizeHtml(decodeHtmlEntities(raw), RICH_TEXT_SANITIZE);
}

function RichLine({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: richTextHtml(html) }}
    />
  );
}

export function FeedbackPanel({
  question,
  feedback,
}: {
  question: Question;
  feedback: FeedbackResult | null;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-zinc-950">Feedback</h3>

      {!feedback ? (
        <p className="mt-2 text-sm text-zinc-600">
          Submit your answer to get feedback and see the model answer.
        </p>
      ) : (
        <div className="mt-4 grid gap-5">
          <div className="grid gap-2">
            <h4 className="text-sm font-semibold text-zinc-900">Strengths</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
              {feedback.strengths.map((s, i) => (
                <li key={`s-${i}`}>
                  <RichLine html={s} />
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-2">
            <h4 className="text-sm font-semibold text-zinc-900">Gaps</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
              {feedback.gaps.map((g, i) => (
                <li key={`g-${i}`}>
                  <RichLine html={g} />
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-2">
            <h4 className="text-sm font-semibold text-zinc-900">Rubric coverage</h4>
            <ul className="space-y-2">
              {feedback.rubricCoverage.map((r, i) => (
                <li key={`r-${i}`} className="flex items-start gap-2">
                  <span
                    className={[
                      "mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs font-semibold",
                      r.covered ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500",
                    ].join(" ")}
                  >
                    {r.covered ? "✓" : "–"}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm text-zinc-800">
                      <RichLine html={r.bullet} />
                    </div>
                    {r.notes ? (
                      <div className="text-xs text-zinc-500">
                        <RichLine html={r.notes} />
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-2">
            <h4 className="text-sm font-semibold text-zinc-900">Suggested rewrite (short)</h4>
            <div
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: richTextHtml(feedback.suggestedRewrite),
              }}
            />
          </div>

          {feedback.followUpQuestions?.length ? (
            <div className="grid gap-2">
              <h4 className="text-sm font-semibold text-zinc-900">Likely follow-ups</h4>
              <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
                {feedback.followUpQuestions.map((q, i) => (
                  <li key={`f-${i}`}>
                    <RichLine html={q} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid gap-2">
            <h4 className="text-sm font-semibold text-zinc-900">Model answer</h4>
            <div className="grid gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Structure</div>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                  {question.answer.structure.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Sample</div>
                <div className="mt-1 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800 whitespace-pre-wrap">
                  {question.answer.sample}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

