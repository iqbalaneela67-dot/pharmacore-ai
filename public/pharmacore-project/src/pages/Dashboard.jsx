import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg0: "#08090c",
  bg1: "#0d0f14",
  bg2: "#12151c",
  bg3: "#181c26",
  bg4: "#1e2330",
  border: "rgba(255,255,255,0.06)",
  borderHov: "rgba(255,255,255,0.12)",
  jade: "#00c896",
  jadeD: "#009e75",
  jadeGlow: "rgba(0,200,150,0.15)",
  amber: "#f59e0b",
  amberGlow: "rgba(245,158,11,0.15)",
  red: "#ef4444",
  redGlow: "rgba(239,68,68,0.12)",
  blue: "#3b82f6",
  blueGlow: "rgba(59,130,246,0.12)",
  text1: "#f0f2f5",
  text2: "#8b95a8",
  text3: "#4e5668",
  mono: "'DM Mono', 'Fira Code', monospace",
  sans: "'DM Sans', system-ui, sans-serif",
  serif: "'Instrument Serif', Georgia, serif",
};

// ─── DATA STORE ───────────────────────────────────────────────────────────────
function dAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}
const MEDS = [
  { id:1,  name:"Panadol 500mg",       cat:"Analgesics",    bar:"123456", batch:"B001", expiry:"2026-12-31", qty:150, mrp:25,  pp:18,  mfr:"GSK",      min:20 },
  { id:2,  name:"Augmentin 625mg",     cat:"Antibiotics",   bar:"234567", batch:"B002", expiry:"2025-08-15", qty:8,   mrp:320, pp:240, mfr:"GSK",      min:15 },
  { id:3,  name:"Omeprazole 20mg",     cat:"Antacids",      bar:"345678", batch:"B003", expiry:"2026-06-30", qty:200, mrp:45,  pp:30,  mfr:"ICI",      min:30 },
  { id:4,  name:"Metformin 500mg",     cat:"Antidiabetic",  bar:"456789", batch:"B004", expiry:"2024-11-30", qty:60,  mrp:18,  pp:12,  mfr:"Sami",     min:25 },
  { id:5,  name:"Vitamin C 500mg",     cat:"Vitamins",      bar:"567890", batch:"B005", expiry:"2027-03-31", qty:5,   mrp:55,  pp:38,  mfr:"Abbott",   min:20 },
  { id:6,  name:"Amlodipine 5mg",      cat:"Cardiac",       bar:"678901", batch:"B006", expiry:"2026-09-30", qty:120, mrp:85,  pp:60,  mfr:"Novartis", min:20 },
  { id:7,  name:"Ciprofloxacin 500mg", cat:"Antibiotics",   bar:"789012", batch:"B007", expiry:"2026-11-30", qty:90,  mrp:95,  pp:70,  mfr:"Getz",     min:15 },
  { id:8,  name:"Atorvastatin 10mg",   cat:"Cardiac",       bar:"890123", batch:"B008", expiry:"2027-01-31", qty:75,  mrp:120, pp:85,  mfr:"Pfizer",   min:20 },
  { id:9,  name:"Cetirizine 10mg",     cat:"Antihistamine", bar:"901234", batch:"B009", expiry:"2026-05-30", qty:12,  mrp:35,  pp:22,  mfr:"AGP",      min:25 },
  { id:10, name:"Pantoprazole 40mg",   cat:"Antacids",      bar:"012345", batch:"B010", expiry:"2026-08-31", qty:180, mrp:65,  pp:45,  mfr:"Getz",     min:30 },
  { id:11, name:"Aspirin 75mg",        cat:"Cardiac",       bar:"111222", batch:"B011", expiry:"2027-06-30", qty:300, mrp:15,  pp:9,   mfr:"Bayer",    min:50 },
  { id:12, name:"Amoxicillin 500mg",   cat:"Antibiotics",   bar:"222333", batch:"B012", expiry:"2026-10-31", qty:110, mrp:55,  pp:38,  mfr:"Atco",     min:20 },
  { id:13, name:"Diclofenac 50mg",     cat:"Analgesics",    bar:"333444", batch:"B013", expiry:"2025-12-31", qty:95,  mrp:30,  pp:20,  mfr:"ICI",      min:20 },
  { id:14, name:"Losartan 50mg",       cat:"Cardiac",       bar:"444555", batch:"B014", expiry:"2027-02-28", qty:65,  mrp:110, pp:78,  mfr:"Searle",   min:15 },
  { id:15, name:"Multivitamin Tabs",   cat:"Vitamins",      bar:"555666", batch:"B015", expiry:"2027-05-31", qty:14,  mrp:280, pp:200, mfr:"Abbott",   min:20 },
];
const SALES_RAW = [
  {id:1,inv:"INV-001",date:dAgo(0),patient:"Ahmad Raza",medId:1,qty:4,total:100,disc:0,status:"Paid"},
  {id:2,inv:"INV-002",date:dAgo(0),patient:"Sana Fatima",medId:7,qty:2,total:190,disc:0,status:"Paid"},
  {id:3,inv:"INV-003",date:dAgo(0),patient:"Bilal Sheikh",medId:3,qty:3,total:135,disc:0,status:"Paid"},
  {id:4,inv:"INV-004",date:dAgo(0),patient:"Hina Bashir",medId:8,qty:1,total:120,disc:0,status:"Paid"},
  {id:5,inv:"INV-005",date:dAgo(0),patient:"Farhan Qureshi",medId:11,qty:6,total:90,disc:0,status:"Paid"},
  {id:6,inv:"INV-006",date:dAgo(0),patient:"Mehwish Noor",medId:14,qty:2,total:220,disc:5,status:"Paid"},
  {id:7,inv:"INV-007",date:dAgo(0),patient:"Zain ul Abdin",medId:13,qty:3,total:90,disc:0,status:"Paid"},
  {id:8,inv:"INV-008",date:dAgo(1),patient:"Sara Khan",medId:1,qty:2,total:50,disc:0,status:"Paid"},
  {id:9,inv:"INV-009",date:dAgo(1),patient:"Usman Malik",medId:6,qty:1,total:85,disc:5,status:"Paid"},
  {id:10,inv:"INV-010",date:dAgo(1),patient:"Nadia Hussain",medId:12,qty:2,total:110,disc:0,status:"Paid"},
  {id:11,inv:"INV-011",date:dAgo(1),patient:"Tariq Mehmood",medId:10,qty:3,total:195,disc:0,status:"Paid"},
  {id:12,inv:"INV-012",date:dAgo(1),patient:"Fatima Bibi",medId:8,qty:1,total:120,disc:0,status:"Paid"},
  {id:13,inv:"INV-013",date:dAgo(2),patient:"Kamran Ali",medId:7,qty:1,total:95,disc:0,status:"Paid"},
  {id:14,inv:"INV-014",date:dAgo(2),patient:"Rukhsar Parveen",medId:3,qty:4,total:180,disc:0,status:"Paid"},
  {id:15,inv:"INV-015",date:dAgo(2),patient:"Imran Ashraf",medId:11,qty:10,total:150,disc:0,status:"Paid"},
  {id:16,inv:"INV-016",date:dAgo(2),patient:"Ambreen Sadiq",medId:14,qty:1,total:110,disc:0,status:"Paid"},
  {id:17,inv:"INV-017",date:dAgo(3),patient:"Hassan Akhtar",medId:1,qty:6,total:150,disc:0,status:"Paid"},
  {id:18,inv:"INV-018",date:dAgo(3),patient:"Asma Ijaz",medId:6,qty:2,total:170,disc:0,status:"Paid"},
  {id:19,inv:"INV-019",date:dAgo(3),patient:"Rehan Butt",medId:10,qty:2,total:130,disc:0,status:"Paid"},
  {id:20,inv:"INV-020",date:dAgo(3),patient:"Noor Ul Ain",medId:12,qty:3,total:165,disc:5,status:"Paid"},
  {id:21,inv:"INV-021",date:dAgo(4),patient:"Waseem Akram",medId:8,qty:2,total:240,disc:0,status:"Paid"},
  {id:22,inv:"INV-022",date:dAgo(4),patient:"Shahida Bibi",medId:13,qty:4,total:120,disc:0,status:"Paid"},
  {id:23,inv:"INV-023",date:dAgo(4),patient:"Adeel Chaudhry",medId:7,qty:2,total:190,disc:0,status:"Paid"},
  {id:24,inv:"INV-024",date:dAgo(5),patient:"Rabia Kanwal",medId:1,qty:3,total:75,disc:0,status:"Paid"},
  {id:25,inv:"INV-025",date:dAgo(5),patient:"Naveed Iqbal",medId:6,qty:1,total:85,disc:0,status:"Paid"},
  {id:26,inv:"INV-026",date:dAgo(5),patient:"Samia Riaz",medId:10,qty:4,total:260,disc:0,status:"Paid"},
  {id:27,inv:"INV-027",date:dAgo(5),patient:"Omer Farooq",medId:14,qty:1,total:110,disc:0,status:"Paid"},
  {id:28,inv:"INV-028",date:dAgo(6),patient:"Zara Shahid",medId:3,qty:2,total:90,disc:0,status:"Paid"},
  {id:29,inv:"INV-029",date:dAgo(6),patient:"Muneeb Ur Rehman",medId:11,qty:8,total:120,disc:0,status:"Paid"},
  {id:30,inv:"INV-030",date:dAgo(6),patient:"Iram Shafiq",medId:8,qty:1,total:120,disc:0,status:"Paid"},
  {id:31,inv:"INV-031",date:dAgo(8),patient:"Khalid Mehmood",medId:12,qty:2,total:110,disc:0,status:"Paid"},
  {id:32,inv:"INV-032",date:dAgo(10),patient:"Fariha Naz",medId:1,qty:5,total:125,disc:0,status:"Paid"},
  {id:33,inv:"INV-033",date:dAgo(12),patient:"Shoaib Akhtar",medId:6,qty:2,total:170,disc:0,status:"Paid"},
  {id:34,inv:"INV-034",date:dAgo(14),patient:"Komal Anwar",medId:7,qty:3,total:285,disc:0,status:"Paid"},
  {id:35,inv:"INV-035",date:dAgo(16),patient:"Asif Iqbal",medId:10,qty:2,total:130,disc:0,status:"Paid"},
  {id:36,inv:"INV-036",date:dAgo(18),patient:"Lubna Waheed",medId:8,qty:1,total:120,disc:0,status:"Paid"},
  {id:37,inv:"INV-037",date:dAgo(20),patient:"Rizwan Shah",medId:14,qty:2,total:220,disc:0,status:"Paid"},
  {id:38,inv:"INV-038",date:dAgo(22),patient:"Saima Tariq",medId:13,qty:4,total:120,disc:0,status:"Paid"},
  {id:39,inv:"INV-039",date:dAgo(24),patient:"Faisal Nawaz",medId:3,qty:3,total:135,disc:0,status:"Paid"},
  {id:40,inv:"INV-040",date:dAgo(26),patient:"Tahira Khanam",medId:11,qty:5,total:75,disc:0,status:"Paid"},
  {id:41,inv:"INV-041",date:dAgo(28),patient:"Salman Raza",medId:6,qty:1,total:85,disc:0,status:"Paid"},
  {id:42,inv:"INV-042",date:dAgo(30),patient:"Maryam Siddiqui",medId:12,qty:2,total:110,disc:0,status:"Paid"},
];
const PURCHASES_RAW = [
  {id:1,po:"PO-001",date:dAgo(25),supplier:"MedCo Pvt Ltd",medId:1,qty:200,price:18,total:3600,status:"Received"},
  {id:2,po:"PO-002",date:dAgo(22),supplier:"PharmaCare",medId:2,qty:50,price:240,total:12000,status:"Received"},
  {id:3,po:"PO-003",date:dAgo(18),supplier:"MedCo Pvt Ltd",medId:3,qty:300,price:30,total:9000,status:"Received"},
  {id:4,po:"PO-004",date:dAgo(15),supplier:"Getz Pharma",medId:7,qty:150,price:70,total:10500,status:"Received"},
  {id:5,po:"PO-005",date:dAgo(12),supplier:"Pfizer Pakistan",medId:8,qty:100,price:85,total:8500,status:"Received"},
  {id:6,po:"PO-006",date:dAgo(10),supplier:"Abbott Pakistan",medId:5,qty:80,price:38,total:3040,status:"Received"},
  {id:7,po:"PO-007",date:dAgo(8),supplier:"Searle Company",medId:14,qty:100,price:78,total:7800,status:"Received"},
  {id:8,po:"PO-008",date:dAgo(6),supplier:"Atco Laboratories",medId:12,qty:150,price:38,total:5700,status:"Received"},
  {id:9,po:"PO-009",date:dAgo(4),supplier:"Bayer Pakistan",medId:11,qty:500,price:9,total:4500,status:"Received"},
  {id:10,po:"PO-010",date:dAgo(2),supplier:"Novartis Pharma",medId:6,qty:200,price:60,total:12000,status:"Received"},
  {id:11,po:"PO-011",date:dAgo(1),supplier:"Getz Pharma",medId:10,qty:200,price:45,total:9000,status:"Pending"},
  {id:12,po:"PO-012",date:dAgo(0),supplier:"MedCo Pvt Ltd",medId:13,qty:100,price:20,total:2000,status:"Pending"},
];
const medMap = Object.fromEntries(MEDS.map(m => [m.id, m]));
const pkr = n => "₨ " + Math.round(n).toLocaleString("en-PK");
const pct = (a,b) => b ? Math.round(((a-b)/b)*100) : 0;
const today = dAgo(0);

