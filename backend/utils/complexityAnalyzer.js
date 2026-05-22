import OpenAI from "openai";

let openai = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export const analyzeComplexity = async (code, language) => {
  // If AI disabled
  if (!openai) {
    return {
      timeComplexity: "AI_DISABLED",
      spaceComplexity: "AI_DISABLED",
      explanation: "OpenAI API key not configured.",
    };
  }

  try {
    const prompt = `
You are an expert algorithm complexity analyzer.

Analyze the following ${language} code.

Instructions:
- If recursion exists, derive the recurrence relation.
- Apply Master Theorem if applicable.
- Consider nested loops carefully.
- Return final Big-O only (e.g., O(n), O(n log n), O(n^2)).
- Be precise.

Return ONLY valid JSON in this exact format:

{
  "timeComplexity": "",
  "spaceComplexity": "",
  "explanation": ""
}

Do NOT include markdown.
Do NOT include extra text.
Do NOT include backticks.

Code:
${code}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0].message.content;

    const result = JSON.parse(content);

    // 🔥 Validation (important!)
    if (
      !result.timeComplexity ||
      !result.spaceComplexity ||
      !result.timeComplexity.includes("O(")
    ) {
      throw new Error("Invalid AI response format");
    }

    return {
      timeComplexity: result.timeComplexity.trim(),
      spaceComplexity: result.spaceComplexity.trim(),
      explanation: result.explanation?.trim() || "",
    };

  } catch (error) {
    console.error("AI ERROR:", error.message);

    return {
      timeComplexity: "ANALYSIS_FAILED",
      spaceComplexity: "ANALYSIS_FAILED",
      explanation: "AI analysis failed. Please retry.",
    };
  }
};