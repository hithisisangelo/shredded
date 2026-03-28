import React, { useState } from 'react';
import { C, fonts, input, btn } from '../styles.js';
import { auth } from '../api.js';

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let result;
      if (mode === 'login') {
        result = await auth.login({ username: form.username, password: form.password });
      } else {
        result = await auth.register({ username: form.username, email: form.email, password: form.password });
      }
      onLogin(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: C.bg, fontFamily: fonts.body }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '0 24px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <img
              src="/prezkim.jpg"
              alt="The Supreme Leader"
              style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${C.accent}`, boxShadow: `0 0 24px ${C.accent}40` }}
            />
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SHREDDED
            </span>
          </div>
          <p style={{ color: C.muted, fontSize: '14px' }}>Your personal trainer + nutrition tracker</p>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '32px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', backgroundColor: C.surface, borderRadius: '8px', padding: '4px', marginBottom: '28px' }}>
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: fonts.body,
                  backgroundColor: mode === m ? C.accent : 'transparent',
                  color: mode === m ? '#000' : C.muted,
                  transition: 'all 0.15s',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: C.muted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Username {mode === 'login' ? 'or Email' : ''}
              </label>
              <input
                type="text"
                value={form.username}
                onChange={set('username')}
                placeholder={mode === 'login' ? 'Enter username or email' : 'Choose a username'}
                required
                style={{ ...input, fontSize: '14px' }}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: C.muted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="Enter your email"
                  required
                  style={{ ...input, fontSize: '14px' }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: C.muted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Enter password"
                required
                style={{ ...input, fontSize: '14px' }}
              />
            </div>

            {error && (
              <div style={{ backgroundColor: `${C.danger}20`, border: `1px solid ${C.danger}40`, borderRadius: '8px', padding: '10px 14px', color: C.danger, fontSize: '13px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...btn, width: '100%', padding: '12px', fontSize: '14px', marginTop: '4px',
                backgroundColor: loading ? C.border : C.accent,
                color: loading ? C.muted : '#000',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: C.muted, fontSize: '12px' }}>
          Track workouts, nutrition, and progress — all in one place.
        </p>
      </div>
    </div>
  );
}
