import { App, TFolder } from "obsidian";

export function getFolders(app: App) {
  return app.vault
    .getAllLoadedFiles()
    .filter((f) => f instanceof TFolder && f.path !== "/")
    .map((f) => f.path);
}
