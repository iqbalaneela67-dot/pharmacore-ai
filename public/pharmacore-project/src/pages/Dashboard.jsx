import React, { useEffect, useRef, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { getMedStatus, formatPKR } from '../data/db';
Chart.register(...registerables);

/* ── Inline CSS for dark modern theme ── */
const DashStyle = () => (
  <style>{`
    .db-shell {
      font-family: 'Outfit', sans-serif;
      --ink:#08090c; --ink1:#0d0f15; --ink2:#12151e; --ink3:#181c28; --ink4:#1e2333; --ink5:#242a3c;
      --line:#232840; --line2:#2e3650; --line3:#3d4a6a;
      --t0:#f0f3fb; --t1:#c8d0e8; --t2:#8a94b4; --t3:#525c7a; --t4:#3a4260;
      --jade:#00e5b0; --jade2:#00c49a; --sapphire:#4d8eff; --amber:#f5a623; --rose:#ff5e7d; --violet:#9b7fff;
      --r1:6px; --r2:10px; --r3:14px; --pill:100px;
    }
    @keyframes db-fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes db-pulse{0%,100%{opacity:1}50%{opacity:.4}}
    @keyframes db-ping{0%{transform:scale(1);opacity:1}75%,100%{transform:scale(2.1);opacity:0}}

    .db-shell *{box-sizing:border-box;}
    .db-shell{background:var(--ink);color:var(--t0);min-height:100%;}
    .db-page{padding:28px;animation:db-fadeUp .35s ease both;}
    .db-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px;flex-wrap:wrap;}
    .db-title{font-family:'Fraunces',serif;font-size:22px;font-weight:700;color:var(--t0);letter-spacing:-.3px;}
    .db-sub{font-size:12px;color:var(--t2);margin-top:5px;display:flex;align-items:center;gap:8px;}
    .db-g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;}
    .db-g2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
    .db-g-chart{display:grid;grid-template-columns:1fr 310px;gap:14px;margin-bottom:16px;}
    .db-g-bottom{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;}
    @media(max-width:1100px){.db-g4{grid-template-columns:repeat(2,1fr);}.db-g-chart{grid-template-columns:1fr;}}
    @media(max-width:680px){.db-g4{grid-template-columns:1fr 1fr;}.db-g-bottom{grid-template-columns:1fr;}.db-g2{grid-template-columns:1fr;}}
    .db-card{background:var(--ink2);border:1px solid var(--line);border-radius:var(--r3);padding:20px;transition:border-color .2s;}
    .db-card:hover{border-color:var(--line2);}
    .db-metric{background:var(--ink2);border:1px solid var(--line);border-radius:var(--r3);padding:20px;position:relative;overflow:hidden;animation:db-fadeUp .4s ease both;transition:border-color .2s,transform .2s;}
    .db-metric:hover{border-color:var(--line3);transform:translateY(-2px);}
    .db-metric::before{content:'';position:absolute;inset:0;background:var(--mc,rgba(0,229,176,.04));pointer-events:none;}
    .db-spark{width:100%;height:34px;}
    .db-prog-track{background:var(--ink4);border-radius:99px;overflow:hidden;}
    .db-prog-fill{border-radius:99px;transition:width .6s ease;}
    .db-badge{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:3px 8px;border-radius:var(--pill);white-space:nowrap;}
    .db-badge-jade{background:rgba(0,229,176,.12);color:var(--jade);border:1px solid rgba(0,229,176,.2);}
    .db-badge-rose{background:rgba(255,94,125,.12);color:var(--rose);border:1px solid rgba(255,94,125,.2);}
    .db-badge-amber{background:rgba(245,166,35,.12);color:var(--amber);border:1px solid rgba(245,166,35,.2);}
    .db-badge-sapphire{background:rgba(77,142,255,.12);color:var(--sapphire);border:1px solid rgba(77,142,255,.2);}
    .db-badge-violet{background:rgba(155,127,255,.12);color:var(--violet);border:1px solid rgba(155,127,255,.2);}
    .db-status{font-size:10px;font-weight:700;padding:2px 8px;border-radius:var(--pill);}
    .db-status-ok{background:rgba(0,229,176,.1);color:var(--jade);border:1px solid rgba(0,229,176,.18);}
    .db-status-low{background:rgba(245,166,35,.1);color:var(--amber);border:1px solid rgba(245,166,35,.18);}
    .db-status-exp{background:rgba(255,94,125,.1);color:var(--rose);border:1px solid rgba(255,94,125,.18);}
    .db-alert-item{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:var(--r2);margin-bottom:6px;font-size:12px;}
    .db-alert-danger{background:rgba(255,94,125,.06);border:1px solid rgba(255,94,125,.12);}
    .db-alert-warning{background:rgba(245,166,35,.06);border:1px solid rgba(245,166,35,.12);}
    .db-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:3px;}
    .db-dot-rose{background:var(--rose);}
    .db-dot-amber{background:var(--amber);}
    .db-dot-jade{background:var(--jade);animation:db-pulse 2s infinite;}
    .db-av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--jade),var(--sapphire));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:var(--ink);flex-shrink:0;}
    .db-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:var(--r2);font-size:12px;font-weight:600;cursor:pointer;border:none;font-family:'Outfit',sans-serif;transition:all .18s;white-space:nowrap;}
    .db-btn-ghost{background:var(--ink3);color:var(--t1);border:1px solid var(--line);}
    .db-btn-ghost:hover{background:var(--ink4);border-color:var(--line2);color:var(--t0);}
    .db-btn-primary{background:linear-gradient(135deg,var(--jade),var(--jade2));color:var(--ink);}
    .db-btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,229,176,.28);}
    .db-seg-bar{display:flex;height:8px;border-radius:8px;overflow:hidden;gap:2px;margin-bottom:14px;}
    .db-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(35,40,64,.5);}
    .db-row:last-child{border-bottom:none;}
    .db-mono{font-family:'JetBrains Mono',monospace;}
    .db-live-pip{width:7px;height:7px;border-radius:50%;background:var(--jade);position:relative;display:inline-block;flex-shrink:0;}
    .db-live-ring{position:absolute;inset:0;border-radius:50%;border:1px solid var(--jade);animation:db-ping 2s infinite;}
  `}</style>
);

/* ── Icons ── */
const PATHS = {
  cash:<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
  pill:<><path d="M10.5 20.5L20.5 10.5a7.07 7.07 0 00-10-10L.5 10.5a7.07 7.07 0 0010 10z"/><line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/></>,
  pkg:<><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
  chart:<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  download:<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  plus:<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  warning:<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  check:<><polyline points="20,6 9,17 4,12"/></>,
  purchase:<><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>,
};
const Ic = ({ n, s=15, c='currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {PATHS[n]}
  </svg>
);

/* ── Sparkline ── */
const Spark = ({ data, color='#00e5b0', h=34 }) => {
  if (!data || data.length < 2) return null;
  const mn=Math.min(...data), mx=Math.max(...data), rng=mx-mn||1;
  const W=100, H=h;
  const pts = data.map((v,i) => `${(i/(data.length-1))*W},${H-((v-mn)/rng)*(H-3)-1}`);
  const line = pts.map((p,i)=>(i===0?'M':'L')+p).join(' ');
  const area = `M0,${H} ${pts.map(p=>'L'+p).join(' ')} L${W},${H} Z`;
  const id = `sg${Math.random().toString(36).slice(2,8)}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="db-spark" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`}/>
      <path d={line} fill="none" stroke={color} strokeWidth="1.6"/>
    </svg>
  );
};

