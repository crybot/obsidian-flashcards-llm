# Obsidian Flashcards LLM

This plugin allows you to automatically generate flashcards using Large Language Models (such as OpenAI's GPT*) from within Obsidian.

## Features
- OpenAI's `text-davinci-003` and `gpt-3.5-turbo` integrations through official APIs. You can add your api-key under the plugin settings and choose which language model to use.
- Generate flashcards from any open note by running the `Generate Flashcards` command from the command palette. The generated flashcards will be appended to the current note, under a new markdown header.
- You can select which part of the document you want to generate the flashcards from, or you can use the entire note.
- Customize the separator to use for generating inline flashcards.

**Note**: The plugin works with [obsidian-spaced-repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition) in mind. As of today it can only generate inline flashcards in the format that you choose. Future updates will make more customizations available (including multiline flashcards, reversed flashcards and more).

## Demo
<img src="https://github.com/crybot/obsidian-flashcards-llm/blob/master/docs/flashcards.gif">

