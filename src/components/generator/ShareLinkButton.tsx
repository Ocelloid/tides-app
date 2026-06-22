"use client";

import { useEffect, useMemo, useState } from "react";
import { isCharacterUrlTooLong } from "~/lib/generator/characterSnapshot";

type ShareLinkButtonProps = {
  charParam: string;
  disabled?: boolean;
};

const COPY_RESET_MS = 2000;

export function ShareLinkButton({
  charParam,
  disabled = false,
}: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const tooLong = useMemo(() => isCharacterUrlTooLong(charParam), [charParam]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopied(false);
    }, COPY_RESET_MS);

    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    const shareUrl = `${window.location.origin}${window.location.pathname}?char=${charParam}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      window.prompt("Скопируйте ссылку вручную:", shareUrl);
      setCopied(false);
    }
  }

  return (
    <div className="flex w-full md:w-auto flex-col gap-1">
      <button
        className="rounded-xl w-full md:w-auto border border-amber-500/40 bg-black/35 p-3 cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-amber-100 hover:border-amber-300 hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        title={
          tooLong ? "Ссылка длинная, может не везде открыться" : "Копировать ссылку"
        }
        type="button"
        onClick={() => void handleCopy()}
      >
        {copied ? "Скопировано" : "Ссылка"}
      </button>
      {tooLong ? (
        <p className="text-xs text-amber-200/80">
          Ссылка длинная, может не везде открыться
        </p>
      ) : null}
    </div>
  );
}
