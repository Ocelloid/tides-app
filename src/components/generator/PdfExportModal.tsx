"use client";

import { useEffect, useRef, useState } from "react";
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
import { resolveCharacterNameForExport } from "~/lib/chronicle/raceNames";
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
  characterName: string;
  characterNamePlaceholder: string;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (message: string) => void;
};

type PdfFormValues = Omit<PdfPromptValues, "characterName">;

const EMPTY_FORM: PdfFormValues = {
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
  characterName,
  characterNamePlaceholder,
  onExportStart,
  onExportComplete,
  onExportError,
}: PdfExportModalProps) {
  const [values, setValues] = useState<PdfFormValues>(EMPTY_FORM);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportAbortedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      exportAbortedRef.current = true;
      setValues(EMPTY_FORM);
      setIsExporting(false);
      setExportError(null);
    } else {
      exportAbortedRef.current = false;
    }
  }, [isOpen]);

  function updateField<K extends keyof PdfFormValues>(
    key: K,
    value: PdfFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setExportError(null);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      exportAbortedRef.current = true;
    }

    onOpenChange(open);
  }

  async function handleExport(onClose: () => void) {
    setIsExporting(true);
    setExportError(null);
    exportAbortedRef.current = false;
    onExportStart?.();

    try {
      const promptValues: PdfPromptValues = {
        characterName: resolveCharacterNameForExport(
          characterName,
          characterNamePlaceholder,
        ),
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
              <p className="text-xs text-stone-400">
                Экспорт PDF занимает до 30 секунд.
              </p>
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
                isDisabled={isExporting}
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
