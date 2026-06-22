"use client";

import {
  CHARACTER_BUILD_STEPS,
  type CharacterBuild,
  type CharacterBuildStep,
  isStepComplete,
} from "~/lib/character";

import { STEP_LABELS } from "./stepLabels";
import { wizardTheme } from "./wizardTheme";

type StepIndicatorProps = {
  currentStep: CharacterBuildStep;
  build: CharacterBuild;
  onStepClick?: (step: CharacterBuildStep) => void;
};

function ChevronRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="hidden h-4 w-4 shrink-0 text-stone-500 sm:block"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StepIndicator({
  currentStep,
  build,
  onStepClick,
}: StepIndicatorProps) {
  const currentIndex = CHARACTER_BUILD_STEPS.indexOf(currentStep);

  return (
    <nav
      aria-label="Шаги создания персонажа"
      className={`${wizardTheme.stepperPanel} flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2`}
    >
      {CHARACTER_BUILD_STEPS.map((step, index) => {
        const isCurrent = step === currentStep;
        const isComplete = isStepComplete(build, step);
        const isPast = index < currentIndex;
        const isClickable = Boolean(onStepClick) && (isPast || isComplete);

        const content = (
          <>
            {/*<span
              className={
                isCurrent
                  ? "flex h-7 w-7 items-center justify-center rounded-full bg-amber-300 text-xs font-black text-stone-950 shadow-md shadow-amber-900/40"
                  : isComplete || isPast
                    ? "flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white"
                    : "flex h-7 w-7 items-center justify-center rounded-full border border-stone-500 bg-stone-900/80 text-xs font-semibold text-stone-300"
              }
            >
              {isComplete && !isCurrent ? "✓" : index + 1}
            </span>*/}
            <span
              className={
                isCurrent
                  ? "text-sm font-bold text-amber-200"
                  : isComplete || isPast
                    ? "text-sm font-medium text-stone-200"
                    : "text-sm font-medium text-stone-400"
              }
            >
              {STEP_LABELS[step]}
            </span>
          </>
        );

        return (
          <div className="flex items-center gap-2 sm:gap-2" key={step}>
            {isClickable ? (
              <button
                className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-left transition hover:bg-white/5"
                type="button"
                onClick={() => onStepClick?.(step)}
              >
                {content}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-1 py-1">{content}</div>
            )}
            {index < CHARACTER_BUILD_STEPS.length - 1 ? (
              <ChevronRightIcon />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
