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

export default function QuizHistory() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState('');

  useEffect(() => {
    api.get('/quiz/history')
      .then(r => setQuizzes(r.data.quizzes))
      .catch(() => setError('Failed to load quiz history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center gap-4">
        <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-700">Quiz History</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📝 Quiz History</h1>
            <p className="text-gray-500 text-sm mt-1">Your past practice quiz attempts.</p>
          </div>
          <Link
            to="/practice"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            + New Quiz
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-2">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : quizzes.length === 0 ? (
          <div className="bg-white border rounded-xl p-16 text-center">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">No quizzes yet</h2>
            <p className="text-gray-400 text-sm mb-6">Take your first practice quiz to see your history here.</p>
            <Link
              to="/practice"
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700"
            >
              Start a Quiz
            </Link>
          </div>
        ) : (
          <div className="bg-white border rounded-xl divide-y">
            {quizzes.map(quiz => {
              const percent = Math.round((quiz.score / 15) * 100);
              const scoreColor =
                percent >= 80 ? 'text-green-600' :
                percent >= 50 ? 'text-indigo-600' :
                'text-red-500';

              return (
                <Link
                  key={quiz._id}
                  to={`/practice/${quiz._id}/results`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[quiz.category]}`}>
                      {CATEGORY_LABELS[quiz.category]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(quiz.completedAt).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${scoreColor}`}>
                      {quiz.score}/15
                    </span>
                    <span className="text-gray-300 text-sm">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}