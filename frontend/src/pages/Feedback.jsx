import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import api from '../services/api';

const CATEGORY_LABELS = { dsa: 'DSA', webdev: 'Web Dev', ml: 'ML', cs: 'CS Fundamentals' };

const RESOURCE_MAP = {
  monitor:       { label: 'Learn Monitors',            url: 'https://en.wikipedia.org/wiki/Monitor_(synchronization)' },
  semaphore:     { label: 'Learn Semaphores',          url: 'https://www.geeksforgeeks.org/semaphores-in-process-synchronization/' },
  mutex:         { label: 'Learn Mutex',               url: 'https://www.geeksforgeeks.org/mutex-vs-semaphore/' },
  deadlock:      { label: 'Deadlock Prevention',       url: 'https://www.geeksforgeeks.org/deadlock-prevention/' },
  tcp:           { label: 'TCP/IP Deep Dive',          url: 'https://www.cloudflare.com/learning/ddos/glossary/tcp-ip/' },
  graph:         { label: 'Graph Algorithms',          url: 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/' },
  dp:            { label: 'Dynamic Programming',       url: 'https://www.geeksforgeeks.org/dynamic-programming/' },
  tree:          { label: 'Tree Traversals',           url: 'https://www.geeksforgeeks.org/tree-traversals-inorder-preorder-and-postorder/' },
  sql:           { label: 'SQL Advanced Queries',      url: 'https://www.w3schools.com/sql/sql_advanced.asp' },
  os:            { label: 'Operating Systems',         url: 'https://www.geeksforgeeks.org/operating-systems/' },
  default:       { label: 'GeeksForGeeks Practice',   url: 'https://www.geeksforgeeks.org/' },
};

function getResource(text) {
  const lower = (text || '').toLowerCase();
  for (const [key, val] of Object.entries(RESOURCE_MAP)) {
    if (key !== 'default' && lower.includes(key)) return val;
  }
  return RESOURCE_MAP.default;
}

// ── Sub-score breakdown per question (derived from total score) ────────────
function deriveSubScores(score) {
  const s = score || 0;
  return {
    technical:     Math.min(10, Math.round(s * 1.05)),
    communication: Math.max(0,  Math.round(s * 0.90)),
    depth:         Math.max(0,  Math.round(s * 0.95)),
    completeness:  Math.min(10, Math.round(s * 1.00)),
  };
}

// ── Radar chart data from report ───────────────────────────────────────────
function buildRadarData(report, answers) {
  if (!report && !answers?.length) return [];
  const avgScore = answers?.length
    ? answers.reduce((s, a) => s + (a.score || 0), 0) / answers.length
    : 0;
  return [
    { axis: 'Technical',      value: report?.technicalScore     || Math.round(avgScore * 1.05) },
    { axis: 'Communication',  value: report?.communicationScore || Math.round(avgScore * 0.90) },
    { axis: 'Problem Solving',value: Math.min(10, Math.round(avgScore * 1.00)) },
    { axis: 'Depth',          value: Math.max(0,  Math.round(avgScore * 0.95)) },
    { axis: 'Completeness',   value: Math.min(10, Math.round(avgScore * 1.02)) },
  ];
}

// ── Confidence band from score ─────────────────────────────────────────────
function getConfidence(score) {
  if (score >= 8) return { label: 'High',   color: 'text-green-600 bg-green-50',  pct: 95 };
  if (score >= 6) return { label: 'Medium', color: 'text-yellow-600 bg-yellow-50',pct: 78 };
  return              { label: 'Low',    color: 'text-red-500 bg-red-50',       pct: 60 };
}

// ── Collapsible answer block ───────────────────────────────────────────────
function CollapsibleAnswer({ text }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const preview = text.length > 220 ? text.slice(0, 220) + '…' : text;
  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-3">
      <p className="text-xs font-medium text-gray-400 mb-2">Your Answer</p>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
        {open ? text : preview}
      </p>
      {text.length > 220 && (
        <button
          onClick={() => setOpen(o => !o)}
          className="text-xs text-indigo-500 hover:text-indigo-700 mt-2 font-medium"
        >
          {open ? 'Show less ▲' : 'Show more ▼'}
        </button>
      )}
    </div>
  );
}

