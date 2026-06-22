"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  encodeCharacterUrl,
  hydrateCharacterUrl,
  isCharacterUrlTooLong as checkCharacterUrlLength,
  snapshotInputToPayload,
  type CharacterSnapshot,
  type CharacterSnapshotInput,
} from "~/lib/generator/characterSnapshot";

type UseCharacterUrlSyncOptions = {
  snapshotInput: CharacterSnapshotInput;
  onHydrate: (snapshot: CharacterSnapshot, warnings: string[]) => void;
  onHydrateError: (errorMessage: string) => void;
};

const URL_SYNC_DEBOUNCE_MS = 400;

export function useCharacterUrlSync({
  snapshotInput,
  onHydrate,
  onHydrateError,
}: UseCharacterUrlSyncOptions): {
  isHydratingFromUrl: boolean;
  charParam: string;
  isCharacterUrlTooLong: boolean;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialCharParam = searchParams.get("char");
  const [isHydratingFromUrl, setIsHydratingFromUrl] = useState(
    () => initialCharParam !== null && initialCharParam.length > 0,
  );
  const isHydratingFromUrlRef = useRef(
    initialCharParam !== null && initialCharParam.length > 0,
  );
  const skipNextEncodeRef = useRef(false);
  const lastDecodedCharRef = useRef<string | null>(null);
  const pendingExternalCharRef = useRef(
    initialCharParam !== null && initialCharParam.length > 0,
  );
  const charParam = encodeCharacterUrl(snapshotInputToPayload(snapshotInput));
  const isCharacterUrlTooLong = checkCharacterUrlLength(charParam);

  useEffect(() => {
    const char = searchParams.get("char");

    if (!char || lastDecodedCharRef.current === char) {
      pendingExternalCharRef.current = false;
      isHydratingFromUrlRef.current = false;
      setIsHydratingFromUrl(false);
      return;
    }

    // URL sync wrote the same payload we already have — not an external share link.
    if (char === charParam) {
      pendingExternalCharRef.current = false;
      lastDecodedCharRef.current = char;
      isHydratingFromUrlRef.current = false;
      setIsHydratingFromUrl(false);
      return;
    }

    pendingExternalCharRef.current = true;

    isHydratingFromUrlRef.current = true;
    setIsHydratingFromUrl(true);

    try {
      const { snapshot, warnings } = hydrateCharacterUrl(char);
      lastDecodedCharRef.current = char;
      skipNextEncodeRef.current = true;
      onHydrate(snapshot, warnings);
    } catch (error) {
      lastDecodedCharRef.current = char;
      skipNextEncodeRef.current = false;
      const errorMessage =
        error instanceof Error ? error.message : "Не удалось прочитать ссылку.";
      onHydrateError(errorMessage);
    } finally {
      pendingExternalCharRef.current = false;
      isHydratingFromUrlRef.current = false;
      setIsHydratingFromUrl(false);
    }
  }, [charParam, onHydrate, onHydrateError, searchParams]);

  useEffect(() => {
    if (isHydratingFromUrlRef.current || pendingExternalCharRef.current) {
      return;
    }

    if (skipNextEncodeRef.current) {
      skipNextEncodeRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (searchParams.get("char") === charParam) {
        return;
      }

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("char", charParam);
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
    }, URL_SYNC_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [charParam, pathname, router, searchParams]);

  return { isHydratingFromUrl, charParam, isCharacterUrlTooLong };
}
