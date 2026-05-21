import React, { useState, useEffect } from 'react';
import { CATEGORIES, getMedStatus, today } from '../data/db';

const empty = { name:'', category:'Analgesics', barcode:'', batch:'', expiry:'', qty:0, mrp:0, pp:0, mfr:'', minStock:10 };

export default function MedicineModal({ db, updateDB, onClose, editMed = null }) {
  const [form, setForm] = useState(editMed ? { ...editMed } : { ...empty });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name.trim()) { alert('Medicine name is required'); return; }
    updateDB(d => {
      if (editMed) {
        const idx = d.medicines.findIndex(m => m.id === editMed.id);
        if (idx > -1) d.medicines[idx] = { ...d.medicines[idx], ...form };
      } else {
        d.medicines.push({ ...form, id: d.nextMedId++, barcode: form.barcode || String(Date.now()) });
      }
    });
    onClose();
  };

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{editMed ? 'Edit Medicine' : 'Add Medicine'}</span>
          <button className="btn btn-sm btn-icon" onClick={onClose}><i className="ti ti-x" aria-hidden="true" /></button>
        </div>

        <div className="form-grid">
          <div className="input-group full">
            <label>Medicine Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Panadol 500mg" />
          </div>
          <div className="input-group">
            <label>Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Barcode</label>
            <input value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="Scan or type barcode" />
          </div>
          <div className="input-group">
            <label>Batch No</label>
            <input value={form.batch} onChange={e => set('batch', e.target.value)} placeholder="Batch number" />
          </div>
          <div className="input-group">
            <label>Expiry Date</label>
            <input type="date" value={form.expiry} onChange={e => set('expiry', e.target.value)} />
          </div>
          <div className="input-group">
            <label>Quantity</label>
            <input type="number" min="0" value={form.qty} onChange={e => set('qty', +e.target.value)} />
          </div>
          <div className="input-group">
            <label>MRP (PKR)</label>
            <input type="number" min="0" value={form.mrp} onChange={e => set('mrp', +e.target.value)} />
          </div>
          <div className="input-group">
            <label>Purchase Price (PKR)</label>
            <input type="number" min="0" value={form.pp} onChange={e => set('pp', +e.target.value)} />
          </div>
          <div className="input-group">
            <label>Manufacturer</label>
            <input value={form.mfr} onChange={e => set('mfr', e.target.value)} placeholder="Company name" />
          </div>
          <div className="input-group">
            <label>Min Stock Alert</label>
            <input type="number" min="0" value={form.minStock} onChange={e => set('minStock', +e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>
            <i className="ti ti-check" aria-hidden="true" /> Save Medicine
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
