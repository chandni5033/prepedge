import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Profile() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]     = useState({ name: user?.name || '', email: user?.email || '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [msg,   setMsg]     = useState('');
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleSaveProfile = async e => {
    e.preventDefault();
    setSaving(true); setMsg(''); setError('');
    try {
      const { data } = await api.put('/auth/profile', { name: form.name });
      login(localStorage.getItem('token'), { ...user, ...data });
      setMsg('Profile updated.');
    } catch {
      setError('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async e => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) return setError('Passwords do not match.');
    setSaving(true); setMsg(''); setError('');
    try {
      await api.put('/auth/password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setMsg('Password changed successfully.');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
        <span className="text-sm font-medium text-gray-700">Profile</span>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">Logout</button>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-10 space-y-6">

        {/* Avatar */}
        <div className="bg-white border rounded-2xl p-6 flex items-center gap-5">
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="avatar" className="w-16 h-16 rounded-full object-cover"/>
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold">
              {initials}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <p className="text-xs text-gray-300 mt-0.5">
              Member since {new Date(user?.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Feedback messages */}
        {msg   && <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-lg px-4 py-2">{msg}</div>}
        {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-2">{error}</div>}

        {/* Edit name */}
        <div className="bg-white border rounded-2xl p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Edit Profile</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                value={form.email} disabled
                className="w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
            </div>
            <button
              type="submit" disabled={saving}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change password — only for non-Google users */}
        {!user?.googleId && (
          <div className="bg-white border rounded-2xl p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {['current', 'newPw', 'confirm'].map((field, i) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {['Current password', 'New password', 'Confirm new password'][i]}
                  </label>
                  <input
                    type="password"
                    value={pwForm[field]}
                    onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              ))}
              <button
                type="submit" disabled={saving}
                className="bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
              >
                {saving ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* Danger zone */}
        <div className="bg-white border border-red-100 rounded-2xl p-6">
          <h2 className="font-semibold text-red-600 mb-2">Sign out</h2>
          <p className="text-sm text-gray-500 mb-4">You'll need to log back in to access your account.</p>
          <button
            onClick={handleLogout}
            className="border border-red-300 text-red-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}