import { Editor, MarkdownView, Notice, Plugin, TFile, TFolder } from "obsidian";
import { ChatSettingsTab, DEFAULT_SETTINGS, Settings } from "./settings";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import gptoken from "gptoken";

import {
  CHAT_CONFIG_TEMPLATE,
  CHAT_RESPONSE_TEMPLATE,
  DEFAULT_CHAT_SETTINGS,
  KEYWORD_INFERENCE_SETTINGS,
  TITLE_INFERENCE_SETTINGS,
} from "./consts";
import { cleanTitle, getTemplates, parseChatConfig } from "./helpers";
import { ChatConfig, ChatSettings } from "./types";
import { TitleChooserModal } from "./modules";

export default class ChatPlugin extends Plugin {
  settings: Settings;
  openai: OpenAIApi;
  chatName: string;
  pluginName = "Obsidian Chat";

  async onload() {
    await this.loadSettings();

    this.chatName = this.settings.chatName ?? "Chat";

    this.addSettingTab(new ChatSettingsTab(this.app, this));

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
        this.chat(editor);
      },
    });

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
        this.insertNewChat(editor);
      },
    });

    this.addCommand({
      id: "obsidian-chat-new-chat-with-template",
      name: "Start a new chat with a template",
      icon: "file-plus-2",
      editorCheckCallback: (checking) => {
        const templates = getTemplates(this.app, this);
        if (checking) {
          if (this.settings.apiKey && templates.length > 1) {
            return true;
          }
          return false;
        }

        new TitleChooserModal(this.app, templates).start((title) => {
          this.insertNewChat(undefined, title);
        });
      },
    });

    this.addCommand({
      id: "obsidian-chat-infer-section-title",
      name: "Infer section title",
      icon: "flashlight",
      editorCheckCallback: (checking, editor) => {
        if (checking) {
          if (this.settings.apiKey) {
            return true;
          }
          return false;
        }
        this.inferTitle(editor, false);
      },
    });

    this.addCommand({
      id: "obsidian-chat-infer-document-title",
      name: "Infer document title",
      icon: "lightbulb",
      editorCheckCallback: (checking, editor) => {
        if (checking) {
          if (this.settings.apiKey) {
            return true;
          }
          return false;
        }
        this.inferTitle(editor, true);
      },
    });

    this.addCommand({
      id: "obsidian-chat-infer-keywords",
      name: "Infer keywords",
      icon: "key",
      editorCheckCallback: (checking, editor) => {
        if (checking) {
          if (this.settings.apiKey) {
            return true;
          }
          return false;
        }
        // https://platform.openai.com/examples/default-keywords
        this.inferKeywords(editor);
      },
    });

    const configuration = new Configuration({
      apiKey: this.settings.apiKey,
    });

    this.openai = new OpenAIApi(configuration);
  }

  async inferKeywords(editor: Editor) {
    const messages: ChatCompletionRequestMessage[] = [
      {
        role: "user",
        // content: ["Extract keywords from these messages:"].join(" "),
        content: [
          "Provide high level keywords for these messages.",
          "Add some keywords on the theme and type of the messages.",
        ].join(" "),
      },
    ];

    try {
      const [[_, lastConfigLine], __, ___] = await this.findCurrentChatConfig(
        editor
      );

      const [____, chatMessages] = await this.findCurrentChatContents(
        editor,
        lastConfigLine
      );

      messages[0].content = messages[0].content.concat(
        `\nMessages:\n\n${JSON.stringify(chatMessages)}`
      );
    } catch (error) {
      messages[0].content = messages[0].content.concat(
        `\nMessages:\n\n${JSON.stringify({
          role: "user",
          content: editor.getValue(),
        })}`
      );
    }

    const settings = {
      ...KEYWORD_INFERENCE_SETTINGS,
      messages,
    };

    const completion = await this.openai.createChatCompletion(settings);

    const keywords = completion.data.choices[0].message?.content.trim();

    if (keywords) {
      editor.replaceRange(keywords, editor.getCursor());
    } else {
      new Notice(`${this.pluginName}: Could not infer keywords`);
      console.log({ completion });
    }
  }

  async inferTitle(editor: Editor, documentTitle: boolean) {
    const messages: ChatCompletionRequestMessage[] = [
      {
        role: "user",
        content: [
          "Infer title from the summary of the content of these messages.",
          "Return 3 suggestions for the title and nothing else",
        ].join(" "),
      },
    ];

    let configTitleLine = -1;

    try {
      const [[firstConfigLine, lastConfigLine], __, ___] =
        await this.findCurrentChatConfig(editor);

      configTitleLine = firstConfigLine;

      const [_, chatMessages] = await this.findCurrentChatContents(
        editor,
        lastConfigLine
      );

      messages[0].content = messages[0].content.concat(
        `\nMessages:\n\n${JSON.stringify(chatMessages)}`
      );
    } catch (error) {
      if (!documentTitle) {
        new Notice(`${this.pluginName}: No section to set title for`);
        return;
      }

      messages[0].content = messages[0].content.concat(
        `\nMessages:\n\n${JSON.stringify({
          role: "user",
          content: editor.getValue(),
        })}`
      );
    }

    const settings = {
      ...TITLE_INFERENCE_SETTINGS,
      messages,
    };

    const completion = await this.openai.createChatCompletion(settings);

    const titles = completion.data.choices[0].message?.content;
    const cleanedTitles = titles
      ?.trim()
      ?.split("\n")
      .map((title) => cleanTitle(title, documentTitle));

    if (cleanedTitles) {
      new TitleChooserModal(this.app, cleanedTitles).start(async (title) => {
        if (documentTitle) {
          let view = this.app.workspace.getActiveViewOfType(MarkdownView);
          if (view) {
            const newFilePath = `${view.file.parent.path}/${title}.${view.file.extension}`;
            await app.fileManager.renameFile(view.file, newFilePath);
          }
        } else if (configTitleLine !== -1) {
          editor.replaceRange(
            `> ${CHAT_CONFIG_TEMPLATE} ${title}`,
            {
              line: configTitleLine,
              ch: 0,
            },
            {
              line: configTitleLine,
              ch: Infinity,
            }
          );
        }
      });
    } else {
      new Notice(`${this.pluginName}: Could not infer title`);
      console.log({ completion });
    }
  }

  async chat(editor: Editor) {
    const lines = editor.getValue().split("\n");

    try {
      const [[_, lastConfigLine], __, settings] =
        await this.findCurrentChatConfig(editor);

      const [lastChatLine, messages] = await this.findCurrentChatContents(
        editor,
        lastConfigLine
      );

      console.log(messages);

      if (
        messages.length === 0 ||
        messages[messages.length - 1]?.role !== "user"
      ) {
        throw new Error("No user provided message");
      }

      settings.messages = settings.messages.concat(messages);

      const mergedMessages = settings.messages
        .flatMap((message) => message.content)
        .join("");
      const tokenStats = gptoken.tokenStats(gptoken.encode(mergedMessages));

      editor.replaceRange(
        [
          "\n\n",
          "<div class='chat-loading'><div><div></div></div>",
          `<span class='chat-loading-tokens'>Tokens: ${tokenStats.count}</span>`,
          "</div>",
        ].join(""),
        {
          line: lastChatLine,
          ch: lines[lastChatLine].length,
        }
      );

      editor.setCursor(lastChatLine);

      // await new Promise((resolve) => setTimeout(resolve, 3000));
      // const response = "Howdy there partner";

      const completion = await this.openai.createChatCompletion(settings);

      const response = completion.data.choices[0].message?.content
        .replace(/\n/g, "\n> ")
        .concat("\n");

      const match = response?.match(/(\n*)/);
      const skipLines = match ? match[1].length + 2 : 0;

      editor.replaceRange(
        `> ${CHAT_RESPONSE_TEMPLATE} ${this.chatName}\n> ${response}\n\n`,
        {
          line: lastChatLine + 2,
          ch: 0,
        },
        {
          line: lastChatLine + 2,
          ch: Infinity,
        }
      );

      editor.setCursor(lastChatLine + 3 + skipLines);
    } catch (error) {
      new Notice(`${this.pluginName}: ${error.message}`);
      console.error(error.message);
    }
  }

  insertNewChat(editor?: Editor, template?: string) {
    editor = this.getEditor(editor);
    const lines = editor.getValue().split("\n");
    const cursor = editor.getCursor();

    let callout = `> ${CHAT_CONFIG_TEMPLATE} Start a new chat with ${this.chatName}`;
    if (template) {
      callout += `\n> template::${template}`;
    }
    callout += `\n>\n`;

    if (lines.length > cursor.line) {
      callout += "\n";
    }

    editor.replaceRange(callout, cursor);

    const newCursor = cursor.line + (template ? 4 : 3);
    editor.setCursor(newCursor);
  }

  async findCurrentChatContents(
    editor: Editor,
    lastConfigLine: number
  ): Promise<[number, ChatCompletionRequestMessage[]]> {
    const lines = editor.getValue().split("\n");
    let messages: ChatCompletionRequestMessage[] = [];

    // starting at lineNumber, move downwards until we reach the end of the
    // document or the beginning of a new chat
    let lastChatLine = lastConfigLine;
    for (let i = lastConfigLine + 1; i < lines.length; i++) {
      let line = lines[i];
      lastChatLine = i;

      const lastMessage = messages[messages.length - 1];

      if (line.startsWith(`> ${CHAT_CONFIG_TEMPLATE}`)) {
        break;
      }

      if (line.startsWith(`> ${CHAT_RESPONSE_TEMPLATE}`)) {
        messages.push({
          role: "assistant",
          content: "",
        });
        continue;
      }

      if (
        (!lastMessage || lastMessage?.role === "assistant") &&
        !line.startsWith(">")
      ) {
        messages.push({
          role: "user",
          content: "",
        });
        continue;
      }

      if (line.startsWith(">")) {
        if (messages[messages.length - 1]) {
          messages[messages.length - 1].content += line.slice(2) + "\n";
        }
      } else {
        if (messages[messages.length - 1]) {
          messages[messages.length - 1].content += line + "\n";
        }
        continue;
      }
    }

    const lastMessage = messages.slice(-1)[0].content;
    const match = lastMessage.match(/\n+$/);
    const extraNewlines = match ? match[0].length : 0;

    return [
      lastChatLine - (extraNewlines - 1),
      messages.filter((message) => message.content.replace(/\n/g, "") !== ""),
    ];
  }

  async findCurrentChatConfig(
    editor: Editor
  ): Promise<[[number, number], Partial<ChatConfig>, ChatSettings]> {
    const currentCursor = editor.getCursor();
    const contents = editor.getValue().split("\n");

    // starting at cursor, move upwards until we find the CHAT_START_TEMPLATE
    let firstLine = -1;
    for (let i = currentCursor.line - 1; i >= 0; i--) {
      if (contents[i].startsWith(`> ${CHAT_CONFIG_TEMPLATE}`)) {
        firstLine = i;
        break;
      }
    }

    if (firstLine < 0) {
      throw new Error("No chat found");
    }

    const rawConfig: string[] = [];

    let lastLine = firstLine;
    for (let i = firstLine; i < contents.length; i++) {
      let line = contents[i];
      if (line.startsWith(">")) {
        rawConfig.push(line.replace(/>\s?/, ""));
      } else {
        lastLine = i - 1;
        break;
      }
    }

    const [config, settings, messages] = parseChatConfig(rawConfig);
    const [templateSettings, templateMessages] = await this.getTemplateSettings(
      config.template
    );
    const systemMessages = this.createSystemMessages(
      messages.length > 0 ? messages : templateMessages
    );

    return [
      [firstLine, lastLine],
      config,
      Object.assign(templateSettings, {
        ...settings,
        messages: systemMessages,
      }),
    ];
  }

  async getTemplateSettings(
    template: string | undefined
  ): Promise<[ChatSettings, string[]]> {
    if (!this.settings.templateFolder) {
      return [DEFAULT_CHAT_SETTINGS, []];
    }

    template = template ?? this.settings.defaultTemplate;
    if (!template) {
      return [DEFAULT_CHAT_SETTINGS, []];
    }

    const templatePath = `${this.settings.templateFolder}/${template}.md`;
    const templateFile = this.app.vault.getAbstractFileByPath(templatePath);

    if (!templateFile || templateFile instanceof TFolder) {
      return [DEFAULT_CHAT_SETTINGS, []];
    }

    const templateText = await this.app.vault.read(templateFile as TFile);
    const [_, settings, messages] = parseChatConfig(templateText.split("\n"));

    // const systemMessages = this.createSystemMessages(messages);

    const chatSettings = Object.assign({}, DEFAULT_CHAT_SETTINGS, settings);
    return [chatSettings, messages];
  }

  getDefaultSystemMessage(): string[] {
    return [`You will refer to yourself as ${this.chatName}`];
  }

  createSystemMessages(
    messages: string[]
  ): Array<ChatCompletionRequestMessage> {
    const defaultSystemMessage = this.getDefaultSystemMessage();
    return [...defaultSystemMessage, ...messages].map(
      (message) =>
        ({
          role: "system",
          content: message,
        } as ChatCompletionRequestMessage)
    );
  }

  getCurrentView(): MarkdownView | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    return view;
  }

  getEditor(editor: Editor | undefined): Editor {
    if (!editor) {
      editor = this.getCurrentView()?.editor;
    }

    if (!editor) {
      throw new Error("No Editor found");
    }

    return editor;
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
