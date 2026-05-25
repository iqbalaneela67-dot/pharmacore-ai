/* eslint-disable */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { useDatabase } from '../hooks/useDatabase';
Chart.register(...registerables);

function getMedStatus(m) {
  const today = new Date();
  const exp = new Date(m.expiry_date || m.expiry);
  const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Expired';
  if (diffDays <= 30) return 'Expiring Soon';
  if ((m.qty || m.quantity || 0) <= (m.min_stock || m.minStock || 0)) return 'Low Stock';
  return 'In Stock';
}

function formatPKR(v) {
  return 'PKR ' + Math.abs(v || 0).toLocaleString('en-PK');
}

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

function StatusBadge({ status }) {
  const colors = { 'Expired': '#ef4444', 'Low Stock': '#f59e0b', 'Expiring Soon': '#06b6d4', 'In Stock': '#10b981' };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: colors[status] + '22', color: colors[status], border: `1px solid ${colors[status]}44` }}>
      {status}
    </span>
  );
}

export default function Dashboard() {
  const salesRef  = useRef(null);
  const catRef    = useRef(null);
  const salesInst = useRef(null);
  const catInst   = useRef(null);
  const [range, setRange] = useState('7d');
  const clock = useClock();
  const [db, setDb] = useState({ sales: [], purchases: [], medicines: [] });
  const [loading, setLoading] = useState(true);

  const { db: dbData, loading: storeLoading, updateDB } = useDatabase();
const medicines = dbData?.medicines || [];
const sales = dbData?.sales || [];
const purchases = dbData?.purchases || [];
const fetchAllData = () => {};

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    setDb({ medicines, sales, purchases });
    if (!storeLoading.medicines && !storeLoading.sales && !storeLoading.purchases) {
      setLoading(false);
    }
  }, [medicines, sales, purchases, storeLoading]);

  const todayStr      = useMemo(() => new Date().toISOString().split('T')[0], []);
  const rangeDays     = useMemo(() => parseInt(range) || 7, [range]);
  const rangeStart    = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - rangeDays);
    return d.toISOString().split('T')[0];
  }, [rangeDays]);

  const rangeSales    = useMemo(() => db.sales.filter(s => s.date >= rangeStart), [db, rangeStart]);
  const rangePurch    = useMemo(() => db.purchases.filter(p => p.date >= rangeStart), [db, rangeStart]);
  const rangeSalesAmt = useMemo(() => rangeSales.reduce((a, s) => a + (s.total || 0), 0), [rangeSales]);
  const rangePurchAmt = useMemo(() => rangePurch.reduce((a, p) => a + (p.total || 0), 0), [rangePurch]);
  const todaySales    = useMemo(() => db.sales.filter(s => s.date === todayStr).reduce((a, s) => a + (s.total || 0), 0), [db, todayStr]);
  const totalInv      = useMemo(() => db.medicines.reduce((a, m) => a + (m.qty || m.quantity || 0) * (m.mrp || m.price || 0), 0), [db]);
  const profit        = useMemo(() => rangeSalesAmt - rangePurchAmt, [rangeSalesAmt, rangePurchAmt]);
  const margin        = useMemo(() => rangeSalesAmt > 0 ? +((profit / rangeSalesAmt) * 100).toFixed(1) : 0, [profit, rangeSalesAmt]);
  const avgSale       = useMemo(() => rangeSales.length ? Math.round(rangeSalesAmt / rangeSales.length) : 0, [rangeSales, rangeSalesAmt]);
  const lowStock      = useMemo(() => db.medicines.filter(m => getMedStatus(m) === 'Low Stock').length, [db]);
  const expired       = useMemo(() => db.medicines.filter(m => getMedStatus(m) === 'Expired').length, [db]);
  const expiringSoon  = useMemo(() => db.medicines.filter(m => getMedStatus(m) === 'Expiring Soon').length, [db]);
  const pendingPO     = useMemo(() => db.purchases.filter(p => p.status === 'Pending').length, [db]);
  const receivedPO    = useMemo(() => db.purchases.filter(p => p.status === 'Received').length, [db]);
  const todayTxns     = useMemo(() => db.sales.filter(s => s.date === todayStr).length, [db, todayStr]);

  const prevStart    = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - rangeDays * 2);
    return d.toISOString().split('T')[0];
  }, [rangeDays]);
  const prevSalesAmt = useMemo(() => db.sales.filter(s => s.date >= prevStart && s.date < rangeStart).reduce((a, s) => a + (s.total || 0), 0), [db, prevStart, rangeStart]);
  const salesTrend   = useMemo(() => prevSalesAmt > 0 ? +(((rangeSalesAmt - prevSalesAmt) / prevSalesAmt) * 100).toFixed(1) : 0, [rangeSalesAmt, prevSalesAmt]);

  const chartData = useMemo(() => {
    const result = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      result.push({
        lbl: rangeDays <= 7
          ? d.toLocaleDateString('en-PK', { weekday: 'short' })
          : d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
        sales:     db.sales.filter(s => s.date === ds).reduce((a, s) => a + (s.total || 0), 0),
        purchases: db.purchases.filter(p => p.date === ds).reduce((a, p) => a + (p.total || 0), 0),
      });
    }
    return result;
  }, [db, rangeDays]);

  const insights = useMemo(() => {
    const list = [];
    if (expired > 0)      list.push({ icon: '🚨', text: `${expired} expired item${expired > 1 ? 's' : ''} — remove immediately`, type: 'danger' });
    if (expiringSoon > 0) list.push({ icon: '⏳', text: `${expiringSoon} expiring within 30 days`, type: 'warning' });
    if (lowStock > 0)     list.push({ icon: '📦', text: `${lowStock} medicine${lowStock > 1 ? 's' : ''} below reorder level`, type: 'warning' });
    if (pendingPO > 0)    list.push({ icon: '🚚', text: `${pendingPO} purchase order${pendingPO > 1 ? 's' : ''} pending`, type: 'info' });
    if (margin > 20)      list.push({ icon: '📈', text: `Profit margin ${margin}% — healthy`, type: 'success' });
    if (todaySales === 0) list.push({ icon: '💡', text: 'No sales recorded today', type: 'info' });
    if (!list.length)     list.push({ icon: '✅', text: 'All systems operating normally', type: 'success' });
    return list.slice(0, 4);
  }, [expired, expiringSoon, lowStock, pendingPO, margin, todaySales]);

  useEffect(() => {
    if (!salesRef.current || !catRef.current || loading) return;
    if (salesInst.current) salesInst.current.destroy();
    if (catInst.current) catInst.current.destroy();

    salesInst.current = new Chart(salesRef.current, {
      type: 'bar',
      data: {
        labels: chartData.map(d => d.lbl),
        datasets: [
          { label: 'Sales', data: chartData.map(d => d.sales), backgroundColor: '#10b98199', borderRadius: 8, borderSkipped: false, borderColor: '#10b981', borderWidth: 1 },
          { label: 'Purchases', data: chartData.map(d => d.purchases), type: 'line', borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.08)', borderWidth: 2.5, tension: 0.45, fill: true, pointRadius: 5, pointBackgroundColor: '#1e293b', pointBorderColor: '#60a5fa', pointBorderWidth: 2.5 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 11 }, padding: 16, usePointStyle: true } },
          tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#94a3b8', padding: 12, cornerRadius: 10, callbacks: { label: ctx => ` PKR ${ctx.parsed.y.toLocaleString('en-PK')}` } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { size: 10 }, callback: v => v === 0 ? '0' : 'PKR ' + v } },
        },
      },
    });

    const cats = [...new Set(db.medicines.map(m => m.category).filter(Boolean))];
    const catData = cats.map(c => db.medicines.filter(m => m.category === c).reduce((a, m) => a + (m.qty || m.quantity || 0), 0));
    catInst.current = new Chart(catRef.current, {
      type: 'doughnut',
      data: {
        labels: cats.length ? cats : ['No Data'],
        datasets: [{ data: catData.length ? catData : [1], backgroundColor: ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16'], borderWidth: 3, borderColor: '#0f172a', hoverOffset: 10 }],
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 11 }, padding: 10, usePointStyle: true } } } },
    });
    return () => { salesInst.current?.destroy(); catInst.current?.destroy(); };
  }, [db, chartData, loading]);

  const alerts  = db.medicines.filter(m => getMedStatus(m) !== 'In Stock').slice(0, 8);
  const recent  = [...db.sales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const topMeds = useMemo(() => {
    const map = {};
    rangeSales.forEach(s => { map[s.med_id || s.medId] = (map[s.med_id || s.medId] || 0) + (s.total || 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id, rev]) => ({ med: db.medicines.find(m => m.id === +id || m.id === id), rev })).filter(x => x.med);
  }, [db, rangeSales]);
  const maxRev  = topMeds[0]?.rev || 1;
  const avPal   = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4'];
  const aClr    = { Expired: '#ef4444', 'Low Stock': '#f59e0b', 'Expiring Soon': '#06b6d4' };
  const timeStr = clock.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ width:40, height:40, border:'3px solid #1e293b', borderTopColor:'#10b981', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <div style={{ color:'#64748b', fontSize:14 }}>Loading Dashboard...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(1.8)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .d { font-family:'Inter',-apple-system,sans-serif; color:#e2e8f0; animation:fadeIn .5s ease; padding:24px; background:#0a0f1a; min-height:100vh; }
        .d-hdr { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:28px; flex-wrap:wrap; gap:14px; }
        .d-hdr-title { font-size:22px; font-weight:800; color:#f8fafc; letter-spacing:-0.6px; margin:0; }
        .d-hdr-sub { display:flex; align-items:center; gap:10px; margin-top:4px; font-size:12px; color:#64748b; }
        .d-clock { font-size:12px; color:#10b981; background:#10b98115; border:1px solid #10b98130; padding:3px 10px; border-radius:6px; }
        .d-hdr-right { display:flex; align-items:center; gap:8px; }
        .rng-btn { padding:6px 16px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid #1e293b; background:transparent; color:#64748b; transition:all .15s; font-family:inherit; }
        .rng-btn.on { background:#10b981; color:#0f172a; border-color:#10b981; font-weight:700; }
        .live-pill { display:flex; align-items:center; gap:6px; background:#10b98115; border:1px solid #10b98135; border-radius:20px; padding:5px 13px; font-size:11px; font-weight:700; color:#10b981; }
        .live-dot { width:7px; height:7px; border-radius:50%; background:#10b981; animation:pulse-dot 1.6s infinite; }
        .kpi-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:14px; margin-bottom:22px; }
        .kpi { background:linear-gradient(145deg,#1e293b,#151f2e); border:1px solid #1e293b; border-radius:18px; padding:20px; position:relative; overflow:hidden; animation:fadeUp .5s ease both; transition:transform .25s,box-shadow .25s,border-color .25s; }
        .kpi:hover { transform:translateY(-4px); border-color:var(--a); box-shadow:0 16px 40px rgba(0,0,0,0.3); }
        .kpi-top-bar { position:absolute; top:0; left:0; right:0; height:3px; background:var(--a); border-radius:18px 18px 0 0; }
        .kpi-glow { position:absolute; top:-25px; right:-25px; width:90px; height:90px; border-radius:50%; background:rgba(255,255,255,0.03); }
        .kpi-row1 { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        .kpi-icon { width:42px; height:42px; border-radius:12px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; font-size:19px; }
        .kpi-trend { font-size:11px; font-weight:700; padding:3px 8px; border-radius:12px; }
        .tr-up { background:rgba(16,185,129,.15); color:#10b981; }
        .tr-dn { background:rgba(239,68,68,.15); color:#ef4444; }
        .kpi-value { font-size:24px; font-weight:800; color:#f8fafc; letter-spacing:-0.6px; }
        .kv-red { color:#ef4444; }
        .kpi-label { font-size:12px; color:#64748b; margin-top:5px; font-weight:500; }
        .kpi-sub { font-size:11px; margin-top:6px; font-weight:600; }
        .ks-up { color:#10b981; } .ks-down { color:#ef4444; } .ks-mute { color:#475569; }
        .ai-row { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:22px; }
        .ai-lbl { font-size:10px; font-weight:700; color:#475569; letter-spacing:.8px; text-transform:uppercase; }
        .chip { display:flex; align-items:center; gap:7px; padding:6px 13px; border-radius:20px; font-size:12px; font-weight:500; animation:fadeUp .4s ease both; }
        .chip-danger  { background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.3); color:#fca5a5; }
        .chip-warning { background:rgba(245,158,11,.12); border:1px solid rgba(245,158,11,.3); color:#fcd34d; }
        .chip-success { background:rgba(16,185,129,.12); border:1px solid rgba(16,185,129,.3); color:#6ee7b7; }
        .chip-info    { background:rgba(96,165,250,.12); border:1px solid rgba(96,165,250,.3); color:#93c5fd; }
        .chart-row { display:grid; grid-template-columns:3fr 2fr; gap:14px; margin-bottom:16px; }
        @media(max-width:900px){ .chart-row{grid-template-columns:1fr;} }
        .chart-card { background:#0f172a; border:1px solid #1e293b; border-radius:18px; padding:22px; }
        .chart-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
        .chart-ttl { font-size:13px; font-weight:700; color:#e2e8f0; }
        .chart-tag { font-size:10px; font-weight:600; padding:3px 9px; border-radius:6px; background:#1e293b; color:#64748b; border:1px solid #334155; }
        .mini-row { display:grid; grid-template-columns:repeat(4,1fr); gap:13px; margin-bottom:18px; }
        @media(max-width:800px){ .mini-row{grid-template-columns:repeat(2,1fr);} }
        .mini-box { background:#0f172a; border:1px solid #1e293b; border-radius:14px; padding:16px; text-align:center; border-left:3px solid var(--a); }
        .mini-val { font-size:24px; font-weight:800; color:var(--a); }
        .mini-lbl { font-size:11px; color:#64748b; margin-top:3px; font-weight:500; }
        .btm-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
        @media(max-width:1100px){ .btm-row{grid-template-columns:1fr 1fr;} }
        @media(max-width:700px) { .btm-row{grid-template-columns:1fr;} }
        .btm-card { background:#0f172a; border:1px solid #1e293b; border-radius:18px; padding:20px; }
        .sec-ttl { font-size:13px; font-weight:700; color:#e2e8f0; margin-bottom:14px; display:flex; align-items:center; gap:8px; }
        .alert-list { display:flex; flex-direction:column; gap:7px; max-height:265px; overflow-y:auto; }
        .alert-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:11px; background:#1e293b; border:1px solid #334155; }
        .al-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .al-nm { font-size:12px; font-weight:600; color:#e2e8f0; }
        .al-meta { font-size:10px; color:#475569; margin-top:2px; }
        .txn-item { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid #1e293b; }
        .txn-item:last-child { border:none; }
        .txn-av { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; flex-shrink:0; color:#0f172a; }
        .txn-nm { font-size:12px; font-weight:600; color:#e2e8f0; }
        .txn-meta { font-size:10px; color:#475569; margin-top:2px; }
        .txn-amt { font-size:13px; font-weight:800; color:#10b981; margin-left:auto; white-space:nowrap; }
        .med-item { margin-bottom:12px; }
        .med-head { display:flex; justify-content:space-between; margin-bottom:5px; }
        .med-nm { font-size:12px; font-weight:600; color:#cbd5e1; }
        .med-rv { font-size:12px; font-weight:700; color:#10b981; }
        .med-trk { height:5px; border-radius:5px; background:#1e293b; overflow:hidden; }
        .med-fill { height:100%; border-radius:5px; background:linear-gradient(90deg,#10b981,#3b82f6); transition:width 1.2s cubic-bezier(.4,0,.2,1); }
        .pft-center { text-align:center; padding:14px 0 8px; }
        .pft-big { font-size:40px; font-weight:900; letter-spacing:-2px; }
        .pft-pos { color:#10b981; } .pft-neg { color:#ef4444; }
        .pft-sub { font-size:11px; color:#475569; margin-top:3px; }
        .pft-bar { height:8px; border-radius:8px; background:#1e293b; overflow:hidden; margin:12px 0; }
        .pft-fill { height:100%; border-radius:8px; transition:width 1.4s ease; }
        .pft-row { display:flex; justify-content:space-between; padding:9px 0; border-bottom:1px solid #1e293b; }
        .pft-row:last-child { border:none; }
        .pft-k { font-size:12px; color:#64748b; font-weight:500; }
        .pft-v { font-size:12px; font-weight:700; color:#e2e8f0; }
        .pft-v.g { color:#10b981; } .pft-v.r { color:#ef4444; }
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
          <KPICard index={0} label="Today's Sales"         rawValue={todaySales}    prefix="PKR " sub={`${todayTxns} transactions today`}   subType="mute" icon="💊" accent="#10b981" trend={salesTrend} />
          <KPICard index={1} label={`Revenue (${range})`}  rawValue={rangeSalesAmt} prefix="PKR " sub={`${rangeSales.length} transactions`}  subType="mute" icon="💰" accent="#3b82f6" trend={salesTrend} />
          <KPICard index={2} label="Inventory Value"       rawValue={totalInv}      prefix="PKR " sub={`${db.medicines.length} medicines`}   subType="mute" icon="📦" accent="#8b5cf6" />
          <KPICard index={3} label={`Net Profit (${range})`} rawValue={profit}      prefix="PKR " sub={`${margin}% margin`}                  subType={profit >= 0 ? 'up' : 'down'} icon="📈" accent={profit >= 0 ? '#10b981' : '#ef4444'} trend={+margin.toFixed(0)} />
          <KPICard index={4} label={`Purchases (${range})`} rawValue={rangePurchAmt} prefix="PKR " sub={`${rangePurch.length} orders`}       subType="mute" icon="🛒" accent="#f59e0b" />
          <KPICard index={5} label="Avg Sale Value"         rawValue={avgSale}       prefix="PKR " sub={`Per transaction (${range})`}        subType="mute" icon="🧾" accent="#06b6d4" />
          <KPICard index={6} label="Low Stock"              rawValue={lowStock}      sub={lowStock > 0 ? 'Reorder required' : 'All stocked'} subType={lowStock > 0 ? 'down' : 'up'} icon="⚠️" accent={lowStock > 0 ? '#f59e0b' : '#10b981'} />
          <KPICard index={7} label="Expired Items"          rawValue={expired}       sub={expired > 0 ? 'Remove immediately' : 'No expired'} subType={expired > 0 ? 'down' : 'up'} icon="🗑️" accent={expired > 0 ? '#ef4444' : '#10b981'} />
        </div>

        <div className="ai-row">
          <span className="ai-lbl">🤖 AI Insights</span>
          {insights.map((ins, i) => (
            <div key={i} className={`chip chip-${ins.type}`} style={{ animationDelay: `${i * 55}ms` }}>
              <span>{ins.icon}</span><span>{ins.text}</span>
            </div>
          ))}
        </div>

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
            { val: rangeSales.length,   lbl: `Invoices (${range})`, a: '#10b981' },
            { val: receivedPO,          lbl: 'POs Received',        a: '#3b82f6' },
            { val: pendingPO,           lbl: 'POs Pending',         a: '#f59e0b' },
            { val: db.medicines.length, lbl: 'Total Medicines',     a: '#8b5cf6' },
          ].map((s, i) => (
            <div key={i} className="mini-box" style={{ '--a': s.a }}>
              <div className="mini-val">{s.val}</div>
              <div className="mini-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        <div className="btm-row">
          <div className="btm-card">
            <div className="sec-ttl">⚠️ Stock Alerts</div>
            <div className="alert-list">
              {alerts.length ? alerts.map(m => {
                const s = getMedStatus(m);
                return (
                  <div className="alert-item" key={m.id}>
                    <div className="al-dot" style={{ background: aClr[s] || '#64748b' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="al-nm">{m.name}</div>
                      <div className="al-meta">Qty: {m.qty || m.quantity} · Exp: {m.expiry_date || m.expiry}</div>
                    </div>
                    <StatusBadge status={s} />
                  </div>
                );
              }) : <div style={{ textAlign:'center', color:'#475569', fontSize:13, padding:'24px 0' }}>✅ All stock healthy</div>}
            </div>
          </div>

          <div className="btm-card">
            <div className="sec-ttl">🧾 Recent Transactions</div>
            {recent.map((s, i) => {
              const ini = (s.patient || s.customer_name || 'PT').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div className="txn-item" key={s.id}>
                  <div className="txn-av" style={{ background: avPal[i % avPal.length] }}>{ini}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="txn-nm">{s.patient || s.customer_name || 'Customer'}</div>
                    <div className="txn-meta">{s.invoice || s.invoice_no} · {s.date}</div>
                  </div>
                  <span className="txn-amt">{formatPKR(s.total)}</span>
                </div>
              );
            })}
            {!recent.length && <div style={{ color:'#475569', fontSize:13, textAlign:'center', padding:'24px 0' }}>No transactions yet</div>}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="btm-card">
              <div className="sec-ttl">🏆 Top Medicines ({range})</div>
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
              )) : <div style={{ color:'#475569', fontSize:13 }}>No sales data</div>}
            </div>

            <div className="btm-card">
              <div className="sec-ttl">📊 Profitability ({range})</div>
              <div className="pft-center">
                <div className={`pft-big ${profit >= 0 ? 'pft-pos' : 'pft-neg'}`}>{margin}%</div>
                <div className="pft-sub">Net Profit Margin</div>
              </div>
              <div className="pft-bar">
                <div className="pft-fill" style={{ width:`${Math.min(Math.abs(margin),100)}%`, background: profit >= 0 ? 'linear-gradient(90deg,#10b981,#3b82f6)' : 'linear-gradient(90deg,#ef4444,#f59e0b)' }} />
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