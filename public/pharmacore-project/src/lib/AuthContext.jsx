import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

// Role permissions map
export const ROLE_PERMISSIONS = {
  admin: {
    label: 'Admin',
    color: '#7F77DD',
    pages: ['dashboard', 'inventory','prescriptions', 'sales', 'purchases', 'billing', 'returns', 'reports', 'scanner', 'users'],
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
  },
  pharmacist: {
    label: 'Pharmacist',
    color: '#1D9E75',
    pages: ['dashboard', 'inventory','prescriptions', 'sales', 'purchases', 'billing', 'returns', 'reports', 'scanner'],
    canEdit: true,
    canDelete: false,
    canManageUsers: false,
  },
  cashier: {
    label: 'Cashier',
    color: '#BA7517',
    pages: ['dashboard', 'billing', 'sales','prescriptions', 'scanner'],
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
  },
  supplier: {
    label: 'Supplier',
    color: '#D85A30',
    pages: ['dashboard', 'inventory', 'purchases'],
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
  },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) setProfile(data)
    return data
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await fetchProfile(data.user.id)
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const role = profile?.role ?? null
  const permissions = role ? ROLE_PERMISSIONS[role] : null

  function canAccess(page) {
    if (!permissions) return false
    return permissions.pages.includes(page)
  }

  return (
    <AuthContext.Provider value={{ user, profile, role, permissions, loading, signIn, signOut, canAccess }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}