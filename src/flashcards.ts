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


export async function generateFlashcards(text: string, apiKey: string): Promise<string> {
  const configuration = new Configuration({
    apiKey: apiKey,
  });

  const openai = new OpenAIApi(configuration);

  const cleanedText = text.replace(/<!--.*-->[\n]?/g, "");
  const alreadyGenerated = extractTextAfterFlashcards(cleanedText);
  const flashcardText = cleanedText.split("#flashcards")[0];

  const basePrompt = `I'll provide you with a note, identify which are the most important concepts within it and generate at most 5 flashcards in the format \"question :: answer\". Strictly use :: to separate a question from its answer.An example is \"What is chemical formula of water :: H2O\". Do not use any prefix text, start generating right away. Try to make them as atomic as possible, but still challenging and rich of information. Do not generate flashcards that have already been generated. DO NOT REPEAT OR REPHRASE ANY OF THE FOLLOWING flashcards already generated:${alreadyGenerated}`;
  const additionalPrompt = "Additional information on the task: Focus primarily on formulas and equations. Do NOT always start the questions with What. Do not repeat questions. Do not rephrase questions already generated. You can also ask the user to describe something or detail a given concept. You can even write flashcards asking to fill a missing word or phrase.";

  const prompt = `${basePrompt}\n${flashcardText}`;

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    temperature: 0.3,
    max_tokens: 500,
    top_p: 1.0,
    frequency_penalty: 1.3,
    presence_penalty: 0.6,
  });

  if (response.data.choices && response.data.choices.length > 0) {
    return response.data.choices[0].text;
  } else {
    console.log(response)
    throw new OpenAIError("No response received from OpenAI API");
  }
}
