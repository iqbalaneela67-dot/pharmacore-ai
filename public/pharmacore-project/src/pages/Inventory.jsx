/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import useStore from '../lib/store';

const CATEGORIES = ['Antibiotics', 'Analgesics', 'Antacids', 'Antivirals', 'Vitamins', 'Cardiovascular', 'Diabetes', 'Respiratory', 'Dermatology', 'Other'];

function getMedStatus(m) {
  const today = new Date();
  const exp = new Date(m.expiry_date || m.expiry);
  const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  const qty = m.qty || m.quantity || 0;
  const minStock = m.min_stock || m.minStock || 0;
  if (diffDays < 0) return 'Expired';
  if (diffDays <= 30) return 'Expiring Soon';
  if (qty <= minStock) return 'Low Stock';
  return 'In Stock';
}

const STATUS_COLORS = {
  'In Stock':      { bg: '#e6f9f2', color: '#0f6e56' },
  'Low Stock':     { bg: '#fff8e6', color: '#b07d00' },
  'Expiring Soon': { bg: '#e8f4fd', color: '#1a6fa8' },
  'Expired':       { bg: '#fdf0f0', color: '#c0392b' },
};

export default function Inventory() {
  const { user, permissions } = useAuth();
  const { fetchMedicines, invalidate } = useStore();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMed, setEditMed]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const [form, setForm] = useState({
    name: '', category: 'Antibiotics', barcode: '', batch: '',
    expiry_date: '', qty: '', min_stock: 10, mrp: '', purchase_price: '',
    manufacturer: '', description: '',
  });

  useEffect(() => { fetch(); }, []);

  async function fetch() {
    setLoading(true);
    const { data } = await supabase.from('medicines').select('*').order('name');
    setMedicines(data || []);
    setLoading(false);
  }

  function openNew() {
    setEditMed(null);
    setForm({ name: '', category: 'Antibiotics', barcode: '', batch: '', expiry_date: '', qty: '', min_stock: 10, mrp: '', purchase_price: '', manufacturer: '', description: '' });
    setError(''); setShowModal(true);
  }

  function openEdit(m) {
    setEditMed(m);
    setForm({
      name: m.name, category: m.category || 'Other', barcode: m.barcode || '',
      batch: m.batch || '', expiry_date: m.expiry_date || m.expiry || '',
      qty: m.qty || m.quantity || '', min_stock: m.min_stock || m.minStock || 10,
      mrp: m.mrp || m.price || '', purchase_price: m.purchase_price || m.pp || '',
      manufacturer: m.manufacturer || m.mfr || '', description: m.description || '',
    });
    setError(''); setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Medicine name is required'); return; }
    if (!form.expiry_date) { setError('Expiry date is required'); return; }
    setError(''); setSaving(true);
    try {
      const data = {
        name: form.name, category: form.category, barcode: form.barcode,
        batch: form.batch, expiry_date: form.expiry_date,
        qty: +form.qty || 0, min_stock: +form.min_stock || 10,
        mrp: +form.mrp || 0, purchase_price: +form.purchase_price || 0,
        manufacturer: form.manufacturer, description: form.description,
      };
      if (editMed) {
        const { error: e } = await supabase.from('medicines').update(data).eq('id', editMed.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from('medicines').insert([data]);
        if (e) throw e;
      }
      invalidate('medicines');
      await fetchMedicines(true);
      await fetch();
      setShowModal(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this medicine?')) return;
    await supabase.from('medicines').delete().eq('id', id);
    invalidate('medicines');
    await fetchMedicines(true);
    fetch();
  }

  const filtered = medicines.filter(m => {
    const s = getMedStatus(m);
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || (m.barcode || '').includes(search);
    const matchCat    = !catFilter || m.category === catFilter;
    const matchStatus = !statusFilter || s === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  // Stats
  const stats = {
    total:    medicines.length,
    low:      medicines.filter(m => getMedStatus(m) === 'Low Stock').length,
    expiring: medicines.filter(m => getMedStatus(m) === 'Expiring Soon').length,
    expired:  medicines.filter(m => getMedStatus(m) === 'Expired').length,
  };

  return (
    <div style={pg.root}>
      {/* Header */}
      <div style={pg.header}>
        <div>
          <h1 style={pg.title}>Inventory</h1>
          <p style={pg.subtitle}>Manage medicines, stock levels and expiry dates</p>
        </div>
        <button onClick={openNew} style={pg.addBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add Medicine
        </button>
      </div>

      {/* Stats */}
      <div style={pg.statsRow}>
        {[
          { label: 'Total Medicines', value: stats.total,    color: '#3b82f6', icon: '💊' },
          { label: 'Low Stock',       value: stats.low,      color: '#f59e0b', icon: '⚠️' },
          { label: 'Expiring Soon',   value: stats.expiring, color: '#1a6fa8', icon: '⏳' },
          { label: 'Expired',         value: stats.expired,  color: '#ef4444', icon: '🗑️' },
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
        <div style={{ position: 'relative', flex: 1 }}>
          <svg style={pg.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <input style={pg.searchInput} placeholder="Search by name or barcode..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={pg.select} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select style={pg.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {['In Stock', 'Low Stock', 'Expiring Soon', 'Expired'].map(s => <option key={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>{filtered.length} records</span>
      </div>

      {/* Table */}
      <div style={pg.tableWrap}>
        {loading ? (
          <div style={pg.loading}>Loading medicines...</div>
        ) : filtered.length === 0 ? (
          <div style={pg.empty}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💊</div>
            <div style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>No medicines found</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={pg.table}>
              <thead>
                <tr>{['Medicine', 'Category', 'Batch', 'Expiry', 'Stock', 'MRP', 'Purchase', 'Status', 'Actions'].map(h => (
                  <th key={h} style={pg.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map(m => {
                  const s = getMedStatus(m);
                  const sc = STATUS_COLORS[s];
                  return (
                    <tr key={m.id} style={pg.tr}>
                      <td style={pg.td}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: '#aaa' }}>{m.manufacturer || '—'} · {m.barcode || '—'}</div>
                      </td>
                      <td style={pg.td}><span style={pg.catBadge}>{m.category || '—'}</span></td>
                      <td style={pg.td}><span style={{ fontSize: 12, color: '#666' }}>{m.batch || '—'}</span></td>
                      <td style={pg.td}><span style={{ fontSize: 12, color: s === 'Expired' ? '#ef4444' : '#666', fontWeight: s === 'Expired' ? 700 : 400 }}>{m.expiry_date || m.expiry || '—'}</span></td>
                      <td style={pg.td}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: (m.qty || 0) <= (m.min_stock || 0) ? '#ef4444' : '#0f6e56' }}>{m.qty || m.quantity || 0}</div>
                        <div style={{ fontSize: 10, color: '#aaa' }}>Min: {m.min_stock || 0}</div>
                      </td>
                      <td style={pg.td}><span style={{ fontWeight: 600 }}>PKR {m.mrp || 0}</span></td>
                      <td style={pg.td}><span style={{ color: '#888' }}>PKR {m.purchase_price || m.pp || 0}</span></td>
                      <td style={pg.td}><span style={{ ...pg.statusPill, background: sc.bg, color: sc.color }}>{s}</span></td>
                      <td style={pg.td}>
                        <div style={pg.actions}>
                          <button onClick={() => openEdit(m)} style={pg.actionBtn} title="Edit">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5"/></svg>
                          </button>
                          {permissions?.canDelete && (
                            <button onClick={() => handleDelete(m.id)} style={{ ...pg.actionBtn, background: '#fdf0f0', color: '#c0392b' }} title="Delete">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={pg.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={pg.modal}>
            <div style={pg.modalHeader}>
              <h2 style={pg.modalTitle}>{editMed ? 'Edit Medicine' : 'Add Medicine'}</h2>
              <button onClick={() => setShowModal(false)} style={pg.closeBtn}>✕</button>
            </div>
            {error && <div style={pg.errorBox}>⚠️ {error}</div>}
            <div style={pg.formGrid}>
              <div style={{ ...pg.field, gridColumn: '1 / -1' }}><label style={pg.label}>Medicine Name *</label><input style={pg.input} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Panadol 500mg" /></div>
              <div style={pg.field}><label style={pg.label}>Category</label><select style={pg.input} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              <div style={pg.field}><label style={pg.label}>Manufacturer</label><input style={pg.input} value={form.manufacturer} onChange={e => setForm(f => ({...f, manufacturer: e.target.value}))} placeholder="Company name" /></div>
              <div style={pg.field}><label style={pg.label}>Barcode</label><input style={pg.input} value={form.barcode} onChange={e => setForm(f => ({...f, barcode: e.target.value}))} placeholder="Barcode number" /></div>
              <div style={pg.field}><label style={pg.label}>Batch Number</label><input style={pg.input} value={form.batch} onChange={e => setForm(f => ({...f, batch: e.target.value}))} placeholder="Batch no." /></div>
              <div style={pg.field}><label style={pg.label}>Expiry Date *</label><input style={pg.input} type="date" value={form.expiry_date} onChange={e => setForm(f => ({...f, expiry_date: e.target.value}))} /></div>
              <div style={pg.field}><label style={pg.label}>Quantity</label><input style={pg.input} type="number" value={form.qty} onChange={e => setForm(f => ({...f, qty: e.target.value}))} placeholder="0" /></div>
              <div style={pg.field}><label style={pg.label}>Min Stock Level</label><input style={pg.input} type="number" value={form.min_stock} onChange={e => setForm(f => ({...f, min_stock: e.target.value}))} placeholder="10" /></div>
              <div style={pg.field}><label style={pg.label}>MRP (Sale Price)</label><input style={pg.input} type="number" value={form.mrp} onChange={e => setForm(f => ({...f, mrp: e.target.value}))} placeholder="PKR" /></div>
              <div style={pg.field}><label style={pg.label}>Purchase Price</label><input style={pg.input} type="number" value={form.purchase_price} onChange={e => setForm(f => ({...f, purchase_price: e.target.value}))} placeholder="PKR" /></div>
              <div style={{ ...pg.field, gridColumn: '1 / -1' }}><label style={pg.label}>Description</label><textarea style={{ ...pg.input, height: 60, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Optional notes" /></div>
            </div>
            <div style={pg.modalFooter}>
              <button onClick={() => setShowModal(false)} style={pg.cancelBtn}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={pg.saveBtn}>{saving ? 'Saving...' : editMed ? 'Update' : 'Add Medicine'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pg = {
  root:       { padding: '28px', maxWidth: 1200, margin: '0 auto' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title:      { fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  subtitle:   { fontSize: 13, color: '#888' },
  addBtn:     { display: 'flex', alignItems: 'center', gap: 8, background: '#0f6e56', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  statsRow:   { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
  statCard:   { background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  statCount:  { fontSize: 28, fontWeight: 700 },
  statLabel:  { fontSize: 12, color: '#888', marginTop: 2 },
  filterRow:  { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' },
  searchInput:{ width: '100%', padding: '10px 12px 10px 36px', border: '1.5px solid #e0e0e0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' },
  select:     { padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' },
  tableWrap:  { background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { textAlign: 'left', padding: '13px 16px', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', whiteSpace: 'nowrap' },
  tr:         { borderBottom: '1px solid #f8f8f8' },
  td:         { padding: '13px 16px', fontSize: 13, color: '#333', verticalAlign: 'middle' },
  loading:    { padding: 40, textAlign: 'center', color: '#aaa' },
  empty:      { padding: 60, textAlign: 'center', color: '#aaa' },
  catBadge:   { background: '#f0f7ff', color: '#1a6fa8', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  statusPill: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  actions:    { display: 'flex', gap: 6 },
  actionBtn:  { background: '#f0f0f0', border: 'none', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center' },
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal:      { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 580, maxHeight: '90vh', overflow: 'auto' },
  modalHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#1a1a1a' },
  closeBtn:   { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#aaa', padding: '4px 8px' },
  errorBox:   { background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#A32D2D', marginBottom: 16 },
  formGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  field:      { display: 'flex', flexDirection: 'column', gap: 5 },
  label:      { fontSize: 12, fontWeight: 600, color: '#555' },
  input:      { padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' },
  modalFooter:{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22, paddingTop: 18, borderTop: '1px solid #f0f0f0' },
  cancelBtn:  { background: '#f5f5f5', border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#555' },
  saveBtn:    { background: '#0f6e56', border: 'none', borderRadius: 9, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff' },
}
