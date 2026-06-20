import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const ROLE_ICON = {
  'sde-intern':        '🧑‍💻',
  'backend-engineer':  '⚙️',
  'frontend-engineer': '🎨',
  'ml-engineer':       '🧠',
};

export default function SelectRole() {
  const navigate = useNavigate();
  const [roles,   setRoles  ] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting,setStarting] = useState(null); // slug currently being started
  const [error,   setError  ] = useState('');

  useEffect(() => {
    api.get('/roles')
      .then(r => setRoles(r.data.roles))
      .catch(() => setError('Failed to load roles.'))
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async (slug) => {
    setStarting(slug);
    setError('');
    try {
      const { data } = await api.post(`/roles/${slug}/start`);
      navigate(`/roles/attempts/${data.attempt._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start interview loop.');
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center gap-4">
        <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-700">Role-based Interview</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practice for a real interview loop</h1>
          <p className="text-gray-500 text-sm mt-1">
            Pick a role to go through a multi-round interview sequence, just like a real hiring process.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-2">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-gray-400">Loading roles…</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {roles.map(role => (
              <div
                key={role.slug}
                className="border-2 border-gray-200 rounded-xl p-5 bg-white hover:border-indigo-200 transition-all flex flex-col"
              >
                <div className="text-2xl mb-2">{ROLE_ICON[role.slug] || '💼'}</div>
                <h3 className="font-semibold text-gray-900">{role.name}</h3>
                <p className="text-xs text-gray-500 mt-1 flex-1">{role.description}</p>

                {/* Round preview */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {role.rounds.map(r => (
                    <span
                      key={r.order}
                      className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                    >
                      {r.label.replace(/^Round \d+: /, '')}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleStart(role.slug)}
                  disabled={starting === role.slug}
                  className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {starting === role.slug ? 'Starting…' : `Start ${role.rounds.length}-Round Loop →`}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}