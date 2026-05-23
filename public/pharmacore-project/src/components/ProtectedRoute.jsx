import React from 'react'
import { useAuth, ROLE_PERMISSIONS } from '../lib/AuthContext'

// Wrap any page component — redirects to login if not authenticated
export function ProtectedRoute({ page, children }) {
  const { user, loading, canAccess, role } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return null // App.jsx will show LoginPage
  if (page && !canAccess(page)) return <AccessDenied role={role} page={page} />
  return children
}

// Role badge shown in Sidebar / Topbar
export function RoleBadge({ style = {} }) {
  const { profile, role } = useAuth()
  if (!role) return null
  const perm = ROLE_PERMISSIONS[role]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: perm.color + '22',
      border: `1px solid ${perm.color}55`,
      borderRadius: '20px', padding: '3px 10px',
      fontSize: '12px', fontWeight: 600, color: perm.color,
      ...style
    }}>
      <span style={{ width: 7, height: 7, background: perm.color, borderRadius: '50%', display: 'inline-block' }} />
      {perm.label}
    </div>
  )
}

// User info panel (name + role + logout)
export function UserPanel() {
  const { profile, role, signOut } = useAuth()
  const perm = role ? ROLE_PERMISSIONS[role] : null

  return (
    <div style={userPanelStyle.wrap}>
      <div style={userPanelStyle.avatar}>
        {(profile?.full_name || 'U')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={userPanelStyle.name}>{profile?.full_name || 'User'}</div>
        {perm && <RoleBadge />}
      </div>
      <button onClick={signOut} title="Logout" style={userPanelStyle.logoutBtn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0faf6' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e0e0e0', borderTopColor: '#0f6e56', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: '#0f6e56', fontSize: 14, fontWeight: 600 }}>Loading PharmaCore...</div>
      </div>
    </div>
  )
}

function AccessDenied({ role, page }) {
  const perm = role ? ROLE_PERMISSIONS[role] : null
  return (
    <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
      <h2 style={{ color: '#333', marginBottom: 8 }}>Access Nahi Hai</h2>
      <p style={{ marginBottom: 4 }}>
        <strong>{perm?.label}</strong> role ko <strong>{page}</strong> page ka access nahi hai.
      </p>
      <p style={{ fontSize: 13, color: '#aaa' }}>Admin se rabta karein agar zaroorat ho.</p>
    </div>
  )
}

const userPanelStyle = {
  wrap: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  avatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 15, flexShrink: 0,
  },
  name: { fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logoutBtn: {
    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
    color: '#fff', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center',
    flexShrink: 0,
  },
}