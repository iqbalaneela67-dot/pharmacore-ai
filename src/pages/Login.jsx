/* eslint-disable */
import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    onLogin(data.user);
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div className="card" style={{ width:360, padding:32 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <h2 style={{ margin:0, color:'var(--text)' }}>PharmaCore AI</h2>
          <p style={{ color:'var(--text-secondary)', marginTop:6 }}>Sign in to continue</p>
        </div>
        {error && <div style={{ background:'rgba(239,68,68,0.1)', color:'var(--danger)', padding:'10px 14px', borderRadius:8, marginBottom:16, fontSize:13 }}>{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="input-group"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@pharmacy.com" required/></div>
          <div className="input-group" style={{ marginTop:12 }}><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/></div>
          <button className="btn btn-primary" type="submit" style={{ width:'100%', marginTop:20 }} disabled={loading}>{loading?'Signing in...':'Sign In'}</button>
        </form>
      </div>
    </div>
  );
}
