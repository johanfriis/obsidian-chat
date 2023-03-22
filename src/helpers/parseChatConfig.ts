import { CreateChatCompletionRequest } from "openai";
import { CHAT_CONFIG_TEMPLATE, DEFAULT_CHAT_CONFIG } from "src/consts";
import { ChatConfig, ChatSettings } from "src/types";

export function parseChatConfig(
  rawConfig: string[]
): [Partial<ChatConfig>, Partial<ChatSettings>, string[]] {
  const config: Partial<ChatConfig> = {};
  const settings: Partial<ChatSettings> = {};
  const mesages: string[] = [];

  // look for any of the meaningful tokens
  rawConfig.forEach((line) => {
    if (line.startsWith(CHAT_CONFIG_TEMPLATE)) {
      config.title = line.replace(CHAT_CONFIG_TEMPLATE, "").trim();
      return;
    } else if (line.startsWith("template::")) {
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
    } else {
      if (line !== "") {
        mesages.push(line);
      }
    }
  });

  return [config, settings, mesages];
}
