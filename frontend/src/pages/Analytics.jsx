import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../services/api';

const CATEGORY_LABELS = { dsa: 'DSA', webdev: 'Web Dev', ml: 'ML', cs: 'CS Fundamentals', hr: 'HR / Behavioral' };
const CATEGORY_COLORS_MAP = {
  dsa:    '#6366f1',
  webdev: '#3b82f6',
  ml:     '#a855f7',
  cs:     '#10b981',
  hr:     '#ec4899',
};
const BAR_COLORS = ['#6366f1', '#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ef4444'];

// ── Custom tooltip for line chart ──────────────────────────────────────────
const LineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-gray-500 mb-0.5">{label}</p>
      <p className="font-bold text-indigo-600">{payload[0].value}/10</p>
      <p className="text-gray-400">{payload[0].payload.category?.toUpperCase()}</p>
    </div>
  );
};

const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-gray-500 mb-0.5">{label}</p>
      <p className="font-bold text-indigo-600">{payload[0].value} interviews</p>
    </div>
  );
};

// ── Empty state placeholder ────────────────────────────────────────────────
function EmptyChart({ message }) {
  return (
    <div className="flex items-center justify-center h-40 bg-gray-50 rounded-xl border border-dashed border-gray-200">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, gradient }) {
  return (
    <div className={`rounded-2xl p-5 border shadow-sm ${gradient || 'bg-white'}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function Analytics() {
  const [dash,     setDash    ] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading,  setLoading ] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/analytics/progress'),
    ]).then(([d, p]) => {
      setDash(d.data);
      setProgress(p.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Loading analytics…
    </div>
  );

  if (!dash || dash.empty) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <div className="text-5xl">📊</div>
      <h2 className="text-lg font-semibold text-gray-700">No data yet</h2>
      <p className="text-sm text-gray-400">Complete your first interview to see analytics.</p>
      <Link to="/interview/new" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700">
        Start Interview
      </Link>
    </div>
  );

  // ── Derived stats ──────────────────────────────────────────────────────
  const timeline    = progress?.scoreTimeline || [];
  const weekly      = progress?.weeklyGrowth  || [];
  const catStats    = dash.categoryStats       || [];

  const totalQuestions = dash.recentInterviews?.reduce((a, iv) => a + (iv.numQuestions || 5), 0) || 0;

  const bestCat  = catStats.length ? [...catStats].sort((a, b) => b.avgScore - a.avgScore)[0] : null;
  const worstCat = catStats.length ? [...catStats].sort((a, b) => a.avgScore - b.avgScore)[0] : null;

  // Improvement trend: last vs previous interview score
  const trend = timeline.length >= 2
    ? +(timeline[timeline.length - 1].score - timeline[timeline.length - 2].score).toFixed(1)
    : null;

  // Last 8 weeks for weekly chart
  const last8Weeks = weekly.slice(-8);

  // AI insights derived from data
  const insights = generateInsights(catStats, timeline, trend);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
        <span className="text-sm font-semibold text-gray-800">Analytics</span>
        <Link to="/interview/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          + New Interview
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard icon="🎤" label="Total Interviews"     value={dash.totalInterviews} />
          <KpiCard icon="📈" label="Average Score"        value={`${dash.avgScore}/10`} />
          <KpiCard icon="🏆" label="Best Score"           value={`${dash.bestScore}/10`} gradient="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100"/>
          <KpiCard icon="✅" label="Questions Answered"   value={dash.totalQuestions || totalQuestions}
            sub="across all interviews"/>
        </div>

        {/* ── Extra stat cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bestCat && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
              <p className="text-xs text-green-600 font-medium mb-1">🥇 Highest Scoring Topic</p>
              <p className="text-xl font-bold text-green-800">{CATEGORY_LABELS[bestCat.category]}</p>
              <p className="text-sm text-green-600 mt-0.5">{bestCat.avgScore}/10 avg</p>
            </div>
          )}
          {worstCat && catStats.length > 1 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <p className="text-xs text-amber-600 font-medium mb-1">📌 Needs Improvement</p>
              <p className="text-xl font-bold text-amber-800">{CATEGORY_LABELS[worstCat.category]}</p>
              <p className="text-sm text-amber-600 mt-0.5">{worstCat.avgScore}/10 avg</p>
            </div>
          )}
          {trend !== null && (
            <div className={`rounded-2xl p-5 border ${trend >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
              <p className={`text-xs font-medium mb-1 ${trend >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                {trend >= 0 ? '📈' : '📉'} Improvement Trend
              </p>
              <p className={`text-xl font-bold ${trend >= 0 ? 'text-blue-800' : 'text-red-700'}`}>
                {trend >= 0 ? '+' : ''}{trend} pts
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Last: {timeline[timeline.length - 1]?.score}/10 &nbsp;·&nbsp;
                Prev: {timeline[timeline.length - 2]?.score}/10
              </p>
            </div>
          )}
        </div>

        {/* ── Score Over Time ── */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">Score Over Time</h3>
              <p className="text-xs text-gray-400 mt-0.5">Your score trend across all interviews</p>
            </div>
          </div>
          {timeline.length < 2 ? (
            <EmptyChart message="Complete at least 2 interviews to see your score trend." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timeline} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)}/>
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }}/>
                <Tooltip content={<LineTooltip/>}/>
                <ReferenceLine y={dash.avgScore} stroke="#e0e7ff" strokeDasharray="4 4"
                  label={{ value: 'avg', position: 'right', fontSize: 10, fill: '#a5b4fc' }}/>
                <Line
                  type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5}
                  dot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Performance by Topic ── */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800">Performance by Topic</h3>
            <p className="text-xs text-gray-400 mt-0.5">Average score per category</p>
          </div>
          {catStats.length === 0 ? (
            <EmptyChart message="No topic data yet." />
          ) : (
            <div className="space-y-3">
              {[...catStats].sort((a, b) => b.avgScore - a.avgScore).map((c, i) => (
                <div key={c.category} className="flex items-center gap-4">
                  <span className="text-xs font-medium text-gray-500 w-24 shrink-0">
                    {CATEGORY_LABELS[c.category]}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(c.avgScore / 10) * 100}%`,
                        backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-12 text-right">
                    {c.avgScore}/10
                  </span>
                  <span className="text-xs text-gray-400 w-16 text-right">
                    {c.count} interview{c.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Weekly Interview Count ── */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800">Weekly Interview Count</h3>
            <p className="text-xs text-gray-400 mt-0.5">Your consistency over the last 8 weeks</p>
          </div>
          {last8Weeks.length === 0 ? (
            <EmptyChart message="No weekly data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={last8Weeks} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="week" tick={{ fontSize: 10 }} tickFormatter={d => `W${d.slice(5, 7)}`}/>
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }}/>
                <Tooltip content={<BarTooltip/>}/>
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {last8Weeks.map((_, i) => (
                    <Cell key={i} fill={i === last8Weeks.length - 1 ? '#6366f1' : '#c7d2fe'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Recent Interviews Table ── */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">Recent Interviews</h3>
              <p className="text-xs text-gray-400 mt-0.5">Your latest sessions at a glance</p>
            </div>
            <Link to="/history" className="text-xs text-indigo-600 hover:underline">View all →</Link>
          </div>
          {!dash.recentInterviews?.length ? (
            <EmptyChart message="No interviews yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b">
                    <th className="text-left pb-3 font-medium">Date</th>
                    <th className="text-left pb-3 font-medium">Topic</th>
                    <th className="text-left pb-3 font-medium">Difficulty</th>
                    <th className="text-left pb-3 font-medium">Score</th>
                    <th className="text-left pb-3 font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dash.recentInterviews.map(iv => {
                    const score = iv.finalScore || 0;
                    const scoreColor = score >= 7 ? 'text-green-600' : score >= 4 ? 'text-yellow-600' : 'text-red-500';
                    const barColor  = score >= 7 ? 'bg-green-400' : score >= 4 ? 'bg-yellow-400' : 'bg-red-400';
                    return (
                      <tr key={iv._id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 text-gray-500">
                          {new Date(iv.completedAt || iv.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short',
                          })}
                        </td>
                        <td className="py-3">
                          <span className="font-medium text-gray-800">
                            {CATEGORY_LABELS[iv.category]}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium
                            ${iv.difficulty === 'easy'   ? 'bg-green-100 text-green-700'  : ''}
                            ${iv.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700': ''}
                            ${iv.difficulty === 'hard'   ? 'bg-red-100 text-red-600'      : ''}
                          `}>
                            {iv.difficulty}
                          </span>
                        </td>
                        <td className={`py-3 font-bold ${scoreColor}`}>{score}/10</td>
                        <td className="py-3 w-28">
                          <div className="bg-gray-100 rounded-full h-1.5 w-24">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score * 10}%` }}/>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── AI Insights ── */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🤖</span>
            <h3 className="font-semibold text-white">AI Insights</h3>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Powered by AI</span>
          </div>
          {insights.length === 0 ? (
            <p className="text-indigo-200 text-sm">Complete more interviews to unlock personalized AI insights.</p>
          ) : (
            <ul className="space-y-2.5">
              {insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-indigo-100">
                  <span className="mt-0.5 shrink-0">{insight.icon}</span>
                  <span>{insight.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Insight generator ──────────────────────────────────────────────────────
function generateInsights(catStats, timeline, trend) {
  const insights = [];
  if (!catStats.length && !timeline.length) return insights;

  const sorted = [...catStats].sort((a, b) => b.avgScore - a.avgScore);

  if (sorted.length > 0) {
    const best = sorted[0];
    insights.push({
      icon: '💪',
      text: `You're strongest in ${CATEGORY_LABELS[best.category]} with an average of ${best.avgScore}/10. Keep building on this advantage.`,
    });
  }

  if (sorted.length > 1) {
    const worst = sorted[sorted.length - 1];
    insights.push({
      icon: '🎯',
      text: `${CATEGORY_LABELS[worst.category]} needs attention (avg ${worst.avgScore}/10). Try 2-3 focused practice sessions this week.`,
    });
  }

  if (trend !== null) {
    if (trend > 0) {
      insights.push({
        icon: '📈',
        text: `Great momentum! Your score improved by ${trend} points since your last interview. Consistency is key.`,
      });
    } else if (trend < 0) {
      insights.push({
        icon: '⚠️',
        text: `Your score dipped by ${Math.abs(trend)} points. Review feedback from your last session and revisit weak areas.`,
      });
    } else {
      insights.push({
        icon: '➡️',
        text: `Your score is steady. Challenge yourself with a harder difficulty to push further.`,
      });
    }
  }

  if (timeline.length > 0) {
    const avg = timeline.reduce((s, t) => s + t.score, 0) / timeline.length;
    insights.push({
      icon: '📊',
      text: `Your average response quality is ${avg.toFixed(1)}/10 across ${timeline.length} interview${timeline.length !== 1 ? 's' : ''}. Aim for 8+ to be placement-ready.`,
    });
  }

  const totalInterviews = catStats.reduce((s, c) => s + c.count, 0);
  if (totalInterviews < 5) {
    insights.push({
      icon: '🚀',
      text: `You've completed ${totalInterviews} interview${totalInterviews !== 1 ? 's' : ''}. Try to do at least 3 per week before placement season.`,
    });
  }

  return insights;
}