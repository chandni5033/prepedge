const Interview = require('../models/Interview');

exports.getDashboard = async (req, res) => {
  const uid = req.user.id;
  const interviews = await Interview.find({ userId: uid, status: 'completed' })
    .sort({ completedAt: -1 });

  if (!interviews.length) return res.json({ empty: true });

  const scores  = interviews.map(i => i.finalScore).filter(Boolean);
  const avgScore= scores.reduce((a, b) => a + b, 0) / scores.length;
  const totalQuestions = interviews.reduce((sum, iv) => sum + (iv.numQuestions || 5), 0);
  const best    = Math.max(...scores);

  // Category breakdown
  const byCategory = {};
  for (const iv of interviews) {
    if (!byCategory[iv.category]) byCategory[iv.category] = { count: 0, totalScore: 0 };
    byCategory[iv.category].count++;
    byCategory[iv.category].totalScore += iv.finalScore || 0;
  }
  const categoryStats = Object.entries(byCategory).map(([cat, v]) => ({
    category: cat, avgScore: +(v.totalScore / v.count).toFixed(1), count: v.count,
  }));

  res.json({
    totalInterviews: interviews.length,
    avgScore:        +avgScore.toFixed(1),
    bestScore:       best,
    totalQuestions,
    recentInterviews:interviews.slice(0, 5),
    categoryStats,
  });
};

exports.getProgress = async (req, res) => {
  const uid = req.user.id;
  const interviews = await Interview.find({ userId: uid, status: 'completed' })
    .sort({ completedAt: 1 })
    .select('finalScore category completedAt');

  // Build score-over-time series
  const scoreTimeline = interviews.map(i => ({
    date:     i.completedAt.toISOString().slice(0, 10),
    score:    i.finalScore,
    category: i.category,
  }));

  // Weekly aggregation
  const weeklyMap = {};
  for (const item of scoreTimeline) {
    const week = getWeekKey(new Date(item.date));
    if (!weeklyMap[week]) weeklyMap[week] = { scores: [], count: 0 };
    weeklyMap[week].scores.push(item.score);
    weeklyMap[week].count++;
  }
  const weeklyGrowth = Object.entries(weeklyMap).map(([week, v]) => ({
    week,
    avgScore: +(v.scores.reduce((a,b) => a+b, 0) / v.scores.length).toFixed(1),
    count:    v.count,
  }));

  res.json({ scoreTimeline, weeklyGrowth });
};

function getWeekKey(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}