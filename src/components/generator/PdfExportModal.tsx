"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

import type { CharacterBuild } from "~/lib/character";
import type { Chronicle } from "~/lib/chronicle";
import {
  formatNamePlaceholder,
  rollRaceName,
} from "~/lib/chronicle/raceNames";
import {
  buildPdfDownloadFilename,
  downloadPdfBytes,
} from "~/lib/pdf/downloadPdfBytes";
import { exportChroniclePdf } from "~/lib/pdf/exportChroniclePdf";
import type { PdfPromptValues } from "~/lib/pdf/characterSheetFields";

export type PdfExportModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chronicle: Chronicle;
  characterBuild: CharacterBuild;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (message: string) => void;
};

const EMPTY_PROMPT: PdfPromptValues = {
  characterName: "",
  playerName: "",
  alignment: "",
  height: "",
  weight: "",
};

export function PdfExportModal({
  isOpen,
  onOpenChange,
  chronicle,
  characterBuild,
  onExportStart,
  onExportComplete,
  onExportError,
}: PdfExportModalProps) {
  const [values, setValues] = useState<PdfPromptValues>(EMPTY_PROMPT);
  const [nameExample, setNameExample] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showNameError, setShowNameError] = useState(false);
  const exportAbortedRef = useRef(false);

  const rollName = useCallback(
    () =>
      rollRaceName(
        chronicle.race.entry.id,
        chronicle.gender.entry.id,
      ),
    [chronicle.gender.entry.id, chronicle.race.entry.id],
  );

  const characterNameTrimmed = values.characterName.trim();
  const isCharacterNameMissing = characterNameTrimmed.length === 0;

  useEffect(() => {
    if (!isOpen) {
      exportAbortedRef.current = true;
      setValues(EMPTY_PROMPT);
      setNameExample("");
      setIsExporting(false);
      setExportError(null);
      setShowNameError(false);
    } else {
      exportAbortedRef.current = false;
      setNameExample(rollName());
    }
  }, [isOpen, rollName]);

  function handleRerollName() {
    const nextName = rollName();
    setNameExample(nextName);
    updateField("characterName", nextName);
  }

  function updateField<K extends keyof PdfPromptValues>(
    key: K,
    value: PdfPromptValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === "characterName") {
      setShowNameError(false);
      setExportError(null);
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      exportAbortedRef.current = true;
    }

    onOpenChange(open);
  }

  async function handleExport(onClose: () => void) {
    if (isCharacterNameMissing) {
      setShowNameError(true);
      return;
    }

    setIsExporting(true);
    setExportError(null);
    exportAbortedRef.current = false;
    onExportStart?.();

    try {
      const promptValues: PdfPromptValues = {
        characterName: characterNameTrimmed,
        playerName: values.playerName.trim(),
        alignment: values.alignment.trim(),
        height: values.height.trim(),
        weight: values.weight.trim(),
      };

      const bytes = await exportChroniclePdf({
        chronicle,
        promptValues,
        characterBuild,
      });

      if (exportAbortedRef.current) {
        return;
      }

      downloadPdfBytes(
        bytes,
        buildPdfDownloadFilename(chronicle, promptValues),
      );
      onExportComplete?.();
      onClose();
    } catch {
      const message = "Не удалось создать PDF";
      setExportError(message);
      onExportError?.(message);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange} placement="center">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span>Скачать PDF-лист</span>
            </ModalHeader>
            <ModalBody className="flex flex-col gap-4">
              <div className="flex items-center gap-2 flex-row">
                <Input
                  isRequired
                  className="flex-1"
                  label="Имя персонажа"
                  placeholder={
                    nameExample
                      ? formatNamePlaceholder(nameExample)
                      : "Например: …"
                  }
                  value={values.characterName}
                  isInvalid={showNameError && isCharacterNameMissing}
                  errorMessage={
                    showNameError && isCharacterNameMissing
                      ? "Укажите имя персонажа"
                      : undefined
                  }
                  isDisabled={isExporting}
                  onValueChange={(value) => updateField("characterName", value)}
                />
                <Button
                  isIconOnly
                  aria-label="Сгенерировать имя"
                  className="min-h-14 min-w-14 shrink-0"
                  isDisabled={isExporting}
                  variant="flat"
                  onPress={handleRerollName}
                >
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 16h5v5" />
                  </svg>
                </Button>
              </div>
              <Input
                label="Имя игрока"
                placeholder="Необязательно"
                value={values.playerName}
                isDisabled={isExporting}
                onValueChange={(value) => updateField("playerName", value)}
              />
              <Input
                label="Мировоззрение"
                placeholder="Необязательно, например: нейтральный добрый"
                value={values.alignment}
                isDisabled={isExporting}
                onValueChange={(value) => updateField("alignment", value)}
              />
              <Input
                label="Рост"
                placeholder="Необязательно"
                value={values.height}
                isDisabled={isExporting}
                onValueChange={(value) => updateField("height", value)}
              />
              <Input
                label="Вес"
                placeholder="Необязательно"
                value={values.weight}
                isDisabled={isExporting}
                onValueChange={(value) => updateField("weight", value)}
              />
              {exportError ? (
                <p className="text-sm text-danger" role="alert">
                  {exportError}
                </p>
              ) : null}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="flat"
                isDisabled={isExporting}
                onPress={onClose}
              >
                Отмена
              </Button>
              <Button
                color="primary"
                isLoading={isExporting}
                isDisabled={isExporting || isCharacterNameMissing}
                onPress={() => void handleExport(onClose)}
              >
                Скачать
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
