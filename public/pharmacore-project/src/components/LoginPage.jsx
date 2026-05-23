import React, { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Galat email ya password. Dobara try karein.'
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.bg}>
      {/* Background pattern */}
      <div style={styles.pattern} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="#0f6e56" opacity="0.15"/>
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="#0f6e56" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M9 12h6M12 9v6" stroke="#0f6e56" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={styles.logoTitle}>PharmaCore AI</div>
            <div style={styles.logoSub}>Pro Pharmacy Management</div>
          </div>
        </div>

        <h1 style={styles.heading}>Khush Aamdeed</h1>
        <p style={styles.subheading}>Apne account mein login karein</p>

        {error && (
          <div style={styles.errorBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
              <circle cx="12" cy="12" r="10" stroke="#A32D2D" strokeWidth="1.5"/>
              <path d="M12 8v4M12 16h.01" stroke="#A32D2D" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrap}>
              <svg style={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@pharmacy.com"
                required
                style={styles.input}
                autoComplete="email"
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <svg style={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={styles.input}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={styles.eyeBtn}
                tabIndex={-1}
              >
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            ...styles.submitBtn,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? (
              <span style={styles.spinnerWrap}>
                <span style={styles.spinner} /> Logging in...
              </span>
            ) : 'Login Karein →'}
          </button>
        </form>

        {/* Role info cards */}
        <div style={styles.rolesSection}>
          <div style={styles.rolesDivider}>
            <span style={styles.rolesDividerText}>Available Roles</span>
          </div>
          <div style={styles.rolesGrid}>
            {[
              { role: 'Admin', color: '#7F77DD', desc: 'Full access' },
              { role: 'Pharmacist', color: '#1D9E75', desc: 'Medicine & billing' },
              { role: 'Cashier', color: '#BA7517', desc: 'Billing only' },
              { role: 'Supplier', color: '#D85A30', desc: 'Stock & purchases' },
            ].map(r => (
              <div key={r.role} style={styles.roleChip}>
                <span style={{ ...styles.roleDot, background: r.color }} />
                <div>
                  <div style={{ ...styles.roleChipTitle, color: r.color }}>{r.role}</div>
                  <div style={styles.roleChipDesc}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={styles.footer}>© 2025 PharmaCore AI · Secure Login</p>
      </div>
    </div>
  )
}

const styles = {
  bg: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #04342C 0%, #0f6e56 50%, #085041 100%)',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  pattern: {
    position: 'absolute', inset: 0,
    backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.03) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 40%)`,
    pointerEvents: 'none',
  },
  card: {
    background: '#fff',
    borderRadius: '20px',
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
    position: 'relative',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px',
  },
  logoIcon: {
    width: '48px', height: '48px', background: '#E1F5EE',
    borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoTitle: { fontWeight: 700, fontSize: '16px', color: '#04342C' },
  logoSub: { fontSize: '12px', color: '#0f6e56' },
  heading: { fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' },
  subheading: { fontSize: '14px', color: '#666', margin: '0 0 24px' },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: '#FCEBEB', border: '1px solid #F7C1C1',
    borderRadius: '10px', padding: '12px 14px',
    fontSize: '13px', color: '#A32D2D', marginBottom: '16px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#333' },
  inputWrap: {
    position: 'relative', display: 'flex', alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute', left: '12px', color: '#999', pointerEvents: 'none',
  },
  input: {
    width: '100%', padding: '11px 40px 11px 38px',
    border: '1.5px solid #e0e0e0', borderRadius: '10px',
    fontSize: '14px', color: '#1a1a1a', outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  eyeBtn: {
    position: 'absolute', right: '12px',
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#999', padding: '4px', display: 'flex', alignItems: 'center',
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #0f6e56 0%, #1D9E75 100%)',
    color: '#fff', border: 'none', borderRadius: '10px',
    padding: '13px', fontSize: '15px', fontWeight: 600,
    cursor: 'pointer', marginTop: '4px',
    transition: 'opacity 0.2s, transform 0.1s',
    fontFamily: 'inherit',
  },
  spinnerWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  spinner: {
    width: '16px', height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff', borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.8s linear infinite',
  },
  rolesSection: { marginTop: '28px' },
  rolesDivider: {
    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px',
  },
  rolesDividerText: { fontSize: '11px', color: '#aaa', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' },
  rolesGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  roleChip: {
    display: 'flex', alignItems: 'flex-start', gap: '8px',
    background: '#f8f9fa', borderRadius: '8px', padding: '10px 12px',
  },
  roleDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '3px' },
  roleChipTitle: { fontSize: '12px', fontWeight: 700 },
  roleChipDesc: { fontSize: '11px', color: '#888' },
  footer: { textAlign: 'center', fontSize: '11px', color: '#bbb', margin: '20px 0 0' },
}