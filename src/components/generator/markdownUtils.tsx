import type { ReactNode } from "react";

export type FormatAction = "heading" | "list" | "bold" | "italic";
export type EditorMode = "edit" | "preview";

export function renderInlineMarkdown(
  source: string,
  keyPrefix: string,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*)/g;
  let lastIndex = 0;
  let tokenIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(source.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong
          key={`${keyPrefix}-strong-${tokenIndex}`}
          className="font-bold text-stone-50"
        >
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(
        <em
          key={`${keyPrefix}-em-${tokenIndex}`}
          className="italic text-amber-100"
        >
          {token.slice(1, -1)}
        </em>,
      );
    }

    tokenIndex += 1;
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < source.length) {
    nodes.push(source.slice(lastIndex));
  }

  return nodes;
}

function renderEditableHeading(
  level: number,
  children: ReactNode[],
  key: string,
  onInput: () => void,
  onBlur: () => void,
) {
  // React ругается на contentEditable с React-дочерними узлами (<strong>, <em>).
  // suppressContentEditableWarning — штатный флаг: DOM правит браузер, мы синхронизируем через onInput/onBlur.
  const editableProps = {
    contentEditable: true as const,
    suppressContentEditableWarning: true as const,
    onBlur,
    onInput,
  };

  if (level === 1) {
    return (
      <h1
        key={key}
        className="text-2xl font-black tracking-tight text-amber-100 outline-none focus:text-amber-50"
        {...editableProps}
      >
        {children}
      </h1>
    );
  }

  if (level === 2) {
    return (
      <h2
        key={key}
        className="text-xl font-black tracking-tight text-amber-100 outline-none focus:text-amber-50"
        {...editableProps}
      >
        {children}
      </h2>
    );
  }

  if (level === 3) {
    return (
      <h3
        key={key}
        className="text-lg font-bold text-amber-100 outline-none focus:text-amber-50"
        {...editableProps}
      >
        {children}
      </h3>
    );
  }

  return (
    <h4
      key={key}
      className="text-base font-bold uppercase tracking-[0.16em] text-amber-200/90 outline-none focus:text-amber-50"
      {...editableProps}
    >
      {children}
    </h4>
  );
}

export function renderEditableMarkdown(
  markdown: string,
  onInput: () => void,
  onBlur: () => void,
): ReactNode[] {
  const lines = markdown.split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (line.trim() === "") {
      index += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading?.[1] && heading[2] !== undefined) {
      blocks.push(
        renderEditableHeading(
          heading[1].length,
          renderInlineMarkdown(heading[2], `editable-h-${index}`),
          `editable-h-${index}`,
          onInput,
          onBlur,
        ),
      );
      index += 1;
      continue;
    }

    const ordered = /^\d+\.\s+/.test(line);
    const unordered = /^[-*]\s+/.test(line);
    if (ordered || unordered) {
      const items: ReactNode[] = [];
      const listPattern = ordered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/;

      while (index < lines.length) {
        const itemMatch = listPattern.exec(lines[index] ?? "");
        if (!itemMatch?.[1]) {
          break;
        }

        items.push(
          <li
            key={`editable-li-${index}`}
            className="pl-1 outline-none focus:text-amber-50"
            contentEditable
            suppressContentEditableWarning
            onBlur={onBlur}
            onInput={onInput}
          >
            {renderInlineMarkdown(itemMatch[1], `editable-li-${index}`)}
          </li>,
        );
        index += 1;
      }

      blocks.push(
        ordered ? (
          <ol
            key={`editable-ol-${index}`}
            className="list-decimal space-y-2 pl-6 text-stone-200"
          >
            {items}
          </ol>
        ) : (
          <ul
            key={`editable-ul-${index}`}
            className="list-disc space-y-2 pl-6 text-stone-200"
          >
            {items}
          </ul>
        ),
      );
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      (lines[index]?.trim() ?? "") !== "" &&
      !/^(#{1,6})\s+/.test(lines[index] ?? "") &&
      !/^([-*]|\d+\.)\s+/.test(lines[index] ?? "")
    ) {
      paragraphLines.push(lines[index] ?? "");
      index += 1;
    }

    blocks.push(
      <p
        key={`editable-p-${index}`}
        className="leading-8 text-stone-200 outline-none focus:text-amber-50"
        contentEditable
        suppressContentEditableWarning
        onBlur={onBlur}
        onInput={onInput}
      >
        {renderInlineMarkdown(paragraphLines.join(" "), `editable-p-${index}`)}
      </p>,
    );
  }

  return blocks;
}

