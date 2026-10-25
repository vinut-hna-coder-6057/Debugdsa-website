const DEFAULT_URL = "http://localhost:11434";
const DEFAULT_MODEL = "qwen2.5:3b-instruct";
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";
const MAX_PROMPT_CHARS = 32_000;
const MAX_GENERATION_CHARS = 8_000;
const MAX_PROVIDER_ERROR_CHARS = 240;
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
  const hostname = url.hostname.toLowerCase();
  const isLoopback = hostname === "localhost" || hostname.endsWith(".localhost") ||
    hostname === "localhost.localdomain" || hostname === "[::1]" ||
    /^127(?:\.\d{1,3}){3}$/.test(hostname);
  if (process.env.NODE_ENV === "production" && isLoopback) {
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

function getProviderErrorDetails(data) {
  const error = data?.error;
  const message = typeof error === "string"
    ? error
    : error?.message || data?.message || data?.error_description;
  const code = typeof error?.code === "string" ? error.code : data?.code;
  const type = typeof error?.type === "string" ? error.type : "";
  return {
    message: typeof message === "string" ? message : "",
    code: typeof code === "string" ? code : "",
    type,
  };
}

function getProviderErrorCategory(status, details) {
  const modelError = /model.{0,60}(?:not found|does not exist|not supported|unsupported|unknown|unavailable|invalid|decommissioned)|(?:not found|does not exist|not supported|unsupported|unknown|unavailable|invalid|decommissioned).{0,60}model/i;
  if ((status === 404 || status === 400 || status === 422) &&
      (modelError.test(details.message) ||
       /model[_-](?:not[_-]found|not[_-]supported|unsupported|decommissioned)/i.test(details.code) ||
       /model[_-](?:not[_-]found|not[_-]supported|unsupported|decommissioned)/i.test(details.type))) {
    return "model_missing";
  }
  if (status === 401 || status === 403) return "authorization";
  if (status === 429 || status === 498) return "rate_limited";
  if (status === 408 || status === 504) return "timeout";
  if (status === 400 || status === 413 || status === 422) return "invalid_request";
  return "provider_error";
}

function logProviderDiagnostic(provider, model, status, category, message, startedAt = Date.now()) {
  console.warn(JSON.stringify({
    event: "ai.provider_error",
    provider,
    model: model || null,
    status,
    category,
    durationMs: Math.max(0, Date.now() - startedAt),
    message: message.slice(0, MAX_PROVIDER_ERROR_CHARS),
  }));
}

export function logMalformedProviderResponse() {
  const selectedProvider = (process.env.AI_PROVIDER || "ollama").trim().toLowerCase();
  const provider = selectedProvider === "groq" || selectedProvider === "ollama" ? selectedProvider : "unknown";
  const model = provider === "groq"
    ? (process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL).trim()
    : provider === "ollama" ? (process.env.OLLAMA_MODEL || DEFAULT_MODEL).trim() : null;
  logProviderDiagnostic(
    provider,
    model || null,
    200,
    "invalid_response",
    getSafeProviderErrorMessage("invalid_response", 200)
  );
}

function getSafeProviderErrorMessage(category, status) {
  if (category === "authorization") return "Provider authentication failed.";
  if (category === "model_missing") return "Configured model is unsupported or unavailable.";
  if (category === "rate_limited") return "Provider rate limit exceeded.";
  if (category === "timeout") return "Provider request timed out.";
  if (category === "invalid_request") return "Provider rejected the request as invalid.";
  if (category === "network_error") return "Could not connect to the configured AI provider.";
  if (category === "invalid_response") return "Provider returned a malformed response.";
  if (category === "configuration") return "Selected AI provider is not correctly configured.";
  if (status >= 500) return "Provider returned an upstream server error.";
  if (status >= 400) return "Provider rejected the request.";
  return "Provider returned an unexpected error response.";
}

function getRequestAbortError(signal, controller, providerConfig, startedAt) {
  if (signal?.aborted) return new AIServiceError("cancelled", "The AI request was cancelled.", 499);
  if (controller.signal.aborted) {
    logProviderDiagnostic(providerConfig.provider, providerConfig.model, null, "timeout", getSafeProviderErrorMessage("timeout", 0), startedAt);
    return new AIServiceError("timeout", "The AI service timed out.", 504);
  }
  return null;
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

  let providerConfig;
  try {
    providerConfig = getProviderConfig();
  } catch (error) {
    if (error instanceof AIServiceError && error.category === "configuration") {
      const selectedProvider = (process.env.AI_PROVIDER || "ollama").trim().toLowerCase();
      const provider = selectedProvider === "groq" || selectedProvider === "ollama" ? selectedProvider : "unknown";
      const model = provider === "groq"
        ? (process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL).trim()
        : (process.env.OLLAMA_MODEL || DEFAULT_MODEL).trim();
      logProviderDiagnostic(provider, model || null, null, "configuration", getSafeProviderErrorMessage("configuration", 0));
    }
    throw error;
  }
  activeRequests++;
  const startedAt = Date.now();
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
            max_completion_tokens: 500,
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
    } catch {
      const abortError = getRequestAbortError(signal, controller, providerConfig, startedAt);
      if (abortError) throw abortError;
      logProviderDiagnostic(providerConfig.provider, providerConfig.model, null, "network_error", getSafeProviderErrorMessage("network_error", 0), startedAt);
      throw new AIServiceError("network_error", "The AI service is unavailable.");
    }

    if (!response.ok) {
      let details = { message: "", code: "" };
      try {
        details = getProviderErrorDetails(await response.json());
      } catch {
        const abortError = getRequestAbortError(signal, controller, providerConfig, startedAt);
        if (abortError) throw abortError;
        details.message = "Provider returned an unreadable error response.";
      }
      const category = getProviderErrorCategory(response.status, details);
      logProviderDiagnostic(
        providerConfig.provider,
        providerConfig.model,
        response.status,
        category,
        getSafeProviderErrorMessage(category, response.status),
        startedAt
      );
      if (category === "authorization") {
        throw new AIServiceError(category, "AI service authorization failed.", response.status);
      }
      if (category === "model_missing") {
        throw new AIServiceError(category, "The configured AI model is not available.");
      }
      if (category === "rate_limited") {
        throw new AIServiceError(category, "The AI service is rate limited.", 429);
      }
      if (category === "timeout") {
        throw new AIServiceError(category, "The AI service timed out.", 504);
      }
      if (category === "invalid_request") {
        throw new AIServiceError(category, "The AI provider rejected the request.", response.status);
      }
      throw new AIServiceError(category, "The AI service returned an error.");
    }

    let data;
    try { data = await response.json(); } catch {
      const abortError = getRequestAbortError(signal, controller, providerConfig, startedAt);
      if (abortError) throw abortError;
      logProviderDiagnostic(
        providerConfig.provider,
        providerConfig.model,
        response.status,
        "invalid_response",
        getSafeProviderErrorMessage("invalid_response", response.status),
        startedAt
      );
      throw new AIServiceError("invalid_response", "The AI service returned an invalid response.");
    }

    let content;
    if (providerConfig.provider === "groq") {
      content = normalizeGroqContent(data?.choices?.[0]?.message?.content);
    } else {
      content = typeof data?.message?.content === "string" ? data.message.content.trim() : "";
    }

    if (!content || content.length > MAX_GENERATION_CHARS) {
      logProviderDiagnostic(
        providerConfig.provider,
        providerConfig.model,
        response.status,
        "invalid_response",
        getSafeProviderErrorMessage("invalid_response", response.status),
        startedAt
      );
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
