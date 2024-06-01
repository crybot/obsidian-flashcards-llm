import { App, MarkdownView, PluginSettingTab, Setting } from 'obsidian';
import { availableChatModels, availableCompletionModels } from "./models";
import FlashcardsLLMPlugin from "./main"

// TODO:
// - make additional prompt a resizable textarea

export interface FlashcardsSettings {
  apiKey: string;
  model: string;
  inlineSeparator: string;
  multilineSeparator: string;
  flashcardsCount: number;
  additionalPrompt: string;
  maxTokens: number;
  streaming: boolean;
  hideInPreview: boolean;
  tag: string;
}


export class FlashcardsSettingsTab extends PluginSettingTab {
  plugin: FlashcardsLLMPlugin;

  constructor(app: App, plugin: FlashcardsLLMPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h3", {text: "Model settings"})

    new Setting(containerEl)
    .setName("OpenAI API key")
    .setDesc("Enter your OpenAI API key")
    .addText((text) =>
      text
      .setPlaceholder("API key")
      .setValue(this.plugin.settings.apiKey)
      .onChange(async (value) => {
        this.plugin.settings.apiKey = value;
        await this.plugin.saveSettings();
      })
    );

    new Setting(containerEl)
    .setName("Model")
    .setDesc("Which language model to use")
    .addDropdown((dropdown) =>
      dropdown
      .addOptions(Object.fromEntries(availableCompletionModels().map(k => [k, k])))
      .addOptions(Object.fromEntries(availableChatModels().map(k => [k, k])))
      .setValue(this.plugin.settings.model)
      .onChange(async (value) => {
        this.plugin.settings.model = value;
        await this.plugin.saveSettings();
      })
    );

    containerEl.createEl("h3", {text: "Preferences"})

    new Setting(containerEl)
    .setName("Separator for inline flashcards")
    .setDesc("Note that after changing this you have to manually edit any flashcards you already have")
    .addText((text) =>
      text
      .setPlaceholder("::")
      .setValue(this.plugin.settings.inlineSeparator)
      .onChange(async (value) => {
        this.plugin.settings.inlineSeparator = value;
        await this.plugin.saveSettings();
      })
    );
    new Setting(containerEl)
    .setName("Separator for multi-line flashcards")
    .setDesc("Note that after changing this you have to manually edit any flashcards you already have")
    .addText((text) =>
      text
      .setPlaceholder("?")
      .setValue(this.plugin.settings.multilineSeparator)
      .onChange(async (value) => {
        this.plugin.settings.multilineSeparator = value;
        await this.plugin.saveSettings();
      })
    );

    new Setting(containerEl)
    .setName("Flashcards tag")
    .setDesc("Set which tag to append upon flashcards generation. " +
      "See the Spaced Repetition plugin for details")
    .addText((text) =>
      text
      .setPlaceholder("#flashcards")
      .setValue(this.plugin.settings.tag)
      .onChange(async (value) => {
        this.plugin.settings.tag = value;
        await this.plugin.saveSettings();
      })
    );

    new Setting(containerEl)
    .setName("Number of flashcards to generate")
    .setDesc("Set this to the total number of flashcards the model should "+
      "generate each time a new `Generate Flashcards` command is issued")
    .addText((text) =>
      text
      .setPlaceholder("3")
      .setValue(this.plugin.settings.flashcardsCount.toString())
      .onChange(async (value) => {
        this.plugin.settings.flashcardsCount = Number(value);
        await this.plugin.saveSettings();
      })
    );

    new Setting(containerEl)
    .setName("Additional prompt")
    .setDesc("Provide additional instructions to the language model")
    .addText((text) =>
      text
      .setPlaceholder("Additional instructions")
      .setValue(this.plugin.settings.additionalPrompt)
      .onChange(async (value) => {
        this.plugin.settings.additionalPrompt = value;
        await this.plugin.saveSettings();
      })
    );

    new Setting(containerEl)
    .setName("Maximum output tokens")
    .setDesc("Set this to the total number of tokens the model can generate")
    .addText((text) =>
      text
      .setPlaceholder("300")
      .setValue(this.plugin.settings.maxTokens.toString())
      .onChange(async (value) => {
        this.plugin.settings.maxTokens = Number(value);
        await this.plugin.saveSettings();
      })
    );

    new Setting(containerEl)
    .setName("Streaming")
    .setDesc("Enable/Disable streaming text completion")
    .addToggle((on) => 
      on
      .setValue(this.plugin.settings.streaming)
      .onChange(async (on) => {
        this.plugin.settings.streaming = on;
        await this.plugin.saveSettings();
      })
    );

    new Setting(containerEl)
    .setName("Hide flashcards in preview mode")
    .setDesc("If enabled, you won't see flashcards when in preview mode, "
      + "but you will still be able to edit them")
    .addToggle((on) => 
      on
      .setValue(this.plugin.settings.hideInPreview)
      .onChange(async (on) => {
        this.plugin.settings.hideInPreview = on;

        await this.plugin.saveSettings();

        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
          view.previewMode.rerender(true);
        }
      })
    );

  }
}
