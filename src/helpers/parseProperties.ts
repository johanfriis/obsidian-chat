import { ChatConfig, ChatSettings } from "src/types";

export function parseProperties(rawConfig: string[]): {
  config: Partial<ChatConfig>;
  settings: Partial<ChatSettings>;
} {
  const config: Partial<ChatConfig> = {};
  const settings: Partial<ChatSettings> = {};

  // look for any of the known tokens
  rawConfig.forEach((line) => {
    if (line.startsWith("template::")) {
      config.template = line.split("::")[1].trim();
      return;
    } else if (line.startsWith("model::")) {
      settings.model = line.split("::")[1].trim();
      return;
    } else if (line.startsWith("temperature::")) {
      const value = Number(line.split("::")[1].trim());
      if (isNaN(value)) return;
      settings.temperature = value;
      return;
    } else if (line.startsWith("top_p::")) {
      const value = Number(line.split("::")[1].trim());
      if (isNaN(value)) return;
      settings.top_p = value;
      return;
    } else if (line.startsWith("n::")) {
      const value = Number(line.split("::")[1].trim());
      if (isNaN(value)) return;
      settings.n = value;
      return;
    } else if (line.startsWith("stream::")) {
      const value = line.split("::")[1].trim();
      settings.stream = value === "true" ? true : false;
      return;
    } else if (line.startsWith("stop::")) {
      settings.stop = line.split("::")[1].trim();
      return;
    } else if (line.startsWith("max_tokens::")) {
      const value = Number(line.split("::")[1].trim());
      if (isNaN(value)) return;
      settings.max_tokens = value;
      return;
    } else if (line.startsWith("presence_penalty::")) {
      const value = Number(line.split("::")[1].trim());
      if (isNaN(value)) return;
      settings.presence_penalty = value;
      return;
    } else if (line.startsWith("frequency_penalty::")) {
      const value = Number(line.split("::")[1].trim());
      if (isNaN(value)) return;
      settings.frequency_penalty = value;
      return;
    }
  });

  return { config, settings };
}
