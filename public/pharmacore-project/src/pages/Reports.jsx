import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { getMedStatus, formatPKR } from '../data/db';
import { MedStatusBadge, exportToCSV } from '../components/ui';
Chart.register(...registerables);

export default function Reports({ db }) {
  const revRef = useRef(); const topRef = useRef();
  const revInst = useRef(); const topInst = useRef();

  const totalSales = db.sales.reduce((a, s) => a + s.total, 0);
  const totalPur = db.purchases.reduce((a, p) => a + p.total, 0);
  const profit = totalSales - totalPur;
  const avgSale = db.sales.length ? Math.round(totalSales / db.sales.length) : 0;

  useEffect(() => {
    revInst.current?.destroy();
    topInst.current?.destroy();

    revInst.current = new Chart(revRef.current, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          { label: 'Revenue', data: [12000, 15000, 9000, 18000, totalSales, 0], backgroundColor: 'rgba(29,158,117,0.75)', borderRadius: 5 },
          { label: 'Purchases', data: [8000, 10000, 7000, 12000, totalPur, 0], backgroundColor: 'rgba(37,99,235,0.6)', borderRadius: 5 },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } }, scales: { y: { ticks: { callback: v => 'PKR ' + v } } } },
    });

    const medSales = db.medicines.map(m => ({
      name: m.name.split(' ')[0],
      count: db.sales.filter(s => s.medId === m.id).reduce((a, s) => a + s.qty, 0),
    })).sort((a, b) => b.count - a.count).slice(0, 6);

    topInst.current = new Chart(topRef.current, {
      type: 'bar',
      data: {
        labels: medSales.map(m => m.name),
        datasets: [{ label: 'Units Sold', data: medSales.map(m => m.count), backgroundColor: 'rgba(124,58,237,0.7)', borderRadius: 5 }],
      },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } },
    });

    return () => { revInst.current?.destroy(); topInst.current?.destroy(); };
  }, [db]);

  const now = new Date();
  const expiringSoon = db.medicines.filter(m => {
    const d = new Date(m.expiry);
    const diffDays = (d - now) / (1000 * 60 * 60 * 24);
    return diffDays < 90;
  }).sort((a, b) => new Date(a.expiry) - new Date(b.expiry));

  return (
    <div>
      <div className="metric-grid">
        {[
          { label: 'Total Revenue', value: formatPKR(totalSales), cls: '' },
          { label: 'Total Purchases', value: formatPKR(totalPur), cls: '' },
          { label: 'Gross Profit', value: formatPKR(profit), cls: profit >= 0 ? 'metric-up' : 'metric-down' },
          { label: 'Avg Sale Value', value: formatPKR(avgSale), cls: '' },
          { label: 'Total Bills', value: db.bills.length, cls: '' },
          { label: 'Total Returns', value: db.saleReturns.length + db.purchaseReturns.length, cls: '' },
        ].map((m, i) => (
          <div className="metric-card" key={i}>
            <div className="metric-label">{m.label}</div>
            <div className={`metric-value ${m.cls}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="chart-grid-2">
        <div className="chart-card">
          <div className="chart-title">Monthly Revenue vs Purchases</div>
          <div style={{ position: 'relative', height: 220 }}><canvas ref={revRef} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Top Selling Medicines</div>
          <div style={{ position: 'relative', height: 220 }}><canvas ref={topRef} /></div>
        </div>
      </div>

      <div className="card card-flush">
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="section-title">⚠️ Expiry Report (Next 90 Days + Already Expired)</span>
          <div style={{ flex: 1 }} />
          <button className="btn btn-sm" onClick={() => exportToCSV(
            [['Medicine', 'Category', 'Batch', 'Expiry', 'Qty', 'MRP', 'Status'],
             ...expiringSoon.map(m => [m.name, m.category, m.batch, m.expiry, m.qty, m.mrp, getMedStatus(m)])],
            'expiry-report.csv'
          )}><i className="ti ti-download" aria-hidden="true" /> Export CSV</button>
        </div>
        <table>
          <thead><tr><th>Medicine</th><th>Category</th><th>Batch</th><th>Expiry</th><th>Qty</th><th>MRP Value</th><th>Status</th></tr></thead>
          <tbody>
            {expiringSoon.length ? expiringSoon.map(m => (
              <tr key={m.id} className={getMedStatus(m) === 'Expired' ? 'row-expired' : 'row-low'}>
                <td><b>{m.name}</b></td>
                <td>{m.category}</td>
                <td>{m.batch}</td>
                <td><b>{m.expiry}</b></td>
                <td>{m.qty}</td>
                <td>{formatPKR(m.qty * m.mrp)}</td>
                <td><MedStatusBadge med={m} /></td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="empty">✅ No medicines expiring in next 90 days</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
