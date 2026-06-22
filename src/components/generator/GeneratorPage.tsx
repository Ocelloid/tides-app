"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  formatChronicle,
  generateChronicle,
  type Chronicle,
} from "~/lib/chronicle";
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

export function GeneratorPage() {
  // generateChronicle() использует Math.random(). Если вызывать его при первом
  // рендере (useState(generateChronicle()) или const initial = generateChronicle()),
  // Next.js отрендерит SSR с одними бросками, а клиент — с другими → hydration error
  // в RollBadge. Поэтому chronicle=null до useEffect на клиенте.
  const [chronicle, setChronicle] = useState<Chronicle | null>(null);
  const [text, setText] = useState("");
  const [copyState, setCopyState] = useState("Скопировать");
  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => {
    const initial = generateChronicle();
    setChronicle(initial);
    setText(formatChronicle(initial));
  }, []);

  function applyChronicle(next: Chronicle) {
    setChronicle(next);
    setText(formatChronicle(next));
    setCopyState("Скопировать");
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

  if (!chronicle) {
    return (
      <GeneratorShell>
        <header className="rounded-2xl border border-amber-700/30 bg-black/35 p-4 shadow-2xl shadow-black/30">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
            Дикогорье
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-stone-50">
            Генератор персонажа
          </h1>
          <p className="mt-3 text-base text-stone-400">Загрузка таблиц…</p>
        </header>
      </GeneratorShell>
    );
  }

  return (
    <GeneratorShell>
        <header className="rounded-2xl border border-amber-700/30 bg-black/35 p-4 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-3xl flex-col gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
                Дикогорье
              </p>
              <h1 className="text-2xl font-black tracking-tight text-stone-50">
                Генератор персонажа
              </h1>
              <p className="text-base leading-7 text-stone-300">
                Бросает таблицы биографии, семьи, союзников, судьбоносных
                моментов, любимой еды, секрета и пророчеств. Итоговый Markdown
                можно форматировать и копировать.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button
                className="rounded-xl bg-amber-300 p-3 cursor-pointer text-sm font-black uppercase tracking-[0.18em] text-stone-950 shadow-lg shadow-amber-950/40 hover:bg-amber-200"
                type="button"
                onClick={() => applyChronicle(generateChronicle())}
              >
                Сгенерировать
              </button>
              <PdfExportButton chronicle={chronicle} />
              <button
                aria-expanded={controlsVisible}
                className="rounded-xl border border-amber-500/40 bg-black/35 p-3 cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-amber-100 hover:border-amber-300 hover:bg-amber-300/10"
                type="button"
                onClick={() => setControlsVisible((visible) => !visible)}
              >
                {controlsVisible ? "Скрыть настройки" : "Показать настройки"}
              </button>
            </div>
          </div>
        </header>

        <div
          className={
            controlsVisible
              ? "grid gap-6 lg:grid-cols-[minmax(20rem,27rem)_1fr]"
              : "grid gap-6"
          }
        >
          {controlsVisible ? (
            <GeneratorControls chronicle={chronicle} onChange={applyChronicle} />
          ) : null}

          <MarkdownEditor
            text={text}
            copyState={copyState}
            onTextChange={updateText}
            onCopy={(source) => void copyText(source)}
          />
        </div>
    </GeneratorShell>
  );
}
