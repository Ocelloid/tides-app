"use client";

import {
  createCharacterSnapshot,
  downloadCharacterSnapshot,
  type CharacterSnapshotInput,
} from "~/lib/generator/characterSnapshot";

type JsonExportButtonProps = {
  snapshot: CharacterSnapshotInput;
  disabled?: boolean;
};

export function JsonExportButton({
  snapshot,
  disabled = false,
}: JsonExportButtonProps) {
  function handleDownload() {
    downloadCharacterSnapshot(createCharacterSnapshot(snapshot));
  }

  return (
    <button
      className="rounded-xl w-full md:w-auto border border-amber-500/40 bg-black/35 p-3 cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-amber-100 hover:border-amber-300 hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      type="button"
      onClick={handleDownload}
    >
      JSON
    </button>
  );
}
