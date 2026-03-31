import Link from "next/link";

import { SuggestForm } from "@/components/SuggestForm";
import { CATEGORY_LABELS } from "@/lib/types";

export default function SuggestPage() {
  return (
    <div className="min-h-full bg-zinc-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-zinc-600">Contribute</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
              Suggest a new question
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Add a prompt + a strong model answer. We’ll generate the rubric/follow-ups automatically
              when possible.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex min-w-[150px] items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-2 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Back to practice
          </Link>
        </header>

        <main className="mt-8">
          <SuggestForm
            categoryOptions={Object.entries(CATEGORY_LABELS).map(([k, v]) => ({
              key: k,
              label: v,
            }))}
          />
        </main>
      </div>
    </div>
  );
}

