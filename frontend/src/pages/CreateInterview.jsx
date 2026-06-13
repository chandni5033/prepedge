import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const CATEGORIES = [
  { value: 'dsa',    label: 'Data Structures & Algorithms', icon: '🧮', desc: 'Arrays, trees, graphs, DP and more' },
  { value: 'webdev', label: 'Web Development',              icon: '🌐', desc: 'HTML, CSS, JS, React, Node.js' },
  { value: 'ml',     label: 'Machine Learning',             icon: '🤖', desc: 'Models, training, evaluation, math' },
  { value: 'cs',     label: 'CS Fundamentals',              icon: '💻', desc: 'OS, Networks, DBMS, System Design' },
];

const DIFFICULTIES = [
  { value: 'easy',   label: 'Easy',   desc: 'Conceptual, beginner-friendly', color: 'border-green-300 bg-green-50 text-green-700' },
  { value: 'medium', label: 'Medium', desc: 'Moderate depth, common in OAs', color: 'border-yellow-300 bg-yellow-50 text-yellow-700' },
  { value: 'hard',   label: 'Hard',   desc: 'Deep dives, senior-level',      color: 'border-red-300 bg-red-50 text-red-700' },
];

const QUESTION_COUNTS = [3, 5, 7, 10];

export default function CreateInterview() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ category: '', difficulty: 'medium', numQuestions: 5 });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleStart = async () => {
    if (!form.category) return setError('Please select a topic.');
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/interview/create', form);
      navigate(`/interview/${data.interview._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create interview.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center gap-4">
        <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-700">New Interview</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Set up your interview</h1>
          <p className="text-gray-500 text-sm mt-1">Choose a topic, difficulty, and how many questions you want.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-2">{error}</div>
        )}

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Topic</label>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setForm(f => ({ ...f, category: c.value }))}
                className={`text-left p-4 border-2 rounded-xl transition-all ${
                  form.category === c.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-indigo-200'
                }`}
              >
                <div className="text-2xl mb-1">{c.icon}</div>
                <p className="font-medium text-gray-800 text-sm">{c.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Difficulty</label>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                onClick={() => setForm(f => ({ ...f, difficulty: d.value }))}
                className={`p-4 border-2 rounded-xl text-center transition-all ${
                  form.difficulty === d.value ? d.color + ' border-current' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-sm">{d.label}</p>
                <p className="text-xs mt-0.5 opacity-70">{d.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Number of questions */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Number of questions</label>
          <div className="flex gap-3">
            {QUESTION_COUNTS.map(n => (
              <button
                key={n}
                onClick={() => setForm(f => ({ ...f, numQuestions: n }))}
                className={`w-14 h-14 rounded-xl border-2 font-semibold text-sm transition-all ${
                  form.numQuestions === n
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Summary + Start */}
        {form.category && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
            📋 {form.numQuestions} {form.difficulty} questions on{' '}
            {CATEGORIES.find(c => c.value === form.category)?.label}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading || !form.category}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating questions with AI…' : 'Start Interview →'}
        </button>
      </div>
    </div>
  );
}