// ─── COMPUTED ANALYTICS ───────────────────────────────────────────────────────
function useAnalytics() {
  return useMemo(() => {
    const todaySales = SALES_RAW.filter(s => s.date === dAgo(0));
    const ydaySales  = SALES_RAW.filter(s => s.date === dAgo(1));
    const month30    = SALES_RAW.filter(s => s.date >= dAgo(30));
    const prevMonth  = SALES_RAW.filter(s => s.date >= dAgo(60) && s.date < dAgo(30));
    const todayRev   = todaySales.reduce((a,s)=>a+s.total,0);
    const ydayRev    = ydaySales.reduce((a,s)=>a+s.total,0);
    const monthRev   = month30.reduce((a,s)=>a+s.total,0);
    const prevRev    = prevMonth.reduce((a,s)=>a+s.total,0);
    const pending    = PURCHASES_RAW.filter(p=>p.status==="Pending");
    const pendVal    = pending.reduce((a,p)=>a+p.total,0);
    const now = new Date();
    const alerts = MEDS.filter(m => new Date(m.expiry)<now || m.qty<=m.min);
    const expired = MEDS.filter(m => new Date(m.expiry)<now);
    const lowStock = MEDS.filter(m => m.qty<=m.min && new Date(m.expiry)>=now);
    const days7 = Array.from({length:7},(_,i)=>dAgo(6-i));
    const rev7 = days7.map(d=>({
      label: d.slice(5),
      rev: SALES_RAW.filter(s=>s.date===d).reduce((a,s)=>a+s.total,0),
      cnt: SALES_RAW.filter(s=>s.date===d).length,
    }));
    const catMap = {};
    month30.forEach(s=>{
      const cat=medMap[s.medId]?.cat||"Other";
      catMap[cat]=(catMap[cat]||0)+s.total;
    });
    const topMeds = [...MEDS].sort((a,b)=>{
      const aRev=SALES_RAW.filter(s=>s.medId===a.id).reduce((x,s)=>x+s.total,0);
      const bRev=SALES_RAW.filter(s=>s.medId===b.id).reduce((x,s)=>x+s.total,0);
      return bRev-aRev;
    }).slice(0,5).map(m=>({
      ...m,
      rev: SALES_RAW.filter(s=>s.medId===m.id).reduce((x,s)=>x+s.total,0)
    }));
    const profit30 = month30.reduce((a,s)=>{
      const med=medMap[s.medId];
      return a+(med?((med.mrp-med.pp)*s.qty):0);
    },0);
    const margin = monthRev>0?Math.round((profit30/monthRev)*100):0;
    return {todayRev,ydayRev,monthRev,prevRev,todaySales,month30,pending,pendVal,
            alerts,expired,lowStock,days7,rev7,catMap,topMeds,profit30,margin};
  },[]);
}

// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────
const Fade = ({children,delay=0,style={}}) => {
  const [vis,setVis]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),delay);return()=>clearTimeout(t);},[delay]);
  return <div style={{opacity:vis?1:0,transform:vis?"translateY(0)":"translateY(8px)",
    transition:"opacity 0.4s ease, transform 0.4s ease",...style}}>{children}</div>;
};

const AnimNum = ({target,prefix="",suffix="",duration=1200}) => {
  const [cur,setCur]=useState(0);
  useEffect(()=>{
    let start=null,raf;
    const step=ts=>{
      if(!start)start=ts;
      const p=Math.min((ts-start)/duration,1);
      const ease=1-Math.pow(1-p,3);
      setCur(Math.round(target*ease));
      if(p<1)raf=requestAnimationFrame(step);
    };
    raf=requestAnimationFrame(step);
    return()=>cancelAnimationFrame(raf);
  },[target,duration]);
  return <>{prefix}{cur.toLocaleString("en-PK")}{suffix}</>;
};

