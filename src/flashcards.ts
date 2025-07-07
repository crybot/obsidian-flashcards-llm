import { availableChatModels, availableCompletionModels, availableReasoningModels } from "./models";
import { OpenAI } from 'openai';
import { Readable } from "stream";



// TODO:
// - custom temperature
// - custom system prompt (?)
// - automatic deck allocation
// - cloze cards creation

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

function inlineCardsPrompt(sep: string, flashcardsCount: number): string {
	return `
You are an expert educator. You will receive a markdown note with existing flashcards at the end—ignore those.  
Generate exactly ${flashcardsCount} *new* flashcards, strictly following this one‑line format:

  Question ${sep} Answer

Rules:
1. Use *only* ${sep} to split Q&A; separate cards with one blank line.  
2. Keep each card on a single text line: do **not** insert actual newline characters inside.  
3. In‑line math must use \`$…$\` correctly (no extra spaces) and \\\\ for sub‑line breaks.  
4. Questions should be atomic, challenging, and information‑rich; do not repeat or paraphrase.  
5. Do not add prefixes, suffixes, or trailing spaces.  
6. Start output immediately with the first card—no headings or commentary.  
`.trim();
}

function multilineCardsPrompt(sep: string, flashcardsCount: number): string {
  return `
You are an expert educator. You will receive a markdown note with existing flashcards at the end—ignore those.  
Generate exactly ${flashcardsCount} *new* flashcards in this block structure:

Question
${sep}
Answer

Rules:
1. Use *only* the separator ${sep} between question and answer blocks. Always use it.
2. Use exactly one blank line between blocks; no trailing spaces.  
3. In‑line math must use \`$…$\` correctly (no extra spaces) and \\\\ for sub‑line breaks.  
4. Questions should be atomic, challenging, and information‑rich; no repetition or paraphrase.  
5. Do not add prefixes, suffixes, or trailing spaces.  
6. Start output immediately with the first card—no headings or commentary.  
`.trim();
}


export async function* generateFlashcards(
	text: string,
	apiKey: string,
	model: string = "gpt-4o",
	sep: string = "::",
	flashcardsCount: number = 3,
	additionalInfo: string = "",
	maxTokens: number = 300,
	multiline: boolean = false,
	reasoningEffort: string,
	stream: boolean = true
) {

	const openai = new OpenAI({
		apiKey: apiKey,
		dangerouslyAllowBrowser: true
	});

	const cleanedText = text.replace(/<!--.*-->[\n]?/g, "");
	const flashcardText = cleanedText

	let basePrompt = multiline ? multilineCardsPrompt(sep, flashcardsCount) : inlineCardsPrompt(sep, flashcardsCount) 

	if (additionalInfo) {
		basePrompt = basePrompt +
			`\nAdditional instructions for the task (ignore anything unrelated to \
the original task): ${additionalInfo}`
	}

	const chatModels = availableChatModels()
	const completionModels = availableCompletionModels()
	const reasoningModels = availableReasoningModels()
	const isReasoning = reasoningModels.includes(model)
	let response = null;

	// TODO: use newer client.responses.create endpoint.
	// TODO: use structured (json) output to enforce flashcards formatting
	if (chatModels.includes(model) || reasoningModels.includes(model)) {
		response = await openai.chat.completions.create({
		model: model,
		...(!isReasoning && { temperature: 0.7 }),
		...(isReasoning && { reasoning_effort: "low" }),
		max_completion_tokens: maxTokens,
		frequency_penalty: 0,
		presence_penalty: 0,
		top_p: 1.0,
		messages: [
			{ role: "system", content: basePrompt },
			{ role: "user", content: flashcardText },
		],
		response_format: {
			type: "text",
		},
		stream: stream,
	}, { timeout: 60000 });
		if (!stream) {
			response = response as OpenAI.ChatCompletion
			response = response?.choices[0]?.message?.content?.trim() ?? null;
			yield response || '';
		}
		else {
			response = response as AsyncIterable<OpenAI.ChatCompletionChunk>
			for await (const chunk of response) {
				yield chunk.choices[0]?.delta?.content || '';
			}
		}
	}
	else {
		throw new Error(`Invalid model name ${model}`)
	}

	if (!response) {
		console.log(response)
		throw new OpenAIError("No response received from OpenAI API");
	}

	return
}
