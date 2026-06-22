export function RollBadge({ dice, roll }: { dice: string; roll: number }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-stone-600 bg-black/40 px-2.5 py-1 font-mono text-[0.7rem] font-semibold text-amber-100">
      {dice}: {roll}
    </span>
  );
}
