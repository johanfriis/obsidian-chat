import { ChatConfig, ChatSettings } from "../types";
import { findProperties } from "./findProperties";
import { parseProperties } from "./parseProperties";

export function getProperties(content: string[]): {
  config: Partial<ChatConfig>;
  settings: Partial<ChatSettings>;
  positions?: { start: number; end: number };
} {
  const positions = findProperties(content);

  if (positions) {
    const rawProperties = content.slice(
      positions.start,
      positions.end - positions.start + 1
    );

    return {
      ...parseProperties(rawProperties),
      positions: positions,
    };
  }
  return { config: {}, settings: {}, positions: undefined };
}
