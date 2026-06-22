"use client";

import { setCount, type Chronicle, type CountKey } from "~/lib/chronicle";

export function CountControl({
  title,
  value,
  countKey,
  chronicle,
  onChange,
  hint,
}: {
  title: string;
  value: number;
  countKey: CountKey;
  chronicle: Chronicle;
  onChange: (next: Chronicle) => void;
  hint: string;
}) {
  function choose(event: React.ChangeEvent<HTMLSelectElement>) {
    onChange(
      setCount(chronicle, countKey, Number(event.currentTarget.value)),
    );
  }

  return (
    <div className="rounded-2xl border border-amber-900/30 bg-stone-950/70 p-4 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300/80">
            {title}
          </p>
          <p className="text-xs text-stone-400">{hint}</p>
        </div>
        <select
          className="w-full cursor-pointer rounded-xl border border-stone-700 bg-black/60 px-3 py-2 text-sm text-stone-100 outline-none focus:border-amber-300"
          value={value}
          onChange={choose}
        >
          {[0, 1, 2, 3, 4, 5].map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
