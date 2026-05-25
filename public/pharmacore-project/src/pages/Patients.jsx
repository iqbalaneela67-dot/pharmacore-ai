/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

export default function Patients() {
  const { user } = useAuth();
  const [patients, setPatients]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [viewPatient, setViewPatient] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [patientBills, setPatientBills] = useState([]);
  const [patientRxs, setPatientRxs]    = useState([]);

  const [form, setForm] = useState({
    name: '', phone: '', age: '', gender: 'Male',
    address: '', allergies: '', chronic_conditions: '', blood_group: '',
  });

  useEffect(() => { fetchPatients(); }, []);

  async function fetchPatients() {
    setLoading(true);
    const { data } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
    setPatients(data || []);
    setLoading(false);
  }

  async function fetchPatientHistory(patient) {
    const [{ data: bills }, { data: rxs }] = await Promise.all([
      supabase.from('bills').select('*').ilike('patient_name', `%${patient.name}%`).order('created_at', { ascending: false }),
      supabase.from('prescriptions').select('*, prescription_items(*)').ilike('patient_name', `%${patient.name}%`).order('created_at', { ascending: false }),
    ]);
    setPatientBills(bills || []);
    setPatientRxs(rxs || []);
  }

  function openNew() {
    setEditPatient(null);
    setForm({ name: '', phone: '', age: '', gender: 'Male', address: '', allergies: '', chronic_conditions: '', blood_group: '' });
    setError('');
    setShowModal(true);
  }

  function openEdit(p) {
    setEditPatient(p);
    setForm({ name: p.name, phone: p.phone || '', age: p.age || '', gender: p.gender || 'Male', address: p.address || '', allergies: p.allergies || '', chronic_conditions: p.chronic_conditions || '', blood_group: p.blood_group || '' });
    setError('');
    setShowModal(true);
  }

  async function openView(p) {
    setViewPatient(p);
    await fetchPatientHistory(p);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Patient name is required'); return; }
    setError(''); setSaving(true);
    try {
      const data = { ...form, age: +form.age || null, created_by: user?.id };
      if (editPatient) {
        const { error: e } = await supabase.from('patients').update(data).eq('id', editPatient.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from('patients').insert([data]);
        if (e) throw e;
      }
      await fetchPatients();
      setShowModal(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this patient?')) return;
    await supabase.from('patients').delete().eq('id', id);
    fetchPatients();
  }

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || '').includes(search)
  );

  return (
    <div style={pg.root}>
      {/* Header */}
      <div style={pg.header}>
        <div>
          <h1 style={pg.title}>Patient Management</h1>
          <p style={pg.subtitle}>Manage patient profiles, history and records</p>
        </div>
        <button onClick={openNew} style={pg.addBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          New Patient
        </button>
      </div>

      {/* Stats */}
      <div style={pg.statsRow}>
        {[
          { label: 'Total Patients', value: patients.length, color: '#3b82f6', icon: '👥' },
          { label: 'Male',   value: patients.filter(p => p.gender === 'Male').length,   color: '#0f6e56', icon: '👨' },
          { label: 'Female', value: patients.filter(p => p.gender === 'Female').length, color: '#e91e8c', icon: '👩' },
          { label: 'With Allergies', value: patients.filter(p => p.allergies).length, color: '#f59e0b', icon: '⚠️' },
        ].map(s => (
          <div key={s.label} style={{ ...pg.statCard, borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ ...pg.statCount, color: s.color }}>{s.value}</div>
            <div style={pg.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={pg.searchWrap}>
        <svg style={pg.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        <input style={pg.searchInput} placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div style={pg.tableWrap}>
        {loading ? (
          <div style={pg.loading}>Loading patients...</div>
        ) : filtered.length === 0 ? (
          <div style={pg.empty}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <div style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>No patients found</div>
            <div style={{ color: '#aaa', fontSize: 13 }}>Add a new patient to get started</div>
          </div>
        ) : (
          <table style={pg.table}>
            <thead>
              <tr>{['Name', 'Phone', 'Age', 'Gender', 'Blood Group', 'Allergies', 'Actions'].map(h => (
                <th key={h} style={pg.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={pg.tr}>
                  <td style={pg.td}>
                    <div style={pg.nameCell}>
                      <div style={{ ...pg.avatar, background: p.gender === 'Female' ? '#fce4f0' : '#e4f0fc', color: p.gender === 'Female' ? '#e91e8c' : '#1a6fa8' }}>
                        {p.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: '#aaa' }}>{p.chronic_conditions || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={pg.td}><span style={{ fontSize: 13, color: '#555' }}>{p.phone || '—'}</span></td>
                  <td style={pg.td}><span style={{ fontSize: 13 }}>{p.age ? `${p.age} yrs` : '—'}</span></td>
                  <td style={pg.td}>
                    <span style={{ ...pg.genderBadge, background: p.gender === 'Female' ? '#fce4f0' : p.gender === 'Male' ? '#e4f0fc' : '#f0f0f0', color: p.gender === 'Female' ? '#e91e8c' : p.gender === 'Male' ? '#1a6fa8' : '#888' }}>
                      {p.gender || '—'}
                    </span>
                  </td>
                  <td style={pg.td}><span style={pg.bloodBadge}>{p.blood_group || '—'}</span></td>
                  <td style={pg.td}>
                    {p.allergies ? (
                      <span style={pg.allergyBadge}>⚠️ {p.allergies.substring(0, 20)}{p.allergies.length > 20 ? '...' : ''}</span>
                    ) : <span style={{ color: '#aaa', fontSize: 12 }}>None</span>}
                  </td>
                  <td style={pg.td}>
                    <div style={pg.actions}>
                      <button onClick={() => openView(p)} style={pg.actionBtn} title="View History">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
                      </button>
                      <button onClick={() => openEdit(p)} style={pg.actionBtn} title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5"/></svg>
                      </button>
                      <button onClick={() => handleDelete(p.id)} style={{ ...pg.actionBtn, background: '#fdf0f0', color: '#c0392b' }} title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={pg.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={pg.modal}>
            <div style={pg.modalHeader}>
              <h2 style={pg.modalTitle}>{editPatient ? 'Edit Patient' : 'New Patient'}</h2>
              <button onClick={() => setShowModal(false)} style={pg.closeBtn}>✕</button>
            </div>
            {error && <div style={pg.errorBox}>⚠️ {error}</div>}

            <div style={pg.formGrid}>
              <div style={pg.field}><label style={pg.label}>Full Name *</label><input style={pg.input} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Ahmed Ali" /></div>
              <div style={pg.field}><label style={pg.label}>Phone</label><input style={pg.input} value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="03001234567" /></div>
              <div style={pg.field}><label style={pg.label}>Age</label><input style={pg.input} type="number" value={form.age} onChange={e => setForm(f => ({...f, age: e.target.value}))} placeholder="Years" /></div>
              <div style={pg.field}><label style={pg.label}>Gender</label><select style={pg.input} value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))}>{GENDERS.map(g => <option key={g}>{g}</option>)}</select></div>
              <div style={pg.field}><label style={pg.label}>Blood Group</label><select style={pg.input} value={form.blood_group} onChange={e => setForm(f => ({...f, blood_group: e.target.value}))}><option value="">Select...</option>{BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}</select></div>
              <div style={pg.field}><label style={pg.label}>Address</label><input style={pg.input} value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} placeholder="City, Area" /></div>
              <div style={{ ...pg.field, gridColumn: '1 / -1' }}><label style={pg.label}>Allergies</label><input style={pg.input} value={form.allergies} onChange={e => setForm(f => ({...f, allergies: e.target.value}))} placeholder="e.g. Penicillin, Aspirin, Sulfa drugs" /></div>
              <div style={{ ...pg.field, gridColumn: '1 / -1' }}><label style={pg.label}>Chronic Conditions</label><input style={pg.input} value={form.chronic_conditions} onChange={e => setForm(f => ({...f, chronic_conditions: e.target.value}))} placeholder="e.g. Diabetes, Hypertension, Asthma" /></div>
            </div>

            <div style={pg.modalFooter}>
              <button onClick={() => setShowModal(false)} style={pg.cancelBtn}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={pg.saveBtn}>{saving ? 'Saving...' : editPatient ? 'Update' : 'Save Patient'}</button>
            </div>
          </div>
        </div>
      )}

      {/* View History Modal */}
      {viewPatient && (
        <div style={pg.overlay} onClick={e => e.target === e.currentTarget && setViewPatient(null)}>
          <div style={{ ...pg.modal, maxWidth: 650 }}>
            <div style={pg.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ ...pg.avatar, width: 48, height: 48, fontSize: 20, background: viewPatient.gender === 'Female' ? '#fce4f0' : '#e4f0fc', color: viewPatient.gender === 'Female' ? '#e91e8c' : '#1a6fa8' }}>
                  {viewPatient.name[0].toUpperCase()}
                </div>
                <div>
                  <h2 style={pg.modalTitle}>{viewPatient.name}</h2>
                  <div style={{ fontSize: 12, color: '#888' }}>{viewPatient.phone} · {viewPatient.age ? `${viewPatient.age} yrs` : ''} · {viewPatient.gender}</div>
                </div>
              </div>
              <button onClick={() => setViewPatient(null)} style={pg.closeBtn}>✕</button>
            </div>

            {/* Patient Info Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={pg.infoCard}>
                <div style={pg.infoCardTitle}>🩸 Medical Info</div>
                <div style={pg.infoRow}><span>Blood Group</span><strong>{viewPatient.blood_group || '—'}</strong></div>
                <div style={pg.infoRow}><span>Allergies</span><strong style={{ color: viewPatient.allergies ? '#ef4444' : '#aaa' }}>{viewPatient.allergies || 'None'}</strong></div>
                <div style={pg.infoRow}><span>Conditions</span><strong>{viewPatient.chronic_conditions || '—'}</strong></div>
              </div>
              <div style={pg.infoCard}>
                <div style={pg.infoCardTitle}>📊 Activity</div>
                <div style={pg.infoRow}><span>Total Bills</span><strong style={{ color: '#0f6e56' }}>{patientBills.length}</strong></div>
                <div style={pg.infoRow}><span>Prescriptions</span><strong style={{ color: '#3b82f6' }}>{patientRxs.length}</strong></div>
                <div style={pg.infoRow}><span>Total Spent</span><strong style={{ color: '#0f6e56' }}>PKR {patientBills.reduce((a, b) => a + (b.total || 0), 0).toLocaleString()}</strong></div>
              </div>
            </div>

            {/* Recent Bills */}
            {patientBills.length > 0 && (
              <div style={{ ...pg.infoCard, marginBottom: 12 }}>
                <div style={pg.infoCardTitle}>🧾 Recent Bills</div>
                {patientBills.slice(0, 4).map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{b.invoice}</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{b.date} · {b.payment_mode}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f6e56' }}>PKR {(b.total || 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Prescriptions */}
            {patientRxs.length > 0 && (
              <div style={pg.infoCard}>
                <div style={pg.infoCardTitle}>📋 Recent Prescriptions</div>
                {patientRxs.slice(0, 3).map(rx => (
                  <div key={rx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{rx.rx_number}</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>Dr. {rx.doctor_name} · {rx.issue_date}</div>
                    </div>
                    <span style={{ background: '#e6f9f2', color: '#0f6e56', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{rx.status}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={pg.modalFooter}>
              <button onClick={() => openEdit(viewPatient)} style={pg.saveBtn}>Edit Patient</button>
              <button onClick={() => setViewPatient(null)} style={pg.cancelBtn}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pg = {
  root:        { padding: '28px', maxWidth: 1200, margin: '0 auto' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title:       { fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  subtitle:    { fontSize: 13, color: '#888' },
  addBtn:      { display: 'flex', alignItems: 'center', gap: 8, background: '#0f6e56', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  statsRow:    { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
  statCard:    { background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  statCount:   { fontSize: 28, fontWeight: 700 },
  statLabel:   { fontSize: 12, color: '#888', marginTop: 2 },
  searchWrap:  { position: 'relative', marginBottom: 16 },
  searchIcon:  { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: '10px 12px 10px 36px', border: '1.5px solid #e0e0e0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' },
  tableWrap:   { background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  th:          { textAlign: 'left', padding: '13px 16px', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' },
  tr:          { borderBottom: '1px solid #f8f8f8' },
  td:          { padding: '13px 16px', fontSize: 13, color: '#333', verticalAlign: 'middle' },
  loading:     { padding: 40, textAlign: 'center', color: '#aaa' },
  empty:       { padding: 60, textAlign: 'center', color: '#aaa' },
  nameCell:    { display: 'flex', alignItems: 'center', gap: 10 },
  avatar:      { width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 },
  genderBadge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  bloodBadge:  { background: '#fdf0f0', color: '#c0392b', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  allergyBadge:{ background: '#fff8e6', color: '#b07d00', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 },
  actions:     { display: 'flex', gap: 6 },
  actionBtn:   { background: '#f0f0f0', border: 'none', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center' },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal:       { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle:  { fontSize: 18, fontWeight: 700, color: '#1a1a1a' },
  closeBtn:    { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#aaa', padding: '4px 8px' },
  errorBox:    { background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#A32D2D', marginBottom: 16 },
  formGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  field:       { display: 'flex', flexDirection: 'column', gap: 5 },
  label:       { fontSize: 12, fontWeight: 600, color: '#555' },
  input:       { padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' },
  modalFooter: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22, paddingTop: 18, borderTop: '1px solid #f0f0f0' },
  cancelBtn:   { background: '#f5f5f5', border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#555' },
  saveBtn:     { background: '#0f6e56', border: 'none', borderRadius: 9, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff' },
  infoCard:    { background: '#f8f9fa', borderRadius: 10, padding: '14px 16px' },
  infoCardTitle: { fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 },
  infoRow:     { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: '#666' },
}