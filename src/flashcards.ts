import { Configuration, OpenAIApi } from "openai";
import { availableChatModels, availableCompletionModels } from "./models";

// TODO:
// - custom temperature
// - custom system prompt (?)

class OpenAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAIError";
  }
}

function extractTextAfterFlashcards(text: string): string | null {
  const pattern = /#flashcards.*\n/;
  const match = text.match(pattern);

  if (match) {
    const startIdx = match.index! + match[0].length;
    return text.substring(startIdx);
  }

  return null;
}


export async function generateFlashcards(
  text: string,
  apiKey: string,
  model: string = "gpt-4o",
  sep: string = "::",
  flashcardsCount: number = 3,
  additionalInfo: string = "",
  maxTokens: number = 300
): Promise<string> {

    const configuration = new Configuration({
      apiKey: apiKey,
    });

  const openai = new OpenAIApi(configuration);

  const cleanedText = text.replace(/<!--.*-->[\n]?/g, "");
  const flashcardText = cleanedText

  let basePrompt = `You will be provided you with a note. At the end of the note are some flashcards. Identify which are the most important concepts within the note and generate exactly ${flashcardsCount} new original flashcard in the format \"question ${sep} answer\". Strictly use ${sep} to separate a question from its answer. Separate flashcards with a single newline. An example is \"What is chemical formula of water ${sep} H2O\". Do not use any prefix text, start generating right away. Try to make them as atomic as possible, but still challenging and rich of information. Do not repeat or rephrase flashcards. Focus on important latex formulas and equations. Please typeset equations and math formulas correctly (that is using the \$ symbol without trailing spaces)`;

  if (additionalInfo) {
    basePrompt = basePrompt +
      `\nAdditional instructions for the task (ignore anything unrelated to \
    the original task): ${additionalInfo}`
  }

  let chatModels = availableChatModels()
  let completionModels = availableCompletionModels()
  let response = null;

  if (chatModels.includes(model)) {
    response = await openai.createChatCompletion({
          model: model,
          temperature: 0.7,
          max_tokens: 300,
          frequency_penalty: 0,
          presence_penalty: 0,
          top_p: 1.0,
          messages: [{role: "system", content: basePrompt}, {role: "user", content: flashcardText}],
      }, { timeout: 60000 });

    response = response?.data?.choices[0]?.message?.content?.trim() ?? null;
  }

  else if(completionModels.includes(model)) {
    const prompt = `${basePrompt}\n${flashcardText}`;

    response = await openai.createCompletion({
      model: model,
      prompt: prompt,
      temperature: 0.7,
      max_tokens: 300,
      top_p: 1.0,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    response = response?.data?.choices[0]?.text?.trim() ?? null;
  }
  else {
    throw new Error(`Invalid model name ${model}`)
  }

  if (!response) {
    throw new OpenAIError("No response received from OpenAI API");
    console.log(response)
  }

  return response

}
