"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { CharacterCreationWizard } from "~/components/character-creation/CharacterCreationWizard";
import {
  applyCharacterBuildToChronicle,
  clearNarrativeChronicle,
  emptyCharacterBuild,
  formatChronicleForBuild,
  rerollNarrativeChronicle,
  syncCharacterBuildToChronicle,
  type CharacterBuild,
  type CharacterBuildStep,
} from "~/lib/character";
import { type Chronicle } from "~/lib/chronicle";
import { resolveCharacterNameForExport } from "~/lib/chronicle/raceNames";
import {
  parseCharacterSnapshot,
  type CharacterSnapshot,
  type CharacterSnapshotInput,
} from "~/lib/generator/characterSnapshot";
import { BACKGROUND_IMAGE_PATH } from "~/lib/pdf/assets";

import { CharacterSnapshotDropZone } from "./CharacterSnapshotDropZone";
import { GeneratorControls } from "./GeneratorControls";
import { JsonExportButton } from "./JsonExportButton";
import { MarkdownEditor } from "./MarkdownEditor";
import { PdfExportButton } from "./PdfExportButton";

type ImportMessage = {
  kind: "error" | "success";
  text: string;
};

function GeneratorShell({
  children,
  importMessage,
  onImportError,
  onSnapshotFile,
}: {
  children: ReactNode;
  importMessage?: ImportMessage | null;
  onImportError?: (message: string) => void;
  onSnapshotFile?: (file: File) => void | Promise<void>;
}) {
  const section = (
    <section className="relative z-20 mx-auto flex max-w-7xl flex-col gap-8">
      {importMessage ? (
        <p
          className={
            importMessage.kind === "error"
              ? "rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100"
              : "rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100"
          }
          role="status"
        >
          {importMessage.text}
        </p>
      ) : null}
      {children}
    </section>
  );

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-stone-950 px-5 py-8 text-stone-100">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 scale-110 bg-cover bg-center opacity-70 blur-md"
        style={{ backgroundImage: `url(${BACKGROUND_IMAGE_PATH})` }}
      />
      {onSnapshotFile ? (
        <CharacterSnapshotDropZone
          onImportError={onImportError}
          onSnapshotFile={onSnapshotFile}
        >
          {section}
        </CharacterSnapshotDropZone>
      ) : (
        section
      )}
    </main>
  );
}

