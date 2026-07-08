import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  return new GoogleGenerativeAI(apiKey);
};

const HINT_PROMPTS: Record<number, string> = {
  1: "Give a brief conceptual hint about what type of problem this is. Do NOT mention data structures or algorithms — just the category/concept.",
  2: "Give an approach hint — what high-level strategy would work (e.g. divide and conquer, two pointers, sliding window). Still don't give pseudocode.",
  3: "Mention which data structures would be useful and why. Don't give pseudocode yet.",
  4: "Give pseudocode-level hints — steps without actual code.",
  5: "Give the complete solution approach with code-level guidance. Be thorough.",
};

router.post("/ai/hint", async (req, res): Promise<void> => {
  const { problemTitle, problemDescription, hintLevel, language, userCode } = req.body;

  if (!problemTitle || !hintLevel || !language) {
    res.status(400).json({ error: "problemTitle, hintLevel, and language are required" });
    return;
  }

  const level = Math.min(Math.max(parseInt(hintLevel, 10), 1), 5);

  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a coding mentor helping a student solve: "${problemTitle}".
${problemDescription ? `Problem description: ${problemDescription}` : ""}
${userCode ? `Student's current code (${language}):\n\`\`\`\n${userCode}\n\`\`\`` : ""}

Hint instruction (level ${level}/5): ${HINT_PROMPTS[level]}

Keep your response focused and encouraging. Maximum 200 words.`;

    const result = await model.generateContent(prompt);
    const hint = result.response.text();

    res.json({ hint, hintLevel: level, nextLevelAvailable: level < 5 });
  } catch (err) {
    req.log.error({ err }, "Failed to get hint");
    res.status(500).json({ error: "Failed to generate hint" });
  }
});

router.post("/ai/analyze", async (req, res): Promise<void> => {
  const { problemTitle, problemDescription, platform } = req.body;

  if (!problemTitle) {
    res.status(400).json({ error: "problemTitle is required" });
    return;
  }

  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze this coding problem: "${problemTitle}"
${problemDescription ? `Description: ${problemDescription}` : ""}
${platform ? `Platform: ${platform}` : ""}

Respond ONLY with valid JSON in this exact format:
{
  "difficulty": "Easy|Medium|Hard",
  "topics": ["array of relevant DSA topics"],
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "summary": "1-2 sentence summary of the problem",
  "approachSuggestion": "1-2 sentence high-level approach"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid JSON response");
    const parsed = JSON.parse(jsonMatch[0]);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Failed to analyze problem");
    res.status(500).json({ error: "Failed to analyze problem" });
  }
});

router.post("/ai/review", async (req, res): Promise<void> => {
  const { code, language, problemTitle, problemDescription } = req.body;

  if (!code || !language) {
    res.status(400).json({ error: "code and language are required" });
    return;
  }

  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Review this ${language} code${problemTitle ? ` for "${problemTitle}"` : ""}:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`
${problemDescription ? `Problem: ${problemDescription}` : ""}

Respond ONLY with valid JSON:
{
  "overallFeedback": "concise overall feedback",
  "bugs": ["list of bugs found, or empty array"],
  "optimizations": ["list of optimization suggestions"],
  "edgeCases": ["list of edge cases to handle"],
  "confidenceScore": 75,
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "dryRunExample": "trace through example input"
}
confidenceScore is 0-100 indicating how good the solution is.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid JSON response");
    const parsed = JSON.parse(jsonMatch[0]);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Failed to review code");
    res.status(500).json({ error: "Failed to review code" });
  }
});

router.post("/ai/chat", async (req, res): Promise<void> => {
  const { message, problemTitle, conversationHistory } = req.body;

  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `You are an AI coding mentor for students. Your job is to guide students to discover solutions themselves through Socratic questioning.
- Ask guiding questions instead of giving direct answers
- Be encouraging and positive
- If a student is stuck, give conceptual nudges not solutions
- Keep responses concise (under 150 words unless explaining a concept)
- Focus on teaching, not just answering
${problemTitle ? `The student is currently working on: "${problemTitle}"` : ""}`;

    const history = ((conversationHistory as Array<{ role: string; content: string }>) || [])
      .map((m) => `${m.role === "user" ? "Student" : "Mentor"}: ${m.content}`)
      .join("\n");

    const prompt = `${systemPrompt}\n\n${history ? `Conversation so far:\n${history}\n\n` : ""}Student: ${message}\n\nMentor:`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "Failed to chat");
    res.status(500).json({ error: "Failed to generate response" });
  }
});

router.post("/ai/explain", async (req, res): Promise<void> => {
  const { concept, depth } = req.body;

  if (!concept) {
    res.status(400).json({ error: "concept is required" });
    return;
  }

  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Explain the DSA concept: "${concept}" for a CS student.
Depth level: ${depth || "intermediate"}

Respond ONLY with valid JSON:
{
  "explanation": "clear explanation paragraph",
  "keyPoints": ["3-5 key points to remember"],
  "examples": ["2-3 concrete code/usage examples"],
  "relatedConcepts": ["2-4 related concepts to study next"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid JSON response");
    const parsed = JSON.parse(jsonMatch[0]);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Failed to explain concept");
    res.status(500).json({ error: "Failed to explain concept" });
  }
});

router.post("/ai/study-plan", async (req, res): Promise<void> => {
  const { weakTopics, targetCompany, durationDays } = req.body;

  if (!weakTopics || !durationDays) {
    res.status(400).json({ error: "weakTopics and durationDays are required" });
    return;
  }

  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Create a ${durationDays}-day coding interview study plan for a student.
Weak topics to focus on: ${(weakTopics as string[]).join(", ")}
${targetCompany ? `Target company: ${targetCompany}` : ""}

Respond ONLY with valid JSON:
{
  "overview": "1-2 sentence plan overview",
  "plan": [
    {
      "day": 1,
      "topic": "topic name",
      "tasks": ["task 1", "task 2", "task 3"],
      "estimatedHours": 2.5
    }
  ]
}
Generate exactly ${durationDays} days. Keep tasks specific and actionable.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid JSON response");
    const parsed = JSON.parse(jsonMatch[0]);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Failed to generate study plan");
    res.status(500).json({ error: "Failed to generate study plan" });
  }
});

export default router;
