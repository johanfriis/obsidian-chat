import { CachedMetadata, Editor } from "obsidian";
import { ChatSectionNotFound } from "../consts";
import { ChatSection } from "../types";

export function getChatSection(
  editor: Editor,
  metadata: CachedMetadata,
  chatTitle: string
): ChatSection | typeof ChatSectionNotFound {
  if (!metadata.headings) {
    return ChatSectionNotFound;
  }

  const currentLine = editor.getCursor().line;
  const reverseHeadings = metadata.headings.reverse();
  const chatHeading = reverseHeadings.find(
    (section) =>
      section.heading === chatTitle && section.position.start.line < currentLine
  );

  if (!chatHeading) {
    return ChatSectionNotFound;
  }

  const nextHeading = reverseHeadings.find(
    (section) =>
      section.level === chatHeading.level &&
      section.position.start.line > chatHeading.position.start.line
  );

  const headingLevel = chatHeading.level;
  const startLine = chatHeading.position.start.line + 1;
  const endLine = nextHeading?.position.start.line ?? editor.lastLine();

  // get the text between the start and end lines
  const content = editor.getRange(
    { line: startLine, ch: 0 },
    { line: endLine, ch: Infinity }
  );

  return { startLine, endLine, content, headingLevel };
}