export function GeneratorHeader({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="rounded-2xl flex flex-col gap-2 border border-amber-700/30 bg-black/35 p-4 shadow-2xl shadow-black/30">
      <div className="flex flex-col w-full gap-2 lg:items-center lg:justify-between">
        <div className="flex flex-col w-full gap-1">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
            Дикогорье
          </p>
          <h1 className="text-2xl font-black tracking-tight text-stone-50">
            {title}
          </h1>
          <p className="text-base leading-7 text-stone-300">{description}</p>
        </div>
        {actions ? (
          <div className="flex md:flex-row flex-col gap-3 w-full justify-end">{actions}</div>
        ) : null}
      </div>
      {children}
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
  const [characterName, setCharacterName] = useState("");
  const [characterNamePlaceholder, setCharacterNamePlaceholder] = useState("");
  const [importMessage, setImportMessage] = useState<ImportMessage | null>(null);

  function applyChronicle(next: Chronicle, build: CharacterBuild) {
    setChronicle(next);
    setText(formatChronicleForBuild(next, build));
    setCopyState("Скопировать");
  }

  function handleWizardComplete() {
    setCharacterBuild((build) => {
      const completed = { ...build, wizardCompleted: true };
      const nextChronicle = chronicle
        ? syncCharacterBuildToChronicle(completed, chronicle)
        : applyCharacterBuildToChronicle(completed);
      applyChronicle(nextChronicle, completed);
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

  const snapshotInput = useMemo(
    (): CharacterSnapshotInput => ({
      characterBuild,
      chronicle,
      characterName,
      characterNamePlaceholder,
      wizardPhase,
      wizardStep,
    }),
    [
      characterBuild,
      characterName,
      characterNamePlaceholder,
      chronicle,
      wizardPhase,
      wizardStep,
    ],
  );

  const applySnapshot = useCallback((snapshot: CharacterSnapshot) => {
    const build = snapshot.characterBuild;
    setCharacterBuild(build);
    setCharacterName(
      resolveCharacterNameForExport(
        snapshot.characterName,
        snapshot.characterNamePlaceholder,
      ),
    );
    setCharacterNamePlaceholder(snapshot.characterNamePlaceholder);
    setWizardStep(snapshot.wizardStep);
    setWizardSessionKey((key) => key + 1);

    if (snapshot.wizardPhase === "done" && build.wizardCompleted) {
      const nextChronicle =
        snapshot.chronicle ?? applyCharacterBuildToChronicle(build);
      setChronicle(nextChronicle);
      setText(formatChronicleForBuild(nextChronicle, build));
      setCopyState("Скопировать");
      setWizardPhase("done");
      return;
    }

    setWizardPhase("active");
    setChronicle(null);
    setText("");
  }, []);

  const handleSnapshotFile = useCallback(
    async (file: File) => {
      let raw: unknown;
      try {
        raw = JSON.parse(await file.text()) as unknown;
      } catch {
        throw new Error("Файл содержит некорректный JSON.");
      }

      const snapshot = parseCharacterSnapshot(raw);
      applySnapshot(snapshot);
      setImportMessage({ kind: "success", text: "Персонаж загружен из JSON." });
    },
    [applySnapshot],
  );

  const handleImportError = useCallback((message: string) => {
    setImportMessage({ kind: "error", text: message });
  }, []);

  const shellProps = {
    importMessage,
    onImportError: handleImportError,
    onSnapshotFile: handleSnapshotFile,
  };

  function handleClear() {
    applyChronicle(clearNarrativeChronicle(characterBuild), characterBuild);
  }

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
      <GeneratorShell {...shellProps}>
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
      <GeneratorShell {...shellProps}>
        <GeneratorHeader
          description="Подготовка хроники с выбранными параметрами персонажа…"
          title="Генератор хроники"
        />
        <p className="rounded-2xl border border-amber-700/30 bg-black/35 p-6 text-base text-stone-300">
          Создание хроники…
        </p>
      </GeneratorShell>
    );
  }

  return (
    <GeneratorShell {...shellProps}>
      <GeneratorHeader
        actions={
          <>
            <button
              className="rounded-xl border border-stone-600/60 bg-black/25 p-3 cursor-pointer text-sm font-semibold uppercase tracking-[0.18em] text-stone-300 hover:border-amber-400/60 hover:text-amber-100"
              type="button"
              onClick={handleEdit}
            >
              Назад к форме
            </button>
            <div className="flex flex-row justify-between md:justify-start items-start gap-3">
              <PdfExportButton
                characterBuild={characterBuild}
                characterName={characterName}
                characterNamePlaceholder={characterNamePlaceholder}
                chronicle={chronicle}
              />
              <JsonExportButton snapshot={snapshotInput} />
            </div>
            <button
              aria-expanded={controlsVisible}
              className="rounded-xl border border-stone-600/60 bg-black/25 p-3 cursor-pointer text-sm font-semibold uppercase tracking-[0.18em] text-stone-300 hover:border-amber-400/60 hover:text-amber-100"
              type="button"
              onClick={() => setControlsVisible((visible) => !visible)}
            >
              {controlsVisible ? "Скрыть настройки" : "Показать настройки"}
            </button>
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
          </>
        }
        description="Бросает таблицы внешности, биографии, семьи, союзников, судьбоносных моментов, любимой еды, секретов и пророчеств."
        title="Генератор хроники"
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
            characterName={characterName}
            characterNamePlaceholder={characterNamePlaceholder}
            chronicle={chronicle}
            onCharacterNameChange={setCharacterName}
            onCharacterNamePlaceholderChange={setCharacterNamePlaceholder}
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