const Badge = ({type,children}) => {
  const styles={
    success:{bg:"rgba(0,200,150,0.12)",color:T.jade,border:`1px solid rgba(0,200,150,0.2)`},
    warn:{bg:"rgba(245,158,11,0.12)",color:T.amber,border:`1px solid rgba(245,158,11,0.2)`},
    danger:{bg:"rgba(239,68,68,0.1)",color:T.red,border:`1px solid rgba(239,68,68,0.18)`},
    info:{bg:"rgba(59,130,246,0.1)",color:T.blue,border:`1px solid rgba(59,130,246,0.18)`},
    neutral:{bg:T.bg4,color:T.text2,border:`1px solid ${T.border}`},
  };
  const s=styles[type]||styles.neutral;
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,
    padding:"3px 10px",borderRadius:20,fontSize:11,fontFamily:T.mono,fontWeight:500,
    letterSpacing:"0.03em",background:s.bg,color:s.color,border:s.border}}>{children}</span>;
};

const MiniSparkline = ({data,color=T.jade,height=32}) => {
  const max=Math.max(...data,1);
  const pts=data.map((v,i)=>`${(i/(data.length-1))*100},${100-(v/max)*90}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{width:"100%",height}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      <polyline points={`0,100 ${pts} 100,100`}
        fill={`url(#sg-${color.replace("#","").replace(/[^a-z0-9]/gi,"")})`} stroke="none"/>
      <defs>
        <linearGradient id={`sg-${color.replace("#","").replace(/[^a-z0-9]/gi,"")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  );
};

const BarChart = ({data,keyRev,keyLabel,color=T.jade}) => {
  const max=Math.max(...data.map(d=>d[keyRev]),1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:120,padding:"8px 0 0"}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{width:"100%",background:T.bg4,borderRadius:4,height:96,position:"relative",overflow:"hidden"}}>
            <div style={{
              position:"absolute",bottom:0,width:"100%",
              height:`${Math.max((d[keyRev]/max)*100,4)}%`,
              background:`linear-gradient(180deg,${color}cc,${color}55)`,
              borderRadius:"3px 3px 0 0",
              transition:"height 0.8s cubic-bezier(0.34,1.56,0.64,1)",
            }}/>
          </div>
          <span style={{fontSize:10,color:T.text3,fontFamily:T.mono}}>{d[keyLabel]}</span>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({data,colors}) => {
  const total=data.reduce((a,d)=>a+d.val,0)||1;
  let cumul=0;
  const slices=data.map((d,i)=>{
    const frac=d.val/total;
    const start=cumul;
    cumul+=frac;
    const a1=start*2*Math.PI-Math.PI/2;
    const a2=cumul*2*Math.PI-Math.PI/2;
    const r=38,cx=50,cy=50;
    const x1=cx+r*Math.cos(a1),y1=cy+r*Math.sin(a1);
    const x2=cx+r*Math.cos(a2),y2=cy+r*Math.sin(a2);
    const lg=frac>0.5?1:0;
    return {path:`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} Z`,
            color:colors[i%colors.length],label:d.label,val:d.val,frac};
  });
  return (
    <svg viewBox="0 0 100 100" style={{width:"100%",maxWidth:160}}>
      {slices.map((s,i)=>(
        <path key={i} d={s.path} fill={s.color} opacity={0.85}
          style={{transition:"opacity 0.2s"}}
          onMouseEnter={e=>e.target.setAttribute("opacity","1")}
          onMouseLeave={e=>e.target.setAttribute("opacity","0.85")}/>
      ))}
      <circle cx="50" cy="50" r="24" fill={T.bg2}/>
      <text x="50" y="48" textAnchor="middle" fill={T.text1} fontSize="9" fontFamily={T.mono} fontWeight="600">
        {data.length}
      </text>
      <text x="50" y="57" textAnchor="middle" fill={T.text3} fontSize="6" fontFamily={T.mono}>cats</text>
    </svg>
  );
};

const StockBar = ({qty,min,max}) => {
  const pct=Math.min((qty/Math.max(max,1))*100,100);
  const isLow=qty<=min, isCrit=qty<=min*0.5;
  const col=isCrit?T.red:isLow?T.amber:T.jade;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1,height:4,background:T.bg4,borderRadius:2,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:col,borderRadius:2,
          transition:"width 1s cubic-bezier(0.34,1.56,0.64,1)"}}/>
      </div>
      <span style={{fontSize:11,fontFamily:T.mono,color:col,minWidth:28,textAlign:"right"}}>{qty}</span>
    </div>
  );
};

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {id:"dashboard",icon:"⬡",label:"Dashboard"},
  {id:"inventory",icon:"◫",label:"Inventory"},
  {id:"billing",icon:"▣",label:"Billing"},
  {id:"purchases",icon:"◈",label:"Purchases"},
  {id:"reports",icon:"◩",label:"Reports"},
  {id:"ai",icon:"◎",label:"AI Insights"},
  {id:"settings",icon:"◌",label:"Settings"},
];

const Sidebar = ({active,setActive,alerts}) => {
  const [hov,setHov]=useState(null);
  return (
    <div style={{width:220,background:T.bg1,borderRight:`1px solid ${T.border}`,
      display:"flex",flexDirection:"column",height:"100vh",position:"fixed",left:0,top:0,zIndex:100}}>
      {/* Logo */}
      <div style={{padding:"24px 20px 20px",borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,background:`linear-gradient(135deg,${T.jade},${T.jadeD})`,
            borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:16,boxShadow:`0 0 20px ${T.jadeGlow}`}}>✚</div>
          <div>
            <div style={{fontFamily:T.serif,fontSize:16,color:T.text1,letterSpacing:"-0.01em",lineHeight:1.1}}>
              PharmaCore
            </div>
            <div style={{fontFamily:T.mono,fontSize:9,color:T.jade,letterSpacing:"0.12em",marginTop:1}}>
              ENTERPRISE
            </div>
          </div>
        </div>
      </div>
      {/* Nav Items */}
      <nav style={{flex:1,padding:"12px 10px",overflowY:"auto"}}>
        {NAV_ITEMS.map(item=>(
          <button key={item.id}
            onClick={()=>setActive(item.id)}
            onMouseEnter={()=>setHov(item.id)}
            onMouseLeave={()=>setHov(null)}
            style={{
              display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 12px",
              borderRadius:8,border:"none",cursor:"pointer",marginBottom:2,
              background:active===item.id?`${T.jadeGlow}`:"transparent",
              transition:"all 0.15s ease",
              outline:"none",
            }}>
            <span style={{fontSize:14,color:active===item.id?T.jade:hov===item.id?T.text1:T.text3,
              transition:"color 0.15s",lineHeight:1}}>{item.icon}</span>
            <span style={{fontSize:13,fontFamily:T.sans,fontWeight:500,
              color:active===item.id?T.jade:hov===item.id?T.text1:T.text2,
              transition:"color 0.15s"}}>{item.label}</span>
            {item.id==="inventory" && alerts>0 && (
              <span style={{marginLeft:"auto",minWidth:18,height:18,borderRadius:9,
                background:T.amber,color:"#000",fontSize:10,fontWeight:700,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:T.mono}}>{alerts}</span>
            )}
          </button>
        ))}
      </nav>
      {/* User */}
      <div style={{padding:"16px 20px",borderTop:`1px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",
            background:`linear-gradient(135deg,${T.jade}44,${T.blue}44)`,
            border:`1px solid ${T.border}`,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:12,color:T.jade,fontFamily:T.mono,fontWeight:700}}>A</div>
          <div>
            <div style={{fontSize:12,color:T.text1,fontFamily:T.sans,fontWeight:500}}>Admin User</div>
            <div style={{fontSize:10,color:T.text3,fontFamily:T.mono}}>admin@pharmacore.io</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
const KpiCard = ({label,value,rawValue,prefix="",suffix="",delta,deltaLabel,sub,accent=T.jade,sparkData,delay=0}) => {
  const [hov,setHov]=useState(false);
  return (
    <Fade delay={delay}>
      <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        style={{background:T.bg2,border:`1px solid ${hov?T.borderHov:T.border}`,
          borderRadius:12,padding:"20px 20px 16px",cursor:"default",
          transition:"all 0.2s ease",
          boxShadow:hov?`0 0 0 1px ${T.borderHov}, 0 8px 32px rgba(0,0,0,0.3)`:"none",
          position:"relative",overflow:"hidden"}}>
        {/* Accent glow */}
        <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,
          background:accent,borderRadius:"50%",opacity:hov?0.06:0.03,
          transition:"opacity 0.3s",filter:"blur(20px)"}}/>
        <div style={{fontSize:11,fontFamily:T.mono,color:T.text3,letterSpacing:"0.08em",
          textTransform:"uppercase",marginBottom:10}}>{label}</div>
        <div style={{fontSize:26,fontFamily:T.mono,fontWeight:700,color:T.text1,
          letterSpacing:"-0.02em",lineHeight:1.1,marginBottom:8}}>
          {prefix}<AnimNum target={rawValue||parseInt(String(value).replace(/\D/g,""))||0}/>
          {suffix}
        </div>
        {delta!==undefined && (
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
            <span style={{fontSize:11,fontFamily:T.mono,
              color:delta>=0?T.jade:T.red,fontWeight:600}}>
              {delta>=0?"▲":"▼"} {Math.abs(delta)}%
            </span>
            {deltaLabel && <span style={{fontSize:11,color:T.text3,fontFamily:T.mono}}>{deltaLabel}</span>}
          </div>
        )}
        {sub && <div style={{fontSize:11,color:T.text3,fontFamily:T.mono}}>{sub}</div>}
        {sparkData && <div style={{marginTop:8,opacity:0.8}}><MiniSparkline data={sparkData} color={accent}/></div>}
      </div>
    </Fade>
  );
};

