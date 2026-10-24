import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "node:http";
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requestObservability } from "../middleware/requestObservability.js";

const logLines = [];
const app = express();
app.use(requestObservability({ log: (line) => logLines.push(line) }));
app.use(express.json());
const aiRoutes = express.Router();
aiRoutes.post("/debug", protect, (_req, res) => res.sendStatus(200));
app.use("/api/ai", aiRoutes);

const server = createServer(app);
let origin;

before(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("logs unauthenticated AI requests with safe fields and a correlatable request ID", async () => {
  const response = await fetch(
    `${origin}/api/ai/debug?privateQuery=private-query-value`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "ApiKey private-auth-value",
        Cookie: "theme=private-cookie-value",
        "X-Api-Key": "private-api-key-value",
        "X-Request-Id": "untrusted-client-id",
      },
      body: JSON.stringify({ code: "private-body-value" }),
    },
  );

  assert.equal(response.status, 401);
  const requestId = response.headers.get("x-request-id");
  assert.match(requestId, /^[0-9a-f-]{36}$/i);
  assert.equal(logLines.length, 1);

  const log = JSON.parse(logLines[0]);
  assert.deepEqual(Object.keys(log).sort(), ["durationMs", "event", "method", "path", "requestId", "status"]);
  assert.equal(log.event, "http.request");
  assert.equal(log.requestId, requestId);
  assert.equal(log.method, "POST");
  assert.equal(log.path, "/api/ai/debug");
  assert.equal(log.status, 401);
  assert.equal(typeof log.durationMs, "number");

  for (const secret of [
    "private-query-value",
    "private-auth-value",
    "private-cookie-value",
    "private-api-key-value",
    "private-body-value",
    "untrusted-client-id",
  ]) {
    assert.equal(logLines[0].includes(secret), false);
  }
});

test("uses a safe normalized path when no route matches", async () => {
  const response = await fetch(`${origin}/users/person@example.com?token=private-query-value`);
  assert.equal(response.status, 404);

  const log = JSON.parse(logLines[1]);
  assert.equal(log.path, "/unmatched");
  assert.equal(log.status, 404);
  assert.equal(logLines[1].includes("person@example.com"), false);
  assert.equal(logLines[1].includes("private-query-value"), false);
});
