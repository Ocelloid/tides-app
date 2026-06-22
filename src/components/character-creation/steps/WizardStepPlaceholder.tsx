"use client";

import { getPrimaryClassId, type CharacterBuild, type CharacterBuildStep } from "~/lib/character";

import { STEP_DESCRIPTIONS, STEP_LABELS } from "../stepLabels";

type WizardStepPlaceholderProps = {
  step: CharacterBuildStep;
  build: CharacterBuild;
};

const TASK_REFERENCES: Partial<Record<CharacterBuildStep, string>> = {
  class: "Task 05",
  race: "Task 06",
  background: "Task 07",
  abilities: "Task 08",
  equipment: "Task 09",
  review: "Task 12",
};

function ChevronCardIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0 text-stone-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WizardStepPlaceholder({
  step,
  build,
}: WizardStepPlaceholderProps) {
  const taskRef = TASK_REFERENCES[step];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-black text-stone-900">{STEP_LABELS[step]}</h2>
        <p className="mt-2 text-base leading-7 text-stone-600">
          {STEP_DESCRIPTIONS[step]}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {[1, 2, 3].map((index) => (
          <li
            className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 shadow-sm"
            key={index}
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-stone-400">
                Заглушка {index}
              </span>
              <span className="text-base text-stone-700">
                Контент шага «{STEP_LABELS[step]}» будет добавлен в {taskRef ?? "следующей задаче"}.
              </span>
            </div>
            <ChevronCardIcon />
          </li>
        ))}
      </ul>

      {step === "review" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Сводка (предпросмотр)</p>
          <dl className="mt-2 grid gap-1 sm:grid-cols-2">
            <div>
              <dt className="text-amber-700">Класс</dt>
              <dd>{getPrimaryClassId(build) ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-amber-700">Раса</dt>
              <dd>{build.raceId ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-amber-700">Происхождение</dt>
              <dd>{build.backgroundId ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-amber-700">Снаряжение</dt>
              <dd>{build.equipmentChoice ?? "—"}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
