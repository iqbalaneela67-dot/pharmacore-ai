/* eslint-disable */
import React, { useEffect, useRef, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { getMedStatus, formatPKR } from '../data/db';
import { MedStatusBadge, exportToCSV } from '../components/ui';
Chart.register(...registerables);

export default function Reports({ db }) {
  const revRef=useRef(); const topRef=useRef();
  const revInst=useRef(); const topInst=useRef();
  const totalSales=db.sales.reduce((a,s)=>a+(s.total||0),0);
  const totalPur=db.purchases.reduce((a,p)=>a+(p.total||0),0);
  const profit=totalSales-totalPur;
  const avgSale=db.sales.length?Math.round(totalSales/db.sales.length):0;

  const monthlyData=useMemo(()=>{
    const months=[];
    for(let i=5;i>=0;i--){
      const d=new Date(); d.setMonth(d.getMonth()-i);
      const ym=d.toISOString().slice(0,7);
      const lbl=d.toLocaleDateString('en-PK',{month:'short',year:'2-digit'});
      const rev=db.sales.filter(s=>s.date&&s.date.startsWith(ym)).reduce((a,s)=>a+(s.total||0),0);
      const pur=db.purchases.filter(p=>p.date&&p.date.startsWith(ym)).reduce((a,p)=>a+(p.total||0),0);
      months.push({lbl,rev,pur});
    }
    return months;
  },[db]);

  const topMeds=useMemo(()=>db.medicines.map(m=>({
    name:m.name.split(' ')[0],
    count:db.sales.filter(s=>s.medId===m.id).reduce((a,s)=>a+(s.qty||0),0),
    revenue:db.sales.filter(s=>s.medId===m.id).reduce((a,s)=>a+(s.total||0),0),
  })).filter(m=>m.count>0).sort((a,b)=>b.revenue-a.revenue).slice(0,6),[db]);

  useEffect(()=>{
    revInst.current?.destroy(); topInst.current?.destroy();
    revInst.current=new Chart(revRef.current,{type:'bar',data:{labels:monthlyData.map(m=>m.lbl),datasets:[{label:'Revenue',data:monthlyData.map(m=>m.rev),backgroundColor:'rgba(16,185,129,0.75)',borderRadius:6,borderSkipped:false},{label:'Purchases',data:monthlyData.map(m=>m.pur),backgroundColor:'rgba(59,130,246,0.6)',borderRadius:6,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#94a3b8',font:{size:11}}}},scales:{x:{ticks:{color:'#64748b'},grid:{display:false}},y:{ticks:{color:'#64748b',callback:v=>v===0?'0':'PKR '+v.toLocaleString()},grid:{color:'rgba(255,255,255,0.04)'}}}}});
    topInst.current=new Chart(topRef.current,{type:'bar',data:{labels:topMeds.length?topMeds.map(m=>m.name):['No Sales Yet'],datasets:[{label:'Revenue (PKR)',data:topMeds.length?topMeds.map(m=>m.revenue):[0],backgroundColor:'rgba(124,58,237,0.75)',borderRadius:6,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#64748b',callback:v=>'PKR '+v.toLocaleString()},grid:{color:'rgba(255,255,255,0.04)'}},y:{ticks:{color:'#94a3b8'},grid:{display:false}}}}});
    return()=>{ revInst.current?.destroy(); topInst.current?.destroy(); };
  },[db,monthlyData,topMeds]);

  const now=new Date();
  const expiringSoon=db.medicines.filter(m=>(new Date(m.expiry)-now)/(1000*60*60*24)<90).sort((a,b)=>new Date(a.expiry)-new Date(b.expiry));

  return(
    <div>
      <div className="metric-grid">
        {[{label:'Total Revenue',value:formatPKR(totalSales)},{label:'Total Purchases',value:formatPKR(totalPur)},{label:'Gross Profit',value:formatPKR(profit),cls:profit>=0?'metric-up':'metric-down'},{label:'Avg Sale Value',value:formatPKR(avgSale)},{label:'Total Bills',value:db.bills?.length||0},{label:'Total Returns',value:(db.saleReturns?.length||0)+(db.purchaseReturns?.length||0)}].map((m,i)=>(
          <div className="metric-card" key={i}><div className="metric-label">{m.label}</div><div className={`metric-value ${m.cls||''}`}>{m.value}</div></div>
        ))}
      </div>
      <div className="chart-grid-2">
        <div className="chart-card"><div className="chart-title">Monthly Revenue vs Purchases</div><div style={{position:'relative',height:220}}><canvas ref={revRef}/></div></div>
        <div className="chart-card"><div className="chart-title">Top Selling Medicines by Revenue</div><div style={{position:'relative',height:220}}><canvas ref={topRef}/></div></div>
      </div>
      <div className="card card-flush">
        <div style={{padding:'12px 16px',borderBottom:'0.5px solid var(--border)',display:'flex',alignItems:'center',gap:12}}>
          <span className="section-title">Expiry Report (Next 90 Days + Expired)</span>
          <div style={{flex:1}}/>
          <button className="btn btn-sm" onClick={()=>exportToCSV([['Medicine','Category','Batch','Expiry','Qty','MRP','Status'],...expiringSoon.map(m=>[m.name,m.category,m.batch,m.expiry,m.qty,m.mrp,getMedStatus(m)])],'expiry-report.csv')}><i className="ti ti-download"/> Export CSV</button>
        </div>
        <table>
          <thead><tr><th>Medicine</th><th>Category</th><th>Batch</th><th>Expiry</th><th>Qty</th><th>MRP Value</th><th>Status</th></tr></thead>
          <tbody>{expiringSoon.length?expiringSoon.map(m=>(<tr key={m.id} className={getMedStatus(m)==='Expired'?'row-expired':'row-low'}><td><b>{m.name}</b></td><td>{m.category}</td><td>{m.batch}</td><td><b>{m.expiry}</b></td><td>{m.qty}</td><td>{formatPKR(m.qty*m.mrp)}</td><td><MedStatusBadge med={m}/></td></tr>)):(<tr><td colSpan={7} className="empty">No medicines expiring in next 90 days</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
