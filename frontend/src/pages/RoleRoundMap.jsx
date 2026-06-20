import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const STATUS_STYLE = {
  locked:      { label: 'Locked',       icon: '🔒', cls: 'bg-gray-50 border-gray-200 text-gray-400' },
  unlocked:    { label: 'Ready',        icon: '▶',  cls: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  in_progress: { label: 'In Progress',  icon: '⏳', cls: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  completed:   { label: 'Completed',    icon: '✅', cls: 'bg-green-50 border-green-200 text-green-700' },
};

export default function RoleRoundMap() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [error,   setError  ] = useState('');
  const [starting,setStarting] = useState(false);

  const load = () => {
    api.get(`/roles/attempts/${attemptId}`)
      .then(r => setAttempt(r.data.attempt))
      .catch(() => setError('Failed to load this interview loop.'));
  };

  useEffect(load, [attemptId]);

  const handleBeginRound = async (order) => {
    setStarting(true);
    setError('');
    try {
      const { data } = await api.post(`/roles/attempts/${attemptId}/rounds/${order}/begin`);
      navigate(`/interview/${data.interview._id}?roleAttempt=${attemptId}&round=${order}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start this round.');
    } finally {
      setStarting(false);
    }
  };

  const handleFinishLoop = async () => {
    setStarting(true);
    setError('');
    try {
      await api.post(`/roles/attempts/${attemptId}/finish`);
      navigate(`/roles/attempts/${attemptId}/report`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate combined report.');
    } finally {
      setStarting(false);
    }
  };

  if (!attempt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <p className="text-sm text-gray-400">Loading…</p>
        )}
      </div>
    );
  }

  const allCompleted = attempt.rounds.every(r => r.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center gap-4">
        <Link to="/roles" className="text-gray-400 hover:text-gray-600 text-sm">← Roles</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-700">{attempt.roleName}</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{attempt.roleName} — Interview Loop</h1>
          <p className="text-gray-500 text-sm mt-1">
            Complete each round in order. Your final report combines all rounds.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-2">{error}</div>
        )}

        {/* Round list */}
        <div className="space-y-3">
          {attempt.rounds.map((round) => {
            const style = STATUS_STYLE[round.status];
            const isActionable = round.status === 'unlocked' || round.status === 'in_progress';

            return (
              <div
                key={round.order}
                className={`border-2 rounded-xl p-4 flex items-center justify-between ${style.cls}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{style.icon}</span>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{round.label}</p>
                    <p className="text-xs opacity-70">{style.label}</p>
                  </div>
                </div>

                {isActionable && (
                  <button
                    onClick={() => handleBeginRound(round.order)}
                    disabled={starting}
                    className="bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {round.status === 'in_progress' ? 'Continue →' : 'Start →'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Finish loop */}
        {allCompleted && attempt.status !== 'completed' && (
          <button
            onClick={handleFinishLoop}
            disabled={starting}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {starting ? 'Generating combined report…' : 'View Combined Report →'}
          </button>
        )}

        {attempt.status === 'completed' && (
          <Link
            to={`/roles/attempts/${attemptId}/report`}
            className="block text-center w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            View Combined Report →
          </Link>
        )}
      </div>
    </div>
  );
}