// ─── PANEL CARD ───────────────────────────────────────────────────────────────
const Panel = ({title,action,children,delay=0,style={}}) => (
  <Fade delay={delay}>
    <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:12,
      overflow:"hidden",...style}}>
      {title && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"16px 20px",borderBottom:`1px solid ${T.border}`}}>
          <span style={{fontSize:12,fontFamily:T.mono,color:T.text2,letterSpacing:"0.06em",
            textTransform:"uppercase",fontWeight:600}}>{title}</span>
          {action && <button onClick={action.fn}
            style={{fontSize:11,color:T.jade,fontFamily:T.mono,background:"none",border:"none",
              cursor:"pointer",padding:"2px 8px",borderRadius:4,
              transition:"all 0.15s",letterSpacing:"0.04em"}}>
            {action.label} →
          </button>}
        </div>
      )}
      <div style={{padding:"16px 20px"}}>{children}</div>
    </div>
  </Fade>
);

// ─── ALERT RIBBON ─────────────────────────────────────────────────────────────
const AlertRibbon = ({expired,lowStock,onView}) => {
  const total=expired.length+lowStock.length;
  if(!total)return null;
  return (
    <Fade delay={50}>
      <div onClick={onView} style={{
        display:"flex",alignItems:"center",gap:12,padding:"10px 18px",
        background:`linear-gradient(90deg,rgba(245,158,11,0.08),rgba(245,158,11,0.03))`,
        border:`1px solid rgba(245,158,11,0.18)`,borderRadius:10,cursor:"pointer",
        marginBottom:20,transition:"all 0.15s",
      }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(245,158,11,0.35)"}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(245,158,11,0.18)"}}>
        <span style={{fontSize:14}}>⚠</span>
        <div style={{flex:1}}>
          <span style={{fontFamily:T.mono,fontSize:12,color:T.amber}}>
            {expired.length>0 && <><strong>{expired.length}</strong> expired {expired.length===1?"medicine":"medicines"}</>}
            {expired.length>0 && lowStock.length>0 && " · "}
            {lowStock.length>0 && <><strong>{lowStock.length}</strong> low-stock {lowStock.length===1?"item":"items"}</>}
          </span>
          <span style={{fontFamily:T.mono,fontSize:11,color:T.text3,marginLeft:8}}>
            — immediate action required
          </span>
        </div>
        <span style={{fontSize:11,color:T.amber,fontFamily:T.mono,opacity:0.7}}>View Inventory →</span>
      </div>
    </Fade>
  );
};

