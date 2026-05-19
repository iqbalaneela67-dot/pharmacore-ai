import React, { useState } from 'react';
import { today, padId, formatPKR } from '../data/db';
import { StatusBadge, exportToCSV, Empty } from '../components/ui';

export default function Purchases({ db, updateDB }) {
  const [tab, setTab] = useState('list');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');

  const [prForm, setPrForm] = useState({ po: '', supplier: '', medId: '', qty: 1, reason: 'Expired' });
  const setPR = (k, v) => setPrForm(f => ({ ...f, [k]: v }));

  const filtered = db.purchases.filter(p =>
    (!search || p.supplier.toLowerCase().includes(search.toLowerCase()) || p.po.toLowerCase().includes(search.toLowerCase())) &&
    (!date || p.date === date)
  );

  const processPurchaseReturn = () => {
    if (!prForm.po.trim() || !prForm.medId || !prForm.qty) { alert('Please fill PO Number, Medicine, and Quantity'); return; }
    const med = db.medicines.find(m => m.id === +prForm.medId);
    updateDB(d => {
      const m = d.medicines.find(x => x.id === +prForm.medId);
      if (m) m.qty = Math.max(0, m.qty - +prForm.qty); // Stock decreases on purchase return
      const returnNo = padId(d.nextPRId, 'PR-');
      d.purchaseReturns.unshift({
        id: d.nextPRId, returnNo, po: prForm.po, supplier: prForm.supplier,
        medId: +prForm.medId, medName: med?.name || 'N/A',
        qty: +prForm.qty, reason: prForm.reason, date: today()
      });
      d.nextPRId++;
    });
    setPrForm({ po: '', supplier: '', medId: '', qty: 1, reason: 'Expired' });
    alert(`Purchase return processed. Stock decreased by ${prForm.qty} units.`);
  };

  return (
    <div>
      <div className="tabs">
        <div className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>Purchase List</div>
        <div className={`tab ${tab === 'return' ? 'active' : ''}`} onClick={() => setTab('return')}>Purchase Return</div>
      </div>

      {tab === 'list' && (
        <>
          <div className="filters">
            <input type="search" placeholder="Search by supplier or PO..." value={search} onChange={e => setSearch(e.target.value)} />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{filtered.length} records</span>
            <button className="btn btn-sm" onClick={() => exportToCSV(
              [['PO#', 'Date', 'Supplier', 'Medicine', 'Qty', 'Unit Price', 'Total', 'Status'],
               ...filtered.map(p => {
                 const med = db.medicines.find(m => m.id === p.medId);
                 return [p.po, p.date, p.supplier, med?.name || 'N/A', p.qty, p.price, p.total, p.status];
               })],
              'purchases.csv'
            )}><i className="ti ti-download" aria-hidden="true" /> Export CSV</button>
          </div>
          <div className="card card-flush">
            <table>
              <thead><tr><th>PO#</th><th>Date</th><th>Supplier</th><th>Medicine</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.length ? filtered.map(p => {
                  const med = db.medicines.find(m => m.id === p.medId);
                  return (
                    <tr key={p.id}>
                      <td><b>{p.po}</b></td>
                      <td>{p.date}</td>
                      <td>{p.supplier}</td>
                      <td>{med?.name || 'N/A'}</td>
                      <td>{p.qty}</td>
                      <td>PKR {p.price}</td>
                      <td style={{ fontWeight: 600 }}>{formatPKR(p.total)}</td>
                      <td><StatusBadge status={p.status} /></td>
                    </tr>
                  );
                }) : <Empty text="No purchases found" />}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'return' && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-header"><span className="section-title">Process Purchase Return</span></div>
            <div className="form-grid">
              <div className="input-group"><label>PO Number *</label><input value={prForm.po} onChange={e => setPR('po', e.target.value)} placeholder="e.g. PO-001" /></div>
              <div className="input-group"><label>Supplier Name</label><input value={prForm.supplier} onChange={e => setPR('supplier', e.target.value)} placeholder="Supplier name" /></div>
            </div>
            <div className="input-group">
              <label>Medicine *</label>
              <select value={prForm.medId} onChange={e => setPR('medId', e.target.value)}>
                <option value="">Select medicine...</option>
                {db.medicines.map(m => <option key={m.id} value={m.id}>{m.name} (Stock: {m.qty})</option>)}
              </select>
            </div>
            <div className="form-grid">
              <div className="input-group"><label>Return Quantity *</label><input type="number" min="1" value={prForm.qty} onChange={e => setPR('qty', e.target.value)} /></div>
              <div className="input-group">
                <label>Reason</label>
                <select value={prForm.reason} onChange={e => setPR('reason', e.target.value)}>
                  <option>Expired</option><option>Damaged</option><option>Quality issue</option><option>Wrong batch</option><option>Overstock</option>
                </select>
              </div>
            </div>
            <div style={{ background: 'var(--warning-bg)', padding: '8px 14px', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--warning-text)', marginBottom: 12 }}>
              ⚠️ Purchase return will <b>decrease</b> the medicine quantity from stock.
            </div>
            <button className="btn btn-primary" onClick={processPurchaseReturn}><i className="ti ti-check" aria-hidden="true" /> Process Return</button>
          </div>

          <div className="card card-flush">
            <table>
              <thead><tr><th>Return#</th><th>PO#</th><th>Supplier</th><th>Medicine</th><th>Qty</th><th>Reason</th><th>Date</th></tr></thead>
              <tbody>
                {db.purchaseReturns.length ? db.purchaseReturns.map(r => (
                  <tr key={r.id}>
                    <td><b>{r.returnNo}</b></td><td>{r.po}</td><td>{r.supplier}</td>
                    <td>{r.medName}</td><td>{r.qty}</td><td>{r.reason}</td><td>{r.date}</td>
                  </tr>
                )) : <Empty text="No purchase returns recorded" />}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
