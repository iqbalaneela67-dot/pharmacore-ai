/* eslint-disable */
import React, { useState } from 'react';
import { today, formatPKR } from '../data/db';
import { StatusBadge, exportToCSV, Empty } from '../components/ui';
import PrintModal from '../components/PrintModal';
import { supabase } from '../utils/supabaseClient';

export default function Sales({ db, updateDB }) {
  const [tab, setTab] = useState('list');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [printBill, setPrintBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [srForm, setSrForm] = useState({ invoice: '', date: today, medId: '', qty: 1, reason: 'Expired', notes: '' });
  const setSR = (k, v) => setSrForm(f => ({ ...f, [k]: v }));

  const filtered = db.sales.filter(s =>
    (!search || (s.patient||'').toLowerCase().includes(search.toLowerCase()) || (s.invoice||'').toLowerCase().includes(search.toLowerCase())) &&
    (!date || s.date === date)
  );

  const processSaleReturn = async () => {
    if (!srForm.invoice.trim() || !srForm.medId || !srForm.qty) { alert('Please fill Invoice, Medicine, and Quantity'); return; }
    setLoading(true);
    try {
      const med = db.medicines.find(m => m.id === +srForm.medId);
      const refundAmt = (med?.mrp || 0) * +srForm.qty;
      const returnNo = 'SR-' + String(Date.now()).slice(-6);
      const { error: e1 } = await supabase.from('sale_returns').insert({ return_no: returnNo, invoice: srForm.invoice, med_id: +srForm.medId, med_name: med?.name||'N/A', qty: +srForm.qty, reason: srForm.reason, notes: srForm.notes, date: srForm.date, refund: refundAmt });
      if (e1) throw e1;
      const newQty = (med?.qty || 0) + +srForm.qty;
      const { error: e2 } = await supabase.from('medicines').update({ qty: newQty }).eq('id', +srForm.medId);
      if (e2) throw e2;
      await updateDB(d => { const m = d.medicines.find(x => x.id === +srForm.medId); if (m) m.qty = newQty; d.saleReturns.unshift({ id: Date.now(), returnNo, invoice: srForm.invoice, medId: +srForm.medId, medName: med?.name||'N/A', qty: +srForm.qty, reason: srForm.reason, notes: srForm.notes, date: srForm.date, refund: refundAmt }); });
      setSrForm({ invoice: '', date: today, medId: '', qty: 1, reason: 'Expired', notes: '' });
      alert('Sale return saved. Stock +' + srForm.qty + ' units.');
    } catch (err) { alert('Error: ' + err.message); } finally { setLoading(false); }
  };

  const makePrintBill = (s) => {
    const med = db.medicines.find(m => m.id === s.medId);
    setPrintBill({ invoice: s.invoice, patient: s.patient, doctor: '', date: s.date, items: [{ name: med?.name||'N/A', qty: s.qty, mrp: med?.mrp||0, total: s.total }], subtotal: s.total, discount: 0, total: s.total, payment: 'Cash' });
  };

  return (
    <div>
      <div className="tabs">
        <div className={`tab ${tab==='list'?'active':''}`} onClick={() => setTab('list')}>Sales List</div>
        <div className={`tab ${tab==='return'?'active':''}`} onClick={() => setTab('return')}>Sale Return</div>
      </div>
      {tab === 'list' && (<>
        <div className="filters">
          <input type="search" placeholder="Search by patient or invoice..." value={search} onChange={e => setSearch(e.target.value)} />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          <div style={{ flex:1 }} />
          <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{filtered.length} records</span>
          <button className="btn btn-sm" onClick={() => exportToCSV([['Invoice','Date','Patient','Qty','Total','Status'],...filtered.map(s=>[s.invoice,s.date,s.patient,s.qty,s.total,s.status])],'sales.csv')}>Export CSV</button>
        </div>
        <div className="card card-flush">
          <table>
            <thead><tr><th>Invoice#</th><th>Date</th><th>Patient</th><th>Medicine</th><th>Qty</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length ? filtered.map(s => {
                const med = db.medicines.find(m => m.id === s.medId);
                return (<tr key={s.id}><td><b>{s.invoice}</b></td><td>{s.date}</td><td>{s.patient}</td><td>{med?.name||'N/A'}</td><td>{s.qty}</td><td style={{fontWeight:600}}>{formatPKR(s.total)}</td><td><StatusBadge status={s.status}/></td><td><button className="btn btn-sm btn-icon" onClick={() => makePrintBill(s)}>Print</button></td></tr>);
              }) : <Empty text="No sales found" />}
            </tbody>
          </table>
        </div>
      </>)}
      {tab === 'return' && (<>
        <div className="card" style={{ marginBottom:16 }}>
          <div className="section-header"><span className="section-title">Process Sale Return</span></div>
          <div className="form-grid">
            <div className="input-group"><label>Invoice Number *</label><input value={srForm.invoice} onChange={e=>setSR('invoice',e.target.value)} placeholder="e.g. INV-001"/></div>
            <div className="input-group"><label>Return Date</label><input type="date" value={srForm.date} onChange={e=>setSR('date',e.target.value)}/></div>
          </div>
          <div className="input-group"><label>Medicine *</label>
            <select value={srForm.medId} onChange={e=>setSR('medId',e.target.value)}>
              <option value="">Select medicine...</option>
              {db.medicines.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-grid">
            <div className="input-group"><label>Qty *</label><input type="number" min="1" value={srForm.qty} onChange={e=>setSR('qty',e.target.value)}/></div>
            <div className="input-group"><label>Reason</label>
              <select value={srForm.reason} onChange={e=>setSR('reason',e.target.value)}>
                <option>Expired</option><option>Damaged</option><option>Wrong medicine</option><option>Patient refused</option><option>Other</option>
              </select>
            </div>
          </div>
          <div className="input-group"><label>Notes</label><textarea rows={2} value={srForm.notes} onChange={e=>setSR('notes',e.target.value)} placeholder="Additional notes..."/></div>
          <button className="btn btn-primary" onClick={processSaleReturn} disabled={loading}>{loading?'Saving...':'Process Return'}</button>
        </div>
        <div className="card card-flush">
          <table>
            <thead><tr><th>Return#</th><th>Invoice</th><th>Medicine</th><th>Qty</th><th>Reason</th><th>Date</th><th>Refund</th></tr></thead>
            <tbody>{db.saleReturns.length ? db.saleReturns.map(r=>(<tr key={r.id}><td><b>{r.returnNo}</b></td><td>{r.invoice}</td><td>{r.medName}</td><td>{r.qty}</td><td>{r.reason}</td><td>{r.date}</td><td style={{color:'var(--success)',fontWeight:600}}>{formatPKR(r.refund)}</td></tr>)) : <Empty text="No sale returns recorded"/>}</tbody>
          </table>
        </div>
      </>)}
      {printBill && <PrintModal bill={printBill} onClose={() => setPrintBill(null)} />}
    </div>
  );
}

