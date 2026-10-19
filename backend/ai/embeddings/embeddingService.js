import { pipeline } from "@xenova/transformers";

let extractorPromise = null;

function normalizeEmbeddingText(text) {
  if (typeof text !== "string") {
    throw new TypeError("Embedding input must be text");
  }

  return text.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    ).catch((error) => {
      extractorPromise = null;
      throw error;
    });
  }

  return extractorPromise;
}

async function generateEmbedding(text) {
  const model = await getExtractor();

  const output = await model(normalizeEmbeddingText(text), {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
}

async function generateEmbeddings(texts) {
  const model = await getExtractor();

  const embeddings = [];

  for (const text of texts) {
    const output = await model(normalizeEmbeddingText(text), {
      pooling: "mean",
      normalize: true,
    });

    embeddings.push(Array.from(output.data));
  }

  return embeddings;
}

export {
  generateEmbedding,
  generateEmbeddings,
  normalizeEmbeddingText,
};