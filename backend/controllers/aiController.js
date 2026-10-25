import { getDebugHint } from "../ai/rag/debugCoach.js";
import { AIServiceError, generateResponse } from "../ai/llm/llmClient.js";

const limits = { code: 16_000, description: 2_000, error: 2_000, expectedOutput: 2_000, topic: 120 };
const languages = new Set(["JavaScript", "Python", "Java", "C++", "C", "Go", "TypeScript"]);
const configuredConcurrency = Number(process.env.AI_MAX_CONCURRENT);
const maximumActiveRequests = Number.isInteger(configuredConcurrency)
  ? Math.max(1, Math.min(4, configuredConcurrency))
  : 2;
let activeRequests = 0;

export function getDebugRequestValidationError(body = {}) {
  const { code, language } = body;
  if (typeof code !== "string" || !code.trim() || typeof language !== "string" || !languages.has(language)) {
    return "Code and a supported language are required.";
  }
  const values = { code, ...body };
  for (const [field, maximum] of Object.entries(limits)) {
    if (values[field] !== undefined && (typeof values[field] !== "string" || values[field].length > maximum)) {
      return `The ${field} field is invalid or too long.`;
    }
  }
  return null;
}

export async function debugCoach(req, res) {
  const { code, language, topic, description, error, expectedOutput } = req.body || {};
  const validationError = getDebugRequestValidationError(req.body || {});
  if (validationError) {
    return res.status(400).json({ success: false, error: { code: "INVALID_REQUEST", message: validationError } });
  }
  if (activeRequests >= maximumActiveRequests) {
    return res.status(429).json({ success: false, error: { code: "AI_BUSY", message: "AI help is busy. Please retry shortly." } });
  }
  activeRequests++;
  const controller = new AbortController();
  const onClose = () => { if (!res.writableEnded) controller.abort(); };
  res.once("close", onClose);
  const startedAt = Date.now();
  let outcome = "success";
  try {
    const result = await getDebugHint({ code, language, topic, description, error, expectedOutput }, {
      throwOnFailure: true,
      generateResponseFn: (args) => generateResponse({ ...args, signal: controller.signal }),
    });
    if (!res.headersSent && !res.destroyed) return res.status(200).json({ success: true, ...result });
  } catch (cause) {
    const aiError = cause instanceof AIServiceError ? cause : null;
    outcome = aiError?.category || "internal_error";
    if (!res.headersSent && !res.destroyed) {
      const status = aiError?.statusCode || 503;
      const code = aiError?.category === "timeout" ? "AI_TIMEOUT" : aiError?.category === "busy" ? "AI_BUSY" : "AI_UNAVAILABLE";
      const message = aiError?.category === "timeout" ? "AI help timed out. Please retry." : aiError?.category === "busy" ? "AI help is busy. Please retry shortly." : "AI help is temporarily unavailable.";
      return res.status(status).json({ success: false, error: { code, message } });
    }
  } finally {
    activeRequests--;
    res.removeListener("close", onClose);
    console.info(JSON.stringify({ event: "ai.coach", outcome, durationMs: Date.now() - startedAt }));
  }
}

export const getDebuggingHint = debugCoach;
