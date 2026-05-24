/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import useStore from '../lib/store';

function today() { return new Date().toISOString().split('T')[0]; }
function formatPKR(v) { return 'PKR ' + (v || 0).toLocaleString('en-PK'); }

const PAYMENT_MODES = ['Cash', 'Card', 'JazzCash', 'EasyPaisa', 'Bank Transfer', 'Credit'];

function genInvoice() {
  const d = new Date();
  return `BILL-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Date.now().toString().slice(-4)}`;
}

export default function Billing() {
  const { user } = useAuth();
  const { medicines: storeMeds, fetchMedicines, invalidate } = useStore();

  const [medicines, setMedicines]   = useState([]);
  const [bills, setBills]           = useState([]);
  const [loadingBills, setLoadingBills] = useState(true);

  // Form state
  const [patient, setPatient]   = useState('');
  const [phone, setPhone]       = useState('');
  const [doctor, setDoctor]     = useState('');
  const [billDate, setBillDate] = useState(today());
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment]   = useState('Cash');
  const [items, setItems]       = useState([]);
  const [selMedId, setSelMedId] = useState('');
  const [selQty, setSelQty]     = useState(1);
  const [saving, setSaving]     = useState(false);
  const [printBill, setPrintBill] = useState(null);
  const [search, setSearch]     = useState('');

  useEffect(() => { fetchMedicines(); fetchBills(); }, []);
  useEffect(() => { setMedicines(storeMeds); }, [storeMeds]);

  async function fetchBills() {
    setLoadingBills(true);
    const { data } = await supabase.from('bills').select('*').order('created_at', { ascending: false });
    setBills(data || []);
    setLoadingBills(false);
  }

  const availableMeds = medicines.filter(m => (m.qty || m.quantity || 0) > 0);

  function addItem(medId, qty = selQty) {
    const id = +medId;
    const med = medicines.find(m => m.id === id);
    if (!med) return;
    const stock = med.qty || med.quantity || 0;
    const alreadyQty = items.find(i => i.medId === id)?.qty || 0;
    if (alreadyQty + qty > stock) { alert(`Insufficient stock! Available: ${stock}`); return; }
    setItems(prev => {
      const ex = prev.find(i => i.medId === id);
      if (ex) return prev.map(i => i.medId === id ? { ...i, qty: i.qty + qty, total: (i.qty + qty) * i.mrp } : i);
      return [...prev, { medId: id, name: med.name, qty, mrp: med.mrp || med.price || 0, total: qty * (med.mrp || med.price || 0) }];
    });
    setSelMedId(''); setSelQty(1);
  }

  function updateQty(medId, qty) {
    const q = Math.max(1, +qty || 1);
    const med = medicines.find(m => m.id === medId);
    const stock = med?.qty || med?.quantity || 0;
    if (q > stock) { alert('Insufficient stock! Available: ' + stock); return; }
    setItems(prev => prev.map(i => i.medId === medId ? { ...i, qty: q, total: q * i.mrp } : i));
  }

  function removeItem(medId) { setItems(prev => prev.filter(i => i.medId !== medId)); }

  const subtotal = items.reduce((a, i) => a + i.total, 0);
  const discAmt  = Math.round(subtotal * discount / 100);
  const total    = subtotal - discAmt;

  async function finalize() {
    if (!patient.trim()) { alert('Patient name is required'); return; }
    if (!items.length)   { alert('Please add at least one medicine'); return; }
    setSaving(true);
    try {
      const invoice = genInvoice();
      const bill = {
        invoice, patient_name: patient, patient_phone: phone, doctor,
        date: billDate, items: items, subtotal, discount: discAmt,
        total, payment_mode: payment, status: 'Paid', created_by: user?.id,
      };

      // Save bill
      const { data: savedBill, error: billErr } = await supabase.from('bills').insert([bill]).select().single();
      if (billErr) throw billErr;

      // Deduct stock
      for (const item of items) {
        const med = medicines.find(m => m.id === item.medId);
        if (med) {
          const newQty = (med.qty || med.quantity || 0) - item.qty;
          await supabase.from('medicines').update({ qty: newQty }).eq('id', item.medId);
        }
      }

      // Save sale record
      await supabase.from('sales').insert([{
        invoice, date: billDate,
        patient: patient,
        total, discount: discAmt, status: 'Paid',
      }]);

      invalidate('medicines'); invalidate('sales');
      await fetchMedicines(true);
      await fetchBills();

      setPrintBill({ ...savedBill, invoice, patient_name: patient, items, total, payment_mode: payment });
      setPatient(''); setPhone(''); setDoctor(''); setDiscount(0); setItems([]); setBillDate(today()); setPayment('Cash');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  const filteredBills = bills.filter(b =>
    b.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.invoice?.toLowerCase().includes(search.toLowerCase()) ||
    b.doctor?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Billing</h1>
          <p style={s.subtitle}>Create and manage patient bills</p>
        </div>
      </div>

      <div style={s.layout}>
        {/* ── Left: Bill Form ── */}
        <div style={s.formSide}>
          {/* Patient Info */}
          <div style={s.card}>
            <div style={s.cardTitle}>👤 Patient Information</div>
            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Patient Name *</label>
                <input style={s.input} value={patient} onChange={e => setPatient(e.target.value)} placeholder="Full name" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Phone</label>
                <input style={s.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="03001234567" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Doctor / Referred By</label>
                <input style={s.input} value={doctor} onChange={e => setDoctor(e.target.value)} placeholder="Dr. name" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Date</label>
                <input style={s.input} type="date" value={billDate} onChange={e => setBillDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Add Medicines */}
          <div style={s.card}>
            <div style={s.cardTitle}>💊 Add Medicines</div>
            <div style={s.addMedRow}>
              <select style={{ ...s.input, flex: 1 }} value={selMedId} onChange={e => setSelMedId(e.target.value)}>
                <option value="">Select medicine...</option>
                {availableMeds.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} — PKR {m.mrp || m.price || 0} (Stock: {m.qty || m.quantity || 0})
                  </option>
                ))}
              </select>
              <input style={{ ...s.input, width: 80 }} type="number" min="1" value={selQty} onChange={e => setSelQty(+e.target.value)} placeholder="Qty" />
              <button style={s.addBtn} onClick={() => selMedId && addItem(selMedId)}>+ Add</button>
            </div>

            {items.length > 0 && (
              <div style={s.itemsTable}>
                <div style={s.itemsHeader}>
                  <span style={{ flex: 2 }}>Medicine</span>
                  <span style={{ width: 70, textAlign: 'center' }}>Qty</span>
                  <span style={{ width: 90, textAlign: 'right' }}>Rate</span>
                  <span style={{ width: 90, textAlign: 'right' }}>Total</span>
                  <span style={{ width: 30 }}></span>
                </div>
                {items.map(item => (
                  <div key={item.medId} style={s.itemRow}>
                    <span style={{ flex: 2, fontSize: 13, fontWeight: 500 }}>{item.name}</span>
                    <input
                      type="number" min="1" value={item.qty}
                      style={{ ...s.input, width: 70, textAlign: 'center', padding: '5px 8px' }}
                      onChange={e => updateQty(item.medId, e.target.value)}
                    />
                    <span style={{ width: 90, textAlign: 'right', fontSize: 13, color: '#555' }}>PKR {item.mrp}</span>
                    <span style={{ width: 90, textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#0f6e56' }}>PKR {item.total}</span>
                    <button onClick={() => removeItem(item.medId)} style={s.removeBtn}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {!items.length && (
              <div style={s.emptyItems}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🛒</div>
                <div style={{ color: '#aaa', fontSize: 13 }}>No items added yet</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Summary ── */}
        <div style={s.summarySide}>
          <div style={{ ...s.card, position: 'sticky', top: 20 }}>
            <div style={s.cardTitle}>🧾 Invoice Summary</div>

            <div style={s.summaryItems}>
              {items.map(item => (
                <div key={item.medId} style={s.summaryRow}>
                  <span style={{ color: '#666', fontSize: 12 }}>{item.name} ×{item.qty}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>PKR {item.total}</span>
                </div>
              ))}
              {!items.length && <div style={{ color: '#ccc', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>No items</div>}
            </div>

            <div style={s.totalSection}>
              <div style={s.totalRow}><span>Subtotal</span><span>PKR {subtotal.toLocaleString()}</span></div>
              <div style={{ ...s.totalRow, color: '#e74c3c' }}><span>Discount ({discount}%)</span><span>-PKR {discAmt.toLocaleString()}</span></div>
              <div style={{ ...s.totalRow, ...s.totalFinal }}><span>Total</span><span>{formatPKR(total)}</span></div>
            </div>

            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Discount %</label>
                <input style={s.input} type="number" min="0" max="100" value={discount} onChange={e => setDiscount(+e.target.value)} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Payment Mode</label>
                <select style={s.input} value={payment} onChange={e => setPayment(e.target.value)}>
                  {PAYMENT_MODES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <button onClick={finalize} disabled={saving} style={{ ...s.finalizeBtn, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Processing...' : '✅ Finalize & Print Bill'}
            </button>
            <button onClick={() => { setItems([]); setPatient(''); setPhone(''); setDoctor(''); setDiscount(0); }} style={s.clearBtn}>
              🗑️ Clear
            </button>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div style={{ ...s.card, marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={s.cardTitle}>📋 Billing History</div>
          <div style={{ position: 'relative' }}>
            <input style={{ ...s.input, paddingLeft: 32, width: 220 }} placeholder="Search bills..." value={search} onChange={e => setSearch(e.target.value)} />
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
        </div>

        {loadingBills ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Loading bills...</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>{['Invoice#', 'Patient', 'Doctor', 'Date', 'Items', 'Total', 'Payment', 'Actions'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filteredBills.length ? filteredBills.map(b => (
                <tr key={b.id} style={s.tr}>
                  <td style={s.td}><b style={{ color: '#0f6e56' }}>{b.invoice}</b></td>
                  <td style={s.td}>{b.patient_name}</td>
                  <td style={s.td}><span style={{ color: '#888' }}>{b.doctor || '—'}</span></td>
                  <td style={s.td}><span style={{ color: '#888', fontSize: 12 }}>{b.date}</span></td>
                  <td style={s.td}><span style={s.itemCount}>{b.items?.length || 0} items</span></td>
                  <td style={s.td}><b style={{ color: '#0f6e56' }}>{formatPKR(b.total)}</b></td>
                  <td style={s.td}><span style={s.payBadge}>{b.payment_mode}</span></td>
                  <td style={s.td}>
                    <button onClick={() => setPrintBill(b)} style={s.printBtn} title="View/Print">
                      🖨️
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>No bills found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Print Modal */}
      {printBill && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setPrintBill(null)}>
          <div style={s.printModal}>
            <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '2px dashed #e0e0e0', paddingBottom: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f6e56' }}>PharmaCore AI</div>
              <div style={{ fontSize: 12, color: '#888' }}>Pro Pharmacy Management</div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Invoice: {printBill.invoice}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, fontSize: 12 }}>
              <div><span style={{ color: '#888' }}>Patient:</span> <b>{printBill.patient_name}</b></div>
              <div><span style={{ color: '#888' }}>Date:</span> <b>{printBill.date}</b></div>
              {printBill.patient_phone && <div><span style={{ color: '#888' }}>Phone:</span> <b>{printBill.patient_phone}</b></div>}
              {printBill.doctor && <div><span style={{ color: '#888' }}>Doctor:</span> <b>{printBill.doctor}</b></div>}
              <div><span style={{ color: '#888' }}>Payment:</span> <b>{printBill.payment_mode}</b></div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 700 }}>Medicine</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, color: '#888', fontWeight: 700 }}>Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, color: '#888', fontWeight: 700 }}>Rate</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, color: '#888', fontWeight: 700 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(printBill.items || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px 10px', fontSize: 13 }}>{item.name}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 13 }}>{item.qty}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 13 }}>PKR {item.mrp}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 13, fontWeight: 600 }}>PKR {item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '2px dashed #e0e0e0', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: '#888' }}>Subtotal</span><span>PKR {printBill.subtotal?.toLocaleString() || 0}</span>
              </div>
              {printBill.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#e74c3c', marginBottom: 4 }}>
                  <span>Discount</span><span>-PKR {printBill.discount?.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: '#0f6e56', marginTop: 8 }}>
                <span>Total</span><span>{formatPKR(printBill.total)}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#aaa' }}>
              Thank you for your visit! · Get well soon 💊
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => window.print()} style={s.finalizeBtn}>🖨️ Print</button>
              <button onClick={() => setPrintBill(null)} style={s.clearBtn}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  root:       { padding: '24px', maxWidth: 1200, margin: '0 auto' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:      { fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  subtitle:   { fontSize: 13, color: '#888' },
  layout:     { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' },
  formSide:   { display: 'flex', flexDirection: 'column', gap: 16 },
  summarySide:{ },
  card:       { background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  cardTitle:  { fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 },
  grid2:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field:      { display: 'flex', flexDirection: 'column', gap: 5 },
  label:      { fontSize: 12, fontWeight: 600, color: '#555' },
  input:      { padding: '9px 12px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' },
  addMedRow:  { display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' },
  addBtn:     { background: '#0f6e56', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  itemsTable: { display: 'flex', flexDirection: 'column', gap: 6 },
  itemsHeader:{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' },
  itemRow:    { display: 'flex', alignItems: 'center', gap: 8, padding: '8px', background: '#f8f9fa', borderRadius: 8 },
  removeBtn:  { background: '#fdf0f0', border: 'none', color: '#c0392b', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 700, marginLeft: 'auto' },
  emptyItems: { textAlign: 'center', padding: '30px 0' },
  summaryItems:{ minHeight: 80, marginBottom: 12 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '3px 0' },
  totalSection:{ borderTop: '1px solid #f0f0f0', paddingTop: 10, marginBottom: 14 },
  totalRow:   { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' },
  totalFinal: { fontSize: 16, fontWeight: 800, color: '#0f6e56', paddingTop: 8, borderTop: '1px solid #e0e0e0', marginTop: 4 },
  finalizeBtn:{ width: '100%', padding: '12px', background: '#0f6e56', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 8, fontFamily: 'inherit' },
  clearBtn:   { width: '100%', padding: '10px', background: '#f5f5f5', color: '#555', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 8, fontFamily: 'inherit' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' },
  tr:         { borderBottom: '1px solid #f8f8f8' },
  td:         { padding: '12px 14px', fontSize: 13, color: '#333', verticalAlign: 'middle' },
  itemCount:  { background: '#f0f7ff', color: '#1a6fa8', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  payBadge:   { background: '#e6f9f2', color: '#0f6e56', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  printBtn:   { background: '#f0f0f0', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', fontSize: 14 },
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  printModal: { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto' },
}