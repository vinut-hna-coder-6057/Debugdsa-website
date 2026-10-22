import fs from "fs/promises";
import os from "os";
import path from "path";
import crypto from "crypto";
import knowledgeBase from "../knowledgeBase.js";
import { generateEmbedding, generateEmbeddings, normalizeEmbeddingText, MODEL_ID } from "../embeddings/embeddingService.js";
import { AIServiceError } from "../llm/llmClient.js";

const EMBEDDING_VERSION = 3;
const RELEVANCE_THRESHOLD = Number.isFinite(Number(process.env.AI_RELEVANCE_THRESHOLD))
  ? Math.max(0, Math.min(1, Number(process.env.AI_RELEVANCE_THRESHOLD))) : 0.14;
let cacheDirectory = process.env.AI_CACHE_DIR || path.join(os.tmpdir(), "debugdsa-ai");
let embeddingsPath = path.join(cacheDirectory, "KnowledgeEmbeddings.json");
let embeddingProvider = { generateEmbedding, generateEmbeddings };
let documents = [];
let initializationPromise = null;
const STOP_WORDS = new Set(["a","an","and","are","as","at","be","by","for","from","has","have","in","into","is","it","of","on","or","that","the","this","to","was","when","with","what","why","how","where","which","who","does","do","did","can","could","would","should","please","explain","tell","about","question","general","knowledge"]);

function tokenize(text) {
  const normalized = normalizeEmbeddingText(text);
  const technical = normalized.match(/\b(?:dp|visited|prev|curr|current|next|low|high|left|right|mid|queue|stack|row|col|rows|cols|factorial|negative|boundary|candidate|base|case|window|pointer)\s*(?:\[[^\]\n]{1,30}\]|\b)?/g) || [];
  return new Set([...technical, ...(normalized.match(/[a-z][a-z0-9_]*/g) || [])].filter((term) => term.length > 1 && !STOP_WORDS.has(term)));
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || !a.length || a.length !== b.length ||
      !a.every(Number.isFinite) || !b.every(Number.isFinite)) return 0;
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; aa += a[i] * a[i]; bb += b[i] * b[i]; }
  return aa && bb ? dot / Math.sqrt(aa * bb) : 0;
}

const sourceFingerprint = () => crypto.createHash("sha256").update(JSON.stringify(knowledgeBase)).digest("hex");

async function buildEmbeddings() {
  if (!knowledgeBase.length) return [];
  const texts = knowledgeBase.map((item) => normalizeEmbeddingText(`${item.topic}. ${item.bugType}. ${item.title}. ${item.content}`));
  const vectors = await embeddingProvider.generateEmbeddings(texts);
  const payload = { schemaVersion: EMBEDDING_VERSION, model: MODEL_ID, sourceFingerprint: sourceFingerprint(), documents: knowledgeBase.map((item, i) => ({ ...item, embedding: vectors[i] })) };
  if (!isValidCache(payload)) throw new Error("The embedding service returned incompatible vectors.");
  await fs.mkdir(cacheDirectory, { recursive: true });
  const temporaryPath = `${embeddingsPath}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`;
  try {
    await fs.writeFile(temporaryPath, JSON.stringify(payload), { encoding: "utf8", flag: "wx" });
    await fs.rename(temporaryPath, embeddingsPath);
  } finally {
    await fs.rm(temporaryPath, { force: true }).catch(() => {});
  }
  return payload.documents;
}

export function isValidCache(cache) {
  const saved = cache?.documents;
  const metadataValid = cache?.schemaVersion === EMBEDDING_VERSION && cache?.model === MODEL_ID && cache?.sourceFingerprint === sourceFingerprint();
  if (!metadataValid || !Array.isArray(saved) || saved.length !== knowledgeBase.length) return false;
  if (!saved.length) return true;
  const dimension = saved[0]?.embedding?.length;
  return Number.isInteger(dimension) && dimension > 0 && saved.every((item, i) =>
    item && item.id === knowledgeBase[i].id && item.topic === knowledgeBase[i].topic && item.bugType === knowledgeBase[i].bugType &&
    item.title === knowledgeBase[i].title && item.content === knowledgeBase[i].content && Array.isArray(item.embedding) &&
    item.embedding.length === dimension && item.embedding.every(Number.isFinite));
}

