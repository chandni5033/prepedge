import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const LETTERS = ['A', 'B', 'C', 'D'];
const SECONDS_PER_QUESTION = 30;

const CATEGORY_LABELS = { dsa: 'DSA', webdev: 'Web Development', ml: 'Machine Learning', cs: 'CS Fundamentals' };
const DIFFICULTY_STYLE = {
  easy:   'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard:   'bg-red-100 text-red-700',
};

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function QuizSession() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quizMeta, setQuizMeta] = useState(null);
  const [current,  setCurrent ] = useState(0);
  // answers: questionId -> selectedIndex (purely local + auto-saved, no correctness known yet)
  const [answers,  setAnswers ] = useState({});
  const [saving,   setSaving  ] = useState(false);
  const [finishing,setFinishing] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);

  const totalBudget = SECONDS_PER_QUESTION * 15; // 7.5 min for the whole quiz
  const [secondsLeft, setSecondsLeft] = useState(totalBudget);
  const timerRef = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`quiz_${id}`);
    if (stored) setQuizMeta(JSON.parse(stored));
  }, [id]);

  useEffect(() => {
    if (!quizMeta) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [quizMeta]);

  if (!quizMeta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-sm text-gray-500 mb-3">This quiz session couldn't be found (maybe the page was reloaded).</p>
          <Link to="/practice" className="text-indigo-600 text-sm font-medium">← Start a new quiz</Link>
        </div>
      </div>
    );
  }

  const questions = quizMeta.questions;
  const q = questions[current];
  const selected = answers[q._id] ?? null;
  const answeredCount = Object.keys(answers).length;

  const timerColor =
    secondsLeft === 0   ? 'text-red-600 bg-red-50 border-red-200' :
    secondsLeft <= 60   ? 'text-red-500 bg-red-50 border-red-100' :
    secondsLeft <= 180  ? 'text-yellow-600 bg-yellow-50 border-yellow-100' :
    'text-gray-600 bg-gray-50 border-gray-200';

  const goToQuestion = (index) => setCurrent(index);

  // Selecting an option immediately auto-saves it — no separate submit click.
  // Re-selecting on an already-answered question just overwrites the saved choice.
  const handleSelect = async (index) => {
    setAnswers(prev => ({ ...prev, [q._id]: index })); // optimistic update
    setSaving(true);
    try {
      await api.post(`/quiz/${id}/answer`, {
        questionId: q._id,
        selectedIndex: index,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      await api.post(`/quiz/${id}/finish`);
      sessionStorage.removeItem(`quiz_${id}`);
      navigate(`/practice/${id}/results`);
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/practice" className="text-gray-400 hover:text-gray-600 text-sm">← Exit Quiz</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-700">{CATEGORY_LABELS[quizMeta.category]} Quiz</span>
        </div>
        <span className={`flex items-center gap-1.5 text-sm font-mono font-bold px-3 py-1.5 rounded-full border ${timerColor}`}>
          ⏱ {secondsLeft === 0 ? "Time's up" : formatTime(secondsLeft)}
        </span>
      </nav>

      <div className="max-w-5xl mx-auto p-6 grid grid-cols-[220px_1fr] gap-6">

        {/* ── Left panel: question grid ── */}
        <div className="bg-white border rounded-2xl p-4 h-fit sticky top-6">
          <p className="text-xs font-semibold text-gray-500 mb-3">
            {answeredCount}/{questions.length} answered
          </p>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((qq, i) => {
              const isAnswered = answers[qq._id] !== undefined;
              const isCurrent  = i === current;
              let style = isAnswered
                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200';
              if (isCurrent) style += ' ring-2 ring-indigo-500 ring-offset-1';

              return (
                <button
                  key={qq._id}
                  onClick={() => goToQuestion(i)}
                  className={`aspect-square rounded-lg text-xs font-semibold transition-all ${style}`}
                  title={`Question ${i + 1}${isAnswered ? ' — answered' : ' — unanswered'}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t space-y-1.5 text-xs text-gray-500">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gray-100"/> Unanswered</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-indigo-100"/> Answered</div>
          </div>

          <button
            onClick={() => setConfirmFinish(true)}
            className="mt-4 w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700"
          >
            Submit Quiz →
          </button>
          <p className="text-[11px] text-gray-400 text-center mt-2">
            Results revealed after submission
          </p>
        </div>

        {/* ── Right panel: current question ── */}
        <div className="space-y-5">
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">Question {current + 1} of {questions.length}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DIFFICULTY_STYLE[q.difficulty]}`}>
                {q.difficulty?.toUpperCase()}
              </span>
            </div>
            <h2 className="text-base font-medium text-gray-900 leading-relaxed">{q.questionText}</h2>
          </div>

          {/* Lettered options — click immediately saves, no separate submit */}
          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              const isSelected = i === selected;
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`w-full flex items-center gap-3 text-left border-2 rounded-xl p-4 text-sm transition-colors ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                  }`}
                >
                  <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-colors ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {LETTERS[i]}
                  </span>
                  <span className="text-gray-800">{opt}</span>
                  {isSelected && <span className="ml-auto text-indigo-600 text-xs font-medium">{saving ? 'Saving…' : 'Selected'}</span>}
                </button>
              );
            })}
          </div>

          {/* Prev / Next only — no per-question submit */}
          <div className="flex gap-3">
            <button
              onClick={() => goToQuestion(Math.max(0, current - 1))}
              disabled={current === 0}
              className="px-4 py-3 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              onClick={() => goToQuestion(Math.min(questions.length - 1, current + 1))}
              disabled={current === questions.length - 1}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              Next Question →
            </button>
          </div>
        </div>
      </div>

      {/* ── Confirm submit dialog ── */}
      {confirmFinish && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Submit quiz?</h3>
            <p className="text-sm text-gray-600">
              You've answered <span className="font-medium text-indigo-600">{answeredCount}</span> of {questions.length} questions.
              {answeredCount < questions.length && ' Unanswered questions will be marked incorrect.'}
              {' '}This can't be undone.
            </p>
            <div className="space-y-2">
              <button
                onClick={handleFinish}
                disabled={finishing}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50"
              >
                {finishing ? 'Submitting…' : 'Yes, submit quiz'}
              </button>
              <button
                onClick={() => setConfirmFinish(false)}
                className="w-full text-gray-500 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Keep working
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}