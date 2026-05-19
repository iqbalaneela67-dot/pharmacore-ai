cat > /home/claude/Dashboard.jsx << 'EOF'
import React, { useEffect, useRef, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { getMedStatus, formatPKR } from '../data/db';
Chart.register(...registerables);

const S = () => (
  <style>{`
    .db{font-family:'Segoe UI',sans-serif;--jade:#00e5b0;--jade2:#00c49a;--sap:#4d8eff;--amb:#f5a623;--rose:#ff5e7d;--vio:#9b7fff;--ink:#08090c;--ink2:#12151e;--ink3:#181c28;--ink4:#1e2333;--line:#232840;--line2:#2e3650;--t0:#f0f3fb;--t1:#c8d0e8;--t2:#8a94b4;--t3:#525c7a;--r2:10px;--r3:14px;--pill:100px;}
    @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
    @keyframes pu{0%,100%{opacity:1}50%{opacity:.35}}
    @keyframes pg{0%{transform:scale(1);opacity:1}100%{transform:scale(2.2);opacity:0}}
    .db *{box-sizing:border-box;}
    .db{background:var(--ink);color:var(--t0);min-height:100%;padding:26px;animation:fu .3s ease both;}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:22px;}
    .ttl{font-size:21px;font-weight:700;letter-spacing:-.3px;}
    .sub{font-size:12px;color:var(--t2);margin-top:4px;display:flex;align-items:center;gap:7px;}
    .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px;}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
    .gc{display:grid;grid-template-columns:1fr 300px;gap:12px;margin-bottom:14px;}
    @media(max-width:1100px){.g4{grid-template-columns:1fr 1fr;}.gc{grid-template-columns:1fr;}}
    @media(max-width:640px){.g4{grid-template-columns:1fr 1fr;}.g2{grid-template-columns:1fr;}}
    .card{background:var(--ink2);border:1px solid var(--line);border-radius:var(--r3);padding:18px;transition:border-color .2s;}
    .card:hover{border-color:var(--line2);}
    .mc{background:var(--ink2);border:1px solid var(--line);border-radius:var(--r3);padding:18px;position:relative;overflow:hidden;animation:fu .4s ease both;transition:border-color .2s,transform .2s;}
    .mc:hover{border-color:var(--line2);transform:translateY(-2px);}
    .mc::before{content:'';position:absolute;inset:0;background:var(--mcb,transparent);pointer-events:none;}
    .spark{width:100%;height:32px;}
    .bdg{display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;padding:3px 7px;border-radius:var(--pill);white-space:nowrap;}
    .bj{background:rgba(0,229,176,.12);color:var(--jade);border:1px solid rgba(0,229,176,.2);}
    .br{background:rgba(255,94,125,.12);color:var(--rose);border:1px solid rgba(255,94,125,.2);}
    .ba{background:rgba(245,166,35,.12);color:var(--amb);border:1px solid rgba(245,166,35,.2);}
    .bs{background:rgba(77,142,255,.12);color:var(--sap);border:1px solid rgba(77,142,255,.2);}
    .bv{background:rgba(155,127,255,.12);color:var(--vio);border:1px solid rgba(155,127,255,.2);}
    .st{font-size:10px;font-weight:700;padding:2px 8px;border-radius:var(--pill);}
    .sj{background:rgba(0,229,176,.1);color:var(--jade);border:1px solid rgba(0,229,176,.18);}
    .sl{background:rgba(245,166,35,.1);color:var(--amb);border:1px solid rgba(245,166,35,.18);}
    .se{background:rgba(255,94,125,.1);color:var(--rose);border:1px solid rgba(255,94,125,.18);}
    .ai{display:flex;align-items:flex-start;gap:9px;padding:9px 11px;border-radius:var(--r2);margin-bottom:5px;font-size:12px;}
    .ad{background:rgba(255,94,125,.06);border:1px solid rgba(255,94,125,.12);}
    .aw{background:rgba(245,166,35,.06);border:1px solid rgba(245,166,35,.12);}
    .dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:2px;}
    .dr{background:var(--rose);}
    .da{background:var(--amb);animation:pu 2s infinite;}
    .av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--jade),var(--sap));display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:var(--ink);flex-shrink:0;}
    .btn{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:var(--r2);font-size:12px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .17s;white-space:nowrap;}
    .bg{background:var(--ink3);color:var(--t1);border:1px solid var(--line);}
    .bg:hover{background:var(--ink4);color:var(--t0);}
    .bp{background:linear-gradient(135deg,var(--jade),var(--jade2));color:var(--ink);}
    .bp:hover{transform:translateY(-1px);box-shadow:0 5px 18px rgba(0,229,176,.25);}
    .row{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid rgba(35,40,64,.5);}
    .row:last-child{border-bottom:none;}
    .seg{display:flex;height:7px;border-radius:7px;overflow:hidden;gap:2px;margin-bottom:12px;}
    .lp{width:7px;height:7px;border-radius:50%;background:var(--jade);position:relative;display:inline-block;}
    .lr{position:absolute;inset:0;border-radius:50%;border:1px solid var(--jade);animation:pg 2s infinite;}
    .mono{font-family:'Courier New',monospace;}
  `}</style>
);

const COLORS = ['#00e5b0','#4d8eff','#9b7fff','#f5a623','#ff5e7d','#2dffc3','#ff7b5e','#3d4a6a'];

const Ic = ({ n, s=15, c='currentColor' }) => {
  const P = {
    cash:   <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    chart:  <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    pkg:    <><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    po:     <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>,
    warn:   <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    ok:     <><polyline points="20,6 9,17 4,12"/></>,
    dl:     <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    plus:   <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{P[n]}</svg>;
};

const Spark = ({ data, color='#00e5b0' }) => {
  if (!data || data.length < 2) return null;
  const mn=Math.min(...data), mx=Math.max(...data), rng=mx-mn||1, W=100, H=32;
  const pts = data.map((v,i)=>`${(i/(data.length-1))*W},${H-((v-mn)/rng)*(H-3)-1}`);
  const line = pts.map((p,i)=>(i===0?'M':'L')+p).join(' ');
  const area = `M0,${H} ${pts.map(p=>'L'+p).join(' ')} L${W},${H} Z`;
  const id = 'sg'+Math.random().toString(36).slice(2,7);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="spark" preserveAspectRatio="none">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".28"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={area} fill={`url(#${id})`}/><path d={line} fill="none" stroke={color} strokeWidth="1.5"/>
    </svg>
  );
};

const SBadge = ({ status }) => {
  const cls = status==='In Stock'?'sj':status==='Low Stock'?'sl':'se';
  return <span className={`st ${cls}`}>{status}</span>;
};

export default function Dashboard({ db }) {
  const chartRef = useRef(null);
  const donutRef = useRef(null);
  const cInst    = useRef(null);
  const dInst    = useRef(null);
  const todayStr = new Date().toISOString().split('T')[0];

  const M = useMemo(() => {
    const totalRev   = db.sales.reduce((a,s)=>a+s.total,0);
    const todayRev   = db.sales.filter(s=>s.date===todayStr).reduce((a,s)=>a+s.total,0);
    const invVal     = db.medicines.reduce((a,m)=>a+m.qty*m.mrp,0);
    const totalPurch = db.purchases.reduce((a,p)=>a+p.total,0);
    const inStock    = db.medicines.filter(m=>getMedStatus(m)==='In Stock').length;
    const lowStock   = db.medicines.filter(m=>getMedStatus(m)==='Low Stock').length;
    const expired    = db.medicines.filter(m=>getMedStatus(m)==='Expired').length;
    const pendingPOs = db.purchases.filter(p=>p.status==='Pending').length;
    const sbd={};
    db.sales.forEach(s=>{sbd[s.date]=(sbd[s.date]||0)+s.total;});
    const spark = Object.values(sbd).slice(-12);
    if(spark.length<2) spark.unshift(0,0);
    return {totalRev,todayRev,invVal,totalPurch,inStock,lowStock,expired,pendingPOs,
            totalMeds:db.medicines.length,totalSales:db.sales.length,
            totalPOs:db.purchases.length,spark};
  },[db,todayStr]);

  // Bar chart — last 7 days revenue vs purchases
  useEffect(()=>{
    if(!chartRef.current) return;
    if(cInst.current) cInst.current.destroy();
    const dates=[];
    for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);dates.push(d.toISOString().split('T')[0]);}
    const sbd={},pbd={};
    db.sales.forEach(s=>{sbd[s.date]=(sbd[s.date]||0)+s.total;});
    db.purchases.forEach(p=>{pbd[p.date]=(pbd[p.date]||0)+p.total;});
    const labels=dates.map(d=>new Date(d).toLocaleDateString('en-PK',{weekday:'short'}));
    cInst.current = new Chart(chartRef.current,{
      type:'bar',
      data:{labels,datasets:[
        {label:'Revenue',data:dates.map(d=>sbd[d]||0),backgroundColor:'rgba(0,229,176,.18)',borderColor:'#00e5b0',borderWidth:2,borderRadius:6,borderSkipped:false},
        {label:'Purchases',data:dates.map(d=>pbd[d]||0),borderColor:'rgba(77,142,255,.5)',borderWidth:1.5,type:'line',pointRadius:3,pointBackgroundColor:'#4d8eff',tension:.4,borderDash:[5,5],fill:false},
      ]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false},tooltip:{backgroundColor:'#181c28',titleColor:'#f0f3fb',bodyColor:'#8a94b4',borderColor:'#2e3650',borderWidth:1,padding:10,cornerRadius:8,callbacks:{label:c=>`PKR ${c.raw.toLocaleString()}`}}},
        scales:{x:{grid:{color:'rgba(35,40,64,.4)'},ticks:{color:'#525c7a',font:{size:11}}},y:{grid:{color:'rgba(35,40,64,.4)'},ticks:{color:'#525c7a',font:{size:11},callback:v=>`PKR ${v}`}}},
      },
    });
    return ()=>cInst.current?.destroy();
  },[db]);

  // Donut — stock by category
  useEffect(()=>{
    if(!donutRef.current) return;
    if(dInst.current) dInst.current.destroy();
    const cats=[...new Set(db.medicines.map(m=>m.category))];
    const vals=cats.map(c=>db.medicines.filter(m=>m.category===c).reduce((a,m)=>a+m.qty,0));
    dInst.current = new Chart(donutRef.current,{
      type:'doughnut',
      data:{labels:cats,datasets:[{data:vals,backgroundColor:COLORS,borderWidth:2,borderColor:'#12151e',hoverOffset:4}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'64%',
        plugins:{legend:{display:false},tooltip:{backgroundColor:'#181c28',titleColor:'#f0f3fb',bodyColor:'#8a94b4',borderColor:'#2e3650',borderWidth:1,padding:10,cornerRadius:8}},
      },
    });
    return ()=>dInst.current?.destroy();
  },[db]);

  const alerts      = db.medicines.filter(m=>getMedStatus(m)!=='In Stock').slice(0,5);
  const recentSales = [...db.sales].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  const recentPOs   = [...db.purchases].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4);
  const cats        = [...new Set(db.medicines.map(m=>m.category))];
  const catRev      = cats.map(cat=>{
    const ids=db.medicines.filter(m=>m.category===cat).map(m=>m.id);
    return {name:cat,rev:db.sales.filter(s=>ids.includes(s.medId)).reduce((a,s)=>a+s.total,0)};
  }).filter(c=>c.rev>0).sort((a,b)=>b.rev-a.rev);
  const totalCR = catRev.reduce((a,c)=>a+c.rev,0);
  const nowDate = new Date().toLocaleDateString('en-PK',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

  const kpi = [
    {label:'Total Revenue',  val:formatPKR(M.totalRev),   ico:'cash',  clr:'#00e5b0', mcb:'rgba(0,229,176,.06)',   bdg:`${M.totalSales} sales`,   bc:'bj', spark:M.spark},
    {label:"Today's Sales",  val:formatPKR(M.todayRev),   ico:'chart', clr:'#4d8eff', mcb:'rgba(77,142,255,.06)',  bdg:'Live',                    bc:'bs', spark:M.spark},
    {label:'Inventory Value',val:formatPKR(M.invVal),     ico:'pkg',   clr:'#9b7fff', mcb:'rgba(155,127,255,.06)', bdg:`${M.totalMeds} SKUs`,     bc:'bv', spark:db.medicines.map(m=>m.qty).slice(0,12)},
    {label:'Purchase Spend', val:formatPKR(M.totalPurch), ico:'po',    clr:'#f5a623', mcb:'rgba(245,166,35,.06)',  bdg:`${M.totalPOs} orders`,    bc:'ba', spark:db.purchases.map(p=>p.total)},
  ];

  const iconBg = c => ({
    '#00e5b0':'rgba(0,229,176,.15)','#4d8eff':'rgba(77,142,255,.15)',
    '#9b7fff':'rgba(155,127,255,.15)','#f5a623':'rgba(245,166,35,.15)',
  }[c]||'rgba(255,255,255,.08)');

  return (
    <div className="db">
      <S/>

      {/* Header */}
      <div className="hdr">
        <div>
          <div className="ttl">Dashboard <span style={{color:'var(--jade)',fontStyle:'italic'}}>✦</span></div>
          <div className="sub">
            <span className="lp"><span className="lr"/></span> Live · {nowDate}
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn bg"><Ic n="dl" s={13}/> Export</button>
          <button className="btn bp"><Ic n="plus" s={13}/> New Sale</button>
        </div>
      </div>

      {/* KPI */}
      <div className="g4">
        {kpi.map((m,i)=>(
          <div key={i} className="mc" style={{'--mcb':m.mcb,animationDelay:`${i*.06}s`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:11}}>
              <div style={{width:37,height:37,borderRadius:9,background:iconBg(m.clr),display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Ic n={m.ico} s={16} c={m.clr}/>
              </div>
              <span className={`bdg ${m.bc}`}>{m.bdg}</span>
            </div>
            <div style={{marginBottom:9}}>
              <div style={{fontSize:20,fontWeight:800,color:m.clr,letterSpacing:'-1px',lineHeight:1}}>{m.val}</div>
              <div style={{fontSize:11,color:'var(--t3)',marginTop:5,fontWeight:500}}>{m.label}</div>
            </div>
            <Spark data={m.spark.length>1?m.spark:[0,1]} color={m.clr}/>
          </div>
        ))}
      </div>

      {/* Quick stats */}
      <div className="g4">
        {[
          {label:'In Stock',    val:M.inStock,    clr:'var(--jade)', ico:'ok',   bg:'rgba(0,229,176,.13)'},
          {label:'Low Stock',   val:M.lowStock,   clr:'var(--amb)',  ico:'warn', bg:'rgba(245,166,35,.13)'},
          {label:'Expired',     val:M.expired,    clr:'var(--rose)', ico:'warn', bg:'rgba(255,94,125,.13)'},
          {label:'Pending POs', val:M.pendingPOs, clr:'var(--sap)',  ico:'po',   bg:'rgba(77,142,255,.13)'},
        ].map((s,i)=>(
          <div key={i} className="card" style={{padding:'13px 16px',display:'flex',alignItems:'center',gap:11}}>
            <div style={{width:35,height:35,borderRadius:8,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Ic n={s.ico} s={14} c={s.clr}/>
            </div>
            <div>
              <div style={{fontSize:19,fontWeight:800,color:s.clr,lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:11,color:'var(--t3)',marginTop:3}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="gc" style={{marginTop:14}}>
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'var(--t0)'}}>Revenue & Purchases</div>
              <div style={{fontSize:11,color:'var(--t3)',marginTop:2}}>Last 7 days</div>
            </div>
            <div style={{display:'flex',gap:12,fontSize:10,color:'var(--t3)',alignItems:'center'}}>
              <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:9,height:9,borderRadius:2,background:'#00e5b0',display:'inline-block'}}/>Revenue</span>
              <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:13,height:2,background:'rgba(77,142,255,.6)',display:'inline-block'}}/>Purchases</span>
            </div>
          </div>
          <div style={{height:190}}><canvas ref={chartRef}/></div>
        </div>

        <div className="card">
          <div style={{fontSize:13,fontWeight:600,color:'var(--t0)',marginBottom:3}}>Stock by Category</div>
          <div style={{fontSize:11,color:'var(--t3)',marginBottom:12}}>Units per category</div>
          <div style={{height:130,marginBottom:13}}><canvas ref={donutRef}/></div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {[...new Set(db.medicines.map(m=>m.category))].slice(0,5).map((cat,i)=>{
              const qty=db.medicines.filter(m=>m.category===cat).reduce((a,m)=>a+m.qty,0);
              const tot=db.medicines.reduce((a,m)=>a+m.qty,0);
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:7}}>
                  <span style={{width:7,height:7,borderRadius:2,background:COLORS[i],display:'inline-block',flexShrink:0}}/>
                  <div style={{flex:1,fontSize:11,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cat}</div>
                  <div style={{fontSize:10,color:'var(--t3)',flexShrink:0}} className="mono">{qty} · {tot?Math.round((qty/tot)*100):0}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alerts + Recent Sales */}
      <div className="g2">
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:13}}>
            <span style={{fontSize:13,fontWeight:600,color:'var(--t0)'}}>Stock Alerts</span>
            <span className="bdg br">{M.expired+M.lowStock} issues</span>
          </div>
          {alerts.length===0
            ? <div style={{padding:'18px 0',textAlign:'center',color:'var(--jade)',fontSize:13}}>
                <Ic n="ok" s={20} c="var(--jade)"/><div style={{marginTop:5}}>All stock levels healthy</div>
              </div>
            : alerts.map((m,i)=>{
                const st=getMedStatus(m),isE=st==='Expired';
                return (
                  <div key={i} className={`ai ${isE?'ad':'aw'}`}>
                    <div className={`dot ${isE?'dr':'da'}`}/>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,color:'var(--t0)',marginBottom:2,fontSize:12}}>{m.name}</div>
                      <div style={{color:'var(--t2)',fontSize:11}}>Qty: {m.qty} · Expiry: {m.expiry} · {m.mfr}</div>
                    </div>
                    <SBadge status={st}/>
                  </div>
                );
              })
          }
        </div>

        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:13}}>
            <span style={{fontSize:13,fontWeight:600,color:'var(--t0)'}}>Recent Sales</span>
            <span className="bdg bj">{db.sales.length} total</span>
          </div>
          {recentSales.length===0
            ? <div style={{padding:'18px 0',textAlign:'center',color:'var(--t3)',fontSize:13}}>No sales yet</div>
            : recentSales.map((s,i)=>{
                const med=db.medicines.find(m=>m.id===s.medId);
                const ini=s.patient.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
                return (
                  <div key={i} className="row">
                    <div className="av" style={{fontSize:10}}>{ini}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500,color:'var(--t0)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.patient}</div>
                      <div style={{fontSize:11,color:'var(--t3)',marginTop:1}}>{s.invoice} · {med?.name||'—'} · {s.date}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--jade)'}} className="mono">{formatPKR(s.total)}</div>
                      <div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>Qty: {s.qty}</div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* Category Revenue + Recent Purchases */}
      <div className="g2">
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:13}}>
            <span style={{fontSize:13,fontWeight:600,color:'var(--t0)'}}>Revenue by Category</span>
            <span style={{fontSize:11,color:'var(--t3)'}}>{formatPKR(totalCR)}</span>
          </div>
          {totalCR===0
            ? <div style={{color:'var(--t3)',fontSize:13,textAlign:'center',padding:'18px 0'}}>No sales data yet</div>
            : <>
                <div className="seg">
                  {catRev.map((c,i)=>(
                    <div key={i} title={`${c.name}: ${formatPKR(c.rev)}`}
                      style={{flex:c.rev,background:COLORS[i%COLORS.length],height:7,borderRadius:4,opacity:.85}}/>
                  ))}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {catRev.map((c,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{width:7,height:7,borderRadius:2,background:COLORS[i%COLORS.length],display:'inline-block',flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:500,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
                        <div style={{fontSize:10,color:'var(--t3)'}}>{totalCR?Math.round((c.rev/totalCR)*100):0}% · {formatPKR(c.rev)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
          }
        </div>

        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:13}}>
            <span style={{fontSize:13,fontWeight:600,color:'var(--t0)'}}>Recent Purchases</span>
            <span className="bdg ba">{db.purchases.length} orders</span>
          </div>
          {recentPOs.length===0
            ? <div style={{color:'var(--t3)',fontSize:13,textAlign:'center',padding:'18px 0'}}>No purchases yet</div>
            : recentPOs.map((p,i)=>{
                const med=db.medicines.find(m=>m.id===p.medId);
                const ip=p.status==='Pending';
                return (
                  <div key={i} className="row">
                    <div style={{width:34,height:34,borderRadius:8,background:ip?'rgba(245,166,35,.13)':'rgba(0,229,176,.13)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <Ic n="po" s={13} c={ip?'var(--amb)':'var(--jade)'}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500,color:'var(--t0)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.supplier}</div>
                      <div style={{fontSize:11,color:'var(--t3)',marginTop:1}}>{p.po} · {med?.name||'—'} · {p.date}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:ip?'var(--amb)':'var(--jade)'}} className="mono">{formatPKR(p.total)}</div>
                      <span className={`bdg ${ip?'ba':'bj'}`} style={{marginTop:3,display:'inline-flex'}}>{p.status}</span>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}



