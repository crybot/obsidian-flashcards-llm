import { App, Modal, Setting } from "obsidian"
import { FlashcardsSettings } from "./settings"
import FlashcardsLLMPlugin from "./main"


export class InputModal extends Modal {
  plugin: FlashcardsLLMPlugin
  configuration: FlashcardsSettings;
  multiline: boolean;
  onSubmit: (configuration: FlashcardsSettings, multiline: boolean) => void;

  constructor(app: App, plugin: FlashcardsLLMPlugin, onSubmit: (configuration: FlashcardsSettings, multiline: boolean) => void) {
    super(app);
    this.plugin = plugin;
    this.onSubmit = onSubmit;
    this.configuration = { ...this.plugin.settings };
  }

  onOpen() {
    let {  contentEl } = this;
    contentEl.createEl("h1", { text: "Prompt configuration" });

    new Setting(contentEl)
    .setName("Number of flashcards to generate")
    .addText((text) =>
      text
      .setValue(this.configuration.flashcardsCount.toString())
      .onChange((value) => {
        this.configuration.flashcardsCount = Number(value)
        // TODO: check input
      })
    );

    new Setting(contentEl)
    .setName("Additional prompt")
    .addText((text) =>
      text
      .setValue(this.configuration.additionalPrompt)
      .onChange((value) => {
        this.configuration.additionalPrompt = value
      })
    );

    new Setting(contentEl)
      .setName("Multiline")
      .addToggle((on) => 
        on
        .setValue(false)
        .onChange(async (on) => {
          this.multiline = on
        })
      );

    new Setting(contentEl)
      .addButton((btn) => 
        btn
        .setButtonText("Submit")
        .setCta()
        .onClick(() => {
          this.close();
          this.onSubmit(this.configuration, this.multiline);
        })
      );

  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
