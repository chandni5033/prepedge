import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const TOPICS = [
  { key: 'dsa',    label: 'DSA',               icon: '🧮', color: 'border-indigo-200 hover:bg-indigo-50' },
  { key: 'webdev', label: 'Web Development',    icon: '🌐', color: 'border-blue-200 hover:bg-blue-50' },
  { key: 'ml',     label: 'Machine Learning',  icon: '🧠', color: 'border-purple-200 hover:bg-purple-50' },
  { key: 'cs',     label: 'CS Fundamentals',   icon: '💻', color: 'border-green-200 hover:bg-green-50' },
];

export default function QuizTopicSelect() {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(null);
  const [error, setError] = useState('');

  const handleStart = async (category) => {
    setStarting(category);
    setError('');
    try {
      const { data } = await api.post('/quiz/create', { category });
      sessionStorage.setItem(`quiz_${data.quizId}`, JSON.stringify({
        category: data.category,
        questions: data.questions,
      }));
      navigate(`/practice/${data.quizId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate quiz. Try again.');
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center gap-4">
        <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-700">Practice Quiz</span>
        <Link to="/practice/history" className="ml-auto text-sm text-indigo-600 hover:underline">View History →</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📝 Practice Quiz</h1>
          <p className="text-gray-500 text-sm mt-1">
            Pick a topic — 15 mixed-difficulty multiple-choice questions, generated fresh each time.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-2">{error}</div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {TOPICS.map(topic => (
            <button
              key={topic.key}
              onClick={() => handleStart(topic.key)}
              disabled={starting === topic.key}
              className={`border-2 rounded-xl p-5 bg-white text-left transition-all disabled:opacity-50 ${topic.color}`}
            >
              <div className="text-2xl mb-2">{topic.icon}</div>
              <h3 className="font-semibold text-gray-900">{topic.label}</h3>
              <p className="text-xs text-gray-400 mt-1">15 questions · mixed difficulty</p>
              {starting === topic.key && (
                <p className="text-xs text-indigo-600 mt-2 font-medium">Generating quiz…</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}