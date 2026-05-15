import React, { useState } from 'react';
import { today, padId } from '../data/db';

export default function PurchaseModal({ db, updateDB, onClose }) {
  const [form, setForm] = useState({ supplier: '', date: today(), medId: '', qty: 1, price: 0, invNo: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.supplier.trim() || !form.medId || !form.qty) { alert('Please fill all required fields'); return; }
    updateDB(d => {
      const m = d.medicines.find(x => x.id === +form.medId);
      if (m) m.qty += +form.qty;
      const po = padId(d.nextPurId, 'PO-');
      d.purchases.unshift({ id: d.nextPurId, po, date: form.date, supplier: form.supplier, medId: +form.medId, qty: +form.qty, price: +form.price, total: +form.qty * +form.price, status: 'Received', invNo: form.invNo });
      d.nextPurId++;
    });
    onClose();
  };

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">New Purchase</span>
          <button className="btn btn-sm btn-icon" onClick={onClose}><i className="ti ti-x" aria-hidden="true" /></button>
        </div>
        <div className="form-grid">
          <div className="input-group"><label>Supplier Name *</label><input value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Supplier name" /></div>
          <div className="input-group"><label>Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
        </div>
        <div className="input-group">
          <label>Medicine *</label>
          <select value={form.medId} onChange={e => set('medId', e.target.value)}>
            <option value="">Select medicine...</option>
            {db.medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="form-grid">
          <div className="input-group"><label>Quantity</label><input type="number" min="1" value={form.qty} onChange={e => set('qty', e.target.value)} /></div>
          <div className="input-group"><label>Purchase Price/Unit (PKR)</label><input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} /></div>
          <div className="input-group"><label>Supplier Invoice#</label><input value={form.invNo} onChange={e => set('invNo', e.target.value)} placeholder="Supplier's invoice no" /></div>
        </div>
        {form.qty && form.price && (
          <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 14 }}>
            Total: <b style={{ color: 'var(--brand)' }}>PKR {(+form.qty * +form.price).toLocaleString()}</b>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}><i className="ti ti-check" aria-hidden="true" /> Save Purchase</button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
