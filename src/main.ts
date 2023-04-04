import { Editor, Notice, Plugin, TFile, TFolder, setIcon } from "obsidian";
import { ChatSettingsTab, DEFAULT_SETTINGS, Settings } from "./settings";
import {
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum,
  Configuration,
  CreateChatCompletionRequest,
  OpenAIApi,
} from "openai";

import { ChatSectionNotFound, DEFAULT_CHAT_SETTINGS } from "./consts";
import {
  getChatSection,
  getProperties,
  getTemplates,
  startNewChat,
} from "./helpers";
import { ChatSection } from "./types";
import { ChooserModal } from "./modules";

class ChatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatError";
  }
}

export default class ChatPlugin extends Plugin {
  settings: Settings;
  openai: OpenAIApi;

  statusBarEl: HTMLElement;
  iconEl: HTMLElement;

  chatTitle: string;
  chatName: string;
  userName: string;

  chatNameRegex: RegExp;
  userNameRegex: RegExp;
  systemNameRegex: RegExp;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new ChatSettingsTab(this.app, this));

    this.statusBarEl = this.addStatusBarItem();
    this.iconEl = this.statusBarEl.createDiv();
    setIcon(this.iconEl, "bot");

    this.startPlugin();

    this.addCommand({
      id: "obsidian-chat-new-chat",
      name: `Start a new chat`,
      icon: "plus-circle",
      editorCheckCallback: (checking, editor) => {
        if (checking) {
          if (this.settings.apiKey) {
            return true;
          }
          return false;
        }
        this.startNewChat(editor);
      },
    });

    this.addCommand({
      id: "obsidian-chat-do",
      name: `Chat with ${this.chatName}`,
      icon: "message-circle",
      editorCheckCallback: (checking, editor) => {
        if (checking) {
          if (this.settings.apiKey) {
            return true;
          }
          return false;
        }

        new Promise((resolve) => {
          this.toggleStatusBarIcon(true);
          resolve(this.chat(editor));
        })
          .catch((error) => {
            if (error instanceof ChatError) {
              new Notice(`${this.manifest.name}: ${error.message}`);
            }
          })
          .finally(() => {
            this.toggleStatusBarIcon(false);
          });
      },
    });

    this.addCommand({
      id: "obsidian-chat-new-chat-with-template",
      name: "Start a new chat with a template",
      icon: "file-plus-2",
      editorCheckCallback: (checking, editor) => {
        const templates = getTemplates(this.app, this);
        if (checking) {
          if (this.settings.apiKey && templates.length > 1) {
            return true;
          }
          return false;
        }

        new ChooserModal(this.app, templates).start((title) => {
          this.startNewChat(editor, title);
        });
      },
    });
  }

  startPlugin() {
    console.log("Starting Obsidian Chat plugin");

    this.chatTitle = this.settings.chatTitle;
    this.chatName = this.settings.chatName;
    this.userName = this.settings.userName;

    this.chatNameRegex = new RegExp(`^#+ ${this.chatName}`);
    this.userNameRegex = new RegExp(`^#+ ${this.userName}`);
    this.systemNameRegex = new RegExp(`^#+ System`);

    const configuration = new Configuration({
      apiKey: this.settings.apiKey,
    });
    // FIXME: This is a hack to get around the User-Agent header being
    //        set by the OpenAPI generator and causing a console error
    delete configuration.baseOptions.headers["User-Agent"];
    this.openai = new OpenAIApi(configuration);
  }

  async chat(editor: Editor, customSystemMessages?: string[]) {
    const chatSection = this.getChatSection(editor);

    const inlineContent = chatSection.content.split(/\r?\n|\r|\n/g);
    const inlineProps = getProperties(inlineContent);

    const templateContent = await this.getTemplateContent(
      inlineProps.config.template
    );
    const templateProps = getProperties(templateContent);

    const chatSettings = Object.assign(
      DEFAULT_CHAT_SETTINGS,
      templateProps.settings,
      inlineProps.settings
    );

    const inlineMessages = this.getMessages(inlineContent);
    const templateMessages = this.getMessages(templateContent);
    const systemMessage = this.createSystemMessages(customSystemMessages);

    const payload = {
      ...chatSettings,
      messages: [...systemMessage, ...templateMessages, ...inlineMessages],
    };

    const response = await this.fetchResponse(payload);
    this.insertResponse(editor, chatSection, response);
  }

  async fetchResponse(payload: CreateChatCompletionRequest): Promise<string> {
    // await new Promise((resolve) => setTimeout(resolve, 500));
    // return "Howdy there partner";

    const response = await this.openai.createChatCompletion(payload);
    const responseMessage = response.data.choices[0].message?.content;

    if (!responseMessage) {
      console.error(response);
      throw new ChatError("No response from OpenAI");
    }

    return responseMessage;
  }

  insertResponse(editor: Editor, chatSection: ChatSection, response?: string) {
    const lines = chatSection.content.split(/\r?\n|\r|\n/g);

    let endLineOffset = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i] !== "") {
        break;
      }
      endLineOffset++;
    }

    const insertLine = chatSection.endLine - endLineOffset;
    const insertText = [
      `\n\n`,
      `${"#".repeat(chatSection.headingLevel + 1)} ${this.chatName}\n\n`,
      `${response}\n\n`,
      `${"#".repeat(chatSection.headingLevel + 1)} ${this.userName}\n\n`,
    ].join("");
    const insertLineCount = insertText.split(/\r?\n|\r|\n/g).length;

    editor.replaceRange(insertText, {
      line: insertLine,
      ch: Infinity,
    });

    editor.setCursor(insertLine + insertLineCount - 1, 0);
  }

  getMessages(content: string[]): ChatCompletionRequestMessage[] {
    const { positions } = getProperties(content);
    if (positions) {
      content.splice(positions.start, positions.end - positions.start + 1);
    }
    const messages = this.parseMessages(content);
    if (messages.length === 0) {
      throw new ChatError("Please provide a message to start the chat");
    }
    return messages;
  }

  parseMessages(content: string[]): ChatCompletionRequestMessage[] {
    let messages: ChatCompletionRequestMessage[] = [];

    let role: ChatCompletionRequestMessageRoleEnum = "user";
    for (let i = 0; i < content.length; i++) {
      const line = content[i];
      if (line.match(this.chatNameRegex)) {
        role = "assistant";
        continue;
      }

      if (line.match(this.userNameRegex)) {
        role = "user";
        continue;
      }

      if (line.match(this.systemNameRegex)) {
        role = "system";
        continue;
      }

      // if the previous message was from the same role, then we need to add the line to the previous message
      if (messages.length > 0 && messages[messages.length - 1].role === role) {
        messages[messages.length - 1].content += `\n${line}`;
      } else {
        messages.push({
          role,
          content: line,
        });
      }
    }

    // trim content and remove empty messages
    return messages.flatMap(({ role, content }) => {
      if (content.trim() === "") return [];
      return {
        role,
        content: content.trim(),
      };
    });
  }

  getChatSection(editor: Editor): ChatSection {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      throw new ChatError(`Could not find file`);
    }

    const metadata = this.app.metadataCache.getFileCache(file);
    if (!metadata) {
      throw new ChatError(`Could not find file metadata`);
    }

    const chatSection = getChatSection(
      editor,
      metadata,
      this.settings.chatTitle
    );

    if (chatSection === ChatSectionNotFound) {
      throw new ChatError(`Could not find chat section`);
    }

    return chatSection;
  }

  toggleStatusBarIcon(active: boolean) {
    if (active) {
      this.iconEl.addClass("chat-spinner");
    } else {
      this.iconEl.removeClass("chat-spinner");
    }
  }

  startNewChat(editor: Editor, template?: string) {
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const lastLine = editor.lastLine();

    let newLine = cursor.line;
    let spacing = 2;
    let title = `## ${this.settings.chatTitle}\n`;

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

    editor.setCursor(newLine + spacing);
  }

  async getTemplateContent(template: string | undefined): Promise<string[]> {
    if (!this.settings.templateFolder) {
      return [];
    }

    template = template ?? this.settings.defaultTemplate;
    if (!template) {
      return [];
    }

    const templatePath = `${this.settings.templateFolder}/${template}.md`;
    const templateFile = this.app.vault.getAbstractFileByPath(templatePath);

    if (!templateFile || templateFile instanceof TFolder) {
      return [];
    }

    const templateText = await this.app.vault.read(templateFile as TFile);
    return templateText.split(/\r?\n|\r|\n/g);
  }

  getDefaultSystemMessage() {
    return [`You will refer to yourself as ${this.chatName}`];
  }

  createSystemMessages(messages?: string[]): ChatCompletionRequestMessage[] {
    const defaultSystemMessage = this.getDefaultSystemMessage();
    return [...defaultSystemMessage, ...(messages ?? [])].map((message) => ({
      role: "system",
      content: message,
    }));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.startPlugin();
  }
}
