import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CATEGORY_LABELS = { dsa: 'DSA', webdev: 'Web Dev', ml: 'ML', cs: 'CS' };
const CATEGORY_COLORS = {
  dsa:    'bg-indigo-100 text-indigo-700',
  webdev: 'bg-blue-100 text-blue-700',
  ml:     'bg-purple-100 text-purple-700',
  cs:     'bg-green-100 text-green-700',
};

export default function Dashboard() {
  const { user }  = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Loading dashboard…</div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <span className="text-lg font-bold text-indigo-600">InterviewForge</span>
        <div className="flex items-center gap-4">
          <Link to="/analytics" className="text-sm text-gray-500 hover:text-gray-700">Analytics</Link>
          <Link to="/history"   className="text-sm text-gray-500 hover:text-gray-700">History</Link>
          <Link to="/profile"   className="text-sm text-gray-500 hover:text-gray-700">Profile</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-gray-500 text-sm mt-0.5">Ready for today's interview practice?</p>
          </div>
          <Link
            to="/interview/new"
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700"
          >
            + New Interview
          </Link>
        </div>

        {/* KPI Cards */}
        {data && !data.empty ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              <KpiCard label="Total interviews" value={data.totalInterviews} />
              <KpiCard label="Average score"    value={`${data.avgScore}/10`} />
              <KpiCard label="Best score"       value={`${data.bestScore}/10`} highlight />
            </div>

            {/* Category performance */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Performance by topic</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data.categoryStats?.map(c => (
                  <div key={c.category} className="border rounded-lg p-4 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[c.category]}`}>
                      {CATEGORY_LABELS[c.category]}
                    </span>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{c.avgScore}</p>
                    <p className="text-xs text-gray-400">avg / 10</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.count} interview{c.count !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent interviews */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Recent interviews</h2>
                <Link to="/history" className="text-sm text-indigo-600 hover:underline">View all</Link>
              </div>
              <div className="space-y-3">
                {data.recentInterviews?.map(iv => (
                  <Link
                    key={iv._id}
                    to={`/feedback/${iv._id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[iv.category]}`}>
                        {CATEGORY_LABELS[iv.category]}
                      </span>
                      <span className="text-sm text-gray-600 capitalize">{iv.difficulty}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(iv.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-indigo-600">
                      {iv.finalScore}/10
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="bg-white rounded-xl border p-16 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">No interviews yet</h2>
            <p className="text-gray-400 text-sm mb-6">Start your first mock interview to see your stats here.</p>
            <Link
              to="/interview/new"
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700"
            >
              Start First Interview
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, highlight }) {
  return (
    <div className={`rounded-xl p-5 border ${highlight ? 'bg-indigo-50 border-indigo-100' : 'bg-white'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-indigo-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}