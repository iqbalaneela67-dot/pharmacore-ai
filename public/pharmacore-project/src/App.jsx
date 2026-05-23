import React, { useState } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Prescriptions from './pages/Prescriptions'
import LoginPage from './components/LoginPage'
import { UserPanel, ProtectedRoute } from './components/ProtectedRoute'

import Dashboard  from './pages/Dashboard'
import Inventory  from './pages/Inventory'
import Billing    from './pages/Billing'
import Sales      from './pages/Sales'
import Purchases  from './pages/Purchases'
import Returns    from './pages/Returns'
import Reports    from './pages/Reports'
import UsersPage  from './pages/UsersPage'

const Icons = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>,
  inventory: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="1.5"/></svg>,
  billing:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 10h20" stroke="currentColor" strokeWidth="1.5"/></svg>,
  sales:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  purchases: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  returns:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 14l-4-4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 10h11a4 4 0 010 8h-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  reports:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5"/></svg>,
  users:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
}

const MENU_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard'     },
  { id: 'inventory',     label: 'Inventory'     },
  { id: 'prescriptions', label: 'Prescriptions' },
  { id: 'billing',       label: 'Billing'       },
  { id: 'sales',         label: 'Sales'         },
  { id: 'purchases',     label: 'Purchases'     },
  { id: 'returns',       label: 'Returns'       },
  { id: 'reports',       label: 'Reports'       },
  { id: 'users',         label: 'Users'         },
]
const PAGE_COMPONENTS = {
  dashboard:     Dashboard,
  inventory:     Inventory,
  prescriptions: Prescriptions,
  billing:       Billing,
  sales:         Sales,
  purchases:     Purchases,
  returns:       Returns,
  reports:       Reports,
  users:         UsersPage,
}

function AppShell() {
  const { canAccess } = useAuth()
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const visibleMenu = MENU_ITEMS.filter(item => canAccess(item.id))
  const PageComponent = PAGE_COMPONENTS[activePage] || Dashboard

  return (
    <div style={shell.root}>
      <aside style={{ ...shell.sidebar, width: sidebarOpen ? '220px' : '64px' }}>
        <div style={shell.logo}>
          <div style={shell.logoIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M9 12h6M12 9v6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          {sidebarOpen && <span style={shell.logoText}>PharmaCore</span>}
          <button onClick={() => setSidebarOpen(v => !v)} style={shell.toggleBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d={sidebarOpen ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <nav style={shell.nav}>
          {visibleMenu.map(item => {
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  ...shell.navBtn,
                  background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                  borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                }}
                title={!sidebarOpen ? item.label : ''}
              >
                <span style={{ flexShrink: 0 }}>{Icons[item.id]}</span>
                {sidebarOpen && <span style={shell.navLabel}>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {sidebarOpen && <UserPanel />}
      </aside>

      <main style={shell.main}>
        <ProtectedRoute page={activePage}>
          <PageComponent />
        </ProtectedRoute>
      </main>
    </div>
  )
}

function AuthGate() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0faf6' }}>
      <div style={{ textAlign:'center' }}>
        <div style={spinnerStyle} />
        <div style={{ color:'#0f6e56', fontSize:14, fontWeight:600, marginTop:12 }}>Loading PharmaCore AI...</div>
      </div>
    </div>
  )

  return user ? <AppShell /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        button:focus { outline: none; }
        input:focus { outline: 2px solid #0f6e56; outline-offset: 1px; }
      `}</style>
      <AuthGate />
    </AuthProvider>
  )
}

const shell = {
  root: { display:'flex', height:'100vh', overflow:'hidden', background:'#f4f6f8' },
  sidebar: {
    background: 'linear-gradient(180deg, #04342C 0%, #0f6e56 100%)',
    display: 'flex', flexDirection: 'column',
    transition: 'width 0.25s ease',
    overflow: 'hidden', flexShrink: 0,
    boxShadow: '2px 0 12px rgba(0,0,0,0.15)',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '18px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logoIcon: {
    width: 36, height: 36, background: 'rgba(255,255,255,0.15)',
    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  logoText: { color: '#fff', fontWeight: 700, fontSize: 15, flex: 1, whiteSpace: 'nowrap' },
  toggleBtn: {
    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6,
    cursor: 'pointer', padding: '4px 6px', display: 'flex', alignItems: 'center', flexShrink: 0,
  },
  nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' },
  navBtn: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 11px', border: 'none', borderRadius: '8px',
    cursor: 'pointer', width: '100%', transition: 'all 0.15s',
    fontSize: 13, fontWeight: 500,
  },
  navLabel: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  main: { flex: 1, overflow: 'auto', background: '#f4f6f8' },
}

const spinnerStyle = {
  width: 40, height: 40,
  border: '3px solid #e0e0e0',
  borderTopColor: '#0f6e56',
  borderRadius: '50%',
  margin: '0 auto',
  animation: 'spin 0.8s linear infinite',
}