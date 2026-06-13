import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function InterviewSession() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current,   setCurrent  ] = useState(0);
  const [answer,    setAnswer   ] = useState('');
  const [feedback,  setFeedback ] = useState(null);
  const [loading,   setLoading  ] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get(`/interview/${id}`).then(r => {
      setInterview(r.data);
      setQuestions(r.data.questions);
    });
  }, [id]);

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const q = questions[current];
      const { data } = await api.post('/interview/submit-answer', {
        interviewId:  id,
        questionId:   q._id,
        questionText: q.questionText,
        userAnswer:   answer,
      });
      setFeedback(data.feedback);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (current + 1 < questions.length) {
      setCurrent(c => c + 1);
      setAnswer('');
      setFeedback(null);
      setSubmitted(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.post('/interview/finish', { interviewId: id });
      navigate(`/feedback/${id}`);
    } finally {
      setLoading(false);
    }
  };

  if (!interview) return <p className="p-8">Loading interview…</p>;

  const q = questions[current];
  const isLast = current + 1 === questions.length;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">
          Question {current + 1} of {questions.length}
        </span>
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">
          {interview.category} · {interview.difficulty}
        </span>
        <h2 className="mt-2 text-lg font-medium text-gray-900">{q?.questionText}</h2>
      </div>

      {/* Answer area */}
      {!submitted && (
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          rows={8}
          placeholder="Type your answer here…"
          className="w-full border rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      )}

      {/* Feedback */}
      {feedback && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-indigo-800">Score</span>
            <span className="text-2xl font-bold text-indigo-700">{feedback.score}/10</span>
          </div>
          <Section label="✓ Strengths"   items={feedback.strengths}    color="text-green-700"/>
          <Section label="✗ Weaknesses"  items={feedback.weaknesses}   color="text-red-600"/>
          <Section label="→ Improvements"items={feedback.improvements} color="text-amber-700"/>
          <div>
            <p className="text-xs font-medium text-indigo-600 mb-1">Ideal answer</p>
            <p className="text-sm text-gray-700">{feedback.idealAnswer}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!submitted ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={loading || !answer.trim()}
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Evaluating…' : 'Submit Answer'}
          </button>
        ) : isLast ? (
          <button
            onClick={handleFinish}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Generating report…' : 'Finish & Get Report'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium"
          >
            Next Question →
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ label, items, color }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className={`text-xs font-medium mb-1 ${color}`}>{label}</p>
      <ul className="text-sm text-gray-700 space-y-0.5">
        {items.map((s, i) => <li key={i}>• {s}</li>)}
      </ul>
    </div>
  );
}