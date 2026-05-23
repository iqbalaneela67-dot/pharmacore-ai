/* eslint-disable */
import React, { useState } from 'react';

const USERS = [
  { username: 'admin', password: 'admin123', role: 'Admin', name: 'Administrator' },
  { username: 'pharmacist', password: 'pharma123', role: 'Pharmacist', name: 'Pharmacist' },
  { username: 'cashier', password: 'cash123', role: 'Cashier', name: 'Cashier' },
];

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = () => {
    if (!username || !password) { setError('Please enter username and password'); return; }
    setLoading(true);
    setError('');
    setTimeout(() => {
      const user = USERS.find(u => u.username === username && u.password === password);
      if (user) {
        localStorage.setItem('pharmacore_user', JSON.stringify(user));
        onLogin(user);
      } else {
        setError('Invalid username or password');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }

        .lg-wrap {
          min-height:100vh; background:#080e1c;
          display:flex; align-items:center; justify-content:center;
          font-family:'Plus Jakarta Sans',sans-serif;
          position:relative; overflow:hidden;
        }
        .lg-bg-circle {
          position:absolute; border-radius:50%;
          background:radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%);
          pointer-events:none;
        }
        .lg-card {
          background:linear-gradient(145deg,#0f172a,#111827);
          border:1px solid #1e293b; border-radius:24px;
          padding:40px; width:100%; max-width:420px;
          box-shadow:0 25px 80px rgba(0,0,0,.6);
          animation:fadeUp .5s ease;
          position:relative; z-index:1;
        }
        .lg-logo {
          display:flex; align-items:center; gap:12px;
          margin-bottom:32px; justify-content:center;
        }
        .lg-logo-icon {
          width:48px; height:48px; border-radius:14px;
          background:linear-gradient(135deg,#10b981,#3b82f6);
          display:flex; align-items:center; justify-content:center;
          font-size:24px; animation:float 3s ease-in-out infinite;
        }
        .lg-logo-text { font-size:22px; font-weight:800; color:#f8fafc; letter-spacing:-0.5px; }
        .lg-logo-sub  { font-size:11px; color:#10b981; font-weight:600; letter-spacing:1px; text-transform:uppercase; }
        .lg-title { font-size:18px; font-weight:700; color:#f8fafc; margin-bottom:6px; }
        .lg-sub   { font-size:13px; color:#64748b; margin-bottom:28px; }
        .lg-field { margin-bottom:16px; }
        .lg-label { font-size:12px; font-weight:600; color:#94a3b8; margin-bottom:6px; display:block; letter-spacing:.3px; }
        .lg-input-wrap { position:relative; }
        .lg-input {
          width:100%; padding:12px 16px; border-radius:12px;
          background:#1e293b; border:1px solid #334155;
          color:#f1f5f9; font-size:14px; font-family:inherit;
          outline:none; transition:border-color .2s, box-shadow .2s;
          box-sizing:border-box;
        }
        .lg-input:focus { border-color:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,.1); }
        .lg-input::placeholder { color:#475569; }
        .lg-eye {
          position:absolute; right:12px; top:50%; transform:translateY(-50%);
          background:none; border:none; color:#475569; cursor:pointer;
          font-size:16px; padding:4px;
        }
        .lg-error {
          background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.3);
          color:#fca5a5; padding:10px 14px; border-radius:10px;
          font-size:12px; margin-bottom:16px; display:flex; align-items:center; gap:8px;
        }
        .lg-btn {
          width:100%; padding:14px; border-radius:12px;
          background:linear-gradient(135deg,#10b981,#059669);
          border:none; color:#fff; font-size:15px; font-weight:700;
          cursor:pointer; font-family:inherit;
          transition:opacity .2s, transform .15s;
          display:flex; align-items:center; justify-content:center; gap:8px;
          margin-top:8px;
        }
        .lg-btn:hover { opacity:.9; transform:translateY(-1px); }
        .lg-btn:disabled { opacity:.6; cursor:not-allowed; transform:none; }
        .lg-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; }
        .lg-divider { border:none; border-top:1px solid #1e293b; margin:24px 0; }
        .lg-creds { background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:14px; }
        .lg-creds-title { font-size:11px; font-weight:700; color:#475569; letter-spacing:.8px; text-transform:uppercase; margin-bottom:10px; }
        .lg-cred-item { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #1e293b; font-size:12px; }
        .lg-cred-item:last-child { border:none; }
        .lg-cred-role { color:#64748b; }
        .lg-cred-val  { font-family:'JetBrains Mono',monospace; color:#10b981; }
        .lg-live { display:flex; align-items:center; gap:6px; justify-content:center; margin-top:20px; font-size:11px; color:#475569; }
        .lg-live-dot { width:6px; height:6px; border-radius:50%; background:#10b981; animation:pulse 2s infinite; }
      `}</style>

      <div className="lg-wrap">
        <div className="lg-bg-circle" style={{ width:600, height:600, top:-200, left:-200 }} />
        <div className="lg-bg-circle" style={{ width:400, height:400, bottom:-150, right:-100 }} />

        <div className="lg-card">
          <div className="lg-logo">
            <div className="lg-logo-icon">💊</div>
            <div>
              <div className="lg-logo-text">PharmaCore AI</div>
              <div className="lg-logo-sub">Pro Management System</div>
            </div>
          </div>

          <div className="lg-title">Welcome back 👋</div>
          <div className="lg-sub">Sign in to your pharmacy dashboard</div>

          {error && <div className="lg-error">⚠️ {error}</div>}

          <div className="lg-field">
            <label className="lg-label">Username</label>
            <div className="lg-input-wrap">
              <input
                className="lg-input"
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoFocus
              />
            </div>
          </div>

          <div className="lg-field">
            <label className="lg-label">Password</label>
            <div className="lg-input-wrap">
              <input
                className="lg-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ paddingRight: 40 }}
              />
              <button className="lg-eye" onClick={() => setShowPass(!showPass)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button className="lg-btn" onClick={handleLogin} disabled={loading}>
            {loading ? <><div className="lg-spinner" /> Signing in...</> : '🔐 Sign In'}
          </button>

          <hr className="lg-divider" />

          <div className="lg-creds">
            <div className="lg-creds-title">Demo Credentials</div>
            {USERS.map(u => (
              <div className="lg-cred-item" key={u.username} onClick={() => { setUsername(u.username); setPassword(u.password); }} style={{ cursor:'pointer' }}>
                <span className="lg-cred-role">{u.role}</span>
                <span className="lg-cred-val">{u.username} / {u.password}</span>
              </div>
            ))}
          </div>

          <div className="lg-live">
            <div className="lg-live-dot" /> System Online · PharmaCore AI v2.0
          </div>
        </div>
      </div>
    </>
  );
}