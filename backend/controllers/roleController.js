const Role        = require('../models/Role');
const RoleAttempt = require('../models/RoleAttempt');
const Interview   = require('../models/Interview');
const Question    = require('../models/Question');
const aiService    = require('../services/aiService');

// GET /api/roles — list all active roles
exports.listRoles = async (req, res, next) => {
  try {
    const roles = await Role.find({ active: true }).select('name slug description rounds');
    res.json({ roles });
  } catch (err) {
    next(err);
  }
};

// POST /api/roles/:slug/start — begin (or resume) a role attempt
exports.startRoleAttempt = async (req, res, next) => {
  try {
    const role = await Role.findOne({ slug: req.params.slug, active: true });
    if (!role) return res.status(404).json({ message: 'Role not found' });

    
    let attempt = await RoleAttempt.findOne({
      userId: req.user.id, roleId: role._id, status: 'in_progress',
    });

    if (!attempt) {
      attempt = await RoleAttempt.create({
        userId:   req.user.id,
        roleId:   role._id,
        roleName: role.name,
        rounds: role.rounds
          .sort((a, b) => a.order - b.order)
          .map((r, i) => ({
            order:      r.order,
            label:      r.label,
            category:   r.category,
            difficulty: r.difficulty,
            status:     i === 0 ? 'unlocked' : 'locked', // only round 1 starts unlocked
          })),
      });
    }

    res.status(201).json({ attempt });
  } catch (err) {
    next(err);
  }
};

// GET /api/roles/attempts/:attemptId — get current state of an attempt
exports.getRoleAttempt = async (req, res, next) => {
  try {
    const attempt = await RoleAttempt.findOne({ _id: req.params.attemptId, userId: req.user.id });
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    res.json({ attempt });
  } catch (err) {
    next(err);
  }
};

// GET /api/roles/attempts — list this user's role attempts (history)
exports.listMyAttempts = async (req, res, next) => {
  try {
    const attempts = await RoleAttempt.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('roleName status combinedReport.overallScore rounds startedAt completedAt');
    res.json({ attempts });
  } catch (err) {
    next(err);
  }
};

// POST /api/roles/attempts/:attemptId/rounds/:order/begin

exports.beginRound = async (req, res, next) => {
  try {
    const attempt = await RoleAttempt.findOne({ _id: req.params.attemptId, userId: req.user.id });
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

    const order = Number(req.params.order);
    const round = attempt.rounds.find(r => r.order === order);
    if (!round) return res.status(404).json({ message: 'Round not found' });

    if (round.status === 'locked')
      return res.status(403).json({ message: 'Complete the previous round first' });

    
    if (round.interviewId) {
      const interview = await Interview.findById(round.interviewId).populate('questions');
      return res.json({ interview, questions: interview.questions });
    }

    
    const pastInterviews = await Interview.find({
      userId: req.user.id,
      category: round.category,
      status: 'completed',
    }).select('questions').limit(10);

    const seenQuestionIds = pastInterviews.flatMap(i => i.questions.map(q => q.toString()));
    const seenQuestions = seenQuestionIds.length > 0
      ? await Question.find({ _id: { $in: seenQuestionIds.slice(-30) } }).select('questionText')
      : [];
    const recentTexts = seenQuestions.map(q => q.questionText);

    const rawQuestions = await aiService.generateQuestions({
      category:   round.category,
      difficulty: round.difficulty,
      count:      5,
      previousTexts: recentTexts,
    });

    const savedQuestions = await Question.insertMany(
      rawQuestions.map(q => ({ ...q, category: round.category, source: 'ai_generated' }))
    );

    const interview = await Interview.create({
      userId:     req.user.id,
      category:   round.category,
      difficulty: round.difficulty,
      numQuestions: savedQuestions.length,
      questions:  savedQuestions.map(q => q._id),
      status:     'in_progress',
    });

    round.interviewId = interview._id;
    round.status       = 'in_progress';
    await attempt.save();

    res.status(201).json({ interview, questions: savedQuestions });
  } catch (err) {
    next(err);
  }
};

// POST /api/roles/attempts/:attemptId/rounds/:order/complete

exports.completeRound = async (req, res, next) => {
  try {
    const attempt = await RoleAttempt.findOne({ _id: req.params.attemptId, userId: req.user.id });
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

    const order = Number(req.params.order);
    const round = attempt.rounds.find(r => r.order === order);
    if (!round) return res.status(404).json({ message: 'Round not found' });
    if (!round.interviewId)
      return res.status(400).json({ message: 'Round has not been started yet' });

    const interview = await Interview.findById(round.interviewId);
    if (!interview || interview.status !== 'completed')
      return res.status(400).json({ message: 'Underlying interview is not completed yet' });

    round.status = 'completed';

    
    const next_ = attempt.rounds.find(r => r.order === order + 1);
    if (next_ && next_.status === 'locked') next_.status = 'unlocked';

    await attempt.save();
    res.json({ attempt });
  } catch (err) {
    next(err);
  }
};

// POST /api/roles/attempts/:attemptId/finish

exports.finishRoleAttempt = async (req, res, next) => {
  try {
    const attempt = await RoleAttempt.findOne({ _id: req.params.attemptId, userId: req.user.id });
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

    const incomplete = attempt.rounds.filter(r => r.status !== 'completed');
    if (incomplete.length > 0)
      return res.status(400).json({
        message: `Finish all rounds first. Remaining: ${incomplete.map(r => r.label).join(', ')}`,
      });

    const interviews = await Interview.find({
      _id: { $in: attempt.rounds.map(r => r.interviewId) },
    });

    const perRoundScores = attempt.rounds.map(r => {
      const iv = interviews.find(i => i._id.toString() === r.interviewId.toString());
      return { label: r.label, score: iv?.finalScore ?? 0, interviewId: r.interviewId };
    });

    const overallScore = Number(
      (perRoundScores.reduce((sum, r) => sum + r.score, 0) / perRoundScores.length).toFixed(1)
    );

    
    const allStrengths  = interviews.flatMap(i => i.report?.strengths || []);
    const allWeaknesses = interviews.flatMap(i => i.report?.weaknesses || []);
    const allRecs        = interviews.flatMap(i => i.report?.recommendations || []);

    const verdict =
      overallScore >= 7.5 ? 'Strong Hire' :
      overallScore >= 6   ? 'Hire' :
      overallScore >= 4   ? 'Needs Improvement' :
      'Not Ready';

    attempt.combinedReport = {
      overallScore,
      perRoundScores,
      strengths:       [...new Set(allStrengths)].slice(0, 5),
      weaknesses:      [...new Set(allWeaknesses)].slice(0, 5),
      recommendations: [...new Set(allRecs)].slice(0, 5),
      verdict,
    };
    attempt.status      = 'completed';
    attempt.completedAt = new Date();
    await attempt.save();

    res.json({ attempt });
  } catch (err) {
    next(err);
  }
};