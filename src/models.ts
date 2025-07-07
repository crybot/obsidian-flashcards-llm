export function availableChatModels(): Array<string> {
  return ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4o", "gpt-4o-mini"]
}

export function availableCompletionModels(): Array<string> {
  return []
}

export function availableReasoningModels(): Array<string> {
  return ["o4-mini"]
}

export function allAvailableModels(): Array<string> {
  return availableChatModels().concat(availableReasoningModels(), availableCompletionModels())
}
