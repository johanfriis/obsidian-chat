import { CreateChatCompletionRequest } from "openai";
import { ChatConfig } from "./types";

export const ChatSectionNotFound = Symbol();

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