// ── Sub-score bar ──────────────────────────────────────────────────────────
function SubScoreBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-32 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value * 10}%` }}/>
      </div>
      <span className="text-xs font-bold text-gray-700 w-8 text-right">{value}/10</span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function Feedback() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const roleAttemptId = searchParams.get('roleAttempt');
  const roundOrder     = searchParams.get('round');

  const [interview,  setInterview ] = useState(null);
  const [prevScore,  setPrevScore ] = useState(null);
  const [loading,    setLoading   ] = useState(true);
  const [expanded,   setExpanded  ] = useState({});
  const [roleAttempt,setRoleAttempt] = useState(null);

  useEffect(() => {
    api.get(`/interview/${id}`)
      .then(async r => {
        setInterview(r.data);
        // fetch previous interview for comparison
        try {
          const hist = await api.get('/interview/history', { params: { limit: 10 } });
          const others = hist.data.interviews.filter(iv => iv._id !== id);
          if (others.length > 0) setPrevScore(others[0].finalScore);
        } catch {}
      })
      .finally(() => setLoading(false));
  }, [id]);

  // If this report is part of a role-based interview loop, fetch the
  // attempt so we know whether to offer "Next round" or "View combined report".
  useEffect(() => {
    if (!roleAttemptId) return;
    api.get(`/roles/attempts/${roleAttemptId}`)
      .then(r => setRoleAttempt(r.data.attempt))
      .catch(() => {});
  }, [roleAttemptId]);

  const toggleQ = (i) => setExpanded(e => ({ ...e, [i]: !e[i] }));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-sm text-gray-400">Loading your report…</p>
      </div>
    </div>
  );
  if (!interview) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Interview not found.</div>
  );

  const { report, answers = [], category, difficulty, finalScore, createdAt, completedAt, numQuestions } = interview;

  const scoreColor  = finalScore >= 7 ? 'text-green-600' : finalScore >= 4 ? 'text-yellow-600' : 'text-red-500';
  const radarData   = buildRadarData(report, answers);
  const confidence  = getConfidence(finalScore);
  const delta       = prevScore !== null ? +(finalScore - prevScore).toFixed(1) : null;

  // Duration
  const duration = createdAt && completedAt
    ? Math.round((new Date(completedAt) - new Date(createdAt)) / 60000)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link
          to={roleAttemptId ? `/roles/attempts/${roleAttemptId}` : '/dashboard'}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {roleAttemptId ? 'Round Map' : 'Dashboard'}
        </Link>
        <span className="text-sm font-semibold text-gray-700">
          {roleAttempt ? `${roleAttempt.roleName} — Round ${roundOrder} Report` : 'Interview Report'}
        </span>
        <Link to="/interview/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          Practice Again
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6 pb-16">

        {/* ── Metadata card ── */}
        <div className="bg-white border rounded-2xl p-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            {[
              { label: 'Domain',     value: CATEGORY_LABELS[category] },
              { label: 'Difficulty', value: difficulty,               cap: true },
              { label: 'Questions',  value: numQuestions || answers.length },
              { label: 'Duration',   value: duration ? `${duration} min` : '—' },
              { label: 'Date',       value: new Date(completedAt || createdAt)
                  .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
            ].map(m => (
              <div key={m.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">{m.label}</p>
                <p className={`text-sm font-semibold text-gray-800 ${m.cap ? 'capitalize' : ''}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Score hero + radar ── */}
        <div className="bg-white border rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">

            {/* Left: score */}
            <div className="text-center shrink-0">
              <p className={`text-7xl font-bold ${scoreColor}`}>
                {finalScore}
                <span className="text-2xl text-gray-300">/10</span>
              </p>
              <p className="text-gray-500 text-sm mt-1">Overall Score</p>

              {/* AI Confidence */}
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full mt-3 ${confidence.color}`}>
                🤖 AI Confidence: {confidence.label} ({confidence.pct}%)
              </span>

              {/* Comparison with previous */}
              {delta !== null && (
                <div className={`mt-3 text-xs font-medium px-3 py-1.5 rounded-xl inline-block
                  ${delta > 0 ? 'bg-green-50 text-green-700' : delta < 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                  {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {delta > 0 ? '+' : ''}{delta} vs prev ({prevScore}/10)
                </div>
              )}
            </div>

            {/* Right: radar */}
            <div className="flex-1 w-full">
              <p className="text-xs text-gray-400 text-center mb-1">Skill Radar</p>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="#e5e7eb"/>
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#6b7280' }}/>
                  <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false}/>
                  <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2}/>
                  <Tooltip formatter={(v) => [`${v}/10`]}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Score bars */}
          {report && (
            <div className="mt-5 pt-5 border-t space-y-2.5">
              <SubScoreBar label="Technical Accuracy" value={report.technicalScore || 0}     color="bg-indigo-400"/>
              <SubScoreBar label="Communication"      value={report.communicationScore || 0} color="bg-purple-400"/>
              <SubScoreBar label="Problem Solving"    value={Math.round((report.technicalScore + report.communicationScore) / 2)} color="bg-blue-400"/>
            </div>
          )}
        </div>

        {/* ── Overall Assessment ── */}
        {report && (
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <span>🧠</span> Overall Assessment
            </h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              {buildAssessment(report, category, finalScore)}
            </p>
          </div>
        )}

        {/* ── Strengths & Weaknesses ── */}
        {report && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
              <h3 className="font-semibold text-green-800 mb-3 text-sm">✓ Strengths</h3>
              <ul className="space-y-2">
                {report.strengths?.map((s, i) => (
                  <li key={i} className="text-sm text-green-700 flex gap-2 items-start">
                    <span className="mt-0.5 shrink-0">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
              <h3 className="font-semibold text-red-800 mb-3 text-sm">✗ Areas to Improve</h3>
              <ul className="space-y-2">
                {report.weaknesses?.map((w, i) => (
                  <li key={i} className="text-sm text-red-700 flex gap-2 items-start">
                    <span className="mt-0.5 shrink-0">•</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Clickable Recommendations ── */}
        {report?.recommendations?.length > 0 && (
          <div className="bg-white border rounded-2xl p-5">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">📚 Study Recommendations</h3>
            <div className="space-y-2">
              {report.recommendations.map((r, i) => {
                const res = getResource(r);
                return (
                  <a key={i} href={res.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 transition group">
                    <span className="text-lg">📚</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-indigo-700 group-hover:underline">{res.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{r}</p>
                    </div>
                    <span className="text-indigo-400 text-xs">→</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Question-wise Breakdown ── */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-4">Question-wise Breakdown</h2>
          <div className="space-y-4">
            {answers.map((a, i) => {
              const sc   = a.score || 0;
              const sub  = deriveSubScores(sc);
              const conf = getConfidence(sc);
              const isOpen = expanded[i];
              const scoreColorClass = sc >= 7 ? 'text-green-600 bg-green-50 border-green-200'
                : sc >= 4 ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
                : 'text-red-500 bg-red-50 border-red-200';

              return (
                <div key={i} className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                  {/* Question header — always visible */}
                  <button
                    onClick={() => toggleQ(i)}
                    className="w-full text-left p-5 flex items-start justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex-1 mr-4">
                      <span className="text-xs font-bold text-indigo-500 mr-2">Q{i + 1}</span>
                      <span className="text-sm font-medium text-gray-800">{a.questionText}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${scoreColorClass}`}>
                        {sc}/10
                      </span>
                      <span className="text-gray-300 text-xs">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isOpen && (
                    <div className="px-5 pb-5 space-y-4 border-t border-gray-50">

                      {/* Sub-score breakdown */}
                      <div className="pt-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Score Breakdown</p>
                        <div className="space-y-2.5">
                          <SubScoreBar label="Technical Accuracy" value={sub.technical}    color="bg-indigo-400"/>
                          <SubScoreBar label="Communication"      value={sub.communication}color="bg-purple-400"/>
                          <SubScoreBar label="Depth"              value={sub.depth}         color="bg-blue-400"/>
                          <SubScoreBar label="Completeness"       value={sub.completeness}  color="bg-teal-400"/>
                        </div>
                        {/* AI confidence per question */}
                        <div className="mt-3 flex items-center gap-2">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${conf.color}`}>
                            🤖 Evaluation Reliability: {conf.label}
                          </span>
                        </div>
                      </div>

                      {/* Your answer — collapsible */}
                      <CollapsibleAnswer text={a.userAnswer}/>

                      {/* Ideal answer */}
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                        <p className="text-xs font-semibold text-indigo-500 mb-1.5">✨ Ideal Answer</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{a.idealAnswer}</p>
                      </div>

                      {/* Missed concepts */}
                      {a.weaknesses?.length > 0 && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                          <p className="text-xs font-semibold text-amber-600 mb-2.5">🔍 Missed Concepts</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {a.weaknesses.map((w, j) => (
                              <div key={j} className="flex items-center gap-1.5 text-xs text-amber-800">
                                <span className="text-red-400">✗</span> {w}
                              </div>
                            ))}
                            {a.strengths?.map((s, j) => (
                              <div key={`s${j}`} className="flex items-center gap-1.5 text-xs text-green-700">
                                <span className="text-green-500">✓</span> {s}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Clickable improvements */}
                      {a.improvements?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            → Improvements
                          </p>
                          <div className="space-y-1.5">
                            {a.improvements.map((imp, j) => {
                              const res = getResource(imp);
                              return (
                                <a key={j} href={res.url} target="_blank" rel="noreferrer"
                                  className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 hover:underline">
                                  <span>📚</span> {imp}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom CTAs ── */}
        {roleAttempt ? (
          <RoleModeCTAs roleAttempt={roleAttempt} roleAttemptId={roleAttemptId} />
        ) : (
          <div className="flex gap-3">
            <Link to="/interview/new"
              className="flex-1 text-center bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 text-sm">
              Start New Interview
            </Link>
            <Link to="/analytics"
              className="flex-1 text-center border border-indigo-200 text-indigo-600 py-3 rounded-xl font-medium hover:bg-indigo-50 text-sm">
              View Analytics
            </Link>
            <Link to="/history"
              className="flex-1 text-center border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 text-sm">
              All Interviews
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}


// ── Role-mode CTA row: next round, or combined report if this was the last one ──
function RoleModeCTAs({ roleAttempt, roleAttemptId }) {
  const navigate = useNavigate();
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState('');

  const nextRound = roleAttempt.rounds.find(r => r.status === 'unlocked');
  const allDone   = roleAttempt.rounds.every(r => r.status === 'completed');

  const handleViewCombinedReport = async () => {
    setFinishing(true);
    setFinishError('');
    try {
      await api.post(`/roles/attempts/${roleAttemptId}/finish`);
      navigate(`/roles/attempts/${roleAttemptId}/report`);
    } catch (err) {
      setFinishError(err.response?.data?.message || 'Failed to generate combined report.');
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="space-y-2">
      {finishError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{finishError}</p>
      )}
      <div className="flex gap-3">
        <Link
          to={`/roles/attempts/${roleAttemptId}`}
          className="flex-1 text-center border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 text-sm"
        >
          ← Round Map
        </Link>
        {allDone ? (
          <button
            onClick={handleViewCombinedReport}
            disabled={finishing}
            className="flex-1 text-center bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 text-sm disabled:opacity-50"
          >
            {finishing ? 'Generating report…' : 'View Combined Report →'}
          </button>
        ) : nextRound ? (
          <Link
            to={`/roles/attempts/${roleAttemptId}`}
            className="flex-1 text-center bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 text-sm"
          >
            Continue to {nextRound.label} →
          </Link>
        ) : null}
      </div>
    </div>
  );
}

// ── Overall assessment paragraph generator ────────────────────────────────
function buildAssessment(report, category, score) {
  const cat   = CATEGORY_LABELS[category] || category;
  const level = score >= 8 ? 'excellent' : score >= 6 ? 'solid' : 'developing';
  const top   = report.strengths?.[0] || 'core concepts';
  const weak  = report.weaknesses?.[0] || 'some advanced areas';
  const rec   = report.recommendations?.[0] || 'continued practice';

  if (level === 'excellent') {
    return `You demonstrated excellent command of ${cat}. Your answers showed strong ${top} and were well-structured throughout. To reach the top percentile, continue refining ${weak}. ${rec} will help solidify your preparation.`;
  }
  if (level === 'solid') {
    return `You showed a solid understanding of ${cat} with particularly good ${top}. There is room to improve in ${weak}. Focusing on ${rec} before your next session will make a measurable difference.`;
  }
  return `You are building your foundation in ${cat}. You displayed some understanding of ${top}, but ${weak} needs more attention. Prioritise ${rec} and attempt more practice interviews to build confidence.`;
}



