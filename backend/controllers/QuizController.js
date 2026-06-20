const Quiz      = require('../models/Quiz');
const aiService  = require('../services/aiService');

// POST /api/quiz/create  { category }
exports.createQuiz = async (req, res, next) => {
  try {
    const { category } = req.body;
    const questions = await aiService.generateQuiz({ category });

    const quiz = await Quiz.create({
      userId:   req.user.id,
      category,
      questions,
      status:   'in_progress',
    });

    // Don't leak correctIndex/explanation to the client until after they answer —
    // otherwise a user could read devtools network tab and see every answer upfront.
    const safeQuestions = quiz.questions.map(q => ({
      _id:          q._id,
      questionText: q.questionText,
      options:      q.options,
      difficulty:   q.difficulty,
    }));

    res.status(201).json({ quizId: quiz._id, category: quiz.category, questions: safeQuestions });
  } catch (err) {
    next(err);
  }
};

// POST /api/quiz/:id/answer  { questionId, selectedIndex }
// Records the selected answer. Does NOT reveal correctness — results are
// only shown after the quiz is finished, via /finish.
exports.answerQuestion = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user.id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const { questionId, selectedIndex } = req.body;
    const question = quiz.questions.id(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    question.userAnswerIndex = selectedIndex;
    await quiz.save();

    // Deliberately NOT returning correct/correctIndex/explanation here —
    // results are only revealed on the final report after Finish Quiz,
    // so the answer key can't be read from the Network tab mid-quiz.
    res.json({ recorded: true, questionId, selectedIndex });
  } catch (err) {
    next(err);
  }
};

// POST /api/quiz/:id/finish — scores the quiz based on answers recorded so far
exports.finishQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user.id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const correctCount = quiz.questions.filter(
      q => q.userAnswerIndex !== null && q.userAnswerIndex === q.correctIndex
    ).length;

    quiz.score       = correctCount; // out of 15
    quiz.status       = 'completed';
    quiz.completedAt  = new Date();
    await quiz.save();

    res.json({
      score: correctCount,
      total: quiz.questions.length,
      questions: quiz.questions.map(q => ({
        questionText:    q.questionText,
        options:         q.options,
        correctIndex:    q.correctIndex,
        userAnswerIndex: q.userAnswerIndex,
        explanation:     q.explanation,
        difficulty:      q.difficulty,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/quiz/history
exports.listMyQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ userId: req.user.id, status: 'completed' })
      .sort({ completedAt: -1 })
      .select('category score completedAt');
    res.json({ quizzes });
  } catch (err) {
    next(err);
  }
};