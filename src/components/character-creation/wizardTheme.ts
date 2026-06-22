/** Shared styling aligned with SectionControl / GeneratorPage dark amber theme. */

export const wizardTheme = {
  stepperPanel:
    "rounded-2xl border border-amber-900/40 bg-black/50 px-4 py-3 shadow-lg shadow-black/30",
  article:
    "rounded-2xl border border-amber-900/30 bg-stone-950/70 p-5 shadow-xl shadow-black/20 sm:p-8",
  stepHeading: "text-xl font-black text-stone-50",
  stepDescription: "mt-2 text-base leading-7 text-stone-300",
  sectionLabel:
    "text-sm font-semibold uppercase tracking-[0.18em] text-amber-300",
  detailPanel:
    "rounded-xl border border-amber-700/40 bg-black/40 px-4 py-4",
  detailTitle: "text-sm font-semibold text-amber-200",
  detailBody: "mt-2 text-sm leading-7 text-stone-300",
  detailPlaceholder:
    "rounded-xl border border-dashed border-stone-500/70 px-4 py-3 text-sm text-stone-400",
  infoBanner:
    "rounded-xl border border-amber-700/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-100",
  warningBanner:
    "rounded-xl border border-amber-700/40 bg-black/40 px-4 py-3 text-sm text-amber-100",
  errorBanner:
    "rounded-xl border border-red-700/50 bg-red-950/30 px-4 py-3 text-sm text-red-200",
  selectCard: {
    base: "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
    selected:
      "border-amber-400/80 bg-amber-950/50 ring-1 ring-amber-400/50",
    unselected:
      "border-stone-600/80 bg-black/50 hover:border-amber-600/60 hover:bg-stone-900/70",
  },
  navBar:
    "rounded-2xl border border-amber-900/40 bg-black/50 px-4 py-3 shadow-lg shadow-black/30",
  navButtonPrimary:
    "cursor-pointer rounded-xl border border-amber-300 bg-amber-300 px-6 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-stone-950 shadow-md shadow-amber-900/30 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:border-stone-600 disabled:bg-stone-700 disabled:text-stone-400 disabled:shadow-none",
  navButtonSecondary:
    "cursor-pointer rounded-xl border border-amber-400/70 bg-stone-900/80 px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-stone-100 transition hover:border-amber-300 hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-700 disabled:bg-stone-900/40 disabled:text-stone-600",
  editButton:
    "cursor-pointer rounded-full border border-amber-500/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-200 transition hover:border-amber-300 hover:bg-amber-300/10",
  summaryCard:
    "flex flex-col gap-3 rounded-xl border border-stone-700/80 bg-black/40 px-4 py-4",
} as const;
