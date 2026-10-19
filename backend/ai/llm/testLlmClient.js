import dotenv from "dotenv";

dotenv.config();

const { generateResponse } =
  await import("./llmClient.js");

async function test() {
  const response = await generateResponse({
    systemPrompt:
      'Return only JSON with the four string fields "diagnosis", "hint", "concept", and "debuggingStep". Do not include code.',
    userPrompt:
      "Give a short conceptual hint for a binary search that can enter an infinite loop when its bounds stop changing.",
  });

  console.log("\nOllama response:\n");
  console.log(response);
  const parsed = JSON.parse(response);
  for (const field of ["diagnosis", "hint", "concept", "debuggingStep"]) {
    if (typeof parsed[field] !== "string" || !parsed[field].trim()) {
      throw new Error(`Ollama response is missing ${field}`);
    }
  }
}

test().catch((error) => {
  console.error("\nTest failed:\n");
  console.error(error);
  process.exitCode = 1;
});
