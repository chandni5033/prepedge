import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const VERDICT_STYLE = {
  'Strong Hire':       'bg-green-50 border-green-200 text-green-700',
  'Hire':              'bg-emerald-50 border-emerald-200 text-emerald-700',
  'Needs Improvement': 'bg-yellow-50 border-yellow-200 text-yellow-700',
  'Not Ready':         'bg-red-50 border-red-200 text-red-700',
};

export default function RoleReport() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [error,   setError  ] = useState('');

  useEffect(() => {
    api.get(`/roles/attempts/${attemptId}`)
      .then(r => setAttempt(r.data.attempt))
      .catch(() => setError('Failed to load report.'));
  }, [attemptId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  const report = attempt.combinedReport;

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-sm text-gray-500 mb-3">This loop isn't finished yet.</p>
          <Link to={`/roles/attempts/${attemptId}`} className="text-indigo-600 text-sm font-medium">
            ← Back to round map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center gap-4">
        <Link to="/roles" className="text-gray-400 hover:text-gray-600 text-sm">← Roles</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-700">{attempt.roleName} — Report</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{attempt.roleName} — Final Report</h1>
          <p className="text-gray-500 text-sm mt-1">Combined results across all {attempt.rounds.length} rounds.</p>
        </div>

        {/* Overall score + verdict */}
        <div className="bg-white border rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Overall Score</p>
            <p className="text-4xl font-bold text-gray-900 mt-1">{report.overallScore}<span className="text-lg text-gray-400">/10</span></p>
          </div>
          <span className={`text-sm font-semibold px-4 py-2 rounded-full border ${VERDICT_STYLE[report.verdict] || 'bg-gray-50 border-gray-200 text-gray-600'}`}>
            {report.verdict}
          </span>
        </div>

        {/* Per-round breakdown */}
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Round-by-round breakdown</p>
          <div className="space-y-2">
            {report.perRoundScores.map((r, i) => (
              r.interviewId ? (
                <Link
                  key={i}
                  to={`/feedback/${r.interviewId}`}
                  className="flex items-center justify-between text-sm p-2 -mx-2 rounded-lg hover:bg-gray-50 transition"
                >
                  <span className="text-gray-600">{r.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{r.score}/10</span>
                    <span className="text-gray-300">→</span>
                  </span>
                </Link>
              ) : (
                <div key={i} className="flex items-center justify-between text-sm p-2 -mx-2">
                  <span className="text-gray-600">{r.label}</span>
                  <span className="font-medium text-gray-900">{r.score}/10</span>
                </div>
              )
            ))}
          </div>
          {!report.perRoundScores.some(r => r.interviewId) && (
            <p className="text-xs text-gray-400 mt-3">
              Per-round detail links aren't available for this older report.
            </p>
          )}
        </div>

        {/* Strengths / weaknesses / recommendations */}
        <div className="grid sm:grid-cols-1 gap-4">
          <ReportSection title="✓ Strengths"       items={report.strengths}       color="text-green-700" bg="bg-green-50 border-green-100" />
          <ReportSection title="✗ Areas to improve" items={report.weaknesses}      color="text-red-600"   bg="bg-red-50 border-red-100" />
          <ReportSection title="→ Recommendations"  items={report.recommendations} color="text-amber-700" bg="bg-amber-50 border-amber-100" />
        </div>

        <Link
          to="/roles"
          className="block text-center w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Try another role →
        </Link>
      </div>
    </div>
  );
}

function ReportSection({ title, items, color, bg }) {
  if (!items?.length) return null;
  return (
    <div className={`border rounded-xl p-4 ${bg}`}>
      <p className={`text-sm font-semibold mb-2 ${color}`}>{title}</p>
      <ul className="text-sm text-gray-700 space-y-1">
        {items.map((item, i) => <li key={i}>• {item}</li>)}
      </ul>
    </div>
  );
}