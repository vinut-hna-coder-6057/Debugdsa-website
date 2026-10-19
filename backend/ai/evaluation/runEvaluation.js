import "dotenv/config";

import cases from "./cases.js";
import {
  findInclusiveMatrixColumnBound,
  findOverwrittenSuccessor,
  findUncheckedBinarySearchCandidate,
  getDebugHint,
  getModelHint,
} from "../rag/debugCoach.js";
import { search } from "../retrieval/vectorStore.js";

const REQUIRED_FIELDS = ["diagnosis", "hint", "concept", "debuggingStep"];
const MODEL_NAME = process.env.OLLAMA_MODEL || "qwen2.5:3b-instruct";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const EVALUATION_METHOD = {
  positivePrediction:
    "A diagnosis is positive when it contains explicit defect language or a recognized failure behavior; this is a surface heuristic and can misclassify paraphrases.",
  passPartialFail:
    "Diagnosis completeness uses token overlap with each case's essentialFacts; this is a review aid, not a semantic correctness guarantee.",
  ambiguousCases:
    "Cases with hasDefect=null are excluded from binary classification metrics.",
};
const representativeCaseIds = new Set([
  "binary-final-candidate-fault",
  "matrix-inclusive-column-fault",
  "linked-list-successor-overwrite",
]);

function assertDataset() {
  const ids = new Set();
  for (const item of cases) {
    if (ids.has(item.id)) throw new Error(`Duplicate evaluation case ID: ${item.id}`);
    ids.add(item.id);

    for (const field of [
      "id",
      "topic",
      "language",
      "code",
      "description",
      "expectedBehavior",
      "hintBehavior",
      "retrievalQuery",
    ]) {
      if (typeof item[field] !== "string" || !item[field].trim()) {
        throw new Error(`${item.id}: missing required evaluation field ${field}`);
      }
    }
    if (
      typeof item.hasDefect !== "boolean" &&
      item.hasDefect !== null
    ) {
      throw new Error(`${item.id}: hasDefect must be true, false, or null`);
    }
    if (!Array.isArray(item.essentialFacts) || item.essentialFacts.length < 2) {
      throw new Error(`${item.id}: add at least two essential diagnosis facts`);
    }
  }

  const categoryCounts = cases.reduce((counts, item) => {
    counts[item.topic] = (counts[item.topic] || 0) + 1;
    return counts;
  }, {});
  if (cases.length < 30) throw new Error(`Expected at least 30 cases, found ${cases.length}`);
  if (Object.keys(categoryCounts).length < 10) {
    throw new Error(`Expected at least 10 topic categories, found ${Object.keys(categoryCounts).length}`);
  }
  const classifierChecks = [
    ["The function returns not-found without testing the remaining candidate.", true],
    ["The index equals length and reads an undefined value outside valid indexes.", true],
    ["The function does not correctly handle its final candidate.", true],
    ["The inner loop allows c to equal the row length and then reads that column.", true],
    ["The code overwrites the original successor link before advancing.", true],
    ["The BFS does not ensure a node is marked before it can be enqueued twice.", true],
    ["The search can hang because the lower bound makes no progress.", true],
    ["The code does not enforce the at-most-once item constraint.", true],
    ["The code does not access an invalid element for empty input.", false],
    ["No bug is demonstrated by this correct implementation.", false],
  ];
  for (const [diagnosis, expected] of classifierChecks) {
    if (predictsDefect(diagnosis) !== expected) {
      throw new Error(`Diagnosis metric classifier self-check failed: ${diagnosis}`);
    }
  }
  return categoryCounts;
}

function normalizedTokens(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
  );
}

function factCoverage(diagnosis, facts) {
  const tokens = normalizedTokens(diagnosis);
  const significant = facts.flatMap((fact) => [...normalizedTokens(fact)]);
  if (!significant.length) return 0;
  return significant.filter((token) => tokens.has(token)).length / significant.length;
}

