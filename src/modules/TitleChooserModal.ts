import { App, SuggestModal } from "obsidian";
import { TitleChooserOption } from "src/types";

export class TitleChooserModal extends SuggestModal<TitleChooserOption> {
  titles: string[];
  callback: (item: string) => void;

  constructor(app: App, titles: string[]) {
    super(app);
    this.titles = titles;
  }

  getSuggestions(query: string): TitleChooserOption[] {
    return this.titles
      .filter((title) => title.includes(query))
      .map((title) => ({
        title,
      }));
  }

  renderSuggestion(item: TitleChooserOption, el: HTMLElement) {
    el.createEl("div", { text: item.title });
  }

  onChooseSuggestion(item: TitleChooserOption) {
    this.callback(item.title);
  }

  public start(callback: (item: string) => void): void {
    this.callback = callback;
    this.open();
  }
}
