import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createProviderRegistry } from "ai";

export const DEFAULT_MODEL = "anthropic:claude-haiku-4-5";

// MODEL_API_KEY, when set, goes to whichever provider MODEL names. Otherwise each provider
// reads its usual variable: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY.
const apiKey = process.env.MODEL_API_KEY || undefined;

const registry = createProviderRegistry({
  anthropic: createAnthropic({ apiKey }),
  openai: createOpenAI({ apiKey }),
  google: createGoogleGenerativeAI({ apiKey }),
  // Any OpenAI-compatible server: Ollama (the default address), LM Studio, vLLM, OpenRouter…
  local: createOpenAICompatible({
    name: "local",
    baseURL: process.env.LOCAL_BASE_URL || "http://localhost:11434/v1",
    apiKey,
  }),
});

type ModelId = Parameters<typeof registry.languageModel>[0];

/** The model MODEL names, as "provider:model" (for example "openai:gpt-5.4-mini"). */
export function writerModel() {
  return registry.languageModel((process.env.MODEL || DEFAULT_MODEL) as ModelId);
}