// ─── DASHBOARD MODULE ─────────────────────────────────────────────────────────
const Dashboard = ({analytics,setModule}) => {
  const {todayRev,ydayRev,monthRev,prevRev,todaySales,month30,pending,pendVal,
         expired,lowStock,rev7,catMap,topMeds,profit30,margin} = analytics;
  const catEntries = Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  const catColors=[T.jade,T.blue,T.amber,"#a78bfa","#fb7185","#34d399","#60a5fa"];
  const maxCatVal=catEntries[0]?.[1]||1;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PK",{weekday:"long",year:"numeric",month:"long",day:"numeric"});

  return (
    <div>
      {/* Header */}
      <Fade delay={0}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
          <div>
            <h1 style={{fontFamily:T.serif,fontSize:28,color:T.text1,fontWeight:400,
              letterSpacing:"-0.02em",lineHeight:1.1,marginBottom:4}}>Good morning,</h1>
            <p style={{fontFamily:T.mono,fontSize:12,color:T.text3}}>{dateStr}</p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button style={{padding:"8px 16px",background:T.bg3,border:`1px solid ${T.border}`,
              borderRadius:8,color:T.text2,fontSize:12,fontFamily:T.mono,cursor:"pointer"}}>
              ⬇ Export
            </button>
            <button style={{padding:"8px 16px",
              background:`linear-gradient(135deg,${T.jade},${T.jadeD})`,
              border:"none",borderRadius:8,color:"#000",fontSize:12,fontFamily:T.mono,
              fontWeight:700,cursor:"pointer",
              boxShadow:`0 0 20px ${T.jadeGlow}`}}>
              + New Sale
            </button>
          </div>
        </div>
      </Fade>

      <AlertRibbon expired={expired} lowStock={lowStock} onView={()=>setModule("inventory")}/>

      {/* KPI Row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <KpiCard label="Today's Revenue" rawValue={todayRev} prefix="₨ "
          delta={pct(todayRev,ydayRev)} deltaLabel="vs yesterday"
          sub={`${todaySales.length} transactions`} accent={T.jade}
          sparkData={rev7.map(d=>d.rev)} delay={80}/>
        <KpiCard label="Monthly Revenue" rawValue={monthRev} prefix="₨ "
          delta={pct(monthRev,prevRev)} deltaLabel="vs last month"
          sub={`${month30.length} orders`} accent={T.blue}
          sparkData={rev7.map(d=>d.rev)} delay={140}/>
        <KpiCard label="Gross Margin" rawValue={margin} suffix="%"
          sub={`₨ ${Math.round(profit30/1000)}k profit / 30d`} accent={T.jade}
          sparkData={[18,22,19,25,21,28,margin]} delay={200}/>
        <KpiCard label="Pending Orders" rawValue={pending.length}
          sub={`${pkr(pendVal)} value pending`} accent={T.amber} delay={260}/>
      </div>

      {/* Charts row */}
      <div style={{display:"grid",gridTemplateColumns:"1.8fr 1fr",gap:12,marginBottom:20}}>
        <Panel title="Revenue — 7 Day Trend" delay={180}>
          <BarChart data={rev7} keyRev="rev" keyLabel="label" color={T.jade}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:12,
            padding:"10px 0",borderTop:`1px solid ${T.border}`}}>
            {rev7.map((d,i)=>(
              <div key={i} style={{textAlign:"center"}}>
                <div style={{fontFamily:T.mono,fontSize:10,color:T.jade,fontWeight:600}}>
                  {d.cnt}
                </div>
                <div style={{fontFamily:T.mono,fontSize:9,color:T.text3}}>sales</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Sales by Category" delay={220}>
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
              <DonutChart data={catEntries.map(([l,v])=>({label:l,val:v}))} colors={catColors}/>
            </div>
            {catEntries.slice(0,5).map(([cat,val],i)=>(
              <div key={cat} style={{display:"flex",alignItems:"center",gap:8,
                padding:"5px 0",borderBottom:i<4?`1px solid ${T.border}`:"none"}}>
                <div style={{width:6,height:6,borderRadius:"50%",
                  background:catColors[i%catColors.length],flexShrink:0}}/>
                <span style={{flex:1,fontSize:12,fontFamily:T.sans,color:T.text2}}>{cat}</span>
                <span style={{fontSize:11,fontFamily:T.mono,color:T.text1}}>{pkr(val)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Bottom row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Panel title="Top Performing SKUs" delay={260}>
          {topMeds.map((m,i)=>{
            const maxRev=topMeds[0]?.rev||1;
            return (
              <div key={m.id} style={{marginBottom:i<4?12:0}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,fontFamily:T.sans,color:T.text1}}>{m.name}</span>
                  <span style={{fontSize:11,fontFamily:T.mono,color:T.jade}}>{pkr(m.rev)}</span>
                </div>
                <div style={{height:3,background:T.bg4,borderRadius:2}}>
                  <div style={{width:`${(m.rev/maxRev)*100}%`,height:"100%",
                    background:`linear-gradient(90deg,${T.jade},${T.jadeD})`,borderRadius:2,
                    transition:"width 1s ease"}}/>
                </div>
              </div>
            );
          })}
        </Panel>
        <Panel title="Recent Transactions" action={{label:"View all",fn:()=>setModule("billing")}} delay={300}>
          {SALES_RAW.slice(0,6).map((s,i)=>{
            const med=medMap[s.medId];
            return (
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:12,
                padding:"7px 0",borderBottom:i<5?`1px solid ${T.border}`:"none"}}>
                <div style={{width:30,height:30,borderRadius:8,
                  background:T.bg4,border:`1px solid ${T.border}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:10,color:T.jade,fontFamily:T.mono,fontWeight:700,flexShrink:0}}>
                  {s.patient.charAt(0)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontFamily:T.sans,color:T.text1,
                    whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.patient}</div>
                  <div style={{fontSize:10,fontFamily:T.mono,color:T.text3}}>{med?.name}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,fontFamily:T.mono,color:T.text1}}>{pkr(s.total)}</div>
                  <Badge type="success">Paid</Badge>
                </div>
              </div>
            );
          })}
        </Panel>
      </div>
    </div>
  );
};

// ─── INVENTORY MODULE ─────────────────────────────────────────────────────────
const Inventory = () => {
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("All");
  const [sortBy,setSortBy]=useState("name");
  const now=new Date();
  const cats=["All",...new Set(MEDS.map(m=>m.cat))];
  const filtered=MEDS.filter(m=>{
    const matchSearch=m.name.toLowerCase().includes(search.toLowerCase())||
      m.bar.includes(search)||m.mfr.toLowerCase().includes(search.toLowerCase());
    const exp=new Date(m.expiry);
    const status=exp<now?"Expired":m.qty<=m.min?"Low Stock":"In Stock";
    const matchFilter=filter==="All"||filter===status||filter===m.cat;
    return matchSearch && matchFilter;
  }).sort((a,b)=>sortBy==="name"?a.name.localeCompare(b.name):
    sortBy==="qty"?b.qty-a.qty:
    sortBy==="expiry"?a.expiry.localeCompare(b.expiry):0);

  return (
    <div>
      <Fade>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <h1 style={{fontFamily:T.serif,fontSize:24,color:T.text1,fontWeight:400,marginBottom:2}}>Inventory</h1>
            <p style={{fontFamily:T.mono,fontSize:11,color:T.text3}}>{MEDS.length} products · {new Set(MEDS.map(m=>m.cat)).size} categories</p>
          </div>
          <button style={{padding:"8px 18px",background:`linear-gradient(135deg,${T.jade},${T.jadeD})`,
            border:"none",borderRadius:8,color:"#000",fontSize:12,fontFamily:T.mono,
            fontWeight:700,cursor:"pointer"}}>+ Add Medicine</button>
        </div>
      </Fade>

      {/* Filters */}
      <Fade delay={60}>
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{position:"relative",flex:"0 0 240px"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search medicines, barcodes..."
              style={{width:"100%",background:T.bg2,border:`1px solid ${T.border}`,
                borderRadius:8,padding:"8px 12px 8px 34px",color:T.text1,
                fontFamily:T.mono,fontSize:12,outline:"none",boxSizing:"border-box"}}/>
            <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",
              color:T.text3,fontSize:14}}>⌕</span>
          </div>
          {["All","In Stock","Low Stock","Expired",...cats.slice(1)].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              style={{padding:"6px 14px",borderRadius:20,fontSize:11,fontFamily:T.mono,
                background:filter===f?T.jade:"transparent",
                color:filter===f?"#000":T.text2,
                border:`1px solid ${filter===f?T.jade:T.border}`,
                cursor:"pointer",transition:"all 0.15s"}}>
              {f}
            </button>
          ))}
          <div style={{marginLeft:"auto",display:"flex",gap:4}}>
            {["name","qty","expiry"].map(s=>(
              <button key={s} onClick={()=>setSortBy(s)}
                style={{padding:"6px 12px",borderRadius:6,fontSize:11,fontFamily:T.mono,
                  background:sortBy===s?T.bg4:"transparent",color:sortBy===s?T.text1:T.text3,
                  border:`1px solid ${sortBy===s?T.border:"transparent"}`,cursor:"pointer"}}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </Fade>

      {/* Table */}
      <Fade delay={100}>
        <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${T.border}`}}>
                  {["Medicine","Category","Manufacturer","Batch","Expiry","Stock","MRP","Status"].map(h=>(
                    <th key={h} style={{padding:"11px 16px",textAlign:"left",fontSize:10,
                      fontFamily:T.mono,color:T.text3,letterSpacing:"0.08em",
                      textTransform:"uppercase",fontWeight:500,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m,i)=>{
                  const exp=new Date(m.expiry);
                  const isExp=exp<now;
                  const isLow=!isExp&&m.qty<=m.min;
                  const statusType=isExp?"danger":isLow?"warn":"success";
                  const statusLabel=isExp?"Expired":isLow?"Low Stock":"In Stock";
                  const daysToExp=Math.round((exp-now)/(1000*60*60*24));
                  const expColor=isExp?T.red:daysToExp<90?T.amber:T.text2;
                  return (
                    <tr key={m.id} style={{borderBottom:`1px solid ${T.border}`,
                      transition:"background 0.1s",cursor:"pointer"}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.bg3}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{padding:"12px 16px"}}>
                        <div style={{fontSize:13,fontFamily:T.sans,color:T.text1,fontWeight:500}}>{m.name}</div>
                        <div style={{fontSize:10,fontFamily:T.mono,color:T.text3}}>#{m.bar}</div>
                      </td>
                      <td style={{padding:"12px 16px"}}><Badge type="neutral">{m.cat}</Badge></td>
                      <td style={{padding:"12px 16px",fontSize:12,fontFamily:T.mono,color:T.text2}}>{m.mfr}</td>
                      <td style={{padding:"12px 16px",fontSize:11,fontFamily:T.mono,color:T.text3}}>{m.batch}</td>
                      <td style={{padding:"12px 16px"}}>
                        <span style={{fontSize:11,fontFamily:T.mono,color:expColor}}>{m.expiry}</span>
                        {!isExp&&daysToExp<90&&<div style={{fontSize:9,color:T.amber,fontFamily:T.mono}}>{daysToExp}d left</div>}
                      </td>
                      <td style={{padding:"12px 16px",minWidth:120}}>
                        <StockBar qty={m.qty} min={m.min} max={m.qty+50}/>
                      </td>
                      <td style={{padding:"12px 16px",fontFamily:T.mono,fontSize:12,color:T.text1,whiteSpace:"nowrap"}}>
                        ₨ {m.mrp}
                      </td>
                      <td style={{padding:"12px 16px"}}><Badge type={statusType}>{statusLabel}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{padding:"10px 16px",borderTop:`1px solid ${T.border}`,
            fontSize:11,fontFamily:T.mono,color:T.text3}}>
            Showing {filtered.length} of {MEDS.length} products
          </div>
        </div>
      </Fade>
    </div>
  );
};

// ─── BILLING MODULE ───────────────────────────────────────────────────────────
const Billing = () => {
  const [tab,setTab]=useState("history");
  const [items,setItems]=useState([]);
  const [search,setSearch]=useState("");
  const [patientName,setPatientName]=useState("");
  const [doctor,setDoctor]=useState("");
  const [payment,setPayment]=useState("Cash");
  const [discount,setDiscount]=useState(0);
  const [medSearch,setMedSearch]=useState("");
  const [showMedDrop,setShowMedDrop]=useState(false);
  const subtotal=items.reduce((a,i)=>a+i.mrp*i.qty,0);
  const discAmt=Math.round(subtotal*(discount/100));
  const total=subtotal-discAmt;
  const addItem=m=>{
    setItems(prev=>{
      const ex=prev.find(i=>i.id===m.id);
      if(ex)return prev.map(i=>i.id===m.id?{...i,qty:i.qty+1}:i);
      return [...prev,{...m,qty:1}];
    });
    setMedSearch(""); setShowMedDrop(false);
  };
  const filtMeds=MEDS.filter(m=>m.name.toLowerCase().includes(medSearch.toLowerCase())).slice(0,6);

  return (
    <div>
      <Fade>
        <div style={{display:"flex",gap:8,marginBottom:24}}>
          {["history","new"].map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{padding:"8px 20px",borderRadius:8,fontSize:12,fontFamily:T.mono,
                background:tab===t?T.jade:"transparent",
                color:tab===t?"#000":T.text2,
                border:`1px solid ${tab===t?T.jade:T.border}`,cursor:"pointer"}}>
              {t==="history"?"Invoice History":"New Bill / Invoice"}
            </button>
          ))}
        </div>
      </Fade>

      {tab==="history" ? (
        <Fade delay={60}>
          <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,
              fontSize:12,fontFamily:T.mono,color:T.text2,letterSpacing:"0.06em",
              textTransform:"uppercase"}}>Recent Invoices</div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${T.border}`}}>
                  {["Invoice","Date","Patient","Medicine","Qty","Total","Status"].map(h=>(
                    <th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:10,
                      fontFamily:T.mono,color:T.text3,textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SALES_RAW.slice().reverse().map((s,i)=>(
                  <tr key={s.id} style={{borderBottom:`1px solid ${T.border}`,cursor:"pointer"}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.bg3}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"11px 16px",fontFamily:T.mono,fontSize:11,color:T.jade}}>{s.inv}</td>
                    <td style={{padding:"11px 16px",fontFamily:T.mono,fontSize:11,color:T.text3}}>{s.date}</td>
                    <td style={{padding:"11px 16px",fontFamily:T.sans,fontSize:12,color:T.text1}}>{s.patient}</td>
                    <td style={{padding:"11px 16px",fontFamily:T.sans,fontSize:11,color:T.text2}}>{medMap[s.medId]?.name}</td>
                    <td style={{padding:"11px 16px",fontFamily:T.mono,fontSize:11,color:T.text2}}>{s.qty}</td>
                    <td style={{padding:"11px 16px",fontFamily:T.mono,fontSize:12,color:T.text1,whiteSpace:"nowrap"}}>{pkr(s.total)}</td>
                    <td style={{padding:"11px 16px"}}><Badge type="success">Paid</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Fade>
      ) : (
        <Fade delay={60}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:16}}>
            {/* Left: Bill builder */}
            <Panel title="Build Invoice">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {[{label:"Patient Name",val:patientName,set:setPatientName,ph:"Ahmad Raza"},
                  {label:"Doctor",val:doctor,set:setDoctor,ph:"Dr. Imran"}].map(f=>(
                  <div key={f.label}>
                    <label style={{fontSize:10,fontFamily:T.mono,color:T.text3,
                      letterSpacing:"0.06em",textTransform:"uppercase",display:"block",marginBottom:5}}>{f.label}</label>
                    <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                      style={{width:"100%",background:T.bg3,border:`1px solid ${T.border}`,
                        borderRadius:7,padding:"8px 10px",color:T.text1,
                        fontFamily:T.sans,fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                  </div>
                ))}
              </div>
              {/* Medicine search */}
              <div style={{position:"relative",marginBottom:14}}>
                <label style={{fontSize:10,fontFamily:T.mono,color:T.text3,letterSpacing:"0.06em",
                  textTransform:"uppercase",display:"block",marginBottom:5}}>Add Medicine</label>
                <input value={medSearch}
                  onChange={e=>{setMedSearch(e.target.value);setShowMedDrop(true)}}
                  onFocus={()=>setShowMedDrop(true)}
                  placeholder="Type medicine name..."
                  style={{width:"100%",background:T.bg3,border:`1px solid ${T.border}`,
                    borderRadius:7,padding:"8px 10px",color:T.text1,
                    fontFamily:T.sans,fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                {showMedDrop && medSearch && (
                  <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:50,
                    background:T.bg3,border:`1px solid ${T.borderHov}`,borderRadius:8,
                    marginTop:4,overflow:"hidden",boxShadow:"0 16px 40px rgba(0,0,0,0.5)"}}>
                    {filtMeds.map(m=>(
                      <div key={m.id} onClick={()=>addItem(m)}
                        style={{padding:"10px 14px",cursor:"pointer",
                          display:"flex",justifyContent:"space-between",
                          fontSize:12,fontFamily:T.sans,color:T.text1,
                          borderBottom:`1px solid ${T.border}`,transition:"background 0.1s"}}
                        onMouseEnter={e=>e.currentTarget.style.background=T.bg4}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <span>{m.name}</span>
                        <span style={{color:T.jade,fontFamily:T.mono,fontSize:11}}>₨ {m.mrp}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Items */}
              {items.length>0 ? (
                <div style={{background:T.bg3,borderRadius:8,overflow:"hidden",marginBottom:12}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr style={{borderBottom:`1px solid ${T.border}`}}>
                        {["Medicine","Qty","MRP","Total",""].map(h=>(
                          <th key={h} style={{padding:"8px 12px",textAlign:"left",
                            fontSize:9,fontFamily:T.mono,color:T.text3,
                            textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it,i)=>(
                        <tr key={it.id} style={{borderBottom:i<items.length-1?`1px solid ${T.border}`:"none"}}>
                          <td style={{padding:"8px 12px",fontSize:12,fontFamily:T.sans,color:T.text1}}>{it.name}</td>
                          <td style={{padding:"8px 12px"}}>
                            <div style={{display:"flex",alignItems:"center",gap:4}}>
                              <button onClick={()=>setItems(prev=>prev.map(p=>p.id===it.id&&p.qty>1?{...p,qty:p.qty-1}:p))}
                                style={{width:20,height:20,borderRadius:4,background:T.bg4,
                                  border:`1px solid ${T.border}`,color:T.text1,
                                  fontSize:12,cursor:"pointer",lineHeight:1}}>−</button>
                              <span style={{fontSize:12,fontFamily:T.mono,color:T.text1,
                                minWidth:20,textAlign:"center"}}>{it.qty}</span>
                              <button onClick={()=>setItems(prev=>prev.map(p=>p.id===it.id?{...p,qty:p.qty+1}:p))}
                                style={{width:20,height:20,borderRadius:4,background:T.bg4,
                                  border:`1px solid ${T.border}`,color:T.jade,
                                  fontSize:12,cursor:"pointer",lineHeight:1}}>+</button>
                            </div>
                          </td>
                          <td style={{padding:"8px 12px",fontFamily:T.mono,fontSize:11,color:T.text3}}>₨{it.mrp}</td>
                          <td style={{padding:"8px 12px",fontFamily:T.mono,fontSize:12,color:T.text1}}>₨{it.mrp*it.qty}</td>
                          <td style={{padding:"8px 12px"}}>
                            <button onClick={()=>setItems(prev=>prev.filter(p=>p.id!==it.id))}
                              style={{color:T.red,background:"none",border:"none",cursor:"pointer",fontSize:14}}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{padding:"24px",textAlign:"center",color:T.text3,
                  fontFamily:T.mono,fontSize:12,background:T.bg3,borderRadius:8,marginBottom:12}}>
                  No items added yet
                </div>
              )}
            </Panel>

            {/* Right: Summary */}
            <div>
              <Panel title="Invoice Summary">
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:10,fontFamily:T.mono,color:T.text3,
                    letterSpacing:"0.06em",textTransform:"uppercase",display:"block",marginBottom:5}}>Payment Mode</label>
                  <select value={payment} onChange={e=>setPayment(e.target.value)}
                    style={{width:"100%",background:T.bg3,border:`1px solid ${T.border}`,
                      borderRadius:7,padding:"8px 10px",color:T.text1,
                      fontFamily:T.mono,fontSize:12,outline:"none"}}>
                    {["Cash","Card","JazzCash","EasyPaisa","UBL","Credit"].map(p=>(
                      <option key={p} value={p} style={{background:T.bg3}}>{p}</option>
                    ))}
                  </select>
                </div>
                <div style={{marginBottom:16}}>
                  <label style={{fontSize:10,fontFamily:T.mono,color:T.text3,
                    letterSpacing:"0.06em",textTransform:"uppercase",display:"block",marginBottom:5}}>
                    Discount: {discount}%
                  </label>
                  <input type="range" min="0" max="30" value={discount}
                    onChange={e=>setDiscount(+e.target.value)}
                    style={{width:"100%",accentColor:T.jade}}/>
                </div>
                <div style={{background:T.bg3,borderRadius:8,padding:14,marginBottom:14}}>
                  {[["Subtotal",pkr(subtotal)],
                    [`Discount (${discount}%)`,`− ${pkr(discAmt)}`],
                    ["Total",pkr(total)]].map(([l,v],i)=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",
                      padding:"5px 0",borderBottom:i<2?`1px solid ${T.border}`:"none",
                      marginBottom:i===1?4:0}}>
                      <span style={{fontSize:i===2?13:11,fontFamily:T.mono,
                        color:i===2?T.text1:T.text3,fontWeight:i===2?700:400}}>{l}</span>
                      <span style={{fontSize:i===2?14:11,fontFamily:T.mono,
                        color:i===2?T.jade:T.text2,fontWeight:i===2?700:400}}>{v}</span>
                    </div>
                  ))}
                </div>
                <button style={{width:"100%",padding:"12px",
                  background:items.length>0&&patientName?`linear-gradient(135deg,${T.jade},${T.jadeD})`:`${T.bg4}`,
                  border:"none",borderRadius:8,color:items.length>0&&patientName?"#000":T.text3,
                  fontSize:13,fontFamily:T.mono,fontWeight:700,cursor:items.length>0&&patientName?"pointer":"not-allowed",
                  transition:"all 0.2s"}}>
                  Print & Save Invoice
                </button>
              </Panel>
            </div>
          </div>
        </Fade>
      )}
    </div>
  );
};

// ─── PURCHASES MODULE ─────────────────────────────────────────────────────────
const Purchases = () => (
  <div>
    <Fade>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h1 style={{fontFamily:T.serif,fontSize:24,color:T.text1,fontWeight:400,marginBottom:2}}>Purchases</h1>
          <p style={{fontFamily:T.mono,fontSize:11,color:T.text3}}>{PURCHASES_RAW.length} purchase orders</p>
        </div>
        <button style={{padding:"8px 18px",background:`linear-gradient(135deg,${T.jade},${T.jadeD})`,
          border:"none",borderRadius:8,color:"#000",fontSize:12,fontFamily:T.mono,fontWeight:700,cursor:"pointer"}}>
          + New PO
        </button>
      </div>
    </Fade>
    <Fade delay={80}>
      <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:`1px solid ${T.border}`}}>
              {["PO No.","Date","Supplier","Medicine","Qty","Unit Price","Total","Status"].map(h=>(
                <th key={h} style={{padding:"11px 16px",textAlign:"left",fontSize:10,
                  fontFamily:T.mono,color:T.text3,textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...PURCHASES_RAW].reverse().map((p,i)=>(
              <tr key={p.id} style={{borderBottom:`1px solid ${T.border}`,cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.background=T.bg3}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"12px 16px",fontFamily:T.mono,fontSize:11,color:T.jade}}>{p.po}</td>
                <td style={{padding:"12px 16px",fontFamily:T.mono,fontSize:11,color:T.text3}}>{p.date}</td>
                <td style={{padding:"12px 16px",fontFamily:T.sans,fontSize:12,color:T.text1}}>{p.supplier}</td>
                <td style={{padding:"12px 16px",fontFamily:T.sans,fontSize:11,color:T.text2}}>{medMap[p.medId]?.name}</td>
                <td style={{padding:"12px 16px",fontFamily:T.mono,fontSize:12,color:T.text1}}>{p.qty}</td>
                <td style={{padding:"12px 16px",fontFamily:T.mono,fontSize:11,color:T.text2}}>{pkr(p.price)}</td>
                <td style={{padding:"12px 16px",fontFamily:T.mono,fontSize:12,color:T.text1,whiteSpace:"nowrap"}}>{pkr(p.total)}</td>
                <td style={{padding:"12px 16px"}}>
                  <Badge type={p.status==="Received"?"success":"warn"}>{p.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Fade>
  </div>
);

// ─── REPORTS MODULE ───────────────────────────────────────────────────────────
const Reports = ({analytics}) => {
  const {monthRev,prevRev,profit30,margin,month30,rev7,catMap,topMeds} = analytics;
  const catEntries=Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  const totalCatRev=catEntries.reduce((a,c)=>a+c[1],0)||1;
  const catColors=[T.jade,T.blue,T.amber,"#a78bfa","#fb7185","#34d399","#60a5fa"];

  return (
    <div>
      <Fade>
        <h1 style={{fontFamily:T.serif,fontSize:24,color:T.text1,fontWeight:400,marginBottom:4}}>Reports</h1>
        <p style={{fontFamily:T.mono,fontSize:11,color:T.text3,marginBottom:24}}>30-day analytics snapshot</p>
      </Fade>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        {[
          {label:"Monthly Revenue",val:monthRev,prefix:"₨ ",delta:pct(monthRev,prevRev)},
          {label:"Gross Profit",val:profit30,prefix:"₨ ",delta:5},
          {label:"Profit Margin",val:margin,suffix:"%",delta:2},
        ].map((k,i)=>(
          <KpiCard key={k.label} {...k} rawValue={k.val} delay={i*60}/>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <Panel title="Category Revenue Breakdown" delay={160}>
          {catEntries.map(([cat,val],i)=>(
            <div key={cat} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:catColors[i%catColors.length]}}/>
                  <span style={{fontSize:12,fontFamily:T.sans,color:T.text2}}>{cat}</span>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <span style={{fontSize:11,fontFamily:T.mono,color:T.text3}}>
                    {Math.round((val/totalCatRev)*100)}%
                  </span>
                  <span style={{fontSize:11,fontFamily:T.mono,color:T.text1,minWidth:80,textAlign:"right"}}>
                    {pkr(val)}
                  </span>
                </div>
              </div>
              <div style={{height:4,background:T.bg4,borderRadius:2}}>
                <div style={{width:`${(val/totalCatRev)*100}%`,height:"100%",
                  background:catColors[i%catColors.length],borderRadius:2,
                  opacity:0.8,transition:"width 1s ease"}}/>
              </div>
            </div>
          ))}
        </Panel>
        <Panel title="Daily Sales Volume — 7 Days" delay={200}>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {rev7.map((d,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:10,fontFamily:T.mono,color:T.text3,minWidth:36}}>{d.label}</span>
                <div style={{flex:1,height:20,background:T.bg4,borderRadius:3,overflow:"hidden",position:"relative"}}>
                  <div style={{
                    position:"absolute",left:0,top:0,bottom:0,
                    width:`${Math.max((d.rev/Math.max(...rev7.map(x=>x.rev),1))*100,4)}%`,
                    background:`linear-gradient(90deg,${T.jade}88,${T.jade}44)`,
                    borderRadius:3,transition:"width 1s ease"
                  }}/>
                  <span style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",
                    fontSize:9,fontFamily:T.mono,color:T.text2}}>
                    {pkr(d.rev)}
                  </span>
                </div>
                <span style={{fontSize:10,fontFamily:T.mono,color:T.text3,minWidth:16}}>{d.cnt}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="Top SKUs by Revenue — All Time" delay={240}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
          {topMeds.map((m,i)=>(
            <div key={m.id} style={{background:T.bg3,borderRadius:8,padding:"12px",
              border:`1px solid ${T.border}`}}>
              <div style={{fontSize:10,fontFamily:T.mono,color:T.text3,marginBottom:4}}>#{i+1}</div>
              <div style={{fontSize:12,fontFamily:T.sans,color:T.text1,marginBottom:6,
                lineHeight:1.3,minHeight:32}}>{m.name}</div>
              <div style={{fontSize:13,fontFamily:T.mono,color:T.jade,fontWeight:700}}>{pkr(m.rev)}</div>
              <Badge type="neutral">{m.cat}</Badge>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};

// ─── AI INSIGHTS MODULE ───────────────────────────────────────────────────────
const AIInsights = ({analytics}) => {
  const {expired,lowStock,topMeds,margin,monthRev,prevRev} = analytics;
  const now=new Date();
  const expiringSoon=MEDS.filter(m=>{
    const d=new Date(m.expiry);
    const days=Math.round((d-now)/(1000*60*60*24));
    return days>0&&days<90;
  });

  const insights=[
    {
      type:"warn",
      icon:"⚡",
      title:"Reorder Alert",
      body:`${lowStock.length} medicines are at or below minimum stock: ${lowStock.map(m=>m.name).join(", ")}. Estimated stockout risk within 7–14 days at current sales velocity.`,
      action:"Generate PO"
    },
    {
      type:"danger",
      icon:"⚠",
      title:"Expiry Risk",
      body:`${expired.length} medicine(s) already expired. ${expiringSoon.length} more expire within 90 days — consider discounting or returning to supplier before expiry to recover cost.`,
      action:"View Inventory"
    },
    {
      type:"success",
      icon:"↑",
      title:"Revenue Trend",
      body:`Monthly revenue ${monthRev>prevRev?"grew":"declined"} by ${Math.abs(pct(monthRev,prevRev))}% vs previous 30 days. Gross margin is at ${margin}% — ${margin>20?"healthy":"below target"} for a retail pharmacy. Top driver: ${topMeds[0]?.name} (${pkr(topMeds[0]?.rev)}).`,
      action:"Full Report"
    },
    {
      type:"info",
      icon:"◎",
      title:"Category Intelligence",
      body:`Cardiac and Antibiotics categories contribute the highest revenue share this month. Consider negotiating volume discounts with Novartis, Pfizer, and Getz Pharma to improve margins on fast-moving SKUs.`,
      action:"View Categories"
    },
    {
      type:"warn",
      icon:"⟳",
      title:"Slow Movers",
      body:`Metformin 500mg and Vitamin C 500mg show no sales activity in the last 30 days. Review pricing strategy or consider a promotional bundle to clear stock before expiry.`,
      action:"Promotions"
    },
  ];
  const typeColors={
    success:{bg:"rgba(0,200,150,0.07)",border:"rgba(0,200,150,0.15)",icon:T.jade},
    warn:{bg:"rgba(245,158,11,0.07)",border:"rgba(245,158,11,0.15)",icon:T.amber},
    danger:{bg:"rgba(239,68,68,0.07)",border:"rgba(239,68,68,0.15)",icon:T.red},
    info:{bg:"rgba(59,130,246,0.07)",border:"rgba(59,130,246,0.15)",icon:T.blue},
  };

  return (
    <div>
      <Fade>
        <div style={{marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:T.jade,
              boxShadow:`0 0 8px ${T.jade}`,animation:"pulse 2s infinite"}}/>
            <h1 style={{fontFamily:T.serif,fontSize:24,color:T.text1,fontWeight:400}}>AI Insights</h1>
            <Badge type="success">Live</Badge>
          </div>
          <p style={{fontFamily:T.mono,fontSize:11,color:T.text3}}>
            Intelligent analysis of your pharmacy data — updated continuously
          </p>
        </div>
      </Fade>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {insights.map((ins,i)=>{
          const c=typeColors[ins.type];
          return (
            <Fade key={i} delay={i*80}>
              <div style={{background:c.bg,border:`1px solid ${c.border}`,
                borderRadius:12,padding:"18px 20px",
                display:"flex",gap:16,alignItems:"flex-start"}}>
                <div style={{fontSize:20,color:c.icon,lineHeight:1,marginTop:2,flexShrink:0}}>{ins.icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                    <span style={{fontSize:14,fontFamily:T.sans,color:T.text1,fontWeight:600}}>{ins.title}</span>
                    <Badge type={ins.type}>{ins.type.toUpperCase()}</Badge>
                  </div>
                  <p style={{fontSize:13,fontFamily:T.sans,color:T.text2,lineHeight:1.6,margin:0}}>{ins.body}</p>
                </div>
                <button style={{padding:"7px 16px",background:"transparent",
                  border:`1px solid ${c.border}`,borderRadius:7,
                  color:c.icon,fontSize:11,fontFamily:T.mono,cursor:"pointer",
                  whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=c.bg}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent"}}>
                  {ins.action}
                </button>
              </div>
            </Fade>
          );
        })}
      </div>
      {/* AI Chat stub */}
      <Fade delay={500}>
        <div style={{marginTop:20,background:T.bg2,border:`1px solid ${T.border}`,
          borderRadius:12,padding:20}}>
          <div style={{fontSize:12,fontFamily:T.mono,color:T.text3,letterSpacing:"0.06em",
            textTransform:"uppercase",marginBottom:12}}>Ask AI Assistant</div>
          <div style={{display:"flex",gap:8}}>
            <input placeholder="e.g. Which medicines will expire in the next 30 days?"
              style={{flex:1,background:T.bg3,border:`1px solid ${T.border}`,
                borderRadius:8,padding:"10px 14px",color:T.text1,
                fontFamily:T.sans,fontSize:13,outline:"none"}}/>
            <button style={{padding:"10px 20px",
              background:`linear-gradient(135deg,${T.jade},${T.jadeD})`,
              border:"none",borderRadius:8,color:"#000",fontSize:12,
              fontFamily:T.mono,fontWeight:700,cursor:"pointer"}}>Ask</button>
          </div>
          <p style={{marginTop:8,fontSize:11,fontFamily:T.mono,color:T.text3}}>
            AI assistant powered by real inventory & sales data
          </p>
        </div>
      </Fade>
    </div>
  );
};

// ─── SETTINGS MODULE ──────────────────────────────────────────────────────────
const Settings = () => {
  const [pharmacy,setPharmacy]=useState("City Pharmacy — Lahore");
  const [license,setLicense]=useState("DPR-2024-00472");
  const [notif,setNotif]=useState(true);
  const [autoReorder,setAutoReorder]=useState(false);

  const Toggle=({val,set})=>(
    <div onClick={()=>set(v=>!v)} style={{
      width:40,height:22,borderRadius:11,
      background:val?T.jade:T.bg4,
      border:`1px solid ${val?T.jade:T.border}`,
      cursor:"pointer",position:"relative",transition:"all 0.2s"}}>
      <div style={{position:"absolute",top:2,left:val?20:2,width:16,height:16,
        borderRadius:"50%",background:val?"#000":T.text3,transition:"left 0.2s"}}/>
    </div>
  );

  return (
    <div>
      <Fade>
        <h1 style={{fontFamily:T.serif,fontSize:24,color:T.text1,fontWeight:400,marginBottom:24}}>Settings</h1>
      </Fade>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Panel title="Pharmacy Profile" delay={60}>
          {[{label:"Pharmacy Name",val:pharmacy,set:setPharmacy},
            {label:"License No.",val:license,set:setLicense}].map(f=>(
            <div key={f.label} style={{marginBottom:14}}>
              <label style={{fontSize:10,fontFamily:T.mono,color:T.text3,letterSpacing:"0.06em",
                textTransform:"uppercase",display:"block",marginBottom:5}}>{f.label}</label>
              <input value={f.val} onChange={e=>f.set(e.target.value)}
                style={{width:"100%",background:T.bg3,border:`1px solid ${T.border}`,
                  borderRadius:7,padding:"9px 12px",color:T.text1,
                  fontFamily:T.sans,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
            </div>
          ))}
          <button style={{padding:"9px 18px",background:`linear-gradient(135deg,${T.jade},${T.jadeD})`,
            border:"none",borderRadius:8,color:"#000",fontSize:12,fontFamily:T.mono,fontWeight:700,cursor:"pointer"}}>
            Save Changes
          </button>
        </Panel>
        <Panel title="Notifications & Automation" delay={120}>
          {[{label:"Low stock & expiry alerts",val:notif,set:setNotif},
            {label:"Auto-generate reorder POs",val:autoReorder,set:setAutoReorder}].map(s=>(
            <div key={s.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:13,fontFamily:T.sans,color:T.text1}}>{s.label}</span>
              <Toggle val={s.val} set={s.set}/>
            </div>
          ))}
        </Panel>
        <Panel title="System Info" delay={180} style={{gridColumn:"1/-1"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {[
              {label:"Version",val:"v3.4.1 Enterprise"},
              {label:"Database",val:"Supabase (ready)"},
              {label:"Last Backup",val:"Today 03:00 AM"},
              {label:"License",val:"Enterprise — Active"},
            ].map(item=>(
              <div key={item.label} style={{background:T.bg3,borderRadius:8,padding:"12px 14px"}}>
                <div style={{fontSize:10,fontFamily:T.mono,color:T.text3,letterSpacing:"0.06em",
                  textTransform:"uppercase",marginBottom:4}}>{item.label}</div>
                <div style={{fontSize:12,fontFamily:T.mono,color:T.jade}}>{item.val}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [module,setModule]=useState("dashboard");
  const analytics=useAnalytics();

  const moduleMap={
    dashboard:<Dashboard analytics={analytics} setModule={setModule}/>,
    inventory:<Inventory/>,
    billing:<Billing/>,
    purchases:<Purchases/>,
    reports:<Reports analytics={analytics}/>,
    ai:<AIInsights analytics={analytics}/>,
    settings:<Settings/>,
  };

  return (
    <div style={{fontFamily:T.sans,background:T.bg0,minHeight:"100vh",color:T.text1}}>
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.bg4};border-radius:2px}
        input,select,textarea{color-scheme:dark}
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&family=Instrument+Serif&display=swap');
      `}</style>
      <Sidebar active={module} setActive={setModule} alerts={analytics.alerts.length}/>
      <main style={{marginLeft:220,minHeight:"100vh",padding:"32px 36px",
        maxWidth:"calc(100vw - 220px)",boxSizing:"border-box"}}>
        {moduleMap[module]}
      </main>
    </div>
  );
}s