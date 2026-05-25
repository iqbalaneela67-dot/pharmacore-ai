/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function formatPKR(v) { return 'PKR ' + (v || 0).toLocaleString('en-PK'); }

export default function Reports() {
  const [sales, setSales]         = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [bills, setBills]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [range, setRange]         = useState('30');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: s }, { data: p }, { data: m }, { data: b }] = await Promise.all([
      supabase.from('sales').select('*').order('date', { ascending: false }),
      supabase.from('purchases').select('*').order('date', { ascending: false }),
      supabase.from('medicines').select('*'),
      supabase.from('bills').select('*').order('created_at', { ascending: false }),
    ]);
    setSales(s || []);
    setPurchases(p || []);
    setMedicines(m || []);
    setBills(b || []);
    setLoading(false);
  }

  const rangeDays = +range;
  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - rangeDays);
  const rangeStartStr = rangeStart.toISOString().split('T')[0];

  const rangeBills     = bills.filter(b => b.date >= rangeStartStr);
  const rangePurchases = purchases.filter(p => p.date >= rangeStartStr);
  const totalRevenue   = rangeBills.reduce((a, b) => a + (b.total || 0), 0);
  const totalPurchases = rangePurchases.reduce((a, p) => a + (p.total || 0), 0);
  const totalProfit    = totalRevenue - totalPurchases;
  const profitMargin   = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Payment mode breakdown
  const paymentModes = {};
  rangeBills.forEach(b => {
    const mode = b.payment_mode || 'Cash';
    paymentModes[mode] = (paymentModes[mode] || 0) + (b.total || 0);
  });

  // Top medicines by revenue
  const medRevenue = {};
  rangeBills.forEach(b => {
    (b.items || []).forEach(item => {
      medRevenue[item.name] = (medRevenue[item.name] || 0) + (item.total || 0);
    });
  });
  const topMeds = Object.entries(medRevenue).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxRev = topMeds[0]?.[1] || 1;

  // Daily sales last 7 days
  const dailySales = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const dayBills = bills.filter(b => b.date === ds);
    dailySales.push({
      label: d.toLocaleDateString('en-PK', { weekday: 'short' }),
      amount: dayBills.reduce((a, b) => a + (b.total || 0), 0),
      count: dayBills.length,
    });
  }
  const maxDaily = Math.max(...dailySales.map(d => d.amount), 1);

  // Stock status
  function getMedStatus(m) {
    const today = new Date();
    const exp = new Date(m.expiry_date || m.expiry);
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Expired';
    if (diffDays <= 30) return 'Expiring Soon';
    if ((m.qty || 0) <= (m.min_stock || 0)) return 'Low Stock';
    return 'In Stock';
  }

  const stockStats = {
    inStock:     medicines.filter(m => getMedStatus(m) === 'In Stock').length,
    lowStock:    medicines.filter(m => getMedStatus(m) === 'Low Stock').length,
    expiringSoon:medicines.filter(m => getMedStatus(m) === 'Expiring Soon').length,
    expired:     medicines.filter(m => getMedStatus(m) === 'Expired').length,
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #e0e0e0', borderTopColor: '#0f6e56', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: '#888', fontSize: 14 }}>Loading reports...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={pg.root}>
      {/* Header */}
      <div style={pg.header}>
        <div>
          <h1 style={pg.title}>Reports & Analytics</h1>
          <p style={pg.subtitle}>Business performance overview</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['7', '30', '90'].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{ ...pg.rangeBtn, background: range === r ? '#0f6e56' : '#f5f5f5', color: range === r ? '#fff' : '#555' }}>
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={pg.kpiGrid}>
        {[
          { label: `Revenue (${range}d)`,  value: formatPKR(totalRevenue),   color: '#0f6e56', icon: '💰', sub: `${rangeBills.length} bills` },
          { label: `Purchases (${range}d)`,value: formatPKR(totalPurchases),  color: '#3b82f6', icon: '🛒', sub: `${rangePurchases.length} orders` },
          { label: `Net Profit (${range}d)`,value: formatPKR(totalProfit),   color: totalProfit >= 0 ? '#0f6e56' : '#ef4444', icon: '📈', sub: `${profitMargin}% margin` },
          { label: 'Total Medicines',       value: medicines.length,          color: '#8b5cf6', icon: '💊', sub: `${stockStats.lowStock} low stock` },
        ].map(k => (
          <div key={k.label} style={{ ...pg.kpiCard, borderTop: `3px solid ${k.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>{k.label}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={pg.row2}>
        {/* Daily Sales Chart */}
        <div style={pg.card}>
          <div style={pg.cardTitle}>📊 Daily Sales — Last 7 Days</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160, paddingBottom: 24, position: 'relative' }}>
            {dailySales.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 10, color: '#0f6e56', fontWeight: 700 }}>
                  {d.amount > 0 ? `${Math.round(d.amount / 1000)}k` : ''}
                </div>
                <div style={{
                  width: '100%', background: d.amount > 0 ? 'linear-gradient(180deg, #0f6e56, #1D9E75)' : '#f0f0f0',
                  borderRadius: '6px 6px 0 0',
                  height: `${Math.max((d.amount / maxDaily) * 120, d.amount > 0 ? 8 : 4)}px`,
                  transition: 'height 0.5s ease',
                  minHeight: 4,
                }} />
                <div style={{ fontSize: 10, color: '#888', textAlign: 'center' }}>{d.label}</div>
                {d.count > 0 && <div style={{ fontSize: 9, color: '#aaa' }}>{d.count} bills</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Payment Modes */}
        <div style={pg.card}>
          <div style={pg.cardTitle}>💳 Payment Breakdown</div>
          {Object.keys(paymentModes).length === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '40px 0', fontSize: 13 }}>No data in this range</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(paymentModes).sort((a, b) => b[1] - a[1]).map(([mode, amount]) => {
                const pct = ((amount / totalRevenue) * 100).toFixed(1);
                return (
                  <div key={mode}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{mode}</span>
                      <span style={{ color: '#0f6e56', fontWeight: 700 }}>{formatPKR(amount)} ({pct}%)</span>
                    </div>
                    <div style={{ height: 8, background: '#f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #0f6e56, #1D9E75)', borderRadius: 8, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={pg.row2}>
        {/* Top Medicines */}
        <div style={pg.card}>
          <div style={pg.cardTitle}>🏆 Top Medicines by Revenue ({range}d)</div>
          {topMeds.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '40px 0', fontSize: 13 }}>No sales data</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topMeds.map(([name, rev], i) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{i + 1}. {name}</span>
                    <span style={{ color: '#0f6e56', fontWeight: 700 }}>{formatPKR(rev)}</span>
                  </div>
                  <div style={{ height: 6, background: '#f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(rev / maxRev) * 100}%`, background: 'linear-gradient(90deg, #0f6e56, #3b82f6)', borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock Status */}
        <div style={pg.card}>
          <div style={pg.cardTitle}>📦 Stock Status Overview</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'In Stock',      value: stockStats.inStock,      color: '#0f6e56', bg: '#e6f9f2' },
              { label: 'Low Stock',     value: stockStats.lowStock,     color: '#b07d00', bg: '#fff8e6' },
              { label: 'Expiring Soon', value: stockStats.expiringSoon, color: '#1a6fa8', bg: '#e8f4fd' },
              { label: 'Expired',       value: stockStats.expired,      color: '#c0392b', bg: '#fdf0f0' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: s.bg, borderRadius: 10, padding: '12px 16px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.label}</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bills Table */}
      <div style={pg.card}>
        <div style={pg.cardTitle}>🧾 Recent Bills ({range}d)</div>
        {rangeBills.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#aaa', padding: '40px 0', fontSize: 13 }}>No bills in this range</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={pg.table}>
              <thead>
                <tr>{['Invoice', 'Patient', 'Date', 'Items', 'Total', 'Payment'].map(h => (
                  <th key={h} style={pg.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {rangeBills.slice(0, 10).map(b => (
                  <tr key={b.id} style={pg.tr}>
                    <td style={pg.td}><b style={{ color: '#0f6e56' }}>{b.invoice}</b></td>
                    <td style={pg.td}>{b.patient_name}</td>
                    <td style={pg.td}><span style={{ color: '#888', fontSize: 12 }}>{b.date}</span></td>
                    <td style={pg.td}><span style={{ background: '#f0f7ff', color: '#1a6fa8', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{b.items?.length || 0} items</span></td>
                    <td style={pg.td}><b style={{ color: '#0f6e56' }}>{formatPKR(b.total)}</b></td>
                    <td style={pg.td}><span style={{ background: '#e6f9f2', color: '#0f6e56', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{b.payment_mode}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const pg = {
  root:     { padding: '28px', maxWidth: 1200, margin: '0 auto' },
  header:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title:    { fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888' },
  rangeBtn: { padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  kpiGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 },
  kpiCard:  { background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  row2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  card:     { background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 0 },
  cardTitle:{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 },
  table:    { width: '100%', borderCollapse: 'collapse' },
  th:       { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' },
  tr:       { borderBottom: '1px solid #f8f8f8' },
  td:       { padding: '10px 14px', fontSize: 13, color: '#333', verticalAlign: 'middle' },
}