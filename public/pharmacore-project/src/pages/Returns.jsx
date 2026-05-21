import React from 'react';
import { exportToCSV, Empty } from '../components/ui';
import { formatPKR } from '../data/db';

export default function Returns({ db }) {
  const allReturns = [
    ...db.saleReturns.map(r => ({ ...r, type: 'Sale Return', ref: r.invoice, effect: `+${r.qty}`, effectColor: 'var(--success)' })),
    ...db.purchaseReturns.map(r => ({ ...r, type: 'Purchase Return', ref: r.po, effect: `-${r.qty}`, effectColor: 'var(--danger)' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleExport = () => {
    exportToCSV(
      [['Return#', 'Type', 'Reference', 'Medicine', 'Qty', 'Reason', 'Date', 'Qty Effect'],
       ...allReturns.map(r => [r.returnNo, r.type, r.ref, r.medName, r.qty, r.reason, r.date, r.effect])],
      'returns.csv'
    );
  };

  const totalSaleRefunds = db.saleReturns.reduce((a, r) => a + r.refund, 0);

  return (
    <div>
      <div className="metric-grid" style={{ marginBottom: 20 }}>
        <div className="metric-card">
          <div className="metric-label">Sale Returns</div>
          <div className="metric-value">{db.saleReturns.length}</div>
          <div className="metric-sub metric-up">Stock increased</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Purchase Returns</div>
          <div className="metric-value">{db.purchaseReturns.length}</div>
          <div className="metric-sub metric-down">Stock decreased</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Refund Amount</div>
          <div className="metric-value">{formatPKR(totalSaleRefunds)}</div>
          <div className="metric-sub">Sale returns only</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Returns</div>
          <div className="metric-value">{allReturns.length}</div>
          <div className="metric-sub">All time</div>
        </div>
      </div>

      <div className="card card-flush">
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="section-title">All Returns Log</span>
          <div style={{ flex: 1 }} />
          <button className="btn btn-sm" onClick={handleExport}><i className="ti ti-download" aria-hidden="true" /> Export CSV</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Return#</th><th>Type</th><th>Reference</th><th>Medicine</th>
              <th>Qty</th><th>Reason</th><th>Date</th><th>Stock Effect</th>
            </tr>
          </thead>
          <tbody>
            {allReturns.length ? allReturns.map((r, i) => (
              <tr key={i}>
                <td><b>{r.returnNo}</b></td>
                <td>
                  <span className={`badge badge-${r.type === 'Sale Return' ? 'info' : 'warning'}`}>{r.type}</span>
                </td>
                <td>{r.ref}</td>
                <td>{r.medName}</td>
                <td>{r.qty}</td>
                <td>{r.reason}</td>
                <td>{r.date}</td>
                <td style={{ fontWeight: 600, color: r.effectColor }}>
                  {r.effect} units
                </td>
              </tr>
            )) : <Empty text="No returns recorded yet" />}
          </tbody>
        </table>
      </div>
    </div>
  );
}
