import { App, Editor, EditorPosition, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { generateFlashcards } from "./flashcards";
import { availableChatModels, availableCompletionModels } from "./models.ts";

interface FlashcardsSettings {
  apiKey: string;
  model: string;
  inlineSeparator: string;
  flashcardsCount: int;
  additionalPrompt: string;
  maxTokens: int;
}

const DEFAULT_SETTINGS: FlashcardsSettings = {
  apiKey: "",
  model: "text-davinci-003",
  inlineSeparator: "::",
  flashcardsCount: 3,
  additionalPrompt: "",
  maxTokens: 300
};

export default class FlashcardsLLMPlugin extends Plugin {
  settings: FlashcardsSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "generate-flashcards",
      name: "Generate Flashcards",
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.onGenerateFlashcards(editor, view);
      },
    });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new FlashcardsSettingsTab(this.app, this));
  }

  async onGenerateFlashcards(editor: Editor, view: MarkdownView) {
    const apiKey = this.settings.apiKey;
    if (!apiKey) {
      new Notice("API key is not set in plugin settings");
      return;
    }
    const model = this.settings.model;
    if (!model) {
      new Notice("Please select a model to use in the plugin settings");
      return;
    }

    const sep = this.settings.inlineSeparator

    let flashcardsCount = Math.trunc(Number(this.settings.flashcardsCount))
    if (!Number.isFinite(flashcardsCount) || flashcardsCount <= 0) {
      new Notice("Please provide a correct number of flashcards to generate. Defaulting to 3")
      flashcardsCount = 3
    }

    const additionalPrompt = this.settings.additionalPrompt

    let maxTokens = Math.trunc(Number(this.settings.maxTokens))
    if (!Number.isFinite(maxTokens) || maxTokens <= 0) {
      new Notice("Please provide a correct number of maximum tokens to generate. Defaulting to 300")
      maxTokens = 300
    }

    const wholeText = editor.getValue()
    const currentText = (editor.somethingSelected() ? editor.getSelection() : wholeText)
    // Check if the header is already present
    const headerRegex = /\n\n### Generated Flashcards\n/;
    const hasHeader = headerRegex.test(wholeText);

    // Check if the #flashcards tag is already present
    const tagRegex = /\n#flashcards.*\n/;
    const hasTag = tagRegex.test(wholeText);


    new Notice("Generating flashcards...");
    try {
      const generatedCards = (await generateFlashcards(
        currentText,
        apiKey,
        model,
        sep,
        flashcardsCount,
        additionalPrompt,
        maxTokens
      )).split("\n");
      editor.setCursor(editor.lastLine())

      let updatedText = "";

      // Generate and add the header if not already present
      if (!hasHeader) {
        updatedText += "\n\n### Generated Flashcards\n";
      }

      // Generate and add the #flashcards tag if not already present
      if (!hasTag) {
        updatedText += "#flashcards\n";
      }

      updatedText += "\n\n" + generatedCards.map(s => s.trim()).join('\n\n');

      editor.replaceRange(updatedText, editor.getCursor())


      const newPosition: EditorPosition = {
        line: editor.lastLine()
      }
      editor.setCursor(newPosition)
      new Notice("Flashcards succesfully generated!");

    } catch (error) {
      console.error("Error generating flashcards:", error);
      new Notice("Error generating flashcards. Please check the plugin console for details.");
    }
  }

  onunload() {

  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class FlashcardsSettingsTab extends PluginSettingTab {
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
    .setName("Number of flashcards to generate")
    .setDesc("Set this to the total number of flashcards the model should "+
      "generate each time a new `Generate Flashcards` command is issued")
    .addText((text) =>
      text
      .setPlaceholder(3)
      .setValue(this.plugin.settings.flashcardsCount)
      .onChange(async (value) => {
        this.plugin.settings.flashcardsCount = value;
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
      .setPlaceholder(300)
      .setValue(this.plugin.settings.maxTokens)
      .onChange(async (value) => {
        this.plugin.settings.maxTokens = value;
        await this.plugin.saveSettings();
      })
    );

  }
}
