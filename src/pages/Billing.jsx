/* eslint-disable */
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { today, padId, formatPKR, getMedStatus, PAYMENT_MODES } from '../data/db';
import { Empty } from '../components/ui';
import PrintModal from '../components/PrintModal';

export default function Billing({ db, updateDB, openScanner, scannedMed, setScannedMed }) {
  const [patient, setPatient] = useState('');
  const [phone, setPhone] = useState('');
  const [doctor, setDoctor] = useState('');
  const [billDate, setBillDate] = useState(today);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState('Cash');
  const [items, setItems] = useState([]);
  const [selMedId, setSelMedId] = useState('');
  const [selQty, setSelQty] = useState(1);
  const [printBill, setPrintBill] = useState(null);

  // Handle scanned medicine from scanner
  useEffect(() => {
    if (scannedMed) {
      addItem(scannedMed.id, 1);
      setScannedMed(null);
    }
  }, [scannedMed]);

  const availableMeds = db.medicines.filter(m => m.qty > 0 && getMedStatus(m) !== 'Expired');

  const addItem = (medId, qty = selQty) => {
    const id = +medId;
    const med = db.medicines.find(m => m.id === id);
    if (!med) return;
    const totalQtyInBill = (items.find(i => i.medId === id)?.qty || 0) + qty;
    if (totalQtyInBill > med.qty) { alert(`Insufficient stock! Available: ${med.qty}`); return; }
    setItems(prev => {
      const ex = prev.find(i => i.medId === id);
      if (ex) return prev.map(i => i.medId === id ? { ...i, qty: i.qty + qty, total: (i.qty + qty) * i.mrp } : i);
      return [...prev, { medId: id, name: med.name, qty, mrp: med.mrp, total: qty * med.mrp }];
    });
    setSelMedId('');
    setSelQty(1);
  };

  const updateQty = (medId, qty) => {
    const q = Math.max(1, +qty || 1);
    const med = db.medicines.find(m => m.id === medId);
    if (med && q > med.qty) { alert('Insufficient stock! Available: ' + med.qty); return; }
    setItems(prev => prev.map(i => i.medId === medId ? { ...i, qty: q, total: q * i.mrp } : i));
  };

  const removeItem = (medId) => setItems(prev => prev.filter(i => i.medId !== medId));

  const subtotal = items.reduce((a, i) => a + i.total, 0);
  const discAmt = Math.round(subtotal * discount / 100);
  const total = subtotal - discAmt;

  const finalize = () => {
    if (!patient.trim()) { alert('Patient name is required'); return; }
    if (!items.length) { alert('Please add at least one medicine'); return; }
    const invoice = padId(db.nextBillId, 'BILL-');
    const bill = { id: db.nextBillId, invoice, patient, phone, doctor, date: billDate, items: [...items], subtotal, discount: discAmt, total, payment };
    updateDB(d => {
      // Deduct stock
      items.forEach(item => { const m = d.medicines.find(x => x.id === item.medId); if (m) m.qty -= item.qty; });
      d.bills.unshift(bill);
      d.nextBillId++;
      // Also create a sale record
      d.sales.unshift({ id: d.nextSaleId, invoice, date: billDate, patient, medId: items[0]?.medId, qty: items.reduce((a, i) => a + i.qty, 0), total, discount, status: 'Paid' });
      d.nextSaleId++;
    });
    setPrintBill(bill);
    // Clear form
    setPatient(''); setPhone(''); setDoctor(''); setDiscount(0); setItems([]); setBillDate(today);
  };

  return (
    <div>
      <div className="billing-layout">
        {/* Left: form */}
        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="section-header"><span className="section-title">Patient Information</span></div>
            <div className="form-grid">
              <div className="input-group"><label>Patient Name *</label><input value={patient} onChange={e => setPatient(e.target.value)} placeholder="Full name" /></div>
              <div className="input-group"><label>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="03xx-xxxxxxx" /></div>
              <div className="input-group"><label>Doctor / Referred By</label><input value={doctor} onChange={e => setDoctor(e.target.value)} placeholder="Dr. name" /></div>
              <div className="input-group"><label>Date</label><input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} /></div>
            </div>
          </div>

          <div className="card">
            <div className="section-header">
              <span className="section-title">Add Medicines</span>
              <button className="btn btn-sm" onClick={() => openScanner('billing')}>
                <i className="ti ti-barcode" aria-hidden="true" /> Scan Barcode
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px auto', gap: 8, marginBottom: 14 }}>
              <select value={selMedId} onChange={e => setSelMedId(e.target.value)}>
                <option value="">Select medicine...</option>
                {availableMeds.map(m => <option key={m.id} value={m.id}>{m.name} â€” PKR {m.mrp} (Stock: {m.qty})</option>)}
              </select>
              <input type="number" min="1" value={selQty} onChange={e => setSelQty(+e.target.value)} placeholder="Qty" />
              <button className="btn btn-primary" onClick={() => selMedId && addItem(selMedId)}>
                <i className="ti ti-plus" aria-hidden="true" /> Add
              </button>
            </div>

            {items.length > 0 && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 70px 90px 80px 30px', gap: 8, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', padding: '0 2px', marginBottom: 6 }}>
                  <span>Medicine</span><span>Qty</span><span>Rate</span><span>Total</span><span></span>
                </div>
                {items.map(item => (
                  <div key={item.medId} className="bill-item-row">
                    <span style={{ fontSize: 13 }}>{item.name}</span>
                    <input type="number" min="1" value={item.qty} style={{ padding: '5px 7px', fontSize: 12 }} onChange={e => updateQty(item.medId, e.target.value)} />
                    <span style={{ fontSize: 13 }}>PKR {item.mrp}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>PKR {item.total}</span>
                    <button className="btn btn-sm btn-icon" style={{ color: 'var(--danger-text)' }} onClick={() => removeItem(item.medId)}>
                      <i className="ti ti-x" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!items.length && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                <i className="ti ti-shopping-cart" style={{ fontSize: 28, display: 'block', marginBottom: 6 }} aria-hidden="true" />
                No items added yet
              </div>
            )}
          </div>
        </div>

        {/* Right: summary */}
        <div>
          <div className="card" style={{ position: 'sticky', top: 0 }}>
            <div className="chart-title" style={{ marginBottom: 14 }}>
              <i className="ti ti-receipt" aria-hidden="true" /> Invoice Summary
            </div>

            <div style={{ minHeight: 80, marginBottom: 12 }}>
              {items.map(item => (
                <div key={item.medId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name} Ã—{item.qty}</span>
                  <span>PKR {item.total}</span>
                </div>
              ))}
              {!items.length && <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', padding: '12px 0' }}>No items</div>}
            </div>

            <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
              <div className="bill-total-row"><span>Subtotal</span><span>PKR {subtotal}</span></div>
              <div className="bill-total-row" style={{ color: 'var(--danger-text)' }}><span>Discount ({discount}%)</span><span>-PKR {discAmt}</span></div>
              <div className="bill-total-row final"><span>Total</span><span>PKR {total}</span></div>
            </div>

            <div className="form-grid" style={{ marginTop: 14 }}>
              <div className="input-group"><label>Discount %</label><input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(+e.target.value)} /></div>
              <div className="input-group">
                <label>Payment Mode</label>
                <select value={payment} onChange={e => setPayment(e.target.value)}>
                  {PAYMENT_MODES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary" onClick={finalize}>
                <i className="ti ti-check" aria-hidden="true" /> Finalize & Print Bill
              </button>
              <button className="btn" onClick={() => { setItems([]); setPatient(''); setPhone(''); setDoctor(''); setDiscount(0); }}>
                <i className="ti ti-trash" aria-hidden="true" /> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="card card-flush" style={{ marginTop: 20 }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <span className="section-title">Billing History</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{db.bills.length} bills</span>
        </div>
        <table>
          <thead><tr><th>Invoice#</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Actions</th></tr></thead>
          <tbody>
            {db.bills.length ? db.bills.map(b => (
              <tr key={b.id}>
                <td><b>{b.invoice}</b></td>
                <td>{b.patient}</td>
                <td>{b.doctor || 'â€”'}</td>
                <td>{b.date}</td>
                <td>{b.items.length} items</td>
                <td style={{ fontWeight: 600 }}>{formatPKR(b.total)}</td>
                <td><span className="badge badge-gray">{b.payment}</span></td>
                <td>
                  <button className="btn btn-sm btn-icon" onClick={() => setPrintBill(b)} title="Reprint">
                    <i className="ti ti-printer" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            )) : <Empty text="No bills generated yet" />}
          </tbody>
        </table>
      </div>

      {printBill && <PrintModal bill={printBill} onClose={() => setPrintBill(null)} />}
    </div>
  );
}


