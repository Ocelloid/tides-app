"use client";

import { useState } from "react";

import type { Chronicle } from "~/lib/chronicle";

import { PdfExportModal } from "./PdfExportModal";

type PdfExportButtonProps = {
  chronicle: Chronicle;
};

export function PdfExportButton({ chronicle }: PdfExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "exporting" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
      <div className="flex flex-col gap-1">
        <button
          className="rounded-xl border border-amber-500/40 bg-black/35 p-3 cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-amber-100 hover:border-amber-300 hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={!chronicle || status === "exporting"}
          onClick={() => setIsOpen(true)}
        >
          {status === "exporting" ? "Экспорт…" : "Скачать PDF-лист"}
        </button>
        {status === "error" && statusMessage ? (
          <p className="text-xs text-red-300" role="alert">
            {statusMessage}
          </p>
        ) : null}
      </div>
      <PdfExportModal
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
