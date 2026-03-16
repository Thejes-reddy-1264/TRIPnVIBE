import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, MapPin } from 'lucide-react';
import apiClient from '../api/client';

const LoginPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        try {
            if (isLogin) {
                const formData = new FormData();
                formData.append('username', email);
                formData.append('password', password);

                const response = await apiClient.post('/login/access-token', formData, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                localStorage.setItem('token', response.data.access_token);
                navigate('/dashboard');
            } else {
                await apiClient.post('/users/', {
                    email,
                    password,
                    full_name: fullName
                });

                const formData = new FormData();
                formData.append('username', email);
                formData.append('password', password);
                const loginResponse = await apiClient.post('/login/access-token', formData, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                localStorage.setItem('token', loginResponse.data.access_token);
                navigate('/dashboard');
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.detail || 'Authentication failed. Make sure server is running.');
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>

            {/* Background Decor Removed */}

            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                        <div style={{ background: 'var(--bg-glass)', padding: '16px', borderRadius: '50%', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                            <MapPin size={32} color="var(--accent-solid)" />
                        </div>
                    </div>
                    <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '8px' }}>TRIPnVIBE</h1>
                    <p className="text-muted">Welcome to the future of travel.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {errorMsg && (
                        <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center' }}>
                            {errorMsg}
                        </div>
                    )}
                    {!isLogin && (
                        <div className="input-group">
                            <label className="input-label">Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input type="text" className="input-field" placeholder="John Doe" style={{ paddingLeft: '48px' }} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <User size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input type="email" className="input-field" placeholder="you@example.com" style={{ paddingLeft: '48px' }} value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input type="password" className="input-field" placeholder="••••••••" style={{ paddingLeft: '48px' }} value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px', padding: '16px' }}>
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <span style={{ color: 'var(--accent-solid)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setIsLogin(!isLogin)}>
                            {isLogin ? 'Sign up' : 'Log in'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
