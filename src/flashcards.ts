import { Configuration, OpenAIApi } from "openai";

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


export async function generateFlashcards(text: string, apiKey: string, model: string = 'text-davinci-003'): Promise<string> {
  const configuration = new Configuration({
    apiKey: apiKey,
  });

  const openai = new OpenAIApi(configuration);

  const cleanedText = text.replace(/<!--.*-->[\n]?/g, "");
  const flashcardText = cleanedText

  const basePrompt = `I'll provide you with a note. At the end of the note are some flashcards. Identify which are the most important concepts within the note and generate 3 new original flashcard in the format \"question :: answer\". Strictly use :: to separate a question from its answer. Separate flashcards with a single newline. An example is \"What is chemical formula of water :: H2O\". Do not use any prefix text, start generating right away. Try to make them as atomic as possible, but still challenging and rich of information. DO NOT REPEAT OR REPHRASE FLASHCARDS. Focus on important latex formulas and equations. Please typeset equations and math formulas correctly (that is using the \$ symbol)`;
  const additionalPrompt = "Additional information on the task: Focus primarily on formulas and equations. Do NOT always start the questions with What. Do not repeat questions. Do not rephrase questions already generated. You can also ask the user to describe something or detail a given concept. You can even write flashcards asking to fill a missing word or phrase.";

  let response = null;
  if (model == 'gpt-3.5-turbo') {
    response = await openai.createChatCompletion({
          model: model,
          temperature: 0.7,
          max_tokens: 300,
          frequency_penalty: 0,
          presence_penalty: 0,
          top_p: 1.0,
          messages: [{role: "system", content: basePrompt}, {role: "user", content: flashcardText}],
      }, { timeout: 60000 });
  }

  else if(model == 'text-davinci-003') {
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
  }

  
  if (model == 'text-davinci-003') {
    return response.data.choices[0].text.trim();
  }
  else if (model == 'gpt-3.5-turbo') {
    return response.data.choices[0].message.content.trim();
  }
  throw new OpenAIError("No response received from OpenAI API");
  console.log(response)

}
