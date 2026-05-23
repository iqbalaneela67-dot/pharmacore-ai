import React, { useState } from 'react';
import { today, padId } from '../data/db';

export default function SaleModal({ db, updateDB, onClose }) {
  const [form, setForm] = useState({ patient: '', date: today(), medId: '', qty: 1, discount: 0 });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.patient.trim() || !form.medId || !form.qty) { alert('Please fill all required fields'); return; }
    const med = db.medicines.find(m => m.id === +form.medId);
    if (!med || med.qty < +form.qty) { alert('Insufficient stock! Available: ' + (med?.qty || 0)); return; }
    const sub = +form.qty * med.mrp;
    const total = Math.round(sub * (1 - +form.discount / 100));
    updateDB(d => {
      const m = d.medicines.find(x => x.id === +form.medId);
      m.qty -= +form.qty;
      const invoice = padId(d.nextSaleId, 'INV-');
      d.sales.unshift({ id: d.nextSaleId, invoice, date: form.date, patient: form.patient, medId: +form.medId, qty: +form.qty, total, discount: +form.discount, status: 'Paid' });
      d.nextSaleId++;
    });
    onClose();
  };

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">New Sale</span>
          <button className="btn btn-sm btn-icon" onClick={onClose}><i className="ti ti-x" aria-hidden="true" /></button>
        </div>
        <div className="form-grid">
          <div className="input-group"><label>Patient Name *</label><input value={form.patient} onChange={e => set('patient', e.target.value)} placeholder="Patient name" /></div>
          <div className="input-group"><label>Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
        </div>
        <div className="input-group">
          <label>Medicine *</label>
          <select value={form.medId} onChange={e => set('medId', e.target.value)}>
            <option value="">Select medicine...</option>
            {db.medicines.filter(m => m.qty > 0).map(m => <option key={m.id} value={m.id}>{m.name} (Stock: {m.qty}, PKR {m.mrp})</option>)}
          </select>
        </div>
        <div className="form-grid">
          <div className="input-group"><label>Quantity</label><input type="number" min="1" value={form.qty} onChange={e => set('qty', e.target.value)} /></div>
          <div className="input-group"><label>Discount %</label><input type="number" min="0" max="100" value={form.discount} onChange={e => set('discount', e.target.value)} /></div>
        </div>
        {form.medId && form.qty && (
          <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 14 }}>
            Total: <b style={{ color: 'var(--brand)' }}>PKR {Math.round((db.medicines.find(m => m.id === +form.medId)?.mrp || 0) * +form.qty * (1 - +form.discount / 100))}</b>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}><i className="ti ti-check" aria-hidden="true" /> Save Sale</button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
