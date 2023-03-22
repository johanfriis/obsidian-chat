import { App, Plugin, TFile } from "obsidian";
import ChatPlugin from "src/main";

export function getTemplates(app: App, plugin: ChatPlugin) {
  const templateFolder = plugin.settings.templateFolder;

  return app.vault
    .getAllLoadedFiles()
    .filter(
      (f) =>
        f instanceof TFile &&
        templateFolder &&
        f.path.startsWith(templateFolder)
    )
    .map((f) => (f as TFile).basename);
}
