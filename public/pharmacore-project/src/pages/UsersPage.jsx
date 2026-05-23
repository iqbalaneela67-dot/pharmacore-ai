import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth, ROLE_PERMISSIONS } from '../lib/AuthContext'

const ROLES = ['admin', 'pharmacist', 'cashier', 'supplier']

export default function UsersPage() {
  const { role: myRole } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'cashier', phone: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditUser(null)
    setForm({ full_name: '', email: '', password: '', role: 'cashier', phone: '' })
    setError('')
    setShowModal(true)
  }

  function openEdit(u) {
    setEditUser(u)
    setForm({ full_name: u.full_name, email: u.email || '', password: '', role: u.role, phone: u.phone || '' })
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      if (editUser) {
        // Update existing profile
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({ full_name: form.full_name, role: form.role, phone: form.phone })
          .eq('id', editUser.id)
        if (profileErr) throw profileErr
        setSuccess('User update ho gaya!')
      } else {
        // Create new user via Supabase Admin (signUp)
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.full_name, role: form.role }
          }
        })
        if (signUpErr) throw signUpErr
        // Trigger will auto-create profile; update phone separately
        if (data.user) {
          await supabase.from('profiles').update({ phone: form.phone }).eq('id', data.user.id)
        }
        setSuccess('Naya user ban gaya! Email confirm karne ke baad login kar sakta hai.')
      }
      await fetchUsers()
      setShowModal(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(u) {
    await supabase.from('profiles').update({ is_active: !u.is_active }).eq('id', u.id)
    fetchUsers()
  }

  const roleColors = Object.fromEntries(Object.entries(ROLE_PERMISSIONS).map(([k,v]) => [k, v.color]))

  return (
    <div style={pg.root}>
      {/* Header */}
      <div style={pg.header}>
        <div>
          <h1 style={pg.title}>Users Management</h1>
          <p style={pg.subtitle}>Tamam users aur unke roles yahan manage karein</p>
        </div>
        {myRole === 'admin' && (
          <button onClick={openAdd} style={pg.addBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Naya User
          </button>
        )}
      </div>

      {success && (
        <div style={pg.successBox} onClick={() => setSuccess('')}>
          ✅ {success} <span style={{float:'right',cursor:'pointer'}}>✕</span>
        </div>
      )}

      {/* Stats */}
      <div style={pg.statsRow}>
        {ROLES.map(r => {
          const count = users.filter(u => u.role === r).length
          const perm = ROLE_PERMISSIONS[r]
          return (
            <div key={r} style={{ ...pg.statCard, borderTop: `3px solid ${perm.color}` }}>
              <div style={{ ...pg.statCount, color: perm.color }}>{count}</div>
              <div style={pg.statLabel}>{perm.label}s</div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div style={pg.tableWrap}>
        {loading ? (
          <div style={pg.loading}>Users load ho rahe hain...</div>
        ) : (
          <table style={pg.table}>
            <thead>
              <tr>
                {['Name', 'Role', 'Phone', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={pg.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={pg.tr}>
                  <td style={pg.td}>
                    <div style={pg.nameCell}>
                      <div style={{ ...pg.avatar, background: roleColors[u.role] + '33', color: roleColors[u.role] }}>
                        {(u.full_name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={pg.nameText}>{u.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={pg.td}>
                    <span style={{ ...pg.rolePill, background: roleColors[u.role] + '22', color: roleColors[u.role], border: `1px solid ${roleColors[u.role]}44` }}>
                      {ROLE_PERMISSIONS[u.role]?.label || u.role}
                    </span>
                  </td>
                  <td style={pg.td}><span style={pg.muted}>{u.phone || '—'}</span></td>
                  <td style={pg.td}>
                    <span style={{ ...pg.statusPill, background: u.is_active ? '#e6f9f2' : '#fdf0f0', color: u.is_active ? '#1D9E75' : '#c0392b' }}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={pg.td}><span style={pg.muted}>{new Date(u.created_at).toLocaleDateString('en-PK')}</span></td>
                  <td style={pg.td}>
                    {myRole === 'admin' && (
                      <div style={pg.actions}>
                        <button onClick={() => openEdit(u)} style={pg.editBtn} title="Edit">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </button>
                        <button onClick={() => toggleActive(u)} style={{ ...pg.editBtn, background: u.is_active ? '#fdf0f0' : '#e6f9f2', color: u.is_active ? '#c0392b' : '#1D9E75' }} title={u.is_active ? 'Deactivate' : 'Activate'}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={pg.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={pg.modal}>
            <div style={pg.modalHeader}>
              <h2 style={pg.modalTitle}>{editUser ? 'User Edit Karein' : 'Naya User Banayein'}</h2>
              <button onClick={() => setShowModal(false)} style={pg.closeBtn}>✕</button>
            </div>

            {error && <div style={pg.errorBox}>{error}</div>}

            <div style={pg.formGrid}>
              <div style={pg.field}>
                <label style={pg.label}>Poora Naam *</label>
                <input style={pg.input} value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} placeholder="Dr. Ahmed Ali" />
              </div>
              {!editUser && (
                <>
                  <div style={pg.field}>
                    <label style={pg.label}>Email *</label>
                    <input style={pg.input} type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="user@pharmacy.com" />
                  </div>
                  <div style={pg.field}>
                    <label style={pg.label}>Password *</label>
                    <input style={pg.input} type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="Min 6 characters" />
                  </div>
                </>
              )}
              <div style={pg.field}>
                <label style={pg.label}>Role *</label>
                <select style={pg.input} value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_PERMISSIONS[r].label}</option>)}
                </select>
              </div>
              <div style={pg.field}>
                <label style={pg.label}>Phone</label>
                <input style={pg.input} value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="03001234567" />
              </div>
            </div>

            <div style={pg.modalFooter}>
              <button onClick={() => setShowModal(false)} style={pg.cancelBtn}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={pg.saveBtn}>
                {saving ? 'Saving...' : editUser ? 'Update Karein' : 'User Banayein'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const pg = {
  root: { padding: '28px', maxWidth: 1100, margin: '0 auto' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 },
  title: { fontSize:22, fontWeight:700, color:'#1a1a1a', marginBottom:4 },
  subtitle: { fontSize:13, color:'#888' },
  addBtn: { display:'flex', alignItems:'center', gap:8, background:'#0f6e56', color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:600, cursor:'pointer' },
  statsRow: { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:24 },
  statCard: { background:'#fff', borderRadius:12, padding:'16px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' },
  statCount: { fontSize:28, fontWeight:700 },
  statLabel: { fontSize:12, color:'#888', marginTop:2 },
  tableWrap: { background:'#fff', borderRadius:14, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { textAlign:'left', padding:'13px 16px', fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid #f0f0f0', background:'#fafafa' },
  tr: { borderBottom:'1px solid #f8f8f8', transition:'background 0.1s' },
  td: { padding:'13px 16px', fontSize:13, color:'#333', verticalAlign:'middle' },
  loading: { padding:40, textAlign:'center', color:'#aaa' },
  nameCell: { display:'flex', alignItems:'center', gap:10 },
  avatar: { width:34, height:34, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, flexShrink:0 },
  nameText: { fontWeight:600, color:'#1a1a1a' },
  rolePill: { padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:'nowrap' },
  statusPill: { padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 },
  muted: { color:'#aaa' },
  actions: { display:'flex', gap:6 },
  editBtn: { background:'#f0f0f0', border:'none', borderRadius:7, padding:'6px 8px', cursor:'pointer', color:'#555', display:'flex', alignItems:'center' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal: { background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:480, maxHeight:'90vh', overflow:'auto' },
  modalHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  modalTitle: { fontSize:18, fontWeight:700, color:'#1a1a1a' },
  closeBtn: { background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#aaa', padding:'4px 8px' },
  errorBox: { background:'#FCEBEB', border:'1px solid #F7C1C1', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#A32D2D', marginBottom:16 },
  successBox: { background:'#E6F9F2', border:'1px solid #B7EDD8', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#0f6e56', marginBottom:16, cursor:'pointer' },
  formGrid: { display:'flex', flexDirection:'column', gap:14 },
  field: { display:'flex', flexDirection:'column', gap:5 },
  label: { fontSize:12, fontWeight:600, color:'#555' },
  input: { padding:'10px 12px', border:'1.5px solid #e0e0e0', borderRadius:9, fontSize:13, fontFamily:'inherit', color:'#1a1a1a' },
  modalFooter: { display:'flex', gap:10, justifyContent:'flex-end', marginTop:22, paddingTop:18, borderTop:'1px solid #f0f0f0' },
  cancelBtn: { background:'#f5f5f5', border:'none', borderRadius:9, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer', color:'#555' },
  saveBtn: { background:'#0f6e56', border:'none', borderRadius:9, padding:'10px 22px', fontSize:13, fontWeight:600, cursor:'pointer', color:'#fff' },
}