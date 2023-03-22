import { CreateChatCompletionRequest } from "openai";
import { ChatConfig } from "./types";

export const CHAT_CONFIG_TEMPLATE = "[!CHAT-CONFIG]-";

export const CHAT_RESPONSE_TEMPLATE = "[!CHAT-RESPONSE]";

export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  title: "",
  template: "",
};

export const DEFAULT_CHAT_SETTINGS: CreateChatCompletionRequest = {
  model: "gpt-3.5-turbo",
  max_tokens: 512,
  temperature: 0,
  top_p: 1,
  presence_penalty: 0,
  frequency_penalty: 0,
  stream: false,
  messages: [],
};

export const TITLE_INFERENCE_SETTINGS: CreateChatCompletionRequest = {
  model: "gpt-3.5-turbo",
  max_tokens: 64,
  temperature: 0.0,
  top_p: 1,
  presence_penalty: 0,
  frequency_penalty: 0,
  stream: false,
  messages: [],
};

export const KEYWORD_INFERENCE_SETTINGS: CreateChatCompletionRequest = {
  model: "gpt-3.5-turbo",
  max_tokens: 64,
  temperature: 0.5,
  top_p: 1.0,
  frequency_penalty: 0.8,
  presence_penalty: 0.0,
  stream: false,
  messages: [],
};