async function readCache() {
  try { return JSON.parse(await fs.readFile(embeddingsPath, "utf8")); }
  catch (error) { if (error.code === "ENOENT" || error instanceof SyntaxError) return null; throw error; }
}

export async function initializeVectorStore() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      if (!knowledgeBase.length) { documents = []; return; }
      const cache = await readCache();
      documents = isValidCache(cache) ? cache.documents : await buildEmbeddings();
    })().catch((error) => { initializationPromise = null; throw error; });
  }
  await initializationPromise;
}

export async function search(query, topK = 5) {
  if (typeof query !== "string" || !query.trim() || !knowledgeBase.length) return [];
  const limit = Number.isFinite(Number(topK)) ? Math.max(1, Math.min(10, Math.floor(Number(topK)))) : 5;
  try {
    await initializeVectorStore();
  } catch {
    throw new AIServiceError("embedding_unavailable", "The embedding service is unavailable.");
  }
  let queryEmbedding;
  try {
    queryEmbedding = await embeddingProvider.generateEmbedding(query);
  } catch {
    throw new AIServiceError("embedding_unavailable", "The embedding service is unavailable.");
  }
  const queryTerms = tokenize(query);
  const termsByDocument = documents.map((doc) => tokenize(`${doc.topic} ${doc.bugType} ${doc.title} ${doc.content}`));
  const frequencies = new Map();
  for (const terms of termsByDocument) for (const term of terms) frequencies.set(term, (frequencies.get(term) || 0) + 1);
  const weights = new Map([...queryTerms].map((term) => [term, Math.log((documents.length + 1) / ((frequencies.get(term) || 0) + 1)) + 1]));
  const totalWeight = [...weights.values()].reduce((sum, n) => sum + n, 0);
  return documents.map((doc, index) => {
    let matched = 0;
    for (const [term, weight] of weights) if (termsByDocument[index].has(term)) matched += weight;
    const semanticScore = cosineSimilarity(queryEmbedding, doc.embedding);
    const lexicalScore = totalWeight ? matched / totalWeight : 0;
    const directMatchScore = queryTerms.size ? [...queryTerms].filter((term) => termsByDocument[index].has(term)).length / queryTerms.size : 0;
    return { ...doc, semanticScore, lexicalScore, directMatchScore, score: semanticScore * 0.55 + lexicalScore * 0.35 + directMatchScore * 0.10 };
  }).filter((doc) => doc.score >= RELEVANCE_THRESHOLD || doc.lexicalScore >= 0.12 || doc.directMatchScore >= 0.2)
    .sort((a, b) => b.score - a.score || b.semanticScore - a.semanticScore || a.id.localeCompare(b.id))
    .slice(0, limit).map(({ embedding, ...doc }) => doc);
}

export const getEmbeddingCachePath = () => embeddingsPath;
export async function configureVectorStoreForTests({ directory, provider, seedDocuments } = {}) {
  if (directory) { cacheDirectory = directory; embeddingsPath = path.join(directory, "KnowledgeEmbeddings.json"); }
  if (provider) embeddingProvider = provider;
  documents = [];
  initializationPromise = null;
  if (seedDocuments) {
    await fs.mkdir(cacheDirectory, { recursive: true });
    await fs.writeFile(embeddingsPath, JSON.stringify({ schemaVersion: EMBEDDING_VERSION, model: MODEL_ID, sourceFingerprint: sourceFingerprint(), documents: seedDocuments }), "utf8");
  }
}
