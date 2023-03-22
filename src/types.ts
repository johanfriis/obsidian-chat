import { CreateChatCompletionRequest } from "openai";

export type ChatConfig = {
  title: string;
  template: string;
};

export type ChatSettings = CreateChatCompletionRequest;

export type TitleChooserOption = {
  title: string;
};
