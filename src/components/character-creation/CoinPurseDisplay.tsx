import {
  compactPurseToGsp,
  formatPurseBreakdownRu,
  type CharacterBuild,
} from "~/lib/character";

import { wizardTheme } from "./wizardTheme";

const COIN_FIELDS = [
  { key: "gp" as const, label: "Золото" },
  { key: "sp" as const, label: "Серебро" },
  { key: "cp" as const, label: "Медь" },
] as const;

type CoinPurseDisplayProps = {
  build: CharacterBuild;
  totalLabel?: string;
};

export function CoinPurseDisplay({
  build,
  totalLabel = "Всего",
}: CoinPurseDisplayProps) {
  const compact = compactPurseToGsp(build.coins);
  const breakdown = formatPurseBreakdownRu(build.coins);

  return (
    <section className={wizardTheme.detailPanel}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 className={wizardTheme.sectionLabel}>Кошелёк</h3>
        <p className="text-sm text-stone-400">
          {totalLabel}{" "}
          <span className="font-semibold text-amber-200">{breakdown}</span>
        </p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {COIN_FIELDS.map(({ key, label }) => (
          <div
            className="flex flex-col items-center rounded-lg border border-stone-700/80 bg-black/40 px-2 py-2"
            key={key}
          >
            <span className="text-center text-xs font-medium text-stone-400">
              {label}
            </span>
            <span className="mt-1 text-lg font-bold tabular-nums text-stone-100">
              {compact[key]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
