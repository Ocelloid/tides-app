"use client";

import { useState } from "react";

import type { CharacterBuild } from "~/lib/character";
import type { Chronicle } from "~/lib/chronicle";

import { PdfExportModal } from "./PdfExportModal";

type PdfExportButtonProps = {
  chronicle: Chronicle;
  characterBuild: CharacterBuild;
  characterName: string;
  characterNamePlaceholder: string;
};

export function PdfExportButton({
  chronicle,
  characterBuild,
  characterName,
  characterNamePlaceholder,
}: PdfExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "exporting" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const canExport = Boolean(chronicle) && characterBuild.wizardCompleted;

  function handleExportStart() {
    setStatus("exporting");
    setStatusMessage(null);
  }

  function handleExportComplete() {
    setStatus("idle");
    setStatusMessage(null);
  }

  function handleExportError(message: string) {
    setStatus("error");
    setStatusMessage(message);
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open && status !== "exporting") {
      setStatus("idle");
      setStatusMessage(null);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1 w-full md:w-auto">
        <button
          className="rounded-xl border border-amber-500/40 bg-black/35 p-3 cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-amber-100 hover:border-amber-300 hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={!canExport || status === "exporting"}
          onClick={() => setIsOpen(true)}
        >
          {status === "exporting" ? "Экспорт…" : "PDF"}
        </button>
        {!characterBuild.wizardCompleted ? (
          <p className="text-xs text-stone-400">
            Завершите создание персонажа, чтобы скачать PDF.
          </p>
        ) : null}
        {status === "error" && statusMessage ? (
          <p className="text-xs text-red-300" role="alert">
            {statusMessage}
          </p>
        ) : null}
      </div>
      <PdfExportModal
        characterBuild={characterBuild}
        characterName={characterName}
        characterNamePlaceholder={characterNamePlaceholder}
        chronicle={chronicle}
        isOpen={isOpen}
        onExportComplete={handleExportComplete}
        onExportError={handleExportError}
        onExportStart={handleExportStart}
        onOpenChange={handleOpenChange}
      />
    </>
  );
}
