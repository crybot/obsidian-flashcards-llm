import { App, Editor, EditorPosition, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { generateFlashcards } from "./flashcards";

interface FlashcardsSettings {
  apiKey: string;
}

const DEFAULT_SETTINGS: FlashcardsSettings = {
  apiKey: "",
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

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

  async onGenerateFlashcards(editor: Editor, view: MarkdownView) {
    const apiKey = this.settings.apiKey;
    if (!apiKey) {
      new Notice("API key is not set in plugin settings");
      return;
    }

    const currentText = editor.getValue();
    // Check if the header is already present
    const headerRegex = /\n\n### Generated Flashcards\n/;
    const hasHeader = headerRegex.test(currentText);

    // Check if the #flashcards tag is already present
    const tagRegex = /\n#flashcards\n/;
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
      const generatedCards = (await generateFlashcards(updatedText, apiKey)).split("\n");
      editor.setValue(updatedText + "\n" + generatedCards.join('\n\n'))

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
		containerEl.createEl('h2', {text: 'Settings Flashcards LLM.'});

    new Setting(containerEl)
      .setName("OpenAI API Key")
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
  }
}
