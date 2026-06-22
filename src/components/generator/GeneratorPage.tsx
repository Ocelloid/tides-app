"use client";

import { useCallback, useState, type ReactNode } from "react";

import { CharacterCreationWizard } from "~/components/character-creation/CharacterCreationWizard";
import { STEP_LABELS } from "~/components/character-creation/stepLabels";
import {
  applyCharacterBuildToChronicle,
  CHARACTER_BUILD_STEPS,
  emptyCharacterBuild,
  formatChronicleForBuild,
  rerollNarrativeChronicle,
  type CharacterBuild,
  type CharacterBuildStep,
} from "~/lib/character";
import { type Chronicle } from "~/lib/chronicle";
import { BACKGROUND_IMAGE_PATH } from "~/lib/pdf/assets";

import { GeneratorControls } from "./GeneratorControls";
import { MarkdownEditor } from "./MarkdownEditor";
import { PdfExportButton } from "./PdfExportButton";

function GeneratorShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-stone-950 px-5 py-8 text-stone-100">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 scale-110 bg-cover bg-center opacity-70 blur-md"
        style={{ backgroundImage: `url(${BACKGROUND_IMAGE_PATH})` }}
      />
      <section className="relative z-20 mx-auto flex max-w-7xl flex-col gap-8">
        {children}
      </section>
    </main>
  );
}

function GeneratorHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="rounded-2xl border border-amber-700/30 bg-black/35 p-4 shadow-2xl shadow-black/30">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
            Дикогорье
          </p>
          <h1 className="text-2xl font-black tracking-tight text-stone-50">
            {title}
          </h1>
          <p className="text-base leading-7 text-stone-300">{description}</p>
        </div>
        {actions ? (
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

export function GeneratorPage() {
  const [characterBuild, setCharacterBuild] = useState<CharacterBuild>(() =>
    emptyCharacterBuild(),
  );
  const [wizardPhase, setWizardPhase] = useState<"active" | "done">("active");
  const [wizardStep, setWizardStep] = useState<CharacterBuildStep>("class");
  const [wizardSessionKey, setWizardSessionKey] = useState(0);
  const [chronicle, setChronicle] = useState<Chronicle | null>(null);
  const [text, setText] = useState("");
  const [copyState, setCopyState] = useState("Скопировать");
  const [controlsVisible, setControlsVisible] = useState(true);

  function applyChronicle(next: Chronicle, build: CharacterBuild) {
    setChronicle(next);
    setText(formatChronicleForBuild(next, build));
    setCopyState("Скопировать");
  }

  function handleWizardComplete() {
    setCharacterBuild((build) => {
      const completed = { ...build, wizardCompleted: true };
      applyChronicle(applyCharacterBuildToChronicle(completed), completed);
      return completed;
    });
    setWizardPhase("done");
  }

  function handleEdit() {
    setCharacterBuild((build) => ({ ...build, wizardCompleted: false }));
    setWizardStep("review");
    setWizardSessionKey((key) => key + 1);
    setWizardPhase("active");
  }

  const handleWizardStepChange = useCallback((step: CharacterBuildStep) => {
    setWizardStep(step);
  }, []);

  const wizardStepNumber = CHARACTER_BUILD_STEPS.indexOf(wizardStep) + 1;
  const wizardStepTotal = CHARACTER_BUILD_STEPS.length;

  async function copyText(source = text) {
    try {
      await navigator.clipboard.writeText(source);
      setCopyState("Скопировано");
    } catch {
      setCopyState("Не удалось");
    }
  }

  function updateText(next: string) {
    setText(next);
    setCopyState("Скопировать");
  }

  if (wizardPhase === "active") {
    return (
      <GeneratorShell>
        <GeneratorHeader
          description={`Шаг ${wizardStepNumber} из ${wizardStepTotal} — ${STEP_LABELS[wizardStep]}. Пошаговое создание персонажа D&D 5e: класс, раса, происхождение, характеристики, снаряжение, оружие и магия.`}
          title="Создание персонажа"
        />
        <CharacterCreationWizard
          key={wizardSessionKey}
          build={characterBuild}
          initialStep={wizardStep}
          onBuildChange={setCharacterBuild}
          onComplete={handleWizardComplete}
          onStepChange={handleWizardStepChange}
        />
      </GeneratorShell>
    );
  }

  if (!chronicle) {
    return (
      <GeneratorShell>
        <GeneratorHeader
          description="Подготовка хроники с выбранными параметрами персонажа…"
          title="Генератор персонажа"
        />
        <p className="rounded-2xl border border-amber-700/30 bg-black/35 p-6 text-base text-stone-300">
          Создание хроники…
        </p>
      </GeneratorShell>
    );
  }

  return (
    <GeneratorShell>
      <GeneratorHeader
        actions={
          <>
            <button
              className="rounded-xl bg-amber-300 p-3 cursor-pointer text-sm font-black uppercase tracking-[0.18em] text-stone-950 shadow-lg shadow-amber-950/40 hover:bg-amber-200"
              type="button"
              onClick={() =>
                applyChronicle(
                  rerollNarrativeChronicle(characterBuild),
                  characterBuild,
                )
              }
            >
              Сгенерировать
            </button>
            <PdfExportButton characterBuild={characterBuild} chronicle={chronicle} />
            <button
              aria-expanded={controlsVisible}
              className="rounded-xl border border-amber-500/40 bg-black/35 p-3 cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-amber-100 hover:border-amber-300 hover:bg-amber-300/10"
              type="button"
              onClick={() => setControlsVisible((visible) => !visible)}
            >
              {controlsVisible ? "Скрыть настройки" : "Показать настройки"}
            </button>
            <button
              className="rounded-xl border border-stone-600/60 bg-black/25 p-3 cursor-pointer text-sm font-semibold uppercase tracking-[0.18em] text-stone-300 hover:border-amber-400/60 hover:text-amber-100"
              type="button"
              onClick={handleEdit}
            >
              Редактировать
            </button>
          </>
        }
        description="Бросает таблицы биографии, семьи, союзников, судьбоносных моментов, любимой еды, секрета и пророчеств. Итоговый Markdown можно форматировать и копировать."
        title="Генератор персонажа"
      />

      <div
        className={
          controlsVisible
            ? "grid gap-6 lg:grid-cols-[minmax(20rem,27rem)_1fr]"
            : "grid gap-6"
        }
      >
        {controlsVisible ? (
          <GeneratorControls
            chronicle={chronicle}
            onChange={(next) => applyChronicle(next, characterBuild)}
            wizardCompleted={characterBuild.wizardCompleted}
          />
        ) : null}

        <MarkdownEditor
          copyState={copyState}
          text={text}
          onCopy={(source) => void copyText(source)}
          onTextChange={updateText}
        />
      </div>
    </GeneratorShell>
  );
}
