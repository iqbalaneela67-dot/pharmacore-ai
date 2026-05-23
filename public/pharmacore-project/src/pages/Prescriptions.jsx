/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

// ─── Helpers ─────────────────────────────────────────────────
function today() { return new Date().toISOString().split('T')[0]; }
function expiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}
function genRxNumber() {
  const ts = Date.now().toString().slice(-6);
  return `RX-${ts}`;
}

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 8 hours', 'Every 6 hours', 'At bedtime', 'As needed'];
const DURATIONS   = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month', '2 months', '3 months', 'Ongoing'];
const STATUS_COLORS = {
  'Active':               { bg: '#e6f9f2', color: '#0f6e56', border: '#b7edd8' },
  'Dispensed':            { bg: '#e8f4fd', color: '#1a6fa8', border: '#b3d9f5' },
  'Partially Dispensed':  { bg: '#fff8e6', color: '#b07d00', border: '#fde68a' },
  'Expired':              { bg: '#fdf0f0', color: '#c0392b', border: '#f5c6c6' },
  'Cancelled':            { bg: '#f5f5f5', color: '#888',    border: '#ddd' },
};

// ─── Main Component ───────────────────────────────────────────
export default function Prescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicines, setMedicines]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [viewRx, setViewRx]              = useState(null);
  const [search, setSearch]              = useState('');
  const [filterStatus, setFilterStatus]  = useState('All');
  const [saving, setSaving]              = useState(false);
  const [error, setError]                = useState('');

  // Form state
  const [form, setForm] = useState({
    rx_number: genRxNumber(),
    patient_name: '', patient_phone: '', patient_age: '',
    doctor_name: '', doctor_license: '', diagnosis: '',
    is_controlled: false, status: 'Active',
    issue_date: today(), expiry_date: expiryDate(), notes: '',
  });
  const [rxItems, setRxItems] = useState([]);
  const [itemForm, setItemForm] = useState({ medicine_id: '', medicine_name: '', dosage: '', frequency: 'Twice daily', duration: '7 days', quantity: 1, notes: '' });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: rxs }, { data: meds }] = await Promise.all([
      supabase.from('prescriptions').select('*, prescription_items(*)').order('created_at', { ascending: false }),
      supabase.from('medicines').select('id, name, mrp').order('name'),
    ]);
    setPrescriptions(rxs || []);
    setMedicines(meds || []);
    setLoading(false);
  }

  function openNew() {
    setForm({ rx_number: genRxNumber(), patient_name: '', patient_phone: '', patient_age: '', doctor_name: '', doctor_license: '', diagnosis: '', is_controlled: false, status: 'Active', issue_date: today(), expiry_date: expiryDate(), notes: '' });
    setRxItems([]);
    setItemForm({ medicine_id: '', medicine_name: '', dosage: '', frequency: 'Twice daily', duration: '7 days', quantity: 1, notes: '' });
    setError('');
    setShowModal(true);
  }

  function addRxItem() {
    if (!itemForm.medicine_name) return;
    setRxItems(prev => [...prev, { ...itemForm, id: Date.now() }]);
    setItemForm({ medicine_id: '', medicine_name: '', dosage: '', frequency: 'Twice daily', duration: '7 days', quantity: 1, notes: '' });
  }

  function removeRxItem(id) { setRxItems(prev => prev.filter(i => i.id !== id)); }

  function handleMedSelect(e) {
    const med = medicines.find(m => m.id === +e.target.value);
    if (med) setItemForm(f => ({ ...f, medicine_id: med.id, medicine_name: med.name }));
    else setItemForm(f => ({ ...f, medicine_id: '', medicine_name: '' }));
  }

  async function handleSave() {
    if (!form.patient_name.trim()) { setError('Patient name is required'); return; }
    if (!form.doctor_name.trim())  { setError('Doctor name is required'); return; }
    if (!rxItems.length)           { setError('Add at least one medicine'); return; }
    setError(''); setSaving(true);
    try {
      const { data: rx, error: rxErr } = await supabase
        .from('prescriptions')
        .insert([{ ...form, patient_age: +form.patient_age || null, created_by: user?.id }])
        .select().single();
      if (rxErr) throw rxErr;

      const items = rxItems.map(i => ({
        prescription_id: rx.id,
        medicine_id: i.medicine_id || null,
        medicine_name: i.medicine_name,
        dosage: i.dosage,
        frequency: i.frequency,
        duration: i.duration,
        quantity: +i.quantity,
        notes: i.notes,
      }));
      const { error: itemsErr } = await supabase.from('prescription_items').insert(items);
      if (itemsErr) throw itemsErr;

      await fetchAll();
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id, status) {
    await supabase.from('prescriptions').update({ status }).eq('id', id);
    fetchAll();
  }

  // Filters
  const filtered = prescriptions.filter(rx => {
    const matchSearch = rx.patient_name.toLowerCase().includes(search.toLowerCase()) ||
                        rx.doctor_name.toLowerCase().includes(search.toLowerCase()) ||
                        rx.rx_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || rx.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total:      prescriptions.length,
    active:     prescriptions.filter(r => r.status === 'Active').length,
    controlled: prescriptions.filter(r => r.is_controlled).length,
    expiring:   prescriptions.filter(r => r.status === 'Active' && r.expiry_date <= new Date(Date.now() + 7*86400000).toISOString().split('T')[0]).length,
  };

  return (
    <div style={pg.root}>
      {/* Header */}
      <div style={pg.header}>
        <div>
          <h1 style={pg.title}>Prescription Management</h1>
          <p style={pg.subtitle}>Track, dispense and manage all patient prescriptions</p>
        </div>
        <button onClick={openNew} style={pg.addBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          New Prescription
        </button>
      </div>

      {/* Stats */}
      <div style={pg.statsRow}>
        {[
          { label: 'Total Prescriptions', value: stats.total,      color: '#3b82f6', icon: '📋' },
          { label: 'Active',              value: stats.active,     color: '#10b981', icon: '✅' },
          { label: 'Controlled Drugs',    value: stats.controlled, color: '#ef4444', icon: '⚠️' },
          { label: 'Expiring in 7 Days',  value: stats.expiring,   color: '#f59e0b', icon: '⏳' },
        ].map(s => (
          <div key={s.label} style={{ ...pg.statCard, borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ ...pg.statCount, color: s.color }}>{s.value}</div>
            <div style={pg.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={pg.filterRow}>
        <div style={pg.searchWrap}>
          <svg style={pg.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <input style={pg.searchInput} placeholder="Search patient, doctor, Rx number..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={pg.statusFilters}>
          {['All', 'Active', 'Dispensed', 'Partially Dispensed', 'Expired', 'Cancelled'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ ...pg.filterBtn, background: filterStatus === s ? '#0f6e56' : '#f5f5f5', color: filterStatus === s ? '#fff' : '#555' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={pg.tableWrap}>
        {loading ? (
          <div style={pg.loading}>Loading prescriptions...</div>
        ) : filtered.length === 0 ? (
          <div style={pg.empty}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>No prescriptions found</div>
            <div style={{ color: '#aaa', fontSize: 13 }}>Create a new prescription to get started</div>
          </div>
        ) : (
          <table style={pg.table}>
            <thead>
              <tr>{['Rx Number', 'Patient', 'Doctor', 'Diagnosis', 'Medicines', 'Issue Date', 'Expiry', 'Status', 'Actions'].map(h => (
                <th key={h} style={pg.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(rx => {
                const sc = STATUS_COLORS[rx.status] || STATUS_COLORS['Active'];
                const isExpired = rx.expiry_date < today();
                return (
                  <tr key={rx.id} style={pg.tr}>
                    <td style={pg.td}>
                      <div style={{ fontWeight: 700, color: '#0f6e56', fontSize: 13 }}>{rx.rx_number}</div>
                      {rx.is_controlled && <span style={pg.controlledBadge}>⚠️ Controlled</span>}
                    </td>
                    <td style={pg.td}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{rx.patient_name}</div>
                      {rx.patient_phone && <div style={{ fontSize: 11, color: '#aaa' }}>{rx.patient_phone}</div>}
                      {rx.patient_age && <div style={{ fontSize: 11, color: '#aaa' }}>Age: {rx.patient_age}</div>}
                    </td>
                    <td style={pg.td}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Dr. {rx.doctor_name}</div>
                      {rx.doctor_license && <div style={{ fontSize: 11, color: '#aaa' }}>Lic: {rx.doctor_license}</div>}
                    </td>
                    <td style={pg.td}><span style={{ fontSize: 12, color: '#666' }}>{rx.diagnosis || '—'}</span></td>
                    <td style={pg.td}>
                      <span style={pg.medCount}>{rx.prescription_items?.length || 0} medicines</span>
                    </td>
                    <td style={pg.td}><span style={{ fontSize: 12, color: '#666' }}>{rx.issue_date}</span></td>
                    <td style={pg.td}>
                      <span style={{ fontSize: 12, color: isExpired ? '#ef4444' : '#666', fontWeight: isExpired ? 700 : 400 }}>
                        {rx.expiry_date} {isExpired && '⚠️'}
                      </span>
                    </td>
                    <td style={pg.td}>
                      <span style={{ ...pg.statusPill, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {rx.status}
                      </span>
                    </td>
                    <td style={pg.td}>
                      <div style={pg.actions}>
                        <button onClick={() => setViewRx(rx)} style={pg.actionBtn} title="View Details">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
                        </button>
                        {rx.status === 'Active' && (
                          <button onClick={() => updateStatus(rx.id, 'Dispensed')} style={{ ...pg.actionBtn, background: '#e6f9f2', color: '#0f6e56' }} title="Mark Dispensed">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        )}
                        {rx.status === 'Active' && (
                          <button onClick={() => updateStatus(rx.id, 'Cancelled')} style={{ ...pg.actionBtn, background: '#fdf0f0', color: '#c0392b' }} title="Cancel">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* New Prescription Modal */}
      {showModal && (
        <div style={pg.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={pg.modal}>
            <div style={pg.modalHeader}>
              <h2 style={pg.modalTitle}>New Prescription</h2>
              <button onClick={() => setShowModal(false)} style={pg.closeBtn}>✕</button>
            </div>

            {error && <div style={pg.errorBox}>⚠️ {error}</div>}

            {/* Rx Info */}
            <div style={pg.section}>
              <div style={pg.sectionTitle}>📋 Prescription Info</div>
              <div style={pg.formGrid2}>
                <div style={pg.field}>
                  <label style={pg.label}>Rx Number</label>
                  <input style={pg.input} value={form.rx_number} onChange={e => setForm(f => ({...f, rx_number: e.target.value}))} />
                </div>
                <div style={pg.field}>
                  <label style={pg.label}>Issue Date</label>
                  <input style={pg.input} type="date" value={form.issue_date} onChange={e => setForm(f => ({...f, issue_date: e.target.value}))} />
                </div>
                <div style={pg.field}>
                  <label style={pg.label}>Expiry Date</label>
                  <input style={pg.input} type="date" value={form.expiry_date} onChange={e => setForm(f => ({...f, expiry_date: e.target.value}))} />
                </div>
                <div style={pg.field}>
                  <label style={pg.label}>Status</label>
                  <select style={pg.input} value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                    {['Active', 'Dispensed', 'Partially Dispensed', 'Expired', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={pg.field}>
                <label style={pg.checkLabel}>
                  <input type="checkbox" checked={form.is_controlled} onChange={e => setForm(f => ({...f, is_controlled: e.target.checked}))} />
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>⚠️ Contains Controlled / Narcotic Drugs</span>
                </label>
              </div>
            </div>

            {/* Patient Info */}
            <div style={pg.section}>
              <div style={pg.sectionTitle}>👤 Patient Information</div>
              <div style={pg.formGrid2}>
                <div style={pg.field}>
                  <label style={pg.label}>Patient Name *</label>
                  <input style={pg.input} value={form.patient_name} onChange={e => setForm(f => ({...f, patient_name: e.target.value}))} placeholder="Full name" />
                </div>
                <div style={pg.field}>
                  <label style={pg.label}>Phone</label>
                  <input style={pg.input} value={form.patient_phone} onChange={e => setForm(f => ({...f, patient_phone: e.target.value}))} placeholder="03001234567" />
                </div>
                <div style={pg.field}>
                  <label style={pg.label}>Age</label>
                  <input style={pg.input} type="number" value={form.patient_age} onChange={e => setForm(f => ({...f, patient_age: e.target.value}))} placeholder="Years" />
                </div>
              </div>
            </div>

            {/* Doctor Info */}
            <div style={pg.section}>
              <div style={pg.sectionTitle}>👨‍⚕️ Doctor Information</div>
              <div style={pg.formGrid2}>
                <div style={pg.field}>
                  <label style={pg.label}>Doctor Name *</label>
                  <input style={pg.input} value={form.doctor_name} onChange={e => setForm(f => ({...f, doctor_name: e.target.value}))} placeholder="Dr. Ahmed Ali" />
                </div>
                <div style={pg.field}>
                  <label style={pg.label}>License / PMDC No.</label>
                  <input style={pg.input} value={form.doctor_license} onChange={e => setForm(f => ({...f, doctor_license: e.target.value}))} placeholder="PMDC-12345" />
                </div>
                <div style={{ ...pg.field, gridColumn: '1 / -1' }}>
                  <label style={pg.label}>Diagnosis</label>
                  <input style={pg.input} value={form.diagnosis} onChange={e => setForm(f => ({...f, diagnosis: e.target.value}))} placeholder="e.g. Hypertension, Diabetes Type 2" />
                </div>
              </div>
            </div>

            {/* Medicines */}
            <div style={pg.section}>
              <div style={pg.sectionTitle}>💊 Prescribed Medicines</div>

              {/* Add item form */}
              <div style={pg.itemFormGrid}>
                <div style={pg.field}>
                  <label style={pg.label}>Medicine</label>
                  <select style={pg.input} value={itemForm.medicine_id} onChange={handleMedSelect}>
                    <option value="">Select medicine...</option>
                    {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div style={pg.field}>
                  <label style={pg.label}>Dosage</label>
                  <input style={pg.input} value={itemForm.dosage} onChange={e => setItemForm(f => ({...f, dosage: e.target.value}))} placeholder="e.g. 500mg" />
                </div>
                <div style={pg.field}>
                  <label style={pg.label}>Frequency</label>
                  <select style={pg.input} value={itemForm.frequency} onChange={e => setItemForm(f => ({...f, frequency: e.target.value}))}>
                    {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div style={pg.field}>
                  <label style={pg.label}>Duration</label>
                  <select style={pg.input} value={itemForm.duration} onChange={e => setItemForm(f => ({...f, duration: e.target.value}))}>
                    {DURATIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div style={pg.field}>
                  <label style={pg.label}>Qty</label>
                  <input style={pg.input} type="number" min="1" value={itemForm.quantity} onChange={e => setItemForm(f => ({...f, quantity: e.target.value}))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button onClick={addRxItem} style={pg.addItemBtn}>+ Add</button>
                </div>
              </div>

              {/* Items list */}
              {rxItems.length > 0 && (
                <div style={pg.itemsList}>
                  {rxItems.map((item, i) => (
                    <div key={item.id} style={pg.itemRow}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>{i+1}. {item.medicine_name}</div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                          {item.dosage && `${item.dosage} · `}{item.frequency} · {item.duration} · Qty: {item.quantity}
                        </div>
                      </div>
                      <button onClick={() => removeRxItem(item.id)} style={pg.removeBtn}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {!rxItems.length && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#aaa', fontSize: 13, background: '#f8f9fa', borderRadius: 8 }}>
                  No medicines added yet
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={pg.section}>
              <div style={pg.field}>
                <label style={pg.label}>Additional Notes</label>
                <textarea style={{ ...pg.input, height: 70, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Special instructions, allergies, etc." />
              </div>
            </div>

            <div style={pg.modalFooter}>
              <button onClick={() => setShowModal(false)} style={pg.cancelBtn}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={pg.saveBtn}>
                {saving ? 'Saving...' : 'Save Prescription'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Prescription Modal */}
      {viewRx && (
        <div style={pg.overlay} onClick={e => e.target === e.currentTarget && setViewRx(null)}>
          <div style={{ ...pg.modal, maxWidth: 600 }}>
            <div style={pg.modalHeader}>
              <div>
                <h2 style={pg.modalTitle}>{viewRx.rx_number}</h2>
                <span style={{ ...pg.statusPill, ...STATUS_COLORS[viewRx.status], border: `1px solid ${STATUS_COLORS[viewRx.status]?.border}`, fontSize: 11 }}>{viewRx.status}</span>
              </div>
              <button onClick={() => setViewRx(null)} style={pg.closeBtn}>✕</button>
            </div>

            {viewRx.is_controlled && (
              <div style={{ background: '#fdf0f0', border: '1px solid #f5c6c6', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#c0392b', fontWeight: 600, fontSize: 13 }}>
                ⚠️ This prescription contains CONTROLLED / NARCOTIC drugs. Handle with care.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={pg.infoCard}>
                <div style={pg.infoCardTitle}>👤 Patient</div>
                <div style={pg.infoRow}><span>Name</span><strong>{viewRx.patient_name}</strong></div>
                {viewRx.patient_phone && <div style={pg.infoRow}><span>Phone</span><strong>{viewRx.patient_phone}</strong></div>}
                {viewRx.patient_age && <div style={pg.infoRow}><span>Age</span><strong>{viewRx.patient_age} years</strong></div>}
              </div>
              <div style={pg.infoCard}>
                <div style={pg.infoCardTitle}>👨‍⚕️ Doctor</div>
                <div style={pg.infoRow}><span>Name</span><strong>Dr. {viewRx.doctor_name}</strong></div>
                {viewRx.doctor_license && <div style={pg.infoRow}><span>PMDC</span><strong>{viewRx.doctor_license}</strong></div>}
                {viewRx.diagnosis && <div style={pg.infoRow}><span>Diagnosis</span><strong>{viewRx.diagnosis}</strong></div>}
              </div>
            </div>

            <div style={pg.infoCard}>
              <div style={pg.infoCardTitle}>📅 Dates</div>
              <div style={{ display: 'flex', gap: 24 }}>
                <div style={pg.infoRow}><span>Issued</span><strong>{viewRx.issue_date}</strong></div>
                <div style={pg.infoRow}><span>Expires</span><strong style={{ color: viewRx.expiry_date < today() ? '#ef4444' : '#333' }}>{viewRx.expiry_date}</strong></div>
              </div>
            </div>

            <div style={{ ...pg.infoCard, marginTop: 12 }}>
              <div style={pg.infoCardTitle}>💊 Prescribed Medicines</div>
              {viewRx.prescription_items?.map((item, i) => (
                <div key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a', marginBottom: 4 }}>{i+1}. {item.medicine_name}</div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {item.dosage    && <span style={pg.tag}>💊 {item.dosage}</span>}
                    {item.frequency && <span style={pg.tag}>🕐 {item.frequency}</span>}
                    {item.duration  && <span style={pg.tag}>📅 {item.duration}</span>}
                    <span style={pg.tag}>Qty: {item.quantity}</span>
                  </div>
                  {item.notes && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Note: {item.notes}</div>}
                </div>
              ))}
            </div>

            {viewRx.notes && (
              <div style={{ ...pg.infoCard, marginTop: 12 }}>
                <div style={pg.infoCardTitle}>📝 Notes</div>
                <p style={{ fontSize: 13, color: '#555', margin: 0 }}>{viewRx.notes}</p>
              </div>
            )}

            <div style={pg.modalFooter}>
              {viewRx.status === 'Active' && (
                <>
                  <button onClick={() => { updateStatus(viewRx.id, 'Dispensed'); setViewRx(null); }} style={pg.saveBtn}>✅ Mark as Dispensed</button>
                  <button onClick={() => { updateStatus(viewRx.id, 'Partially Dispensed'); setViewRx(null); }} style={{ ...pg.cancelBtn, background: '#fff8e6', color: '#b07d00', border: '1px solid #fde68a' }}>
                    Partially Dispensed
                  </button>
                </>
              )}
              <button onClick={() => setViewRx(null)} style={pg.cancelBtn}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────
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
  filterRow:   { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
  searchWrap:  { position: 'relative', flex: 1, minWidth: 200 },
  searchIcon:  { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: '10px 12px 10px 36px', border: '1.5px solid #e0e0e0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' },
  statusFilters: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn:   { padding: '6px 12px', border: 'none', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  tableWrap:   { background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  th:          { textAlign: 'left', padding: '13px 16px', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' },
  tr:          { borderBottom: '1px solid #f8f8f8' },
  td:          { padding: '13px 16px', fontSize: 13, color: '#333', verticalAlign: 'middle' },
  loading:     { padding: 40, textAlign: 'center', color: '#aaa' },
  empty:       { padding: 60, textAlign: 'center', color: '#aaa' },
  statusPill:  { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  controlledBadge: { display: 'inline-block', background: '#fdf0f0', color: '#c0392b', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, marginTop: 3 },
  medCount:    { background: '#f0f7ff', color: '#1a6fa8', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  actions:     { display: 'flex', gap: 6 },
  actionBtn:   { background: '#f0f0f0', border: 'none', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center' },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal:       { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle:  { fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  closeBtn:    { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#aaa', padding: '4px 8px' },
  errorBox:    { background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#A32D2D', marginBottom: 16 },
  section:     { marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f0f0f0' },
  sectionTitle:{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' },
  formGrid2:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field:       { display: 'flex', flexDirection: 'column', gap: 5 },
  label:       { fontSize: 12, fontWeight: 600, color: '#555' },
  input:       { padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' },
  checkLabel:  { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 },
  itemFormGrid:{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px auto', gap: 10, marginBottom: 12, alignItems: 'end' },
  addItemBtn:  { background: '#0f6e56', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', height: 41 },
  itemsList:   { display: 'flex', flexDirection: 'column', gap: 8 },
  itemRow:     { display: 'flex', alignItems: 'center', gap: 12, background: '#f8f9fa', borderRadius: 8, padding: '10px 14px' },
  removeBtn:   { background: '#fdf0f0', border: 'none', color: '#c0392b', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  modalFooter: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22, paddingTop: 18, borderTop: '1px solid #f0f0f0', flexWrap: 'wrap' },
  cancelBtn:   { background: '#f5f5f5', border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#555' },
  saveBtn:     { background: '#0f6e56', border: 'none', borderRadius: 9, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff' },
  infoCard:    { background: '#f8f9fa', borderRadius: 10, padding: '14px 16px' },
  infoCardTitle: { fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 },
  infoRow:     { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: '#666' },
  tag:         { background: '#fff', border: '1px solid #e0e0e0', borderRadius: 20, padding: '2px 10px', fontSize: 11, color: '#555' },
}
