const AI_LANGUAGES = new Set(["JavaScript", "Python", "Java", "C++", "C", "Go", "TypeScript"]);
const AI_FIELD_LIMITS = {
  code: 16_000,
  description: 2_000,
  error: 2_000,
  expectedOutput: 2_000,
  topic: 120,
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
