import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function QuizResults() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [error,  setError ] = useState('');

  useEffect(() => {
    // Re-finishing is idempotent on the backend (just re-saves the same state),
    // so calling it again here is safe even if QuizSession already called it —
    // this lets the results page work standalone too (e.g. on refresh).
    api.post(`/quiz/${id}/finish`)
      .then(r => setResult(r.data))
      .catch(() => setError('Could not load quiz results.'));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading results…</p>
      </div>
    );
  }

  const percent = Math.round((result.score / result.total) * 100);
  const verdict =
    percent >= 80 ? { label: 'Excellent!', color: 'text-green-700 bg-green-50 border-green-200' } :
    percent >= 60 ? { label: 'Good effort', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' } :
    percent >= 40 ? { label: 'Keep practicing', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' } :
    { label: 'Needs more review', color: 'text-red-700 bg-red-50 border-red-200' };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center gap-4">
        <Link to="/practice" className="text-gray-400 hover:text-gray-600 text-sm">← Practice</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-700">Quiz Results</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        {/* Score card */}
        <div className="bg-white border rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Final Score</p>
            <p className="text-4xl font-bold text-gray-900 mt-1">
              {result.score}<span className="text-lg text-gray-400">/{result.total}</span>
            </p>
          </div>
          <span className={`text-sm font-semibold px-4 py-2 rounded-full border ${verdict.color}`}>
            {verdict.label}
          </span>
        </div>

        {/* Question review */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Question Review</h2>
          {result.questions.map((q, i) => {
            const wasAnswered = q.userAnswerIndex !== null;
            const wasCorrect  = wasAnswered && q.userAnswerIndex === q.correctIndex;
            return (
              <div key={i} className="bg-white border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-gray-800">{i + 1}. {q.questionText}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                    wasCorrect ? 'bg-green-100 text-green-700' :
                    wasAnswered ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {wasCorrect ? '✓ Correct' : wasAnswered ? '✗ Incorrect' : 'Skipped'}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {q.options.map((opt, oi) => (
                    <p
                      key={oi}
                      className={`text-xs px-2 py-1 rounded ${
                        oi === q.correctIndex ? 'bg-green-50 text-green-700 font-medium' :
                        oi === q.userAnswerIndex ? 'bg-red-50 text-red-700' :
                        'text-gray-500'
                      }`}
                    >
                      {opt}
                    </p>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">{q.explanation}</p>
              </div>
            );
          })}
        </div>

        <Link
          to="/practice"
          className="block text-center w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Try Another Quiz →
        </Link>
      </div>
    </div>
  );
}