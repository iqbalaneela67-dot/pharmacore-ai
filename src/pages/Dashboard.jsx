/* eslint-disable */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { getMedStatus, formatPKR } from '../data/db';
import { StatusBadge } from '../components/ui';
Chart.register(...registerables);

HEAD
function useCountUp(target, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf, start = null;
    const abs = Math.abs(target);
    const run = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setVal(target < 0 ? -Math.floor(e * abs) : Math.floor(e * abs));
      if (p < 1) raf = requestAnimationFrame(run);
      else setVal(target);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return val;
}

function useClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return t;
}

function KPICard({ label, rawValue, prefix = '', sub, subType, icon, accent, trend, index }) {
  const animated = useCountUp(rawValue || 0);
  const isNeg = rawValue < 0;
  const display = `${prefix}${Math.abs(animated).toLocaleString('en-PK')}`;
  return (
    <div className="kpi" style={{ '--a': accent, animationDelay: `${index * 60}ms` }}>
      <div className="kpi-top-bar" />
      <div className="kpi-glow" />
      <div className="kpi-row1">
        <span className="kpi-icon">{icon}</span>
        {trend !== undefined && (
          <span className={`kpi-trend ${trend >= 0 ? 'tr-up' : 'tr-dn'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className={`kpi-value ${isNeg ? 'kv-red' : ''}`}>{isNeg ? '−' : ''}{display}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className={`kpi-sub ks-${subType || 'mute'}`}>{sub}</div>}
    </div>
  );
}

function Chip({ icon, text, type, delay }) {
  return (
    <div className={`chip chip-${type}`} style={{ animationDelay: `${delay}ms` }}>
      <span>{icon}</span><span>{text}</span>
    </div>
  );
}

export default function Dashboard({ db }) {
  const salesRef  = useRef(null);
  const catRef    = useRef(null);
  const salesInst = useRef(null);
  const catInst   = useRef(null);
  const [range, setRange] = useState('7d');
  const clock = useClock();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Range-based calculations
  const rangeDays = useMemo(() => parseInt(range) || 7, [range]);

  const rangeStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - rangeDays);
    return d.toISOString().split('T')[0];
  }, [rangeDays]);

  const rangeSales    = useMemo(() => db.sales.filter(s => s.date >= rangeStart), [db, rangeStart]);
  const rangePurch    = useMemo(() => db.purchases.filter(p => p.date >= rangeStart), [db, rangeStart]);
  const rangeSalesAmt = useMemo(() => rangeSales.reduce((a, s) => a + s.total, 0), [rangeSales]);
  const rangePurchAmt = useMemo(() => rangePurch.reduce((a, p) => a + p.total, 0), [rangePurch]);

  const todaySales   = useMemo(() => db.sales.filter(s => s.date === todayStr).reduce((a, s) => a + s.total, 0), [db, todayStr]);
  const totalSales   = useMemo(() => db.sales.reduce((a, s) => a + s.total, 0), [db]);
  const totalPurch   = useMemo(() => db.purchases.reduce((a, p) => a + p.total, 0), [db]);
  const totalInv     = useMemo(() => db.medicines.reduce((a, m) => a + m.qty * m.mrp, 0), [db]);
  const profit       = useMemo(() => rangeSalesAmt - rangePurchAmt, [rangeSalesAmt, rangePurchAmt]);
  const margin       = useMemo(() => rangeSalesAmt > 0 ? +((profit / rangeSalesAmt) * 100).toFixed(1) : 0, [profit, rangeSalesAmt]);
  const avgSale      = useMemo(() => rangeSales.length ? Math.round(rangeSalesAmt / rangeSales.length) : 0, [rangeSales, rangeSalesAmt]);
  const lowStock     = useMemo(() => db.medicines.filter(m => getMedStatus(m) === 'Low Stock').length, [db]);
  const expired      = useMemo(() => db.medicines.filter(m => getMedStatus(m) === 'Expired').length, [db]);
  const expiringSoon = useMemo(() => db.medicines.filter(m => getMedStatus(m) === 'Expiring Soon').length, [db]);
  const pendingPO    = useMemo(() => db.purchases.filter(p => p.status === 'Pending').length, [db]);
  const receivedPO   = useMemo(() => db.purchases.filter(p => p.status === 'Received').length, [db]);
  const todayTxns    = useMemo(() => db.sales.filter(s => s.date === todayStr).length, [db, todayStr]);

  // Real trend: compare current range vs previous range
  const prevStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - rangeDays * 2);
    return d.toISOString().split('T')[0];
  }, [rangeDays]);

  const prevSalesAmt = useMemo(() => db.sales.filter(s => s.date >= prevStart && s.date < rangeStart).reduce((a, s) => a + s.total, 0), [db, prevStart, rangeStart]);
  const salesTrend   = useMemo(() => prevSalesAmt > 0 ? +(((rangeSalesAmt - prevSalesAmt) / prevSalesAmt) * 100).toFixed(1) : 0, [rangeSalesAmt, prevSalesAmt]);

  const topMeds = useMemo(() => {
    const map = {};
    rangeSales.forEach(s => { map[s.medId] = (map[s.medId] || 0) + s.total; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id, rev]) => ({ med: db.medicines.find(m => m.id === +id), rev })).filter(x => x.med);
  }, [db, rangeSales]);

  const chartData = useMemo(() => {
    const result = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      result.push({
        lbl: rangeDays <= 7
          ? d.toLocaleDateString('en-PK', { weekday: 'short' })
          : d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
        sales: db.sales.filter(s => s.date === ds).reduce((a, s) => a + s.total, 0),
        purchases: db.purchases.filter(p => p.date === ds).reduce((a, p) => a + p.total, 0),
      });
    }
    return result;
  }, [db, rangeDays]);

  const insights = useMemo(() => {
    const list = [];
    if (expired > 0)      list.push({ icon: '🚨', text: `${expired} expired item${expired > 1 ? 's' : ''} — remove from shelf immediately`, type: 'danger' });
    if (expiringSoon > 0) list.push({ icon: '⏳', text: `${expiringSoon} expiring within 30 days`, type: 'warning' });
    if (lowStock > 0)     list.push({ icon: '📦', text: `${lowStock} medicine${lowStock > 1 ? 's' : ''} below reorder level`, type: 'warning' });
    if (pendingPO > 0)    list.push({ icon: '🚚', text: `${pendingPO} purchase order${pendingPO > 1 ? 's' : ''} pending delivery`, type: 'info' });
    if (margin > 20)      list.push({ icon: '📈', text: `Profit margin ${margin}% — healthy`, type: 'success' });
    if (todaySales === 0) list.push({ icon: '💡', text: 'No sales recorded today — verify POS', type: 'info' });
    if (!list.length)     list.push({ icon: '✅', text: 'All systems operating normally', type: 'success' });
    return list.slice(0, 4);
  }, [expired, expiringSoon, lowStock, pendingPO, margin, todaySales]);

  useEffect(() => {
    if (salesInst.current) salesInst.current.destroy();
    if (catInst.current) catInst.current.destroy();

    salesInst.current = new Chart(salesRef.current, {
      type: 'bar',
      data: {
        labels: chartData.map(d => d.lbl),
        datasets: [
          {
            label: 'Sales',
            data: chartData.map(d => d.sales),
            backgroundColor: ctx => {
              const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260);
              g.addColorStop(0, '#10b981cc'); g.addColorStop(1, '#10b98122');
              return g;
            },
            borderRadius: 8, borderSkipped: false,
            borderColor: '#10b981', borderWidth: 1,
          },
          {
            label: 'Purchases',
            data: chartData.map(d => d.purchases),
            type: 'line',
            borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.08)',
            borderWidth: 2.5, tension: 0.45, fill: true,
            pointRadius: 5, pointBackgroundColor: '#1e293b',
            pointBorderColor: '#60a5fa', pointBorderWidth: 2.5, pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 11, family: 'Plus Jakarta Sans' }, padding: 16, usePointStyle: true } },
          tooltip: {
            backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1,
            titleColor: '#f1f5f9', bodyColor: '#94a3b8', padding: 12, cornerRadius: 10,
            callbacks: { label: ctx => ` PKR ${ctx.parsed.y.toLocaleString('en-PK')}` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 11 }, maxTicksLimit: rangeDays <= 7 ? 7 : 15 } },
          y: { grid: { color: 'rgba(255,255,255,0.04)', borderDash: [4, 4] }, ticks: { color: '#475569', font: { size: 10 }, callback: v => v === 0 ? '0' : 'PKR ' + v } },
        },
      },
    });

    const cats = [...new Set(db.medicines.map(m => m.category))];
    const catData = cats.map(c => db.medicines.filter(m => m.category === c).reduce((a, m) => a + m.qty, 0));
    catInst.current = new Chart(catRef.current, {
      type: 'doughnut',
      data: {
        labels: cats,
        datasets: [{ data: catData, backgroundColor: ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16'], borderWidth: 3, borderColor: '#0f172a', hoverOffset: 10 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '72%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 11, family: 'Plus Jakarta Sans' }, padding: 10, usePointStyle: true, pointStyleWidth: 8 } },
          tooltip: {
            backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1,
            titleColor: '#f1f5f9', bodyColor: '#94a3b8', cornerRadius: 10,
            callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} units` },
          },
        },
      },
    });
    return () => { salesInst.current?.destroy(); catInst.current?.destroy(); };
  }, [db, chartData]);

  const alerts   = db.medicines.filter(m => getMedStatus(m) !== 'In Stock')
    .sort((a, b) => ({ Expired: 0, 'Low Stock': 1, 'Expiring Soon': 2 }[getMedStatus(a)] - { Expired: 0, 'Low Stock': 1, 'Expiring Soon': 2 }[getMedStatus(b)]))
    .slice(0, 8);
  const recent   = [...db.sales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const maxRev   = topMeds[0]?.rev || 1;
  const avPal    = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4'];
  const aClr     = { Expired: '#ef4444', 'Low Stock': '#f59e0b', 'Expiring Soon': '#06b6d4' };
  const timeStr  = clock.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes fadeUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(1.8)} }
        .d { font-family:'Plus Jakarta Sans',sans-serif; color:#e2e8f0; animation:fadeIn .5s ease; }
        .d-hdr { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:28px; flex-wrap:wrap; gap:14px; }
        .d-hdr-title { font-size:22px; font-weight:800; color:#f8fafc; letter-spacing:-0.6px; margin:0; }
        .d-hdr-sub   { display:flex; align-items:center; gap:10px; margin-top:4px; font-size:12px; color:#64748b; }
        .d-clock     { font-family:'JetBrains Mono',monospace; font-size:12px; color:#10b981; background:#10b98115; border:1px solid #10b98130; padding:3px 10px; border-radius:6px; letter-spacing:.5px; }
        .d-hdr-right { display:flex; align-items:center; gap:8px; }
        .rng-btn { padding:6px 16px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid #1e293b; background:transparent; color:#64748b; transition:all .15s; font-family:inherit; }
        .rng-btn:hover { border-color:#10b981; color:#10b981; }
        .rng-btn.on { background:#10b981; color:#0f172a; border-color:#10b981; font-weight:700; }
        .live-pill { display:flex; align-items:center; gap:6px; background:#10b98115; border:1px solid #10b98135; border-radius:20px; padding:5px 13px; font-size:11px; font-weight:700; color:#10b981; }
        .live-dot  { width:7px; height:7px; border-radius:50%; background:#10b981; animation:pulse-dot 1.6s infinite; }
        .kpi-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:14px; margin-bottom:22px; }
        .kpi { background:linear-gradient(145deg,#1e293b,#151f2e); border:1px solid #1e293b; border-radius:18px; padding:20px; position:relative; overflow:hidden; animation:fadeUp .5s ease both; transition:transform .25s ease, box-shadow .25s ease, border-color .25s; }
        .kpi:hover { transform:translateY(-4px); border-color:var(--a); box-shadow:0 16px 40px color-mix(in srgb,var(--a) 20%,transparent); }
        .kpi-top-bar { position:absolute; top:0; left:0; right:0; height:3px; background:var(--a); border-radius:18px 18px 0 0; }
        .kpi-glow    { position:absolute; top:-25px; right:-25px; width:90px; height:90px; border-radius:50%; background:color-mix(in srgb,var(--a) 10%,transparent); }
        .kpi-row1  { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        .kpi-icon  { width:42px; height:42px; border-radius:12px; background:color-mix(in srgb,var(--a) 15%,transparent); display:flex; align-items:center; justify-content:center; font-size:19px; }
        .kpi-trend { font-size:11px; font-weight:700; padding:3px 8px; border-radius:12px; }
        .tr-up { background:rgba(16,185,129,.15); color:#10b981; }
        .tr-dn { background:rgba(239,68,68,.15);  color:#ef4444; }
        .kpi-value { font-size:24px; font-weight:800; color:#f8fafc; letter-spacing:-0.6px; line-height:1.1; }
        .kv-red    { color:#ef4444; }
        .kpi-label { font-size:12px; color:#64748b; margin-top:5px; font-weight:500; }
        .kpi-sub   { font-size:11px; margin-top:6px; font-weight:600; }
        .ks-up   { color:#10b981; }
        .ks-down { color:#ef4444; }
        .ks-mute { color:#475569; }
        .ai-row { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:22px; }
        .ai-lbl { font-size:10px; font-weight:700; color:#475569; letter-spacing:.8px; text-transform:uppercase; }
        .chip { display:flex; align-items:center; gap:7px; padding:6px 13px; border-radius:20px; font-size:12px; font-weight:500; animation:fadeUp .4s ease both; }
        .chip-danger  { background:rgba(239,68,68,.12);  border:1px solid rgba(239,68,68,.3);  color:#fca5a5; }
        .chip-warning { background:rgba(245,158,11,.12); border:1px solid rgba(245,158,11,.3); color:#fcd34d; }
        .chip-success { background:rgba(16,185,129,.12); border:1px solid rgba(16,185,129,.3); color:#6ee7b7; }
        .chip-info    { background:rgba(96,165,250,.12); border:1px solid rgba(96,165,250,.3); color:#93c5fd; }
        .section-label { font-size:11px; font-weight:700; color:#334155; letter-spacing:.8px; text-transform:uppercase; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
        .section-label::after { content:''; flex:1; height:1px; background:#1e293b; }
        .chart-row { display:grid; grid-template-columns:3fr 2fr; gap:14px; margin-bottom:16px; }
        @media(max-width:900px){ .chart-row{grid-template-columns:1fr;} }
        .chart-card { background:#0f172a; border:1px solid #1e293b; border-radius:18px; padding:22px; box-shadow:0 4px 20px rgba(0,0,0,.3); }
        .chart-top  { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
        .chart-ttl  { font-size:13px; font-weight:700; color:#e2e8f0; }
        .chart-tag  { font-size:10px; font-weight:600; padding:3px 9px; border-radius:6px; background:#1e293b; color:#64748b; border:1px solid #334155; }
        .mini-row { display:grid; grid-template-columns:repeat(4,1fr); gap:13px; margin-bottom:18px; }
        @media(max-width:800px){ .mini-row{grid-template-columns:repeat(2,1fr);} }
        .mini-box { background:#0f172a; border:1px solid #1e293b; border-radius:14px; padding:16px; text-align:center; border-left:3px solid var(--a); transition:transform .2s, box-shadow .2s; }
        .mini-box:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.25); }
        .mini-val { font-size:24px; font-weight:800; color:var(--a); }
        .mini-lbl { font-size:11px; color:#64748b; margin-top:3px; font-weight:500; }
        .btm-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
        @media(max-width:1100px){ .btm-row{grid-template-columns:1fr 1fr;} }
        @media(max-width:700px) { .btm-row{grid-template-columns:1fr;} }
        .btm-card { background:#0f172a; border:1px solid #1e293b; border-radius:18px; padding:20px; box-shadow:0 4px 20px rgba(0,0,0,.25); }
        .sec-ttl { font-size:13px; font-weight:700; color:#e2e8f0; margin-bottom:14px; display:flex; align-items:center; gap:8px; }
        .cnt-bub { font-size:10px; font-weight:700; padding:2px 7px; border-radius:10px; background:rgba(239,68,68,.2); color:#fca5a5; }
        .alert-list { display:flex; flex-direction:column; gap:7px; max-height:265px; overflow-y:auto; }
        .alert-list::-webkit-scrollbar { width:3px; }
        .alert-list::-webkit-scrollbar-thumb { background:#1e293b; border-radius:4px; }
        .alert-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:11px; background:#1e293b; border:1px solid #334155; transition:background .15s, border-color .15s; }
        .alert-item:hover { background:#263048; border-color:#3d4f6b; }
        .al-dot  { width:8px; height:8px; border-radius:50%; flex-shrink:0; box-shadow:0 0 6px currentColor; }
        .al-nm   { font-size:12px; font-weight:600; color:#e2e8f0; }
        .al-meta { font-size:10px; color:#475569; margin-top:2px; font-family:'JetBrains Mono',monospace; }
        .txn-item { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid #1e293b; }
        .txn-item:last-child { border:none; }
        .txn-av   { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; flex-shrink:0; color:#0f172a; }
        .txn-nm   { font-size:12px; font-weight:600; color:#e2e8f0; }
        .txn-meta { font-size:10px; color:#475569; margin-top:2px; font-family:'JetBrains Mono',monospace; }
        .txn-amt  { font-size:13px; font-weight:800; color:#10b981; margin-left:auto; white-space:nowrap; font-family:'JetBrains Mono',monospace; }
        .med-item { margin-bottom:12px; }
        .med-head { display:flex; justify-content:space-between; margin-bottom:5px; }
        .med-nm   { font-size:12px; font-weight:600; color:#cbd5e1; }
        .med-rv   { font-size:12px; font-weight:700; color:#10b981; font-family:'JetBrains Mono',monospace; }
        .med-trk  { height:5px; border-radius:5px; background:#1e293b; overflow:hidden; }
        .med-fill { height:100%; border-radius:5px; background:linear-gradient(90deg,#10b981,#3b82f6); transition:width 1.2s cubic-bezier(.4,0,.2,1); }
        .pft-center { text-align:center; padding:14px 0 8px; }
        .pft-big  { font-size:40px; font-weight:900; letter-spacing:-2px; font-family:'Plus Jakarta Sans',sans-serif; }
        .pft-pos  { color:#10b981; }
        .pft-neg  { color:#ef4444; }
        .pft-sub  { font-size:11px; color:#475569; margin-top:3px; }
        .pft-bar  { height:8px; border-radius:8px; background:#1e293b; overflow:hidden; margin:12px 0; }
        .pft-fill { height:100%; border-radius:8px; transition:width 1.4s ease; }
        .pft-row  { display:flex; justify-content:space-between; padding:9px 0; border-bottom:1px solid #1e293b; }
        .pft-row:last-child { border:none; }
        .pft-k    { font-size:12px; color:#64748b; font-weight:500; }
        .pft-v    { font-size:12px; font-weight:700; font-family:'JetBrains Mono',monospace; color:#e2e8f0; }
        .pft-v.g  { color:#10b981; }
        .pft-v.r  { color:#ef4444; }
        .range-lbl { font-size:10px; color:#475569; margin-left:4px; }
      `}</style>

      <div className="d">
        <div className="d-hdr">
          <div>
            <p className="d-hdr-title">Operations Dashboard</p>
            <div className="d-hdr-sub">
              {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              <span className="d-clock">{timeStr}</span>
            </div>
          </div>
          <div className="d-hdr-right">
            {['7d', '30d', '90d'].map(r => (
              <button key={r} className={`rng-btn ${range === r ? 'on' : ''}`} onClick={() => setRange(r)}>{r}</button>
            ))}
            <div className="live-pill"><div className="live-dot" />Live</div>
          </div>
        </div>

        <div className="kpi-grid">
          <KPICard index={0} label="Today's Sales"   rawValue={todaySales}  prefix="PKR " sub={todaySales > 0 ? `${todayTxns} transactions today` : '● No sales yet today'} subType={todaySales > 0 ? 'up' : 'mute'} icon="💊" accent="#10b981" trend={salesTrend} />
          <KPICard index={1} label={`Revenue (${range})`} rawValue={rangeSalesAmt} prefix="PKR " sub={`${rangeSales.length} transactions`} subType="mute" icon="💰" accent="#3b82f6" trend={salesTrend} />
          <KPICard index={2} label="Inventory Value" rawValue={totalInv}    prefix="PKR " sub={`${db.medicines.length} medicines`} subType="mute" icon="📦" accent="#8b5cf6" />
          <KPICard index={3} label={`Net Profit (${range})`} rawValue={profit} prefix="PKR " sub={`${margin}% margin`} subType={profit >= 0 ? 'up' : 'down'} icon="📈" accent={profit >= 0 ? '#10b981' : '#ef4444'} trend={+margin.toFixed(0)} />
          <KPICard index={4} label={`Purchases (${range})`} rawValue={rangePurchAmt} prefix="PKR " sub={`${rangePurch.length} orders`} subType="mute" icon="🛒" accent="#f59e0b" />
          <KPICard index={5} label="Avg Sale Value"  rawValue={avgSale}     prefix="PKR " sub={`Per transaction (${range})`} subType="mute" icon="🧾" accent="#06b6d4" />
          <KPICard index={6} label="Low Stock"       rawValue={lowStock}    sub={lowStock > 0 ? 'Reorder required' : 'All stocked'} subType={lowStock > 0 ? 'down' : 'up'} icon="⚠️" accent={lowStock > 0 ? '#f59e0b' : '#10b981'} />
          <KPICard index={7} label="Expired Items"   rawValue={expired}     sub={expired > 0 ? 'Remove immediately' : 'No expired'} subType={expired > 0 ? 'down' : 'up'} icon="🗑️" accent={expired > 0 ? '#ef4444' : '#10b981'} />
        </div>

        <div className="ai-row">
          <span className="ai-lbl">🤖 AI Insights</span>
          {insights.map((ins, i) => <Chip key={i} {...ins} delay={i * 55} />)}
        </div>

        <div className="section-label">Analytics — Last {range}</div>
        <div className="chart-row">
          <div className="chart-card">
            <div className="chart-top">
              <span className="chart-ttl">📊 Sales vs Purchases — Last {range}</span>
              <span className="chart-tag">Live · PKR</span>
            </div>
            <div style={{ position: 'relative', height: 240 }}><canvas ref={salesRef} /></div>
          </div>
          <div className="chart-card">
            <div className="chart-top">
              <span className="chart-ttl">🗂️ Stock by Category</span>
              <span className="chart-tag">{db.medicines.length} SKUs</span>
            </div>
            <div style={{ position: 'relative', height: 240 }}><canvas ref={catRef} /></div>
          </div>
        </div>

        <div className="mini-row">
          {[
            { val: rangeSales.length,  lbl: `Invoices (${range})`,  a: '#10b981' },
            { val: receivedPO,         lbl: 'POs Received',          a: '#3b82f6' },
            { val: pendingPO,          lbl: 'POs Pending',           a: '#f59e0b' },
            { val: db.medicines.length,lbl: 'Total Medicines',       a: '#8b5cf6' },
          ].map((s, i) => (
            <div key={i} className="mini-box" style={{ '--a': s.a }}>
              <div className="mini-val">{s.val}</div>
              <div className="mini-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        <div className="section-label">Details</div>
        <div className="btm-row">
          <div className="btm-card">
            <div className="sec-ttl">
              ⚠️ Stock Alerts
              {alerts.length > 0 && <span className="cnt-bub">{alerts.length}</span>}
            </div>
            <div className="alert-list">
              {alerts.length ? alerts.map(m => {
                const s = getMedStatus(m);
                return (
                  <div className="alert-item" key={m.id}>
                    <div className="al-dot" style={{ background: aClr[s] || '#64748b', color: aClr[s] }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="al-nm">{m.name}</div>
                      <div className="al-meta">Qty:{m.qty} · Exp:{m.expiry} · Min:{m.minStock}</div>
                    </div>
                    <StatusBadge status={s} />
                  </div>
                );
              }) : (
                <div style={{ textAlign: 'center', color: '#475569', fontSize: 13, padding: '24px 0' }}>✅ All stock healthy</div>
              )}
            </div>
          </div>

          <div className="btm-card">
            <div className="sec-ttl">🧾 Recent Transactions</div>
            {recent.map((s, i) => {
              const med = db.medicines.find(m => m.id === s.medId);
              const ini = s.patient.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div className="txn-item" key={s.id}>
                  <div className="txn-av" style={{ background: avPal[i % avPal.length] }}>{ini}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="txn-nm">{s.patient}</div>
                    <div className="txn-meta">{s.invoice} · {med?.name || '—'} · {s.date}</div>
                  </div>
                  <span className="txn-amt">{formatPKR(s.total)}</span>
                </div>
              );
            })}
            {!recent.length && <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No transactions yet</div>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="btm-card">
              <div className="sec-ttl">🏆 Top Medicines by Revenue ({range})</div>
              {topMeds.length ? topMeds.map(({ med, rev }, i) => (
                <div className="med-item" key={med.id}>
                  <div className="med-head">
                    <span className="med-nm">{i + 1}. {med.name}</span>
                    <span className="med-rv">{formatPKR(rev)}</span>
                  </div>
                  <div className="med-trk">
                    <div className="med-fill" style={{ width: `${(rev / maxRev) * 100}%` }} />
                  </div>
                </div>
              )) : <div style={{ color: '#475569', fontSize: 13 }}>No sales data in this range</div>}
            </div>

            <div className="btm-card">
              <div className="sec-ttl">📊 Profitability ({range})</div>
              <div className="pft-center">
                <div className={`pft-big ${profit >= 0 ? 'pft-pos' : 'pft-neg'}`}>{margin}%</div>
                <div className="pft-sub">Net Profit Margin</div>
              </div>
              <div className="pft-bar">
                <div className="pft-fill" style={{
                  width: `${Math.min(Math.abs(margin), 100)}%`,
                  background: profit >= 0 ? 'linear-gradient(90deg,#10b981,#3b82f6)' : 'linear-gradient(90deg,#ef4444,#f59e0b)'
                }} />
              </div>
              <div className="pft-row"><span className="pft-k">Revenue</span><span className="pft-v">{formatPKR(rangeSalesAmt)}</span></div>
              <div className="pft-row"><span className="pft-k">Purchases</span><span className="pft-v r">{formatPKR(rangePurchAmt)}</span></div>
              <div className="pft-row"><span className="pft-k">Net Profit</span><span className={`pft-v ${profit >= 0 ? 'g' : 'r'}`}>{formatPKR(profit)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

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

