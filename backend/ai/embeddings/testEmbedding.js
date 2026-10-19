import assert from "node:assert/strict";

import { generateEmbedding } from "./embeddingService.js";

async function test() {
  const text =
    "Binary search gets stuck because the search boundaries do not shrink.";

  console.log("Generating embedding...");

  const embedding = await generateEmbedding(text);
  assert.equal(embedding.length, 384, "MiniLM embeddings should have 384 dimensions");
  assert.ok(embedding.every(Number.isFinite), "Embedding values should be finite");

  console.log("Embedding generated.");
  console.log("Dimensions:", embedding.length);
  console.log("First 10 values:", embedding.slice(0, 10));
}

test().catch((error) => {
  console.error("Embedding test failed:");
  console.error(error);
  process.exitCode = 1;
});