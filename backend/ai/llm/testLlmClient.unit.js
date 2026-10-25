import assert from "node:assert/strict";
import { AIServiceError, generateResponse, getGroqConfig, getOllamaConfig } from "./llmClient.js";
import { analyzeComplexity } from "../../utils/complexityAnalyzer.js";

const originalFetch = globalThis.fetch;
const originalWarn = console.warn;
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
const failed = (status, data) => ({ ok: false, status, json: async () => data });

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
  const ollamaConfigLogs = [];
  console.warn = (line) => ollamaConfigLogs.push(JSON.parse(line));
  try {
    await assert.rejects(generateResponse(request), (error) => error.category === "configuration");
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(ollamaConfigLogs[0].provider, "ollama");
  assert.equal(ollamaConfigLogs[0].category, "configuration");
  process.env.OLLAMA_URL = "http://localhost:11434";
  assert.throws(() => getOllamaConfig(), (error) => error.category === "configuration");
  for (const url of ["http://127.1.2.3:11434", "http://[::1]:11434", "http://ollama.localhost:11434"]) {
    process.env.OLLAMA_URL = url;
    assert.throws(() => getOllamaConfig(), (error) => error.category === "configuration");
  }
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
  let groqRequestBody;
  globalThis.fetch = async (_url, options) => {
    groqRequestBody = JSON.parse(options.body);
    return okGroq('{"ok":true}');
  };
  await generateResponse(request);
  assert.equal(groqRequestBody.model, "openai/gpt-oss-20b");
  assert.equal(groqRequestBody.max_completion_tokens, 500);
  assert.equal(groqRequestBody.response_format.type, "json_object");

  process.env.NODE_ENV = "production";
  delete process.env.GROQ_API_KEY;
  const configLogs = [];
  console.warn = (line) => configLogs.push(JSON.parse(line));
  try {
    await assert.rejects(generateResponse(request), (error) => error.category === "configuration");
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(configLogs[0].provider, "groq");
  assert.equal(configLogs[0].category, "configuration");
  assert.ok(!JSON.stringify(configLogs[0]).includes("test-key"));
  process.env.GROQ_API_KEY = "test-key";
  process.env.NODE_ENV = "test";

  globalThis.fetch = async () => failed(404, { error: { message: "The model does not exist", code: "model_not_found" } });
  await assert.rejects(generateResponse(request), (error) => error.category === "model_missing");
  globalThis.fetch = async () => failed(404, { error: { message: "Not Found" } });
  await assert.rejects(generateResponse(request), (error) => error.category === "provider_error");
  globalThis.fetch = async () => failed(400, { error: { message: "This model is not supported" } });
  await assert.rejects(generateResponse(request), (error) => error.category === "model_missing");
  for (const status of [400, 413, 422]) {
    globalThis.fetch = async () => failed(status, { error: { message: "Invalid request", type: "invalid_request_error" } });
    await assert.rejects(generateResponse(request), (error) => error.category === "invalid_request");
  }
  globalThis.fetch = async () => failed(401, { error: { message: "Invalid API key test-key" } });
  const authLogs = [];
  console.warn = (line) => authLogs.push(JSON.parse(line));
  try {
    await assert.rejects(generateResponse(request), (error) =>
      error.category === "authorization" &&
      error.statusCode === 401 &&
      !error.message.includes("test-key")
    );
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(authLogs[0].provider, "groq");
  assert.equal(authLogs[0].model, "openai/gpt-oss-20b");
  assert.equal(authLogs[0].status, 401);
  assert.equal(authLogs[0].category, "authorization");
  assert.ok(Number.isInteger(authLogs[0].durationMs) && authLogs[0].durationMs >= 0);
  assert.ok(!JSON.stringify(authLogs[0]).includes("test-key"));

  globalThis.fetch = async () => failed(429, { error: { message: "Too many requests" } });
  await assert.rejects(generateResponse(request), (error) => error.category === "rate_limited");
  globalThis.fetch = async () => failed(498, { error: { message: "Capacity exceeded" } });
  await assert.rejects(generateResponse(request), (error) => error.category === "rate_limited");
  globalThis.fetch = async () => failed(504, { error: { message: "Upstream timed out" } });
  await assert.rejects(generateResponse(request), (error) => error.category === "timeout");

  const privateCode = "const password = 'submitted-user-secret';";
  const sensitivePrompt = `UNTRUSTED_INPUT_JSON:\n${JSON.stringify({
    request: { submittedCode: privateCode, topic: "private-topic" },
  })}`;
  globalThis.fetch = async () => failed(503, {
    error: { message: `Rejected ${privateCode}; ${sensitivePrompt}; bearer test-secret-token ${"x".repeat(300)}` },
  });
  process.env.GROQ_API_KEY = "test-secret-token";
  const providerLogs = [];
  console.warn = (line) => providerLogs.push(JSON.parse(line));
  try {
    await assert.rejects(
      generateResponse({ systemPrompt: "system", userPrompt: sensitivePrompt }),
      (error) => error.category === "provider_error" && !error.message.includes("submitted-user-secret")
    );
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(providerLogs[0].provider, "groq");
  assert.equal(providerLogs[0].model, "openai/gpt-oss-20b");
  assert.equal(providerLogs[0].status, 503);
  assert.equal(providerLogs[0].category, "provider_error");
  assert.ok(Number.isInteger(providerLogs[0].durationMs) && providerLogs[0].durationMs >= 0);
  assert.ok(providerLogs[0].message.length <= 240);
  assert.ok(!JSON.stringify(providerLogs[0]).includes(privateCode));
  assert.ok(!JSON.stringify(providerLogs[0]).includes("private-topic"));
  assert.ok(!JSON.stringify(providerLogs[0]).includes("test-secret-token"));

  globalThis.fetch = async () => failed(503, { error: { message: "A".repeat(400) } });
  const boundedLogs = [];
  console.warn = (line) => boundedLogs.push(JSON.parse(line));
  try {
    await assert.rejects(generateResponse(request), (error) => error.category === "provider_error");
  } finally {
    console.warn = originalWarn;
  }
  assert.ok(boundedLogs[0].message.length <= 240);

  globalThis.fetch = async () => failed(503, { error: { message: "A provider outage" } });
  await assert.rejects(generateResponse(request), (error) => error.category === "provider_error" && !error.message.includes("503"));
  const malformedLogs = [];
  console.warn = (line) => malformedLogs.push(JSON.parse(line));
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError("secret body"); } });
  try {
    await assert.rejects(generateResponse(request), (error) => error.category === "invalid_response" && !error.message.includes("secret"));
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(malformedLogs[0].category, "invalid_response");
  assert.ok(!JSON.stringify(malformedLogs[0]).includes("secret body"));
  globalThis.fetch = async () => ok("   ");
  await assert.rejects(generateResponse(request), (error) => error.category === "invalid_response");
  globalThis.fetch = async () => ok("x".repeat(8_001));
  await assert.rejects(generateResponse(request), (error) => error.category === "invalid_response");
  await assert.rejects(generateResponse({ ...request, userPrompt: "x".repeat(32_001) }), (error) => error.category === "validation");

  globalThis.fetch = async () => { throw new Error("private provider details"); };
  const networkLogs = [];
  console.warn = (line) => networkLogs.push(JSON.parse(line));
  try {
    await assert.rejects(generateResponse(request), (error) => error.category === "network_error" && !error.message.includes("private"));
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(networkLogs[0].category, "network_error");
  assert.ok(!JSON.stringify(networkLogs[0]).includes("private"));

  globalThis.fetch = async (_url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
  });
  const timeoutLogs = [];
  console.warn = (line) => timeoutLogs.push(JSON.parse(line));
  try {
    await assert.rejects(generateResponse({ ...request, timeoutMs: 10 }), (error) => error.category === "timeout");
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(timeoutLogs[0].category, "timeout");
  globalThis.fetch = async (_url, options) => ({
    ok: true,
    status: 200,
    json: () => new Promise((resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
    }),
  });
  await assert.rejects(generateResponse({ ...request, timeoutMs: 10 }), (error) => error.category === "timeout");

  globalThis.fetch = async (_url, options) => new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException("aborted", "AbortError"));
    if (options.signal.aborted) abort();
    else options.signal.addEventListener("abort", abort, { once: true });
  });
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