function normalizeMarkdownInline(source: string): string {
  return source
    .replace(/\u00a0/g, " ")
    .replace(/\s*\n\s*/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function isBlockElement(element: Element): boolean {
  return [
    "ARTICLE",
    "DIV",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "LI",
    "OL",
    "P",
    "SECTION",
    "UL",
  ].includes(element.tagName);
}

function inlineNodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as Element;
  if (element.tagName === "BR") {
    return "\n";
  }

  const content = Array.from(element.childNodes)
    .map(inlineNodeToMarkdown)
    .join("");
  if (element.tagName === "STRONG" || element.tagName === "B") {
    const normalized = normalizeMarkdownInline(content);
    return normalized ? `**${normalized}**` : "";
  }

  if (element.tagName === "EM" || element.tagName === "I") {
    const normalized = normalizeMarkdownInline(content);
    return normalized ? `*${normalized}*` : "";
  }

  return content;
}

function listItemToMarkdown(
  item: Element,
  index: number,
  ordered: boolean,
): string {
  const directContent = Array.from(item.childNodes)
    .filter(
      (node) =>
        node.nodeType !== Node.ELEMENT_NODE ||
        !["OL", "UL"].includes((node as Element).tagName),
    )
    .map(inlineNodeToMarkdown)
    .join("");
  const content = normalizeMarkdownInline(directContent) || "пункт списка";
  return `${ordered ? `${index + 1}.` : "-"} ${content}`;
}

function blockNodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return normalizeMarkdownInline(node.textContent ?? "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as Element;
  const tagName = element.tagName;
  if (/^H[1-6]$/.test(tagName)) {
    const level = Number(tagName.slice(1));
    const content = normalizeMarkdownInline(
      Array.from(element.childNodes).map(inlineNodeToMarkdown).join(""),
    );
    return content ? `${"#".repeat(level)} ${content}` : "";
  }

  if (tagName === "UL" || tagName === "OL") {
    return Array.from(element.children)
      .filter((child) => child.tagName === "LI")
      .map((child, index) =>
        listItemToMarkdown(child, index, tagName === "OL"),
      )
      .join("\n");
  }

  if (tagName === "P" || tagName === "LI") {
    return normalizeMarkdownInline(
      Array.from(element.childNodes).map(inlineNodeToMarkdown).join(""),
    );
  }

  const childElements = Array.from(element.children);
  if (childElements.some(isBlockElement)) {
    return Array.from(element.childNodes)
      .map(blockNodeToMarkdown)
      .filter(Boolean)
      .join("\n\n");
  }

  return normalizeMarkdownInline(
    Array.from(element.childNodes).map(inlineNodeToMarkdown).join(""),
  );
}

export function editableElementToMarkdown(element: HTMLElement): string {
  return Array.from(element.childNodes)
    .map(blockNodeToMarkdown)
    .filter(Boolean)
    .join("\n\n");
}

export function replaceMarkdownBlockPrefix(
  block: string,
  prefix: string,
): string {
  if (block.trim() === "") {
    return prefix === "# " ? "# Заголовок" : "- пункт списка";
  }

  return block
    .split("\n")
    .map((line) => {
      if (line.trim() === "") {
        return line;
      }

      const cleanLine = line
        .replace(/^#{1,6}\s+/, "")
        .replace(/^[-*]\s+/, "")
        .replace(/^\d+\.\s+/, "");
      return `${prefix}${cleanLine}`;
    })
    .join("\n");
}
