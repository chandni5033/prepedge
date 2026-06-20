import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import CodeAnswerEditor from '../components/CodeAnswerEditor';

// ── Timer hook ────────────────────────────────────────────────────────────────
function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    ref.current = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(ref.current);
  }, []);

  const fmt = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return { elapsed, formatted: fmt(elapsed) };
}

// ── Voice hook ────────────────────────────────────────────────────────────────
function useVoice(onTranscript) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recogRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = false;
      recog.lang = 'en-US';
      recog.onresult = (e) => {
        const transcript = Array.from(e.results)
          .map(r => r[0].transcript)
          .join(' ');
        onTranscript(prev => prev ? prev + ' ' + transcript : transcript);
      };
      recog.onend = () => setListening(false);
      recogRef.current = recog;
    }
  }, [onTranscript]);

  const toggle = () => {
    if (!recogRef.current) return;
    if (listening) {
      recogRef.current.stop();
      setListening(false);
    } else {
      recogRef.current.start();
      setListening(true);
    }
  };

  return { listening, supported, toggle };
}

// ── Exit dialog ───────────────────────────────────────────────────────────────
function ExitDialog({ answeredCount, onFinishPartial, onExit, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Exit interview?</h3>
        <p className="text-sm text-gray-600">
          You've answered <span className="font-medium text-indigo-600">{answeredCount}</span> question{answeredCount !== 1 ? 's' : ''} so far.
        </p>
        <div className="space-y-2">
          {answeredCount > 0 && (
            <button
              onClick={onFinishPartial}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50"
            >
              {loading ? 'Generating report…' : `Finish & get report (${answeredCount} answered)`}
            </button>
          )}
          <button
            onClick={onExit}
            className="w-full bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-lg font-medium text-sm hover:bg-red-100"
          >
            Exit without saving
          </button>
          <button
            onClick={onCancel}
            className="w-full text-gray-500 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Continue interview
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function InterviewSession() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleAttemptId = searchParams.get('roleAttempt');
  const roundOrder     = searchParams.get('round');

  const [interview,   setInterview  ] = useState(null);
  const [questions,   setQuestions  ] = useState([]);
  const [current,     setCurrent    ] = useState(0);
  const [answer,      setAnswer     ] = useState('');
  const [language,    setLanguage   ] = useState('cpp');
  const [feedback,    setFeedback   ] = useState(null);
  const [loading,     setLoading    ] = useState(false);
  const [submitted,   setSubmitted  ] = useState(false);
  const [showExit,    setShowExit   ] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);

  const { elapsed, formatted: timerDisplay } = useTimer();

  const handleTranscript = useCallback(setAnswer, []);
  const { listening, supported: voiceSupported, toggle: toggleVoice } = useVoice(handleTranscript);

  useEffect(() => {
    api.get(`/interview/${id}`).then(r => {
      setInterview(r.data);
      setQuestions(r.data.questions);
    });
  }, [id]);

  const isCodeQuestion = interview?.category === 'dsa';

  // ── Submit answer ──
  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const q = questions[current];
      const finalAnswer = isCodeQuestion
        ? `// Language: ${language}\n\n${answer}`
        : answer;
      const { data } = await api.post('/interview/submit-answer', {
        interviewId:  id,
        questionId:   q._id,
        questionText: q.questionText,
        userAnswer:   finalAnswer,
      });
      setFeedback(data.feedback);
      setSubmitted(true);
      setAnsweredCount(c => c + 1);
    } finally {
      setLoading(false);
    }
  };

  // ── Next question ──
  const handleNext = () => {
    if (current + 1 < questions.length) {
      setCurrent(c => c + 1);
      setAnswer('');
      setFeedback(null);
      setSubmitted(false);
    }
  };

  // ── Skip question (recorded as 0/10, noted in report) ──
  const handleSkip = async () => {
    setLoading(true);
    try {
      const q = questions[current];
      const { data } = await api.post('/interview/submit-answer', {
        interviewId:  id,
        questionId:   q._id,
        questionText: q.questionText,
        userAnswer:   '', // empty — AI will score 0 and note "no answer provided"
      });
      setFeedback(data.feedback);
      setSubmitted(true);
      // Don't increment answeredCount — skips don't count as answered
    } finally {
      setLoading(false);
    }
  };

  // ── Finish (full or partial) ──
  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.post('/interview/finish', { interviewId: id });

      if (roleAttemptId && roundOrder) {
        // Part of a role-based interview loop — mark the round complete and
        // unlock the next one, THEN show this round's own report (reusing
        // the existing Feedback page) before the user heads back to the
        // round map. Carrying the role context lets Feedback show a
        // "Continue to next round →" CTA instead of just "Start New Interview".
        await api.post(`/roles/attempts/${roleAttemptId}/rounds/${roundOrder}/complete`);
        navigate(`/feedback/${id}?roleAttempt=${roleAttemptId}&round=${roundOrder}`);
      } else {
        navigate(`/feedback/${id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Exit without saving ──
  const handleExitWithoutSaving = () =>
    navigate(roleAttemptId ? `/roles/attempts/${roleAttemptId}` : '/dashboard');

  if (!interview) return <p className="p-8">Loading interview…</p>;

  const q      = questions[current];
  const isLast = current + 1 === questions.length;

  // Timer colour: green → yellow (>10 min) → red (>20 min)
  const timerColor =
    elapsed > 1200 ? 'text-red-500' :
    elapsed > 600  ? 'text-yellow-500' :
    'text-gray-500';

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      {/* ── Top bar: progress + timer + exit ── */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 whitespace-nowrap">
          Question {current + 1} of {questions.length}
        </span>
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
        {/* Timer */}
        <span className={`text-sm font-mono font-medium whitespace-nowrap ${timerColor}`}>
          ⏱ {timerDisplay}
        </span>
        {/* Exit button */}
        <button
          onClick={() => setShowExit(true)}
          className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-300 rounded-lg px-2.5 py-1.5 transition-colors whitespace-nowrap"
        >
          ✕ Exit
        </button>
      </div>

      {/* ── Question card ── */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">
          {interview.category} · {interview.difficulty}
        </span>
        <h2 className="mt-2 text-lg font-medium text-gray-900">{q?.questionText}</h2>
      </div>

      {/* ── Answer area ── */}
      {!submitted && (
        isCodeQuestion ? (
          <CodeAnswerEditor
            value={answer}
            onChange={setAnswer}
            language={language}
            onLanguageChange={setLanguage}
          />
        ) : (
          <div className="relative">
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              rows={8}
              placeholder={
                voiceSupported
                  ? 'Type your answer here, or click the mic to speak…'
                  : 'Type your answer here…'
              }
              className="w-full border rounded-xl p-4 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            {/* Voice button — only shown for non-code questions */}
            {voiceSupported && (
              <button
                onClick={toggleVoice}
                title={listening ? 'Stop recording' : 'Speak your answer'}
                className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${
                  listening
                    ? 'bg-red-100 text-red-600 animate-pulse'
                    : 'bg-gray-100 text-gray-500 hover:bg-indigo-100 hover:text-indigo-600'
                }`}
              >
                🎤
              </button>
            )}
          </div>
        )
      )}

      {/* Voice status banner */}
      {listening && (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
          Listening — speak your answer. Click the mic again to stop.
        </p>
      )}

      {/* ── Feedback ── */}
      {feedback && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-indigo-800">Score</span>
            <span className="text-2xl font-bold text-indigo-700">{feedback.score}/10</span>
          </div>
          <Section label="✓ Strengths"    items={feedback.strengths}    color="text-green-700" />
          <Section label="✗ Weaknesses"   items={feedback.weaknesses}   color="text-red-600"   />
          <Section label="→ Improvements" items={feedback.improvements} color="text-amber-700" />
          <div>
            <p className="text-xs font-medium text-indigo-600 mb-1">Ideal answer</p>
            <p className="text-sm text-gray-700">{feedback.idealAnswer}</p>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex gap-3 flex-col">
        {!submitted ? (
          <>
            <button
              onClick={handleSubmitAnswer}
              disabled={loading || !answer.trim()}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Evaluating…' : 'Submit Answer'}
            </button>
            {/* Skip — always available, but with a visible consequence warning */}
            <button
              onClick={handleSkip}
              disabled={loading}
              className="flex-1 bg-gray-50 text-gray-500 border border-gray-200 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
            >
              Skip question →&nbsp;
              <span className="text-xs text-red-400">(counts as 0/10 in your report)</span>
            </button>
          </>
        ) : isLast ? (
          <button
            onClick={handleFinish}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Generating report…' : 'Finish & Get Report'}
          </button>
        ) : (
          <>
            <button
              onClick={handleNext}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium"
            >
              Next Question →
            </button>
            {/* Complete early — only shows after first answer */}
            {answeredCount > 0 && (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="bg-green-50 text-green-700 border border-green-200 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-100 disabled:opacity-50"
              >
                {loading ? 'Generating…' : '✓ Complete Now'}
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Exit dialog ── */}
      {showExit && (
        <ExitDialog
          answeredCount={answeredCount}
          onFinishPartial={handleFinish}
          onExit={handleExitWithoutSaving}
          onCancel={() => setShowExit(false)}
          loading={loading}
        />
      )}
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