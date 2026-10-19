import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import knowledgeBase from "../knowledgeBase.js";

import {
  generateEmbedding,
  generateEmbeddings,
  normalizeEmbeddingText,
} from "../embeddings/embeddingService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const embeddingsPath = path.join(
  __dirname,
  "../embeddings/KnowledgeEmbeddings.json"
);

const EMBEDDING_VERSION = 2;
const RELEVANCE_THRESHOLD = 0.14;
let documents = [];
let initializationPromise = null;

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has",
  "have", "in", "into", "is", "it", "of", "on", "or", "that", "the", "this",
  "to", "was", "when", "with", "what", "why", "how", "where", "which", "who",
  "does", "do", "did", "can", "could", "would", "should", "please", "explain",
  "tell", "about", "question", "general", "knowledge",
]);

function tokenize(text) {
  const normalized = normalizeEmbeddingText(text);
  const technicalTerms =
    normalized.match(/\b(?:dp|visited|prev|curr|current|next|low|high|left|right|mid|queue|stack|row|col|rows|cols|factorial|negative|boundary|candidate|base|case|window|pointer)\s*(?:\[[^\]\n]{1,30}\]|\b)?/g) || [];
  const words = normalized.match(/[a-z][a-z0-9_]*/g) || [];

  return new Set(
    [...technicalTerms, ...words].filter(
      (term) => term.length > 1 && !STOP_WORDS.has(term)
    )
  );
}

function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

async function buildEmbeddings() {
  const texts = knowledgeBase.map(
    (item) =>
      normalizeEmbeddingText(
        `${item.topic}. ${item.bugType}. ${item.title}. ${item.content}`
      )
  );

  const embeddings = await generateEmbeddings(texts);

  const data = knowledgeBase.map((item, index) => ({
    ...item,
    embeddingVersion: EMBEDDING_VERSION,
    embedding: embeddings[index],
  }));

  await fs.writeFile(
    embeddingsPath,
    JSON.stringify(data),
    "utf8"
  );

  return data;
}

function isValidCache(savedDocuments) {
  if (
    !Array.isArray(savedDocuments) ||
    savedDocuments.length !== knowledgeBase.length
  ) {
    return false;
  }

  const dimension = savedDocuments[0]?.embedding?.length;
  return Number.isInteger(dimension) && dimension > 0 &&
    savedDocuments.every((item, index) =>
      item &&
      item.id === knowledgeBase[index].id &&
      item.topic === knowledgeBase[index].topic &&
      item.bugType === knowledgeBase[index].bugType &&
      item.title === knowledgeBase[index].title &&
      item.content === knowledgeBase[index].content &&
      item.embeddingVersion === EMBEDDING_VERSION &&
      Array.isArray(item.embedding) &&
      item.embedding.length === dimension &&
      item.embedding.every(Number.isFinite)
    );
}

async function readCache() {
  let cacheContents;
  try {
    cacheContents = await fs.readFile(embeddingsPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }

  try {
    return JSON.parse(cacheContents);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

async function initializeVectorStore() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const savedDocuments = await readCache();
      documents = isValidCache(savedDocuments)
        ? savedDocuments
        : await buildEmbeddings();
    })().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  await initializationPromise;
}

async function search(query, topK = 5) {
  await initializeVectorStore();

  if (typeof query !== "string" || !query.trim()) {
    return [];
  }

  const queryEmbedding = await generateEmbedding(query);
  if (queryEmbedding.length !== documents[0]?.embedding?.length) {
    throw new Error("Query embedding does not match the knowledge base dimensions");
  }

  const queryTerms = tokenize(query);
  const documentTerms = documents.map((document) =>
    tokenize(
      `${document.topic} ${document.bugType} ${document.title} ${document.content}`
    )
  );
  const documentFrequencies = new Map();

  for (const terms of documentTerms) {
    for (const term of terms) {
      documentFrequencies.set(
        term,
        (documentFrequencies.get(term) || 0) + 1
      );
    }
  }

  const totalDocuments = documents.length;
  const queryWeights = new Map(
    [...queryTerms].map((term) => [
      term,
      Math.log(
        (totalDocuments + 1) /
          ((documentFrequencies.get(term) || 0) + 1)
      ) + 1,
    ])
  );
  const totalQueryWeight = [...queryWeights.values()].reduce(
    (total, weight) => total + weight,
    0
  );

  const scoredDocuments = documents
    .map((document, index) => {
      let matchedWeight = 0;
      for (const [term, weight] of queryWeights) {
        if (documentTerms[index].has(term)) {
          matchedWeight += weight;
        }
      }

      const semanticScore = cosineSimilarity(
        queryEmbedding,
        document.embedding
      );
      const lexicalScore =
        totalQueryWeight > 0 ? matchedWeight / totalQueryWeight : 0;
      const directMatchScore = documentTerms[index].size > 0 && queryTerms.size > 0
        ? [...queryTerms].filter((term) => documentTerms[index].has(term)).length / queryTerms.size
        : 0;

      return {
        ...document,
        semanticScore,
        lexicalScore,
        directMatchScore,
        score: semanticScore * 0.55 + lexicalScore * 0.35 + directMatchScore * 0.10,
      };
    })
    .filter(
      (document) =>
        document.score >= RELEVANCE_THRESHOLD ||
        document.lexicalScore >= 0.12 ||
        document.directMatchScore >= 0.2
    );

  if (scoredDocuments.length === 0) {
    return [];
  }

  return scoredDocuments
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.semanticScore - a.semanticScore ||
        a.id.localeCompare(b.id)
    )
    .slice(0, topK)
    .map(({ embedding, embeddingVersion, ...document }) => document);
}

export {
  initializeVectorStore,
  isValidCache,
  search,
};
