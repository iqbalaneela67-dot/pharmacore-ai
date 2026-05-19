import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { getMedStatus, formatPKR } from '../data/db';
import { StatusBadge } from '../components/ui';
Chart.register(...registerables);

// ── Animated counter hook ──────────────────────────────────────────────────
function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

// ── Sparkline mini-chart ───────────────────────────────────────────────────
function Sparkline({ data, color }) {
  const canvasRef = useRef(null);
  const instanceRef = useRef(null);
  useEffect(() => {
    if (instanceRef.current) instanceRef.current.destroy();
    instanceRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: data.map((_, i) => i),
        datasets: [{ data, borderColor: color, borderWidth: 2, tension: 0.4, fill: true,
          backgroundColor: color + '18', pointRadius: 0 }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } } },
    });
    return () => instanceRef.current?.destroy();
  }, [data, color]);
  return <canvas ref={canvasRef} />;
}

// ── KPI Card ───────────────────────────────────────────────────────────────
function KPICard({ label, rawValue, formatted, sub, subClass, icon, color, sparkData, trend, index }) {
  const animated = useCountUp(rawValue || 0);
  const displayVal = rawValue !== undefined
    ? (formatted ? formatted.replace(/[\d,]+/, animated.toLocaleString()) : animated.toLocaleString())
    : formatted;

  return (
    <div className="kpi-card" style={{ '--accent': color, animationDelay: `${index * 80}ms` }}>
      <div className="kpi-top">
        <div className="kpi-icon" style={{ background: color + '18', color }}>{icon}</div>
        {trend !== undefined && (
          <span className={`kpi-trend ${trend >= 0 ? 'up' : 'down'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="kpi-value">{displayVal}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className={`kpi-sub ${subClass || ''}`}>{sub}</div>}
      {sparkData && <div className="kpi-spark"><Sparkline data={sparkData} color={color} /></div>}
    </div>
  );
}

// ── AI Insight pill ────────────────────────────────────────────────────────
function AIPill({ text, type }) {
  const colors = { warning: '#f59e0b', danger: '#ef4444', success: '#10b981', info: '#3b82f6' };
  return (
    <div className="ai-pill" style={{ '--c': colors[type] || colors.info }}>
      <span className="ai-dot" />
      <span>{text}</span>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard({ db }) {
  const salesChartRef = useRef(null);
  const catChartRef = useRef(null);
  const salesInstance = useRef(null);
  const catInstance = useRef(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');

  // ── Computed metrics ──────────────────────────────────────────────────
  const totalSales    = useMemo(() => db.sales.reduce((a, s) => a + s.total, 0), [db]);
  const todaySales    = useMemo(() => db.sales.filter(s => s.date === new Date().toISOString().split('T')[0]).reduce((a, s) => a + s.total, 0), [db]);
  const totalInv      = useMemo(() => db.medicines.reduce((a, m) => a + m.qty * m.mrp, 0), [db]);
  const lowStock      = useMemo(() => db.medicines.filter(m => getMedStatus(m) === 'Low Stock').length, [db]);
  const expired       = useMemo(() => db.medicines.filter(m => getMedStatus(m) === 'Expired').length, [db]);
  const expiringSoon  = useMemo(() => db.medicines.filter(m => getMedStatus(m) === 'Expiring Soon').length, [db]);
  const totalPurchases = useMemo(() => db.purchases.reduce((a, p) => a + p.total, 0), [db]);
  const profit        = useMemo(() => totalSales - totalPurchases, [totalSales, totalPurchases]);
  const margin        = useMemo(() => totalSales ? Math.round((profit / totalSales) * 100) : 0, [profit, totalSales]);

  // ── Spark data (simulated weekly trend) ──────────────────────────────
  const salesSpark    = [320, 450, 280, 600, 540, 710, todaySales || 580];
  const invSpark      = [90000, 92000, 88000, 95000, totalInv * 0.9, totalInv * 0.95, totalInv];
  const purchSpark    = [800, 600, 1200, 400, 900, 500, totalPurchases / 7];
  const profitSpark   = salesSpark.map((s, i) => s - (purchSpark[i] || 0));

  // ── AI insights ───────────────────────────────────────────────────────
  const insights = useMemo(() => {
    const list = [];
    if (expired > 0) list.push({ text: `${expired} expired item${expired > 1 ? 's' : ''} — remove from shelf immediately`, type: 'danger' });
    if (expiringSoon > 0) list.push({ text: `${expiringSoon} item${expiringSoon > 1 ? 's' : ''} expiring within 30 days`, type: 'warning' });
    if (lowStock > 0) list.push({ text: `${lowStock} medicine${lowStock > 1 ? 's' : ''} below reorder level`, type: 'warning' });
    if (margin > 30) list.push({ text: `Profit margin at ${margin}% — healthy performance`, type: 'success' });
    if (todaySales === 0) list.push({ text: 'No sales recorded today — check POS terminal', type: 'info' });
    if (db.sales.length > 50) list.push({ text: `${db.sales.length} total transactions — strong volume`, type: 'success' });
    if (list.length === 0) list.push({ text: 'All systems operating normally', type: 'success' });
    return list.slice(0, 4);
  }, [expired, expiringSoon, lowStock, margin, todaySales, db]);

  // ── Charts ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (salesInstance.current) salesInstance.current.destroy();
    if (catInstance.current) catInstance.current.destroy();

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    salesInstance.current = new Chart(salesChartRef.current, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [
          {
            label: 'Sales (PKR)',
            data: [320, 450, 280, 600, 540, 710, todaySales || 580],
            backgroundColor: 'rgba(16,185,129,0.85)',
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Purchases (PKR)',
            data: [800, 600, 1200, 400, 900, 500, totalPurchases / 7],
            backgroundColor: 'rgba(59,130,246,0.7)',
            borderRadius: 6,
            borderSkipped: false,
            type: 'line',
            borderColor: '#3b82f6',
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointBackgroundColor: '#3b82f6',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11, family: 'DM Sans' }, padding: 12, usePointStyle: true } },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { size: 12 },
            bodyFont: { size: 11 },
            padding: 10,
            callbacks: { label: ctx => ` PKR ${ctx.parsed.y.toLocaleString()}` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { callback: v => 'PKR ' + v, font: { size: 10 } } },
        },
      },
    });

    const cats = [...new Set(db.medicines.map(m => m.category))];
    const catQtys = cats.map(c => db.medicines.filter(m => m.category === c).reduce((a, m) => a + m.qty, 0));
    catInstance.current = new Chart(catChartRef.current, {
      type: 'doughnut',
      data: {
        labels: cats,
        datasets: [{
          data: catQtys,
          backgroundColor: ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16'],
          borderWidth: 0,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11, family: 'DM Sans' }, padding: 10, usePointStyle: true, pointStyleWidth: 8 } },
          tooltip: {
            backgroundColor: '#0f172a',
            callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} units` },
          },
        },
      },
    });

    return () => { salesInstance.current?.destroy(); catInstance.current?.destroy(); };
  }, [db, timeRange]);

  const alerts = db.medicines.filter(m => getMedStatus(m) !== 'In Stock').slice(0, 8);
  const recent = [...db.sales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  // ── Top selling medicines ──────────────────────────────────────────────
  const topMeds = useMemo(() => {
    const map = {};
    db.sales.forEach(s => { map[s.medId] = (map[s.medId] || 0) + s.total; });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, rev]) => ({ med: db.medicines.find(m => m.id === parseInt(id)), rev }))
      .filter(x => x.med);
  }, [db]);

  const maxRev = topMeds[0]?.rev || 1;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .dash-root { font-family: 'DM Sans', sans-serif; }

        /* ── Header ── */
        .dash-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
        }
        .dash-title { font-size: 22px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.4px; }
        .dash-sub { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }
        .dash-actions { display: flex; gap: 8px; align-items: center; }
        .time-btn {
          padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
          cursor: pointer; border: 1px solid var(--border); background: transparent;
          color: var(--text-secondary); transition: all .15s;
        }
        .time-btn.active, .time-btn:hover {
          background: var(--brand); color: #fff; border-color: var(--brand);
        }
        .live-badge {
          display: flex; align-items: center; gap: 5px;
          background: rgba(16,185,129,0.1); color: #10b981;
          border: 1px solid rgba(16,185,129,0.25); border-radius: 20px;
          padding: 4px 10px; font-size: 11px; font-weight: 600;
        }
        .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }

        /* ── KPI Grid ── */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 14px; margin-bottom: 24px;
        }
        .kpi-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 18px 20px 14px;
          position: relative; overflow: hidden;
          animation: fadeUp .4s ease both;
          transition: transform .2s, box-shadow .2s;
        }
        .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.12); }
        .kpi-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: var(--accent); border-radius: 14px 14px 0 0;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .kpi-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 17px; }
        .kpi-trend { font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 12px; }
        .kpi-trend.up { background: rgba(16,185,129,.12); color: #10b981; }
        .kpi-trend.down { background: rgba(239,68,68,.1); color: #ef4444; }
        .kpi-value { font-size: 22px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px; line-height: 1.1; }
        .kpi-label { font-size: 12px; color: var(--text-secondary); margin-top: 3px; font-weight: 500; }
        .kpi-sub { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }
        .kpi-sub.metric-down { color: #ef4444; }
        .kpi-sub.metric-up { color: #10b981; }
        .kpi-spark { height: 36px; margin-top: 10px; opacity: .7; }

        /* ── AI Insights ── */
        .ai-section { margin-bottom: 24px; }
        .ai-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .ai-header-icon { font-size: 15px; }
        .ai-header-text { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .ai-pills { display: flex; flex-wrap: wrap; gap: 8px; }
        .ai-pill {
          display: flex; align-items: center; gap: 7px;
          background: color-mix(in srgb, var(--c) 8%, var(--surface));
          border: 1px solid color-mix(in srgb, var(--c) 25%, transparent);
          border-radius: 20px; padding: 6px 12px;
          font-size: 12px; color: var(--text-primary); font-weight: 500;
          animation: fadeUp .4s ease both;
        }
        .ai-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--c); flex-shrink: 0; }

        /* ── Charts ── */
        .chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        @media(max-width:900px){ .chart-row { grid-template-columns: 1fr; } }
        .chart-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 20px;
        }
        .chart-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .chart-title-text { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .chart-badge { font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 10px; background: rgba(59,130,246,.1); color: #3b82f6; }

        /* ── Bottom row ── */
        .bottom-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        @media(max-width:1100px){ .bottom-row { grid-template-columns: 1fr 1fr; } }
        @media(max-width:700px){ .bottom-row { grid-template-columns: 1fr; } }

        /* ── Alert list ── */
        .alert-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 20px; }
        .section-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 14px; display: flex; align-items: center; gap: 6px; }
        .alert-scroll { max-height: 260px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
        .alert-scroll::-webkit-scrollbar { width: 4px; }
        .alert-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        .alert-row {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 9px;
          background: var(--bg); border: 1px solid var(--border);
          transition: background .15s;
        }
        .alert-row:hover { background: color-mix(in srgb, var(--brand) 5%, var(--bg)); }
        .alert-dot-sm { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .alert-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
        .alert-meta { font-size: 11px; color: var(--text-secondary); margin-top: 1px; font-family: 'DM Mono', monospace; }

        /* ── Recent Txns ── */
        .txn-row {
          display: flex; align-items: center; gap: 10px; padding: 9px 0;
          border-bottom: 1px solid var(--border);
        }
        .txn-row:last-child { border-bottom: none; }
        .txn-avatar {
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--brand); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; flex-shrink: 0;
        }
        .txn-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
        .txn-meta { font-size: 11px; color: var(--text-secondary); margin-top: 1px; }
        .txn-amount { font-size: 13px; font-weight: 700; color: var(--brand); margin-left: auto; white-space: nowrap; }

        /* ── Top Medicines ── */
        .top-med-row { display: flex; flex-direction: column; gap: 10px; }
        .top-med-item { display: flex; flex-direction: column; gap: 4px; }
        .top-med-head { display: flex; justify-content: space-between; align-items: center; }
        .top-med-name { font-size: 12px; font-weight: 500; color: var(--text-primary); }
        .top-med-rev { font-size: 12px; font-weight: 600; color: var(--brand); font-family: 'DM Mono', monospace; }
        .top-med-bar { height: 5px; border-radius: 3px; background: var(--border); overflow: hidden; }
        .top-med-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--brand), #3b82f6); transition: width .8s cubic-bezier(.4,0,.2,1); }

        /* ── Profit card ── */
        .profit-stat { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); }
        .profit-stat:last-child { border-bottom: none; }
        .profit-key { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
        .profit-val { font-size: 13px; font-weight: 700; color: var(--text-primary); font-family: 'DM Mono', monospace; }
        .profit-val.green { color: #10b981; }
        .profit-val.red { color: #ef4444; }
        .margin-ring { display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 16px 0; }
        .margin-pct { font-size: 36px; font-weight: 800; color: var(--text-primary); letter-spacing: -1px; }
        .margin-label { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
        .margin-bar { height: 8px; border-radius: 8px; background: var(--border); overflow: hidden; margin: 12px 0; }
        .margin-fill { height: 100%; border-radius: 8px; background: linear-gradient(90deg,#10b981,#06b6d4); transition: width 1s ease; }
      `}</style>

      <div className="dash-root">
        {/* Header */}
        <div className="dash-header">
          <div>
            <div className="dash-title">Operations Dashboard</div>
            <div className="dash-sub">{new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <div className="dash-actions">
            {['7d','30d','90d'].map(r => (
              <button key={r} className={`time-btn ${timeRange === r ? 'active' : ''}`} onClick={() => setTimeRange(r)}>{r}</button>
            ))}
            <div className="live-badge"><div className="live-dot" />Live</div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="kpi-grid">
          <KPICard index={0} label="Today's Sales" rawValue={todaySales} formatted={formatPKR(todaySales)}
            sub="● Live tracking" subClass="metric-up" icon="💊" color="#10b981" sparkData={salesSpark} trend={12} />
          <KPICard index={1} label="Total Revenue" rawValue={totalSales} formatted={formatPKR(totalSales)}
            sub={`${db.sales.length} transactions`} icon="💰" color="#3b82f6" sparkData={salesSpark} trend={8} />
          <KPICard index={2} label="Inventory Value" rawValue={totalInv} formatted={formatPKR(totalInv)}
            sub={`${db.medicines.length} SKUs`} icon="📦" color="#8b5cf6" sparkData={invSpark} trend={-3} />
          <KPICard index={3} label="Net Profit" rawValue={profit} formatted={formatPKR(profit)}
            sub={`${margin}% margin`} subClass={profit >= 0 ? 'metric-up' : 'metric-down'} icon="📈" color="#f59e0b" sparkData={profitSpark} trend={margin} />
          <KPICard index={4} label="Total Purchases" rawValue={totalPurchases} formatted={formatPKR(totalPurchases)}
            sub={`${db.purchases.length} orders`} icon="🛒" color="#06b6d4" sparkData={purchSpark} />
          <KPICard index={5} label="Low Stock" rawValue={lowStock} formatted={String(lowStock)}
            sub="Needs reorder" subClass={lowStock > 0 ? 'metric-down' : ''} icon="⚠️" color={lowStock > 0 ? '#ef4444' : '#10b981'} />
        </div>

        {/* AI Insights */}
        <div className="ai-section">
          <div className="ai-header">
            <span className="ai-header-icon">🤖</span>
            <span className="ai-header-text">AI Insights</span>
          </div>
          <div className="ai-pills">
            {insights.map((ins, i) => <AIPill key={i} text={ins.text} type={ins.type} />)}
          </div>
        </div>

        {/* Charts */}
        <div className="chart-row">
          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-title-text">Sales vs Purchases — Last 7 Days</span>
              <span className="chart-badge">PKR</span>
            </div>
            <div style={{ position: 'relative', height: 230 }}><canvas ref={salesChartRef} /></div>
          </div>
          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-title-text">Stock Distribution by Category</span>
              <span className="chart-badge">{db.medicines.length} items</span>
            </div>
            <div style={{ position: 'relative', height: 230 }}><canvas ref={catChartRef} /></div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="bottom-row">
          {/* Stock Alerts */}
          <div className="alert-card">
            <div className="section-title">⚠️ Stock Alerts <span style={{fontSize:11,background:'rgba(239,68,68,.1)',color:'#ef4444',padding:'2px 7px',borderRadius:10,fontWeight:600}}>{alerts.length}</span></div>
            <div className="alert-scroll">
              {alerts.length ? alerts.map(m => {
                const s = getMedStatus(m);
                return (
                  <div className="alert-row" key={m.id}>
                    <div className="alert-dot-sm" style={{ background: s === 'Expired' ? '#ef4444' : s === 'Low Stock' ? '#f59e0b' : '#06b6d4' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="alert-name">{m.name}</div>
                      <div className="alert-meta">Qty: {m.qty} · Exp: {m.expiry}</div>
                    </div>
                    <StatusBadge status={s} />
                  </div>
                );
              }) : <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, padding: '20px 0' }}>✅ All stock healthy</div>}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="alert-card">
            <div className="section-title">🧾 Recent Transactions</div>
            {recent.map(s => {
              const med = db.medicines.find(m => m.id === s.medId);
              const initials = s.patient.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div className="txn-row" key={s.id}>
                  <div className="txn-avatar">{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="txn-name">{s.patient}</div>
                    <div className="txn-meta">{s.invoice} · {med?.name || '—'} · {s.date}</div>
                  </div>
                  <span className="txn-amount">{formatPKR(s.total)}</span>
                </div>
              );
            })}
          </div>

          {/* Top Medicines + Profit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="alert-card" style={{ flex: 1 }}>
              <div className="section-title">🏆 Top Medicines by Revenue</div>
              <div className="top-med-row">
                {topMeds.map(({ med, rev }, i) => (
                  <div className="top-med-item" key={med.id}>
                    <div className="top-med-head">
                      <span className="top-med-name">{i + 1}. {med.name}</span>
                      <span className="top-med-rev">{formatPKR(rev)}</span>
                    </div>
                    <div className="top-med-bar">
                      <div className="top-med-fill" style={{ width: `${(rev / maxRev) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {topMeds.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No sales data yet</div>}
              </div>
            </div>

            <div className="alert-card">
              <div className="section-title">📊 Profitability</div>
              <div className="margin-ring">
                <div className="margin-pct">{margin}%</div>
                <div className="margin-label">Net Profit Margin</div>
              </div>
              <div className="margin-bar">
                <div className="margin-fill" style={{ width: `${Math.min(margin, 100)}%` }} />
              </div>
              <div className="profit-stat"><span className="profit-key">Revenue</span><span className="profit-val">{formatPKR(totalSales)}</span></div>
              <div className="profit-stat"><span className="profit-key">Cost</span><span className="profit-val red">{formatPKR(totalPurchases)}</span></div>
              <div className="profit-stat"><span className="profit-key">Profit</span><span className={`profit-val ${profit >= 0 ? 'green' : 'red'}`}>{formatPKR(profit)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}