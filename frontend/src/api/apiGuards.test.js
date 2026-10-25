import { fetchRecommendedBugs } from "./recommendations";
import { getAIRequestValidationError, postAIDebugRequest } from "./aiRequest";
import { restoreSessionUser } from "./authSession";
import { shouldRefreshSession } from "./authRetry";

function createStorage(values = {}) {
  const entries = new Map(Object.entries(values));
  return {
    entries,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  };
}

test("cached frontend identity is restored only after the backend confirms the cookie session", async () => {
  const serverUser = { _id: "server-user", name: "Verified" };
  const cachedUser = { _id: "stale-user" };
  const storage = createStorage({ user: JSON.stringify(cachedUser) });
  const client = { get: jest.fn().mockResolvedValue({ data: { user: serverUser } }) };

  await expect(restoreSessionUser(cachedUser, client, storage)).resolves.toEqual(serverUser);

  expect(client.get).toHaveBeenCalledWith("/users/me");
  expect(JSON.parse(storage.entries.get("user"))).toEqual(serverUser);
});

test("a rejected cached session clears stale identity and legacy token storage", async () => {
  const storage = createStorage({ user: JSON.stringify({ _id: "stale-user" }), token: "legacy-token" });
  const client = { get: jest.fn().mockRejectedValue({ response: { status: 401 } }) };

  await expect(restoreSessionUser({ _id: "stale-user" }, client, storage)).resolves.toBeNull();

  expect(storage.entries.has("user")).toBe(false);
  expect(storage.entries.has("token")).toBe(false);
});

test("temporary session verification failures retain the cached user", async () => {
  const cachedUser = { _id: "cached-user" };
  const client = { get: jest.fn().mockRejectedValue(new Error("network unavailable")) };

  await expect(restoreSessionUser(cachedUser, client, createStorage())).resolves.toEqual(cachedUser);
});

test("session initialization asks the backend even if there is no cached user", async () => {
  const user = { _id: "cookie-session-user" };
  const client = { get: jest.fn().mockResolvedValue({ data: { user } }) };
  const storage = createStorage();

  await expect(restoreSessionUser(null, client, storage)).resolves.toEqual(user);

  expect(client.get).toHaveBeenCalledWith("/users/me");
});

test("401 from a protected API request triggers one refresh, but refresh failures do not loop", () => {
  expect(shouldRefreshSession({ response: { status: 401 }, config: { url: "/ai/debug" } })).toBe(true);
  expect(shouldRefreshSession({ response: { status: 401 }, config: { url: "/auth/refresh" } })).toBe(false);
  expect(shouldRefreshSession({ response: { status: 401 }, config: { url: "/ai/debug", _retry: true } })).toBe(false);
  expect(shouldRefreshSession({ response: { status: 403 }, config: { url: "/ai/debug" } })).toBe(false);
});

test("AI debug requests are not sent without a confirmed user session", async () => {
  const client = { post: jest.fn() };

  await expect(postAIDebugRequest(null, { code: "code", language: "JavaScript" }, {}, client)).resolves.toEqual({
    status: "unauthenticated",
  });

  expect(client.post).not.toHaveBeenCalled();
});

test("authenticated AI requests validate locally, then post to the protected endpoint", async () => {
  const payload = { code: "code", language: "JavaScript" };
  const client = { post: jest.fn().mockResolvedValue({ data: { diagnosis: "hint" } }) };

  await expect(postAIDebugRequest({ _id: "user-1" }, payload, { signal: "signal" }, client)).resolves.toEqual({
    status: "success",
    data: { diagnosis: "hint" },
  });

  expect(client.post).toHaveBeenCalledWith("/ai/debug", payload, { signal: "signal" });
});

test("authenticated AI requests reject locally invalid fields without posting", async () => {
  const client = { post: jest.fn() };

  await expect(postAIDebugRequest({ _id: "user-1" }, { code: "", language: "JavaScript" }, {}, client)).resolves.toEqual({
    status: "invalid",
    error: "Code and a supported language are required.",
  });

  expect(client.post).not.toHaveBeenCalled();
});

test("recommendations are not requested for a visitor without a user session", async () => {
  const client = { get: jest.fn() };

  const result = await fetchRecommendedBugs(null, client);

  expect(result).toEqual({ status: "unauthenticated", bugs: [] });
  expect(client.get).not.toHaveBeenCalled();
});

test("recommendations still use the protected API for a signed-in user", async () => {
  const client = { get: jest.fn().mockResolvedValue({ data: [{ _id: "bug-1" }] }) };

  const result = await fetchRecommendedBugs({ _id: "user-1" }, client);

  expect(client.get).toHaveBeenCalledWith("/recommendations/bugs");
  expect(result).toEqual({ status: "loaded", bugs: [{ _id: "bug-1" }] });
});

test("AI request guard accepts every stored bug language including Go and TypeScript", () => {
  for (const language of ["JavaScript", "Python", "Java", "C++", "C", "Go", "TypeScript"]) {
    expect(getAIRequestValidationError({ code: "function solve() {}", language })).toBeNull();
  }
});

test("AI request guard matches the stored bug field sizes", () => {
  expect(getAIRequestValidationError({
    code: "x".repeat(20_000),
    language: "JavaScript",
    description: "x".repeat(5_000),
    error: "x".repeat(2_000),
    expectedOutput: "x".repeat(2_000),
    topic: "x".repeat(100),
  })).toBeNull();
});

test("AI request guard catches invalid payloads before posting", () => {
  expect(getAIRequestValidationError({ code: " ", language: "JavaScript" })).toBe(
    "Code and a supported language are required."
  );
  expect(getAIRequestValidationError({ code: "x", language: "Rust" })).toBe(
    "Code and a supported language are required."
  );
  expect(getAIRequestValidationError({ code: "x".repeat(20_001), language: "JavaScript" })).toBe(
    "The code field is invalid or too long."
  );
  expect(getAIRequestValidationError({ code: "x", language: "JavaScript", description: 1 })).toBe(
    "The description field is invalid or too long."
  );
  expect(getAIRequestValidationError({ code: "x", language: "JavaScript", description: "x".repeat(5_001) })).toBe(
    "The description field is invalid or too long."
  );
  expect(getAIRequestValidationError({ code: "x", language: "JavaScript", topic: "x".repeat(101) })).toBe(
    "The topic field is invalid or too long."
  );
});
