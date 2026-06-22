"use client";

import { useRef, useState } from "react";

import {
  editableElementToMarkdown,
  renderEditableMarkdown,
  replaceMarkdownBlockPrefix,
  type EditorMode,
  type FormatAction,
} from "./markdownUtils";

function MarkdownToolbarButton({
  label,
  title,
  onClick,
}: {
  label: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-full cursor-pointer min-w-10 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-100 hover:border-amber-300 hover:bg-amber-300/10"
      type="button"
      title={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function MarkdownEditor({
  text,
  copyState,
  onTextChange,
  onCopy,
}: {
  text: string;
  copyState: string;
  onTextChange: (next: string) => void;
  onCopy: (source?: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  const pendingPreviewTextRef = useRef<string | null>(null);
  const [mode, setMode] = useState<EditorMode>("preview");

  function updateText(event: React.ChangeEvent<HTMLTextAreaElement>) {
    onTextChange(event.currentTarget.value);
  }

  function setTextWithSelection(
    nextText: string,
    selectionStart: number,
    selectionEnd: number,
  ) {
    onTextChange(nextText);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(selectionStart, selectionEnd);
    });
  }

  function readEditableMarkdown(): string {
    if (!editableRef.current) {
      return text;
    }

    return editableElementToMarkdown(editableRef.current);
  }

  function cacheEditableMarkdown() {
    pendingPreviewTextRef.current = readEditableMarkdown();
  }

  function commitEditableMarkdown(): string {
    const nextText = pendingPreviewTextRef.current ?? readEditableMarkdown();
    pendingPreviewTextRef.current = null;
    if (nextText !== text) {
      onTextChange(nextText);
    }

    return nextText;
  }

  function applyEditableFormat(action: FormatAction) {
    const editable = editableRef.current;
    if (!editable) {
      return;
    }

    const activeElement = document.activeElement;
    const targetElement =
      activeElement instanceof HTMLElement && editable.contains(activeElement)
        ? activeElement
        : editable.querySelector<HTMLElement>('[contenteditable="true"]');
    targetElement?.focus();
    if (action === "bold") {
      document.execCommand("bold");
    } else if (action === "italic") {
      document.execCommand("italic");
    } else if (action === "list") {
      document.execCommand("insertUnorderedList");
    } else {
      document.execCommand("formatBlock", false, "h1");
    }

    requestAnimationFrame(() => {
      cacheEditableMarkdown();
      commitEditableMarkdown();
    });
  }

  function applyFormat(action: FormatAction) {
    if (mode === "preview") {
      applyEditableFormat(action);
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = text.slice(start, end);

    if (action === "bold" || action === "italic") {
      const marker = action === "bold" ? "**" : "*";
      const fallback =
        action === "bold" ? "полужирный текст" : "наклонный текст";
      const content = selected || fallback;
      const nextText =
        text.slice(0, start) + marker + content + marker + text.slice(end);
      const nextStart = start + marker.length;
      setTextWithSelection(nextText, nextStart, nextStart + content.length);
      return;
    }

    const lineStart = text.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const nextBreak = text.indexOf("\n", end);
    const lineEnd = nextBreak === -1 ? text.length : nextBreak;
    const block = text.slice(lineStart, lineEnd);
    const replacement = replaceMarkdownBlockPrefix(
      block,
      action === "heading" ? "# " : "- ",
    );
    const nextText =
      text.slice(0, lineStart) + replacement + text.slice(lineEnd);
    setTextWithSelection(nextText, lineStart, lineStart + replacement.length);
  }

  function switchMode(nextMode: EditorMode) {
    if (mode === "preview" && nextMode === "edit") {
      commitEditableMarkdown();
    }

    setMode(nextMode);
  }

  function copyCurrentMarkdown() {
    onCopy(mode === "preview" ? commitEditableMarkdown() : text);
  }

  return (
    <section className="flex min-h-[48rem] flex-col gap-4 rounded-2xl border border-amber-700/30 bg-stone-950/80 p-4 shadow-2xl shadow-black/40 md:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
        </div>
        <div className="flex flex-col gap-2 sm:items-center sm:justify-between sm:flex-row">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300/80">
            Итоговый текст
          </p>
          {/*<div className="flex flex-wrap gap-2 rounded-full border border-stone-700 bg-black/35 p-1">
            <button
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ${mode === "edit" ? "bg-amber-300 text-stone-950" : "text-stone-300 hover:text-amber-100"}`}
              type="button"
              aria-pressed={mode === "edit"}
              onClick={() => switchMode("edit")}
            >
              Редактировать Markdown
            </button>
            <button
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ${mode === "preview" ? "bg-amber-300 text-stone-950" : "text-stone-300 hover:text-amber-100"}`}
              type="button"
              aria-pressed={mode === "preview"}
              onClick={() => switchMode("preview")}
            >
              Показать как текст
            </button>
          </div>*/}
          <div className="flex flex-wrap gap-2">
            <MarkdownToolbarButton
              label="H"
              title={
                mode === "edit"
                  ? "Сделать текущую строку заголовком"
                  : "Сделать текущий блок заголовком"
              }
              onClick={() => applyFormat("heading")}
            />
            <MarkdownToolbarButton
              label="•"
              title={
                mode === "edit"
                  ? "Сделать выделенные строки списком"
                  : "Сделать текущий блок списком"
              }
              onClick={() => applyFormat("list")}
            />
            <MarkdownToolbarButton
              label="B"
              title="Полужирный текст"
              onClick={() => applyFormat("bold")}
            />
            <MarkdownToolbarButton
              label="I"
              title="Наклонный текст"
              onClick={() => applyFormat("italic")}
            />
            <button
              className="rounded-full cursor-pointer border border-stone-500 px-5 py-2 text-sm font-semibold text-stone-100 hover:border-amber-300 hover:text-amber-100"
              type="button"
              onClick={copyCurrentMarkdown}
            >
              {copyState}
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          {mode === "edit"
            ? "Markdown"
            : "Редактируемый текст с Markdown на заднем плане"}
        </p>
        {mode === "edit" ? (
          <textarea
            ref={textareaRef}
            className="min-h-[32rem] flex-1 resize-y rounded-2xl border border-stone-700 bg-black/70 p-5 font-mono text-sm leading-6 text-stone-100 outline-none focus:border-amber-300"
            value={text}
            onChange={updateText}
          />
        ) : (
          <div
            ref={editableRef}
            className="flex min-h-[32rem] flex-1 flex-col gap-5 overflow-auto rounded-2xl border border-amber-900/30 bg-black/45 p-5 outline-none focus:border-amber-300"
            role="group"
            aria-label="Редактируемый отрендеренный текст"
          >
            {renderEditableMarkdown(
              text,
              cacheEditableMarkdown,
              commitEditableMarkdown,
            )}
          </div>
        )}
      </div>
    </section>
  );
}
