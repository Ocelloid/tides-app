"use client";

import { useState, type ReactNode } from "react";

type CharacterSnapshotDropZoneProps = {
  children: ReactNode;
  onImportError?: (message: string) => void;
  onSnapshotFile: (file: File) => void | Promise<void>;
};

function isJsonFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".json") || file.type === "application/json";
}

export function CharacterSnapshotDropZone({
  children,
  onImportError,
  onSnapshotFile,
}: CharacterSnapshotDropZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  function handleDragEnter(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (event.dataTransfer.types.includes("Files")) {
      setDragActive(true);
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragActive(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (event.currentTarget === event.target) {
      setDragActive(false);
    }
  }

  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files.item(0);
    if (!file) {
      return;
    }

    if (!isJsonFile(file)) {
      onImportError?.("Перетащите JSON-файл персонажа (.json).");
      return;
    }

    try {
      await onSnapshotFile(file);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось загрузить файл.";
      onImportError?.(message);
    }
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={(event) => void handleDrop(event)}
    >
      {children}
      {dragActive ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm">
          <p className="rounded-2xl border-2 border-dashed border-amber-300/80 bg-black/60 px-8 py-5 text-center text-sm font-semibold uppercase tracking-[0.18em] text-amber-100">
            Отпустите JSON-файл, чтобы загрузить персонажа
          </p>
        </div>
      ) : null}
    </div>
  );
}
