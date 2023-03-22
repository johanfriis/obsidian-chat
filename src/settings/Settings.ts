import { App, PluginSettingTab, Setting, TFile, TFolder } from "obsidian";
import { getFolders, getTemplates } from "src/helpers";
import ChatPlugin from "../main";
import { Settings } from "./Settings.types";

export const DEFAULT_SETTINGS: Settings = {
  apiKey: "",
  templateFolder: undefined,
  defaultTemplate: undefined,
  chatName: undefined,
};

export class ChatSettingsTab extends PluginSettingTab {
  plugin: ChatPlugin;

  constructor(app: App, plugin: ChatPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    this.addHeading();
    this.addApiKey();
    this.addChatName();
    this.addTemplateFolder();
    this.addDefaultTemplate();
  }

  addHeading(): void {
    this.containerEl.createEl("h2", {
      text: "Obsidian Chat Settings",
    });
  }

  addApiKey(): void {
    const help = new DocumentFragment();
    help.createEl("a", {
      text: "Get your OpenAI Api Key",
      href: "https://beta.openai.com/account/api-keys",
    });

    new Setting(this.containerEl)
      .setName("Api Key")
      .setDesc(help)
      .addText((text) =>
        text
          .setPlaceholder("Api Key")
          .setValue(this.plugin.settings.apiKey ?? "")
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          })
      );
  }

  addChatName(): void {
    new Setting(this.containerEl)
      .setName("Chat Name")
      .setDesc("What do you want the chat to call itself?")
      .addText((text) =>
        text
          .setPlaceholder("Chat")
          .setValue(this.plugin.settings.chatName ?? "")
          .onChange(async (value) => {
            this.plugin.settings.chatName = value;
            await this.plugin.saveSettings();
          })
      );
  }

  addTemplateFolder(): void {
    const folders = getFolders(this.app);

    const folderOptions = Object.fromEntries(
      folders.map((folder) => [folder, folder])
    );

    new Setting(this.containerEl)
      .setName("Template Folder")
      .setDesc("Choose which folder to store Chat Templates in")
      .addDropdown((component) => {
        return component
          .addOptions(folderOptions)
          .setValue(this.plugin.settings.templateFolder ?? "")
          .onChange(async (value) => {
            this.plugin.settings.templateFolder = value;
            await this.plugin.saveSettings();
            this.display();
          });
      });
  }

  addDefaultTemplate(): void {
    const templateFolder = this.plugin.settings.templateFolder;

    if (!templateFolder) {
      new Setting(this.containerEl)
        .setName("Default Template")
        .setDesc(
          "Select a default template folder before selecting a default template."
        );
      return;
    }

    const templates = getTemplates(this.app, this.plugin);

    if (templates.length === 0) {
      new Setting(this.containerEl)
        .setName("Default Template")
        .setDesc("Create some templates before selecting your default.");
      return;
    }

    const templateOptions = Object.fromEntries(
      templates.map((template) => [template, template])
    );

    new Setting(this.containerEl)
      .setName("Default Template")
      .setDesc("Choose which template to use as the default chat template.")
      .addDropdown((component) => {
        return component
          .addOptions(templateOptions)
          .setValue(this.plugin.settings.defaultTemplate ?? "")
          .onChange(async (value) => {
            this.plugin.settings.defaultTemplate = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
