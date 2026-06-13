import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const CATEGORIES = ['all', 'dsa', 'webdev', 'ml', 'cs'];
const CATEGORY_LABELS = { dsa: 'DSA', webdev: 'Web Dev', ml: 'ML', cs: 'CS' };
const CATEGORY_COLORS = {
  dsa:    'bg-indigo-100 text-indigo-700',
  webdev: 'bg-blue-100 text-blue-700',
  ml:     'bg-purple-100 text-purple-700',
  cs:     'bg-green-100 text-green-700',
};

export default function History() {
  const [interviews, setInterviews] = useState([]);
  const [total,   setTotal  ] = useState(0);
  const [filter,  setFilter ] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page,    setPage   ] = useState(0);
  const LIMIT = 10;

  useEffect(() => {
    setLoading(true);
    const params = { limit: LIMIT, skip: page * LIMIT };
    if (filter !== 'all') params.category = filter;
    api.get('/interview/history', { params })
      .then(r => { setInterviews(r.data.interviews); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [filter, page]);

  const handleFilter = f => { setFilter(f); setPage(0); };

  const scoreColor = s => s >= 7 ? 'text-green-600' : s >= 4 ? 'text-yellow-600' : 'text-red-500';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
        <span className="text-sm font-medium text-gray-700">Interview History</span>
        <Link to="/interview/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          + New
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">All Interviews</h1>
          <span className="text-sm text-gray-400">{total} total</span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => handleFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === c
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border text-gray-600 hover:border-indigo-300'
              }`}
            >
              {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : interviews.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500">No interviews found.</p>
            <Link to="/interview/new" className="text-indigo-600 text-sm hover:underline mt-2 block">Start one now</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {interviews.map(iv => (
              <Link
                key={iv._id}
                to={`/feedback/${iv._id}`}
                className="flex items-center justify-between bg-white border rounded-xl p-4 hover:shadow-sm transition"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[iv.category]}`}>
                    {CATEGORY_LABELS[iv.category]}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 capitalize">{iv.difficulty} level</p>
                    <p className="text-xs text-gray-400">
                      {new Date(iv.completedAt || iv.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ScoreBar score={iv.finalScore}/>
                  <span className={`text-lg font-bold ${scoreColor(iv.finalScore)}`}>
                    {iv.finalScore}/10
                  </span>
                  <span className="text-gray-300">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page + 1} of {Math.ceil(total / LIMIT)}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * LIMIT >= total}
              className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ score }) {
  const pct = ((score || 0) / 10) * 100;
  const color = score >= 7 ? 'bg-green-400' : score >= 4 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }}/>
    </div>
  );
}