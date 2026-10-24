import assert from "node:assert/strict";
import { AIServiceError, generateResponse, getGroqConfig, getOllamaConfig } from "./llmClient.js";
import { analyzeComplexity } from "../../utils/complexityAnalyzer.js";

const originalFetch = globalThis.fetch;
const originalUrl = process.env.OLLAMA_URL;
const originalNodeEnv = process.env.NODE_ENV;
const originalAccessId = process.env.OLLAMA_ACCESS_CLIENT_ID;
const originalAccessSecret = process.env.OLLAMA_ACCESS_CLIENT_SECRET;
const originalProvider = process.env.AI_PROVIDER;
const originalGroqKey = process.env.GROQ_API_KEY;
const originalGroqModel = process.env.GROQ_MODEL;
const request = { systemPrompt: "system", userPrompt: "bounded test" };
const ok = (content = "{\"ok\":true}") => ({ ok: true, status: 200, json: async () => ({ message: { content } }) });
const okGroq = (content = "{\"ok\":true}") => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }) });

try {
  delete process.env.AI_PROVIDER;
  process.env.OLLAMA_URL = "file:///tmp/invalid";
  assert.throws(() => getOllamaConfig(), (error) => error instanceof AIServiceError && error.category === "configuration");
  process.env.OLLAMA_URL = "******localhost:11434";
  assert.throws(() => getOllamaConfig(), (error) => error.category === "configuration");

  process.env.OLLAMA_URL = "http://localhost:11434/";
  process.env.NODE_ENV = "development";
  delete process.env.OLLAMA_ACCESS_CLIENT_ID;
  delete process.env.OLLAMA_ACCESS_CLIENT_SECRET;
  globalThis.fetch = async () => ok();
  assert.equal(await generateResponse(request), "{\"ok\":true}");

  process.env.NODE_ENV = "production";
  delete process.env.OLLAMA_URL;
  assert.throws(() => getOllamaConfig(), (error) => error.category === "configuration");
  process.env.OLLAMA_URL = "http://localhost:11434";
  assert.throws(() => getOllamaConfig(), (error) => error.category === "configuration");
  process.env.OLLAMA_URL = "https://ollama.example.test";
  process.env.OLLAMA_ACCESS_CLIENT_ID = "test-client-id";
  process.env.OLLAMA_ACCESS_CLIENT_SECRET = "test-client-secret";
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers["CF-Access-Client-Id"], "test-client-id");
    assert.equal(options.headers["CF-Access-Client-Secret"], "test-client-secret");
    return ok();
  };
  assert.equal(await generateResponse(request), "{\"ok\":true}");
  delete process.env.OLLAMA_ACCESS_CLIENT_SECRET;
  assert.throws(() => getOllamaConfig(), (error) => error.category === "configuration");

  process.env.NODE_ENV = "test";
  process.env.OLLAMA_URL = "http://localhost:11434/";
  delete process.env.OLLAMA_ACCESS_CLIENT_ID;
  process.env.AI_PROVIDER = "groq";
  process.env.GROQ_API_KEY = "test-key";
  process.env.GROQ_MODEL = "openai/gpt-oss-20b";
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.groq.com/openai/v1/chat/completions");
    assert.equal(options.headers.Authorization, "Bearer test-key");
    return okGroq('{"ok":true}');
  };
  assert.equal(await generateResponse(request), "{\"ok\":true}");
  assert.equal(getGroqConfig().model, "openai/gpt-oss-20b");

  globalThis.fetch = async () => ({ ok: false, status: 404 });
  await assert.rejects(generateResponse(request), (error) => error.category === "model_missing");
  globalThis.fetch = async () => ({ ok: false, status: 503 });
  await assert.rejects(generateResponse(request), (error) => error.category === "provider_error" && !error.message.includes("503"));
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError("secret body"); } });
  await assert.rejects(generateResponse(request), (error) => error.category === "invalid_response" && !error.message.includes("secret"));
  globalThis.fetch = async () => ok("   ");
  await assert.rejects(generateResponse(request), (error) => error.category === "invalid_response");
  globalThis.fetch = async () => ok("x".repeat(8_001));
  await assert.rejects(generateResponse(request), (error) => error.category === "invalid_response");
  await assert.rejects(generateResponse({ ...request, userPrompt: "x".repeat(32_001) }), (error) => error.category === "validation");

  globalThis.fetch = async () => { throw new Error("private provider details"); };
  await assert.rejects(generateResponse(request), (error) => error.category === "unavailable" && !error.message.includes("private"));

  globalThis.fetch = async (_url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
  });
  await assert.rejects(generateResponse({ ...request, timeoutMs: 10 }), (error) => error.category === "timeout");

  const callerAbort = new AbortController();
  const abortedRequest = generateResponse({ ...request, signal: callerAbort.signal });
  callerAbort.abort();
  await assert.rejects(abortedRequest, (error) => error.category === "cancelled");

  const pending = [];
  globalThis.fetch = async (_url, options) => new Promise((resolve, reject) => {
    pending.push(() => resolve(okGroq()));
    options.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
  });
  const one = generateResponse(request);
  const two = generateResponse(request);
  await new Promise((resolve) => setTimeout(resolve, 0));
  await assert.rejects(generateResponse(request), (error) => error.category === "busy");
  pending.splice(0).forEach((release) => release());
  assert.equal(await one, "{\"ok\":true}");
  assert.equal(await two, "{\"ok\":true}");

  const complexity = await analyzeComplexity("for (const x of xs) use(x)", "JavaScript", {
    generateResponseFn: async () => JSON.stringify({ timeComplexity: "O(n)", spaceComplexity: "O(1)", explanation: "One pass." }),
  });
  assert.equal(complexity.timeComplexity, "O(n)");
  const badComplexity = await analyzeComplexity("code", "JavaScript", { generateResponseFn: async () => "not json" });
  assert.equal(badComplexity.timeComplexity, "ANALYSIS_UNAVAILABLE");
  assert.equal(badComplexity.spaceComplexity, "ANALYSIS_UNAVAILABLE");

  console.log("PASS provider-aware AI client, complexity fallback, bounds, errors, timeouts, cancellation, and concurrency");
} finally {
  globalThis.fetch = originalFetch;
  if (originalProvider === undefined) delete process.env.AI_PROVIDER;
  else process.env.AI_PROVIDER = originalProvider;
  if (originalGroqKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = originalGroqKey;
  if (originalGroqModel === undefined) delete process.env.GROQ_MODEL;
  else process.env.GROQ_MODEL = originalGroqModel;
  if (originalUrl === undefined) delete process.env.OLLAMA_URL;
  else process.env.OLLAMA_URL = originalUrl;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalAccessId === undefined) delete process.env.OLLAMA_ACCESS_CLIENT_ID;
  else process.env.OLLAMA_ACCESS_CLIENT_ID = originalAccessId;
  if (originalAccessSecret === undefined) delete process.env.OLLAMA_ACCESS_CLIENT_SECRET;
  else process.env.OLLAMA_ACCESS_CLIENT_SECRET = originalAccessSecret;
}

