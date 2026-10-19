const DEFAULT_URL = "http://localhost:11434";
const DEFAULT_MODEL = "qwen2.5:3b-instruct";
const MAX_PROMPT_CHARS = 32_000;
const MAX_GENERATION_CHARS = 8_000;
const MAX_CONCURRENT = 2;
const REQUEST_TIMEOUT_MS = Math.min(120_000, Math.max(1_000, Number(process.env.OLLAMA_TIMEOUT_MS) || 60_000));

let activeRequests = 0;

export class AIServiceError extends Error {
  constructor(category, message, statusCode = 503) {
    super(message);
    this.name = "AIServiceError";
    this.category = category;
    this.statusCode = statusCode;
  }
}

export function getOllamaConfig() {
  let url;
  try {
    url = new URL(process.env.OLLAMA_URL || DEFAULT_URL);
  } catch {
    throw new AIServiceError("configuration", "AI service configuration is invalid.");
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) {
    throw new AIServiceError("configuration", "AI service configuration is invalid.");
  }
  const model = (process.env.OLLAMA_MODEL || DEFAULT_MODEL).trim();
  if (!model || model.length > 128) throw new AIServiceError("configuration", "AI service configuration is invalid.");
  return { baseUrl: url.toString().replace(/\/$/, ""), model };
}

export async function generateResponse({ systemPrompt, userPrompt, signal, timeoutMs = REQUEST_TIMEOUT_MS }) {
  if (typeof systemPrompt !== "string" || typeof userPrompt !== "string" ||
      systemPrompt.length + userPrompt.length > MAX_PROMPT_CHARS) {
    throw new AIServiceError("validation", "The AI request is too large.", 400);
  }
  if (signal?.aborted) throw new AIServiceError("cancelled", "The AI request was cancelled.", 499);
  if (activeRequests >= MAX_CONCURRENT) {
    throw new AIServiceError("busy", "The AI service is busy. Please try again shortly.", 429);
  }
  const { baseUrl, model } = getOllamaConfig();
  activeRequests++;
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeout = setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);
  try {
    let response;
    try {
      response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model, stream: false, format: "json",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
          options: { temperature: 0, num_predict: 350 },
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (signal?.aborted) throw new AIServiceError("cancelled", "The AI request was cancelled.", 499);
      if (controller.signal.aborted) throw new AIServiceError("timeout", "The AI service timed out.", 504);
      throw new AIServiceError("unavailable", "The local AI service is unavailable.");
    }
    if (response.status === 404) throw new AIServiceError("model_missing", "The configured AI model is not available.");
    if (!response.ok) throw new AIServiceError("provider_error", "The local AI service returned an error.");
    let data;
    try { data = await response.json(); } catch { throw new AIServiceError("invalid_response", "The AI service returned an invalid response."); }
    const content = data?.message?.content;
    if (typeof content !== "string" || !content.trim() || content.length > MAX_GENERATION_CHARS) {
      throw new AIServiceError("invalid_response", "The AI service returned an invalid response.");
    }
    return content.trim();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromCaller);
    activeRequests--;
  }
}

export const llmLimits = Object.freeze({ MAX_PROMPT_CHARS, MAX_GENERATION_CHARS, MAX_CONCURRENT, REQUEST_TIMEOUT_MS });