/* ── Status badge ── */
const StatusBadge = ({ status }) => {
  const cls = status==='In Stock' ? 'db-status-ok' : status==='Low Stock' ? 'db-status-low' : 'db-status-exp';
  return <span className={`db-status ${cls}`}>{status}</span>;
};

const CAT_COLORS = ['#00e5b0','#4d8eff','#9b7fff','#f5a623','#ff5e7d','#2dffc3','#ff7b5e','#3d4a6a'];

export default function Dashboard({ db }) {
  const chartRef    = useRef(null);
  const catChartRef = useRef(null);
  const salesInst   = useRef(null);
  const catInst     = useRef(null);

  const today = new Date().toISOString().split('T')[0];

  /* ── Real computed metrics ── */
  const M = useMemo(() => {
    const totalRevenue     = db.sales.reduce((a,s) => a+s.total, 0);
    const todaySales       = db.sales.filter(s=>s.date===today).reduce((a,s)=>a+s.total, 0);
    const totalInvVal      = db.medicines.reduce((a,m) => a+m.qty*m.mrp, 0);
    const totalPurchases   = db.purchases.reduce((a,p) => a+p.total, 0);
    const lowStock         = db.medicines.filter(m=>getMedStatus(m)==='Low Stock').length;
    const expired          = db.medicines.filter(m=>getMedStatus(m)==='Expired').length;
    const inStock          = db.medicines.filter(m=>getMedStatus(m)==='In Stock').length;
    const pendingPOs       = db.purchases.filter(p=>p.status==='Pending').length;

    // Sparkline from real daily sales
    const salesByDay = {};
    db.sales.forEach(s => { salesByDay[s.date]=(salesByDay[s.date]||0)+s.total; });
    const spark = Object.values(salesByDay).slice(-12);
    if (spark.length < 2) spark.unshift(0,0);

    return { totalRevenue, todaySales, totalInvVal, totalPurchases,
             lowStock, expired, inStock, pendingPOs,
             totalMeds: db.medicines.length,
             totalSales: db.sales.length,
             totalPurchasesCount: db.purchases.length,
             spark };
  }, [db, today]);

  const kpiCards = [
    { label:'Total Revenue',    val:formatPKR(M.totalRevenue),   ico:'cash',     clr:'#00e5b0', mc:'rgba(0,229,176,.07)',   badge:`${M.totalSales} sales`,         badgeCls:'db-badge-jade',     spark:M.spark },
    { label:"Today's Sales",    val:formatPKR(M.todaySales),     ico:'chart',    clr:'#4d8eff', mc:'rgba(77,142,255,.07)',  badge:'Live',                           badgeCls:'db-badge-sapphire', spark:M.spark },
    { label:'Inventory Value',  val:formatPKR(M.totalInvVal),    ico:'pkg',      clr:'#9b7fff', mc:'rgba(155,127,255,.07)', badge:`${M.totalMeds} SKUs`,            badgeCls:'db-badge-violet',   spark:db.medicines.map(m=>m.qty).slice(0,12) },
    { label:'Purchase Spend',   val:formatPKR(M.totalPurchases), ico:'purchase', clr:'#f5a623', mc:'rgba(245,166,35,.07)',  badge:`${M.totalPurchasesCount} orders`,badgeCls:'db-badge-amber',    spark:db.purchases.map(p=>p.total) },
  ];

  /* ── Revenue + Purchases bar chart ── */
  useEffect(() => {
    if (!chartRef.current) return;
    if (salesInst.current) salesInst.current.destroy();

    const dates = [];
    for (let i=6; i>=0; i--) { const d=new Date(); d.setDate(d.getDate()-i); dates.push(d.toISOString().split('T')[0]); }
    const salesByDay={}, purchByDay={};
    db.sales.forEach(s    => { salesByDay[s.date]=(salesByDay[s.date]||0)+s.total; });
    db.purchases.forEach(p => { purchByDay[p.date]=(purchByDay[p.date]||0)+p.total; });

    const labels    = dates.map(d => new Date(d).toLocaleDateString('en-PK',{weekday:'short'}));
    const salesData = dates.map(d => salesByDay[d]||0);
    const purchData = dates.map(d => purchByDay[d]||0);

    salesInst.current = new Chart(chartRef.current, {
      type:'bar',
      data:{ labels, datasets:[
        { label:'Revenue',   data:salesData, backgroundColor:'rgba(0,229,176,.18)',  borderColor:'#00e5b0', borderWidth:2, borderRadius:6, borderSkipped:false },
        { label:'Purchases', data:purchData, borderColor:'rgba(77,142,255,.55)', borderWidth:1.5, type:'line', pointRadius:3, pointBackgroundColor:'#4d8eff', tension:.4, borderDash:[5,5], fill:false },
      ]},
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{backgroundColor:'#181c28',titleColor:'#f0f3fb',bodyColor:'#8a94b4',borderColor:'#2e3650',borderWidth:1,padding:12,cornerRadius:8,callbacks:{label:c=>`PKR ${c.raw.toLocaleString()}`}},
        },
        scales:{
          x:{grid:{color:'rgba(35,40,64,.4)'},ticks:{color:'#525c7a',font:{size:11,family:'Outfit'}}},
          y:{grid:{color:'rgba(35,40,64,.4)'},ticks:{color:'#525c7a',font:{size:11,family:'Outfit'},callback:v=>`PKR ${v}`}},
        },
      },
    });
    return () => salesInst.current?.destroy();
  }, [db]);

  /* ── Category donut ── */
  useEffect(() => {
    if (!catChartRef.current) return;
    if (catInst.current) catInst.current.destroy();

    const cats   = [...new Set(db.medicines.map(m=>m.category))];
    const values = cats.map(c => db.medicines.filter(m=>m.category===c).reduce((a,m)=>a+m.qty,0));

    catInst.current = new Chart(catChartRef.current, {
      type:'doughnut',
      data:{ labels:cats, datasets:[{ data:values, backgroundColor:CAT_COLORS, borderWidth:2, borderColor:'#12151e', hoverOffset:4 }]},
      options:{
        responsive:true, maintainAspectRatio:false, cutout:'65%',
        plugins:{ legend:{display:false}, tooltip:{backgroundColor:'#181c28',titleColor:'#f0f3fb',bodyColor:'#8a94b4',borderColor:'#2e3650',borderWidth:1,padding:12,cornerRadius:8}},
      },
    });
    return () => catInst.current?.destroy();
  }, [db]);

  /* ── Derived lists ── */
  const alerts       = db.medicines.filter(m=>getMedStatus(m)!=='In Stock').slice(0,5);
  const recentSales  = [...db.sales].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  const recentPOs    = [...db.purchases].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4);

  const cats       = [...new Set(db.medicines.map(m=>m.category))];
  const catRevenue = cats.map(cat => {
    const ids = db.medicines.filter(m=>m.category===cat).map(m=>m.id);
    const rev = db.sales.filter(s=>ids.includes(s.medId)).reduce((a,s)=>a+s.total,0);
    return { name:cat, rev };
  }).filter(c=>c.rev>0).sort((a,b)=>b.rev-a.rev);
  const totalCatRev = catRevenue.reduce((a,c)=>a+c.rev,0);

  const nowDate = new Date().toLocaleDateString('en-PK',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

  return (
    <div className="db-shell">
      <DashStyle/>
      <div className="db-page">

        {/* Header */}
        <div className="db-header">
          <div>
            <div className="db-title">Dashboard <span style={{fontStyle:'italic',color:'var(--jade)'}}>✦</span></div>
            <div className="db-sub">
              <span className="db-live-pip"><span className="db-live-ring"/></span>
              Live &nbsp;·&nbsp; {nowDate}
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="db-btn db-btn-ghost"><Ic n="download" s={13}/> Export</button>
            <button className="db-btn db-btn-primary"><Ic n="plus" s={13}/> New Sale</button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="db-g4">
          {kpiCards.map((m,i) => (
            <div key={i} className="db-metric" style={{'--mc':m.mc, animationDelay:`${i*.06}s`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <div style={{width:38,height:38,borderRadius:10,background:`${m.clr}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Ic n={m.ico} s={17} c={m.clr}/>
                </div>
                <span className={`db-badge ${m.badgeCls}`}>{m.badge}</span>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:22,fontWeight:800,color:m.clr,letterSpacing:'-1px',lineHeight:1}}>{m.val}</div>
                <div style={{fontSize:11,color:'var(--t3)',marginTop:5,fontWeight:500}}>{m.label}</div>
              </div>
              <Spark data={m.spark.length>1?m.spark:[0,1]} color={m.clr}/>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="db-g4">
          {[
            {label:'In Stock',    val:M.inStock,      clr:'var(--jade)',     ico:'check'},
            {label:'Low Stock',   val:M.lowStock,     clr:'var(--amber)',   ico:'warning'},
            {label:'Expired',     val:M.expired,      clr:'var(--rose)',    ico:'warning'},
            {label:'Pending POs', val:M.pendingPOs,   clr:'var(--sapphire)',ico:'purchase'},
          ].map((s,i) => (
            <div key={i} className="db-card" style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:36,height:36,borderRadius:9,background:`${s.clr.replace('var(--','').replace(')','') === 'jade' ? 'rgba(0,229,176,.16)' : s.clr.includes('amber') ? 'rgba(245,166,35,.16)' : s.clr.includes('rose') ? 'rgba(255,94,125,.16)' : 'rgba(77,142,255,.16)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Ic n={s.ico} s={15} c={s.clr}/>
              </div>
              <div>
                <div style={{fontSize:20,fontWeight:800,color:s.clr,lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:11,color:'var(--t3)',marginTop:3}}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="db-g-chart" style={{marginTop:16}}>
          <div className="db-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:'var(--t0)'}}>Revenue & Purchases</div>
                <div style={{fontSize:11,color:'var(--t3)',marginTop:2}}>Last 7 days — PKR</div>
              </div>
              <div style={{display:'flex',gap:12,fontSize:10,color:'var(--t3)',alignItems:'center'}}>
                <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:10,borderRadius:3,background:'#00e5b0',display:'inline-block'}}/>Revenue</span>
                <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:14,height:2,background:'rgba(77,142,255,.6)',display:'inline-block'}}/>Purchases</span>
              </div>
            </div>
            <div style={{height:200}}><canvas ref={chartRef}/></div>
          </div>

          <div className="db-card">
            <div style={{fontSize:14,fontWeight:600,color:'var(--t0)',marginBottom:4}}>Stock by Category</div>
            <div style={{fontSize:11,color:'var(--t3)',marginBottom:14}}>Units by medicine type</div>
            <div style={{height:140,position:'relative',marginBottom:14}}><canvas ref={catChartRef}/></div>
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {[...new Set(db.medicines.map(m=>m.category))].slice(0,5).map((cat,i) => {
                const qty   = db.medicines.filter(m=>m.category===cat).reduce((a,m)=>a+m.qty,0);
                const total = db.medicines.reduce((a,m)=>a+m.qty,0);
                return (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{width:7,height:7,borderRadius:2,background:CAT_COLORS[i],display:'inline-block',flexShrink:0}}/>
                    <div style={{flex:1,fontSize:11,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cat}</div>
                    <div style={{fontSize:10,color:'var(--t3)',flexShrink:0}} className="db-mono">{qty} · {total?Math.round((qty/total)*100):0}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Alerts + Recent Sales */}
        <div className="db-g-bottom">
          <div className="db-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <span style={{fontSize:14,fontWeight:600,color:'var(--t0)'}}>Stock Alerts</span>
              <span className="db-badge db-badge-rose">{M.expired+M.lowStock} issues</span>
            </div>
            {alerts.length===0
              ? <div style={{padding:'20px 0',textAlign:'center',color:'var(--jade)',fontSize:13}}>
                  <Ic n="check" s={20} c="var(--jade)"/><div style={{marginTop:6}}>All stock levels healthy</div>
                </div>
              : alerts.map((m,i) => {
                  const st=getMedStatus(m); const isExp=st==='Expired';
                  return (
                    <div key={i} className={`db-alert-item ${isExp?'db-alert-danger':'db-alert-warning'}`}>
                      <div className={`db-dot ${isExp?'db-dot-rose':'db-dot-amber'}`}/>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,color:'var(--t0)',marginBottom:2,fontSize:12}}>{m.name}</div>
                        <div style={{color:'var(--t2)',fontSize:11}}>Qty: {m.qty} · Expiry: {m.expiry} · {m.mfr}</div>
                      </div>
                      <StatusBadge status={st}/>
                    </div>
                  );
                })
            }
          </div>

          <div className="db-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <span style={{fontSize:14,fontWeight:600,color:'var(--t0)'}}>Recent Transactions</span>
              <span className="db-badge db-badge-jade">{db.sales.length} total</span>
            </div>
            {recentSales.length===0
              ? <div style={{padding:'20px 0',textAlign:'center',color:'var(--t3)',fontSize:13}}>No sales yet</div>
              : recentSales.map((s,i) => {
                  const med=db.medicines.find(m=>m.id===s.medId);
                  const initials=s.patient.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
                  return (
                    <div key={i} className="db-row">
                      <div className="db-av" style={{fontSize:10}}>{initials}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:500,color:'var(--t0)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.patient}</div>
                        <div style={{fontSize:11,color:'var(--t3)',marginTop:1}}>{s.invoice} · {med?.name||'—'} · {s.date}</div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontSize:12,fontWeight:700,color:'var(--jade)'}} className="db-mono">{formatPKR(s.total)}</div>
                        <div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>Qty: {s.qty}</div>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>

        {/* Category Revenue + Recent Purchases */}
        <div className="db-g2">
          <div className="db-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <span style={{fontSize:14,fontWeight:600,color:'var(--t0)'}}>Revenue by Category</span>
              <span style={{fontSize:11,color:'var(--t3)'}}>{formatPKR(totalCatRev)} total</span>
            </div>
            {totalCatRev===0
              ? <div style={{color:'var(--t3)',fontSize:13,textAlign:'center',padding:'20px 0'}}>No sales data yet</div>
              : <>
                  <div className="db-seg-bar">
                    {catRevenue.map((c,i) => (
                      <div key={i} title={`${c.name}: ${formatPKR(c.rev)}`}
                        style={{flex:c.rev,background:CAT_COLORS[i%CAT_COLORS.length],height:8,borderRadius:4,opacity:.85}}/>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    {catRevenue.map((c,i) => (
                      <div key={i} style={{display:'flex',alignItems:'center',gap:7}}>
                        <span style={{width:8,height:8,borderRadius:2,background:CAT_COLORS[i%CAT_COLORS.length],display:'inline-block',flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:500,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
                          <div style={{fontSize:10,color:'var(--t3)'}}>{totalCatRev?Math.round((c.rev/totalCatRev)*100):0}% · {formatPKR(c.rev)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
            }
          </div>

          <div className="db-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <span style={{fontSize:14,fontWeight:600,color:'var(--t0)'}}>Recent Purchases</span>
              <span className="db-badge db-badge-amber">{db.purchases.length} orders</span>
            </div>
            {recentPOs.length===0
              ? <div style={{color:'var(--t3)',fontSize:13,textAlign:'center',padding:'20px 0'}}>No purchases yet</div>
              : recentPOs.map((p,i) => {
                  const med=db.medicines.find(m=>m.id===p.medId);
                  const isPending=p.status==='Pending';
                  return (
                    <div key={i} className="db-row">
                      <div style={{width:36,height:36,borderRadius:9,background:isPending?'rgba(245,166,35,.14)':'rgba(0,229,176,.14)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <Ic n="purchase" s={14} c={isPending?'var(--amber)':'var(--jade)'}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:500,color:'var(--t0)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.supplier}</div>
                        <div style={{fontSize:11,color:'var(--t3)',marginTop:1}}>{p.po} · {med?.name||'—'} · {p.date}</div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontSize:12,fontWeight:700,color:isPending?'var(--amber)':'var(--jade)'}} className="db-mono">{formatPKR(p.total)}</div>
                        <span className={`db-badge ${isPending?'db-badge-amber':'db-badge-jade'}`} style={{marginTop:3,display:'inline-flex'}}>{p.status}</span>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>

      </div>
    </div>
  );
}
