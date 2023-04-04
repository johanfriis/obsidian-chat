import { CreateChatCompletionRequest } from "openai";

export type ChatSection = {
  startLine: number;
  endLine: number;
  content: string;
  headingLevel: number;
};

export type ChatConfig = {
  template: string;
};

export type ChatSettings = CreateChatCompletionRequest;

export type ChooserOption = {
  option: string;
};
