const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CATEGORY_MAP = {
  dsa:    'Data Structures & Algorithms',
  webdev: 'Web Development (HTML/CSS/JS/React/Node)',
  ml:     'Machine Learning & Data Science',
  cs:     'Computer Science Fundamentals (OS, Networks, DBMS)',
  hr:     'HR / Behavioral',
};

const chat = async (prompt) => {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',   // free, very capable
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2048,
  });
  return response.choices[0].message.content.trim();
};

// Clean response — remove markdown code fences if model adds them
const parseJSON = (text) => {
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};

exports.generateQuestions = async ({ category, difficulty, count }) => {
  if (category === 'hr') {
    const prompt = `
You are a senior HR interviewer at a top tech company.
Generate exactly ${count} unique behavioral/situational interview questions, ${difficulty}-level depth.

Rules:
- Each question must probe a different competency (teamwork, conflict resolution, leadership,
  failure/learning, time management, motivation, ambiguity, ownership).
- Questions should be open-ended, the kind that invite a STAR-style (Situation, Task, Action,
  Result) answer — not yes/no, not technical.
- Do NOT include answers.

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "questionText": "your question here",
    "expectedTopics": ["competency being tested"],
    "difficulty": "${difficulty}"
  }
]`;
    const text = await chat(prompt);
    return parseJSON(text);
  }

  const prompt = `
You are a senior technical interviewer at a top tech company.
Generate exactly ${count} unique ${difficulty}-level interview questions for: ${CATEGORY_MAP[category]}.

Rules:
- Each question must test a different concept.
- Questions should be practical and commonly asked in real interviews.
- Do NOT include answers.

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "questionText": "your question here",
    "expectedTopics": ["topic1", "topic2"],
    "difficulty": "${difficulty}"
  }
]`;

  const text = await chat(prompt);
  return parseJSON(text);
};

exports.evaluateAnswer = async ({ questionText, userAnswer, category, difficulty }) => {
  if (category === 'hr') {
    const prompt = `
You are an experienced HR interviewer evaluating a candidate's behavioral answer.

Question: ${questionText}
Candidate Answer: ${userAnswer || '(no answer provided)'}

Score out of 10 based on:
- Structure & clarity (3 pts) — is it organised, ideally following a Situation/Task/Action/Result shape, not rambling?
- Self-awareness & reflection (3 pts) — genuine insight into their own role, decisions, growth — not a generic feel-good story
- Relevance (2 pts) — does it actually answer what was asked?
- Communication (2 pts) — concise, confident, professional tone

Return ONLY valid JSON, no markdown:
{
  "score": <number 0-10>,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "improvements": ["improvement1", "improvement2"],
  "idealAnswer": "a short note on what a strong STAR-style answer would emphasise here (2-4 sentences, not a full scripted answer)"
}`;
    const text = await chat(prompt);
    return parseJSON(text);
  }

  const prompt = `
You are a strict but fair technical interviewer. Evaluate this candidate answer.

Question: ${questionText}
Candidate Answer: ${userAnswer || '(no answer provided)'}
Category: ${CATEGORY_MAP[category]}
Difficulty: ${difficulty}

Score out of 10 based on:
- Technical accuracy (4 pts)
- Problem solving approach (3 pts)  
- Communication clarity (2 pts)
- Completeness (1 pt)

Return ONLY valid JSON, no markdown:
{
  "score": <number 0-10>,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "improvements": ["improvement1", "improvement2"],
  "idealAnswer": "concise ideal answer in 2-4 sentences"
}`;

  const text = await chat(prompt);
  return parseJSON(text);
};

exports.generateReport = async ({ category, difficulty, answers, totalQuestions }) => {
  const total = totalQuestions || answers.length;
  const skipped = total - answers.length;

  // Build summary including skipped questions so the AI penalises them
  const summary = answers.map((a, i) =>
    `Q${i + 1}: ${a.questionText}\nScore: ${a.score}/10\nWeaknesses: ${a.weaknesses?.join(', ')}`
  ).join('\n\n');

  const skippedNote = skipped > 0
    ? `\n\nNOTE: The candidate did not attempt ${skipped} of ${total} questions (left unanswered). These should be treated as 0/10 and reflected heavily in the overall score and weaknesses.`
    : '';

  const prompt = `
You are a senior engineering hiring manager. Generate a performance report based on these interview results.

Interview: ${CATEGORY_MAP[category]} — ${difficulty}
Total questions: ${total}
Questions attempted: ${answers.length}
Results:
${summary}${skippedNote}

The overallScore must account for ALL ${total} questions, including unanswered ones (treat each as 0/10).

Return ONLY valid JSON, no markdown:
{
  "overallScore": <weighted average across all ${total} questions 0-10>,
  "technicalScore": <0-10>,
  "communicationScore": <0-10>,
  "strengths": ["top strength 1", "top strength 2", "top strength 3"],
  "weaknesses": ["area to improve 1", "area to improve 2", "area to improve 3"],
  "recommendations": ["actionable recommendation 1", "recommendation 2", "recommendation 3"]
}`;

  const text = await chat(prompt);
  return parseJSON(text);
};