function predictsDefect(diagnosis) {
  const text = diagnosis.toLowerCase();
  if (
    /\b(?:no bug|no defect|no issue|no error|appears correct|is correct|cannot identify a bug|cannot confirm a bug|insufficient evidence|not enough information|no demonstrated defect)\b/.test(text)
  ) {
    return false;
  }
  return /\b(?:bug|defect|issue|error|incorrect(?:ly)?|wrong|missing|fails?|failure|hangs?|non[- ]?terminat(?:e|es|ing)|no progress|out[- ]of[- ]bounds|out of range|infinite loop|infinite recursion|undefined|overflow|never reaches|skips|omits|duplicates?|overwrites?|truncat(?:e|es|ed)|without (?:testing|checking|visiting|preserving)|does not (?:correctly|properly|have|include|check|test|track|maintain|preserve|handle|advance|update|reach|visit|process|ensure|enforce)|doesn't (?:correctly|properly|have|include|check|test|track|maintain|preserve|handle|advance|update|reach|visit|process|ensure|enforce)|not correctly|not properly|allows?\b.*\b(?:equal|reach|exceed)\b.*\b(?:length|bound|index))\b/.test(text);
}

function schemaValid(response) {
  return (
    response &&
    typeof response === "object" &&
    !Array.isArray(response) &&
    Object.keys(response).length === REQUIRED_FIELDS.length &&
    REQUIRED_FIELDS.every(
      (field) =>
        typeof response[field] === "string" &&
        response[field].trim().length >= 3
    )
  );
}

function assess(item, response) {
  const diagnosis = response?.diagnosis || "";
  const predicts = predictsDefect(diagnosis);
  const coverage = factCoverage(diagnosis, item.essentialFacts);
  let verdict;

  if (item.hasDefect === true) {
    if (predicts && coverage >= 0.35) verdict = "Pass";
    else if (predicts || coverage >= 0.2) verdict = "Partial";
    else verdict = "Fail";
  } else if (item.hasDefect === false) {
    if (!predicts && /\b(?:no|not|cannot|doesn't|does not|correct|safe|valid|guard|precondition|depends)\b/i.test(diagnosis)) {
      verdict = "Pass";
    } else if (!predicts) {
      verdict = "Partial";
    } else {
      verdict = "Fail";
    }
  } else {
    verdict =
      !predicts &&
      /\b(?:missing|unclear|cannot|can't|need|requires|depends|insufficient|what|which)\b/i.test(
        `${diagnosis} ${response?.hint || ""}`
      )
        ? "Pass"
        : predicts
          ? "Fail"
          : "Partial";
  }

  const combined = REQUIRED_FIELDS.map((field) => response?.[field] || "").join(" ");
  const hintHasQuestion = (response?.hint || "").includes("?");
  const hintSignalCoverage = factCoverage(
    `${response?.hint || ""} ${response?.debuggingStep || ""}`,
    item.essentialFacts
  );

  return {
    verdict,
    predictsDefect: predicts,
    diagnosisFactCoverage: Number(coverage.toFixed(3)),
    codeGroundingSignal: coverage >= 0.2,
    hintUsefulSignal: hintHasQuestion && hintSignalCoverage >= 0.15,
    relevanceSignal: coverage >= 0.2 || item.hasDefect === null,
    completeSolutionLeakage: /```|`[^`]+`|\b(?:complete|full) solution\b/i.test(combined),
    schemaValid: schemaValid(response),
  };
}

function guardFor(item) {
  if (findUncheckedBinarySearchCandidate(item.code, item.language)) {
    return "binary-final-candidate";
  }
  if (findInclusiveMatrixColumnBound(item.code, item.language)) {
    return "matrix-inclusive-column";
  }
  if (findOverwrittenSuccessor(item.code, item.language)) {
    return "linked-list-overwritten-successor";
  }
  return null;
}

function calculateMetrics(results) {
  const eligible = results.filter((result) => result.item.hasDefect !== null);
  const counts = { truePositive: 0, falsePositive: 0, trueNegative: 0, falseNegative: 0 };
  for (const result of eligible) {
    const actual = result.item.hasDefect;
    const predicted = result.assessment.predictsDefect;
    if (actual && predicted) counts.truePositive++;
    else if (!actual && predicted) counts.falsePositive++;
    else if (!actual && !predicted) counts.trueNegative++;
    else counts.falseNegative++;
  }

  const precision = counts.truePositive + counts.falsePositive
    ? counts.truePositive / (counts.truePositive + counts.falsePositive)
    : 0;
  const recall = counts.truePositive + counts.falseNegative
    ? counts.truePositive / (counts.truePositive + counts.falseNegative)
    : 0;
  const accuracy = eligible.length
    ? (counts.truePositive + counts.trueNegative) / eligible.length
    : 0;

  return {
    eligibleCases: eligible.length,
    ambiguousCasesExcluded: results.length - eligible.length,
    ...counts,
    precision: Number(precision.toFixed(3)),
    recall: Number(recall.toFixed(3)),
    f1: Number((precision + recall ? (2 * precision * recall) / (precision + recall) : 0).toFixed(3)),
    overallDiagnosisAccuracy: Number(accuracy.toFixed(3)),
    schemaValidRate: Number(
      (results.filter((result) => result.assessment.schemaValid).length / results.length).toFixed(3)
    ),
    passPartialFail: {
      pass: results.filter((result) => result.assessment.verdict === "Pass").length,
      partial: results.filter((result) => result.assessment.verdict === "Partial").length,
      fail: results.filter((result) => result.assessment.verdict === "Fail").length,
    },
  };
}

function percentile(values, percentileValue) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(percentileValue * sorted.length) - 1;
  return Number(sorted[Math.max(0, index)].toFixed(1));
}

function summarizeDistribution(categoryCounts) {
  const labelCounts = cases.reduce(
    (counts, item) => {
      if (item.hasDefect === true) counts.faulty++;
      else if (item.hasDefect === false) counts.correct++;
      else counts.ambiguous++;
      return counts;
    },
    { faulty: 0, correct: 0, ambiguous: 0 }
  );
  return { total: cases.length, categoryCounts, labelCounts };
}

async function checkOllama() {
  const response = await fetch(`${OLLAMA_URL}/api/tags`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Ollama health check returned HTTP ${response.status}`);
  const data = await response.json();
  const tags = (data.models || []).map((model) => model.name);
  if (!tags.some((tag) => tag === MODEL_NAME || tag.startsWith(`${MODEL_NAME}:`))) {
    throw new Error(`Configured model ${MODEL_NAME} is not listed by Ollama`);
  }
}

async function runLiveEvaluation() {
  await checkOllama();
  const results = [];
  const latencies = [];

  for (const item of cases) {
    const startedAt = performance.now();
    let response;
    let error = null;
    try {
      response = await getDebugHint({
        code: item.code,
        language: item.language,
        topic: item.topic,
        description: item.description,
      });
    } catch (caught) {
      error = caught.message;
    }
    const latencyMs = Number((performance.now() - startedAt).toFixed(1));
    latencies.push(latencyMs);

    const result = {
      item,
      response,
      error,
      latencyMs,
      guard: guardFor(item),
      fallback: response?.diagnosis === "I could not generate a reliable diagnosis from this request.",
      assessment: assess(item, response),
    };
    results.push(result);

    console.log(
      JSON.stringify({
        caseId: item.id,
        topic: item.topic,
        label: item.hasDefect,
        expectedBehavior: item.expectedBehavior,
        actualResponse: response || null,
        guard: result.guard,
        fallback: result.fallback,
        latencyMs,
        assessment: result.assessment,
        error,
      })
    );
  }

  const metrics = calculateMetrics(results);
  const summary = {
    mode: "live",
    model: MODEL_NAME,
    distribution: summarizeDistribution(categoryCounts),
    evaluationMethod: EVALUATION_METHOD,
    metrics,
    latencyMs: {
      median: percentile(latencies, 0.5),
      p95: percentile(latencies, 0.95),
      min: Math.min(...latencies),
      max: Math.max(...latencies),
    },
  };
  console.log(JSON.stringify({ summary }, null, 2));

  const representative = results.filter((result) =>
    representativeCaseIds.has(result.item.id)
  );
  for (const result of representative) {
    const retrieved = await search(result.item.retrievalQuery, 5);
    let rawModel = null;
    let rawError = null;
    const rawStarted = performance.now();
    try {
      rawModel = await getModelHint({
        code: result.item.code,
        language: result.item.language,
        topic: result.item.topic,
        description: result.item.description,
      });
    } catch (caught) {
      rawError = caught.message;
    }

    console.log(
      JSON.stringify({
        comparison: result.item.id,
        expectedDiagnosis: result.item.expectedBehavior,
        retrieved: retrieved.map(({ id, title, topic, score }) => ({
          id,
          title,
          topic,
          score: Number(score.toFixed(4)),
        })),
        rawModel,
        completeCoach: result.response,
        deterministicGuard: result.guard,
        fallback: result.fallback,
        rawLatencyMs: Number((performance.now() - rawStarted).toFixed(1)),
        completeCoachLatencyMs: result.latencyMs,
        rawError,
      })
    );
  }

  return { results, summary };
}

const categoryCounts = assertDataset();
const distribution = summarizeDistribution(categoryCounts);

if (!process.argv.includes("--live")) {
  console.log(
    JSON.stringify(
      {
        mode: "deterministic-dataset-check",
        distribution,
        nextCommand: "node ai/evaluation/runEvaluation.js --live",
        note: "No LLM calls were made. Live assessment is opt-in and serial.",
      },
      null,
      2
    )
  );
} else {
  try {
    await runLiveEvaluation();
  } catch (error) {
    console.error(`Live evaluation could not complete: ${error.message}`);
    process.exitCode = 1;
  }
}
