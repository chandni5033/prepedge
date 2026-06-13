import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AuthCallback() {
  const [params]  = useSearchParams();
  const { login } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    const token = params.get('token');

    
    if (token) {
        localStorage.setItem('token', token);

        api.get('/auth/profile')
        .then((r) => {
            
            login(token, r.data);
            navigate('/dashboard');
        })
        .catch((err) => {
            console.error("Profile Error:", err);
            navigate('/login');
        });
    } else {
        navigate('/login');
    }
    }, []);

  return <p className="p-8">Signing you in…</p>;
}