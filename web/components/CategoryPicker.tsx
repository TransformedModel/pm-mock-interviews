import type { CategoryKey } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";

type Props = {
  selected: CategoryKey;
  onSelect: (key: CategoryKey) => void;
  counts?: Partial<Record<CategoryKey, number>>;
};

export function CategoryPicker({ selected, onSelect, counts }: Props) {
  const keys = Object.keys(CATEGORY_LABELS) as CategoryKey[];

  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((k) => {
        const isActive = k === selected;
        const count = counts?.[k];
        return (
          <button
            key={k}
            type="button"
            onClick={() => onSelect(k)}
            className={[
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
              isActive
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50",
            ].join(" ")}
          >
            <span>{CATEGORY_LABELS[k]}</span>
            {typeof count === "number" ? (
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-xs",
                  isActive ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-700",
                ].join(" ")}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

