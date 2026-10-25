import axiosInstance from "./axiosInstance";

const AI_LANGUAGES = new Set(["JavaScript", "Python", "Java", "C++", "C", "Go", "TypeScript"]);
const AI_FIELD_LIMITS = {
  code: 20_000,
  description: 5_000,
  error: 2_000,
  expectedOutput: 2_000,
  topic: 100,
};

export function getAIRequestValidationError(payload = {}) {
  const { code, language } = payload;
  if (typeof code !== "string" || !code.trim() || typeof language !== "string" || !AI_LANGUAGES.has(language)) {
    return "Code and a supported language are required.";
  }
  for (const [field, maximum] of Object.entries(AI_FIELD_LIMITS)) {
    const value = payload[field];
    if (value !== undefined && (typeof value !== "string" || value.length > maximum)) {
      return `The ${field} field is invalid or too long.`;
    }
  }
  return null;
}

export async function postAIDebugRequest(user, payload, config, client = axiosInstance) {
  if (!user) return { status: "unauthenticated" };

  const validationError = getAIRequestValidationError(payload);
  if (validationError) return { status: "invalid", error: validationError };

  const response = await client.post("/ai/debug", payload, config);
  return { status: "success", data: response.data };
}
