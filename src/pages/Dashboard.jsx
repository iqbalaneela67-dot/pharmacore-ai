import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { getMedStatus, formatPKR } from '../data/db';
import { StatusBadge } from '../components/ui';
Chart.register(...registerables);

export default function Dashboard({ db }) {
  const salesChartRef = useRef(null);
  const catChartRef = useRef(null);
  const salesInstance = useRef(null);
  const catInstance = useRef(null);

  const totalSales = db.sales.reduce((a, s) => a + s.total, 0);
  const todaySales = db.sales.filter(s => s.date === new Date().toISOString().split('T')[0]).reduce((a, s) => a + s.total, 0);
  const totalInv = db.medicines.reduce((a, m) => a + m.qty * m.mrp, 0);
  const lowStock = db.medicines.filter(m => getMedStatus(m) === 'Low Stock').length;
  const expired = db.medicines.filter(m => getMedStatus(m) === 'Expired').length;
  const totalPurchases = db.purchases.reduce((a, p) => a + p.total, 0);

  useEffect(() => {
    if (salesInstance.current) salesInstance.current.destroy();
    if (catInstance.current) catInstance.current.destroy();

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    salesInstance.current = new Chart(salesChartRef.current, {
      type: 'line',
      data: {
        labels: days,
        datasets: [
          { label: 'Sales', data: [320, 450, 280, 600, 540, 710, totalSales], borderColor: '#1d9e75', backgroundColor: 'rgba(29,158,117,0.08)', tension: 0.4, fill: true, pointRadius: 3 },
          { label: 'Purchases', data: [800, 600, 1200, 400, 900, 500, totalPurchases / 7], borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.05)', tension: 0.4, fill: true, pointRadius: 3, borderDash: [4, 4] },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 8 } } }, scales: { y: { ticks: { callback: v => 'PKR ' + v } } } },
    });

    const cats = [...new Set(db.medicines.map(m => m.category))];
    const catQtys = cats.map(c => db.medicines.filter(m => m.category === c).reduce((a, m) => a + m.qty, 0));
    catInstance.current = new Chart(catChartRef.current, {
      type: 'doughnut',
      data: { labels: cats, datasets: [{ data: catQtys, backgroundColor: ['#1d9e75','#2563eb','#d97706','#dc2626','#7c3aed','#059669','#0891b2','#db2777'], borderWidth: 1 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 8 } } } },
    });

    return () => { salesInstance.current?.destroy(); catInstance.current?.destroy(); };
  }, [db]);

  const alerts = db.medicines.filter(m => getMedStatus(m) !== 'In Stock').slice(0, 6);
  const recent = [...db.sales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div>
      <div className="metric-grid">
        {[
          { label: "Today's Sales", value: formatPKR(todaySales), sub: '● Live', subClass: 'metric-up' },
          { label: 'Total Revenue', value: formatPKR(totalSales), sub: `${db.sales.length} transactions` },
          { label: 'Inventory Value', value: formatPKR(totalInv), sub: `${db.medicines.length} medicines` },
          { label: 'Total Purchases', value: formatPKR(totalPurchases), sub: `${db.purchases.length} orders` },
          { label: 'Low Stock', value: lowStock, sub: 'Needs reorder', subClass: lowStock > 0 ? 'metric-down' : '' },
          { label: 'Expired Items', value: expired, sub: 'Action required', subClass: expired > 0 ? 'metric-down' : '' },
        ].map((m, i) => (
          <div className="metric-card" key={i}>
            <div className="metric-label">{m.label}</div>
            <div className={`metric-value ${m.subClass || ''}`}>{m.value}</div>
            {m.sub && <div className={`metric-sub ${m.subClass || ''}`}>{m.sub}</div>}
          </div>
        ))}
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-title">Sales & Purchases — Last 7 Days</div>
          <div style={{ position: 'relative', height: 220 }}><canvas ref={salesChartRef} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Stock by Category</div>
          <div style={{ position: 'relative', height: 220 }}><canvas ref={catChartRef} /></div>
        </div>
      </div>

      <div className="chart-grid-2">
        <div className="card">
          <div className="chart-title">⚠️ Stock Alerts</div>
          <div className="alert-list">
            {alerts.length ? alerts.map(m => {
              const s = getMedStatus(m);
              return (
                <div className="alert-item" key={m.id}>
                  <div className="alert-dot" style={{ background: s === 'Expired' ? 'var(--danger)' : 'var(--warning)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Qty: {m.qty} · Expiry: {m.expiry}</div>
                  </div>
                  <StatusBadge status={s} />
                </div>
              );
            }) : <div className="empty">✅ All stock levels are healthy</div>}
          </div>
        </div>

        <div className="card">
          <div className="chart-title">Recent Transactions</div>
          <div className="alert-list">
            {recent.map(s => {
              const med = db.medicines.find(m => m.id === s.medId);
              return (
                <div className="alert-item" key={s.id}>
                  <div className="alert-dot" style={{ background: 'var(--brand)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{s.patient}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.invoice} · {med?.name} · {s.date}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>{formatPKR(s.total)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
