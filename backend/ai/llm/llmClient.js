const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL || "qwen2.5:3b-instruct";

async function generateResponse({
  systemPrompt,
  userPrompt,
}) {
  let response;

  try {
    response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        format: "json",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        options: {
          temperature: 0,
          num_predict: 350,
        },
      }),
      signal: AbortSignal.timeout(120000),
    });
  } catch (error) {
    throw new Error(`Ollama is unavailable or timed out: ${error.message}`);
  }

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Ollama request failed (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();
  const content = data.message?.content?.trim();

  if (!content) {
    throw new Error("Ollama returned an empty response");
  }

  return content;
}

export {
  generateResponse,
};
