import { Editor } from "obsidian";

export function startNewChat(
  editor: Editor,
  chatTitle: string,
  template?: string
): number {
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  const lastLine = editor.lastLine();

  let newLine = cursor.line;
  let spacing = 2;
  let title = `## ${chatTitle}\n`;

  if (newLine === lastLine && line.length !== 0) {
    title = `\n${title}`;
  }

  if (template) {
    title = `${title}template::${template}\n`;
    spacing += 1;
  }

  if (cursor.ch > 0 || line.length > 0) {
    newLine += 1;
    title = `${title}\n`;
  }

  editor.replaceRange(`${title}\n`, { line: newLine, ch: 0 });
  return newLine + spacing;
}
