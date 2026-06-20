import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const CATEGORY_LABELS = { dsa: 'DSA', webdev: 'Web Development', ml: 'Machine Learning', cs: 'CS Fundamentals' };
const CATEGORY_COLORS = {
  dsa:    'bg-indigo-100 text-indigo-700',
  webdev: 'bg-blue-100 text-blue-700',
  ml:     'bg-purple-100 text-purple-700',
  cs:     'bg-green-100 text-green-700',
};
const SOURCE_ICON = {
  'GeeksforGeeks':  '📗',
  'MDN Web Docs':   '📘',
  'React (official)': '⚛️',
};

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading,   setLoading  ] = useState(true);
  const [filter,    setFilter   ] = useState('all');

  useEffect(() => {
    api.get('/resources')
      .then(r => setResources(r.data.resources))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', 'dsa', 'webdev', 'ml', 'cs'];
  const filtered = filter === 'all' ? resources : resources.filter(r => r.category === filter);

  // Group by category for display
  const grouped = filtered.reduce((acc, r) => {
    (acc[r.category] ||= []).push(r);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center gap-4">
        <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-700">Learning Resources</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📚 Learning Resources</h1>
          <p className="text-gray-500 text-sm mt-1">
            Curated links to trusted references — GeeksforGeeks, MDN, and official docs.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${
                filter === c
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}
            >
              {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading resources…</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="bg-white border rounded-xl p-5">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[category]}`}>
                  {CATEGORY_LABELS[category]}
                </span>
                <div className="mt-3 space-y-2">
                  {items.map(r => (
                    <a
                      key={r._id}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 hover:border-indigo-200 transition group"
                    >
                      <span className="text-lg mt-0.5">{SOURCE_ICON[r.source] || '🔗'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-700">{r.title}</p>
                        {r.description && <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>}
                        <p className="text-xs text-gray-400 mt-1">{r.source}</p>
                      </div>
                      <span className="text-gray-300 text-sm mt-1">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}