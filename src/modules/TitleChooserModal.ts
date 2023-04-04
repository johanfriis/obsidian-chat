import { App, SuggestModal } from "obsidian";
import { ChooserOption } from "src/types";

export class ChooserModal extends SuggestModal<ChooserOption> {
  options: string[];
  callback: (option: string) => void;

  constructor(app: App, options: string[]) {
    super(app);
    this.options = options;
  }

  getSuggestions(query: string): ChooserOption[] {
    return this.options
      .filter((option) => option.includes(query))
      .map((option) => ({
        option,
      }));
  }

  renderSuggestion(item: ChooserOption, el: HTMLElement) {
    el.createEl("div", { text: item.option });
  }

  onChooseSuggestion(item: ChooserOption) {
    this.callback(item.option);
  }

  public start(callback: (item: string) => void): void {
    this.callback = callback;
    this.open();
  }
}
