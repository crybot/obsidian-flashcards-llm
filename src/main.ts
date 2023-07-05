import { App, Editor, EditorPosition, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { generateFlashcards } from "./flashcards";

interface FlashcardsSettings {
  apiKey: string;
  model: string;
}

const DEFAULT_SETTINGS: FlashcardsSettings = {
  apiKey: "",
  model: "text-davinci-003"
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
    const model = this.settings.model;
    if (!apiKey) {
      new Notice("API key is not set in plugin settings");
      return;
    }

    const currentText = editor.getValue();
    // Check if the header is already present
    const headerRegex = /\n\n### Generated Flashcards\n/;
    const hasHeader = headerRegex.test(currentText);

    // Check if the #flashcards tag is already present
    const tagRegex = /\n#flashcards.*\n/;
    const hasTag = tagRegex.test(currentText);

    let updatedText = currentText;

    // Generate and add the header if not already present
    if (!hasHeader) {
      updatedText += "\n\n### Generated Flashcards\n";
    }

    // Generate and add the #flashcards tag if not already present
    if (!hasTag) {
      updatedText += "#flashcards\n";
    }

    new Notice("Generating flashcards...");
    try {
      const generatedCards = (await generateFlashcards(updatedText, apiKey, model)).split("\n");
      editor.setValue(updatedText + "\n\n" + generatedCards.map(s => s.trim()).join('\n\n'))

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
      .addOption("text-davinci-003", "text-davinci-003")
      .addOption("gpt-3.5-turbo", "gpt-3.5-turbo")
      .setValue(this.plugin.settings.model)
      .onChange(async (value) => {
        this.plugin.settings.model = value;
        await this.plugin.saveSettings();
      })
    );
  }
}
