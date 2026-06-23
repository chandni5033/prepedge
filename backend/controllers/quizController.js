const Quiz      = require('../models/Quiz');
const aiService  = require('../services/aiService');

// POST /api/quiz/create  { category }
exports.createQuiz = async (req, res, next) => {
  try {
    const { category } = req.body;

    
    const pastQuizzes = await Quiz.find({
      userId: req.user.id,
      category,
      status: 'completed',
    }).select('questions').limit(5);

    const recentTexts = pastQuizzes
      .flatMap(q => q.questions.map(qq => qq.questionText))
      .slice(-30);

    const questions = await aiService.generateQuiz({ category, previousTexts: recentTexts });

    const quiz = await Quiz.create({
      userId:   req.user.id,
      category,
      questions,
      status:   'in_progress',
    });

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
exports.answerQuestion = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user.id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const { questionId, selectedIndex } = req.body;
    const question = quiz.questions.id(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    question.userAnswerIndex = selectedIndex;
    await quiz.save();

    res.json({ recorded: true, questionId, selectedIndex });
  } catch (err) {
    next(err);
  }
};

// POST /api/quiz/:id/finish
exports.finishQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user.id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const correctCount = quiz.questions.filter(
      q => q.userAnswerIndex !== null && q.userAnswerIndex === q.correctIndex
    ).length;

    quiz.score       = correctCount;
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