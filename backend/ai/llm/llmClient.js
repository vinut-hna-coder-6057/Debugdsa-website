const DEFAULT_URL = "http://localhost:11434";
const DEFAULT_MODEL = "qwen2.5:3b-instruct";
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";
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

function getConfiguredProvider() {
  const provider = (process.env.AI_PROVIDER || "ollama").trim().toLowerCase();
  if (provider === "ollama" || provider === "groq") return provider;
  if (process.env.NODE_ENV === "production") {
    throw new AIServiceError("configuration", "AI provider is not configured or is unsupported.");
  }
  return "ollama";
}

export function getOllamaConfig() {
  const configuredUrl = process.env.OLLAMA_URL?.trim();
  if (process.env.NODE_ENV === "production" && !configuredUrl) {
    throw new AIServiceError("configuration", "AI service configuration is invalid.");
  }
  let url;
  try {
    url = new URL(configuredUrl || DEFAULT_URL);
  } catch {
    throw new AIServiceError("configuration", "AI service configuration is invalid.");
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) {
    throw new AIServiceError("configuration", "AI service configuration is invalid.");
  }
  if (process.env.NODE_ENV === "production" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname.toLowerCase())) {
    throw new AIServiceError("configuration", "AI service configuration is invalid.");
  }
  const accessId = process.env.OLLAMA_ACCESS_CLIENT_ID?.trim();
  const accessSecret = process.env.OLLAMA_ACCESS_CLIENT_SECRET?.trim();
  if (Boolean(accessId) !== Boolean(accessSecret) || (accessId && url.protocol !== "https:")) {
    throw new AIServiceError("configuration", "AI service configuration is invalid.");
  }
  const model = (process.env.OLLAMA_MODEL || DEFAULT_MODEL).trim();
  if (!model || model.length > 128) throw new AIServiceError("configuration", "AI service configuration is invalid.");
  return { baseUrl: url.toString().replace(/\/$/, ""), model };
}

export function getGroqConfig() {
  const key = process.env.GROQ_API_KEY?.trim();
  const model = (process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL).trim();
  if (!key || !model || model.length > 128) {
    throw new AIServiceError("configuration", "AI service configuration is invalid.");
  }
  return {
    apiKey: key,
    model,
    url: "https://api.groq.com/openai/v1/chat/completions",
  };
}

export function getProviderConfig() {
  const provider = getConfiguredProvider();
  if (provider === "groq") return { provider, ...getGroqConfig() };
  return { provider, ...getOllamaConfig() };
}

function normalizeGroqContent(content) {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    const text = content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
    return text;
  }
  return "";
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

  const providerConfig = getProviderConfig();
  activeRequests++;
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeout = setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);

  try {
    let response;
    try {
      if (providerConfig.provider === "groq") {
        response = await fetch(providerConfig.url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${providerConfig.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: providerConfig.model,
            temperature: 0,
            max_tokens: 500,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
          signal: controller.signal,
        });
      } else {
        const { baseUrl, model } = providerConfig;
        response = await fetch(`${baseUrl}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.OLLAMA_ACCESS_CLIENT_ID?.trim() && process.env.OLLAMA_ACCESS_CLIENT_SECRET?.trim()
              ? {
                  "CF-Access-Client-Id": process.env.OLLAMA_ACCESS_CLIENT_ID.trim(),
                  "CF-Access-Client-Secret": process.env.OLLAMA_ACCESS_CLIENT_SECRET.trim(),
                }
              : {}),
          },
          body: JSON.stringify({
            model, stream: false, format: "json",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            options: { temperature: 0, num_predict: 350 },
          }),
          signal: controller.signal,
        });
      }
    } catch (error) {
      if (signal?.aborted) throw new AIServiceError("cancelled", "The AI request was cancelled.", 499);
      if (controller.signal.aborted) throw new AIServiceError("timeout", "The AI service timed out.", 504);
      throw new AIServiceError("unavailable", "The AI service is unavailable.");
    }

    if (response.status === 401 || response.status === 403) {
      throw new AIServiceError("authorization", "AI service authorization failed.", response.status);
    }
    if (response.status === 404) throw new AIServiceError("model_missing", "The configured AI model is not available.");
    if (response.status === 429) throw new AIServiceError("rate_limited", "The AI service is rate limited.", 429);
    if (!response.ok) throw new AIServiceError("provider_error", "The AI service returned an error.");

    let data;
    try { data = await response.json(); } catch {
      throw new AIServiceError("invalid_response", "The AI service returned an invalid response.");
    }

    let content;
    if (providerConfig.provider === "groq") {
      content = normalizeGroqContent(data?.choices?.[0]?.message?.content);
    } else {
      content = typeof data?.message?.content === "string" ? data.message.content.trim() : "";
    }

    if (!content || content.length > MAX_GENERATION_CHARS) {
      throw new AIServiceError("invalid_response", "The AI service returned an invalid response.");
    }
    return content;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromCaller);
    activeRequests--;
  }
}

export const llmLimits = Object.freeze({ MAX_PROMPT_CHARS, MAX_GENERATION_CHARS, MAX_CONCURRENT, REQUEST_TIMEOUT_MS });
