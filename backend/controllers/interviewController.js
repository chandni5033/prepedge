const Interview = require('../models/Interview');
const Question  = require('../models/Question');
const aiService = require('../services/aiService');

exports.createInterview = async (req, res) => {
  const { category, difficulty, numQuestions = 5, mode = 'text' } = req.body;

  
  const pastInterviews = await Interview.find({
    userId: req.user.id,
    category,           
    status: 'completed',
  }).select('questions').limit(10);

  const seenQuestionIds = pastInterviews.flatMap(i => i.questions.map(q => q.toString()));
  const seenQuestions = seenQuestionIds.length > 0
    ? await Question.find({ _id: { $in: seenQuestionIds.slice(-30) } }).select('questionText')
    : [];
  const recentTexts = seenQuestions.map(q => q.questionText);

  // Generate questions via AI — pass previous question texts so LLM can avoid repeats
  const rawQuestions = await aiService.generateQuestions({
    category, difficulty, count: numQuestions, previousTexts: recentTexts,
  });

  // Save questions to DB
  const savedQuestions = await Question.insertMany(
    rawQuestions.map(q => ({ ...q, category, source: 'ai_generated' }))
  );

  // Create interview document
  const interview = await Interview.create({
    userId:       req.user.id,
    category, difficulty, mode, numQuestions,
    questions:    savedQuestions.map(q => q._id),
    status:       'in_progress',
  });

  res.status(201).json({ interview, questions: savedQuestions });
};

exports.submitAnswer = async (req, res) => {
  const { interviewId, questionId, questionText, userAnswer } = req.body;
  const interview = await Interview.findOne({ _id: interviewId, userId: req.user.id });
  if (!interview) return res.status(404).json({ message: 'Interview not found' });
  if (interview.status === 'completed')
    return res.status(400).json({ message: 'Interview already completed' });

  // Evaluate with AI
  const feedback = await aiService.evaluateAnswer({
    questionText, userAnswer,
    category:   interview.category,
    difficulty: interview.difficulty,
  });

  // Upsert answer (allow re-submission)
  const idx = interview.answers.findIndex(a => a.questionId?.toString() === questionId);
  const answerDoc = { questionId, questionText, userAnswer, ...feedback, evaluatedAt: new Date() };
  if (idx >= 0) interview.answers[idx] = answerDoc;
  else          interview.answers.push(answerDoc);

  await interview.save();
  res.json({ feedback });
};

exports.finishInterview = async (req, res) => {
  const { interviewId } = req.body;
  const interview = await Interview.findOne({ _id: interviewId, userId: req.user.id });
  if (!interview) return res.status(404).json({ message: 'Not found' });

  // Generate final report
  const report = await aiService.generateReport({
    category:       interview.category,
    difficulty:     interview.difficulty,
    answers:        interview.answers,
    totalQuestions: interview.numQuestions,
  });

  const finalScore = report.overallScore;

  interview.status      = 'completed';
  interview.finalScore  = finalScore;
  interview.report      = report;
  interview.completedAt = new Date();
  await interview.save();

  res.json({ report, finalScore, interview });
};

exports.getHistory = async (req, res) => {
  const { category, limit = 20, skip = 0 } = req.query;
  const filter = { userId: req.user.id, status: 'completed' };
  if (category) filter.category = category;

  const interviews = await Interview.find(filter)
    .sort({ completedAt: -1 })
    .limit(+limit).skip(+skip)
    .select('category difficulty finalScore report.overallScore createdAt completedAt');

  const total = await Interview.countDocuments(filter);
  res.json({ interviews, total });
};

exports.getById = async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, userId: req.user.id })
    .populate('questions');
  if (!interview) return res.status(404).json({ message: 'Not found' });
  res.json(interview);
};