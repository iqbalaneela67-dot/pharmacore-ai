/* eslint-disable */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getMedStatus } from '../data/db';

/* ─────────────────────────────────────────────
   TOAST NOTIFICATION SYSTEM
───────────────────────────────────────────── */
let toastListeners = [];
export function showToast(message, type = 'info', duration = 5000) {
  const id = Date.now() + Math.random();
  toastListeners.forEach(fn => fn({ id, message, type, duration }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      setToasts(prev => [toast, ...prev].slice(0, 5));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, toast.duration);
    };
    toastListeners.push(handler);
    return () => { toastListeners = toastListeners.filter(fn => fn !== handler); };
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons = { danger: '🚨', warning: '⚠️', success: '✅', info: '💡' };
  const colors = {
    danger:  { bg: '#450a0a', border: '#ef444440', color: '#fca5a5', bar: '#ef4444' },
    warning: { bg: '#451a03', border: '#f59e0b40', color: '#fcd34d', bar: '#f59e0b' },
    success: { bg: '#052e16', border: '#10b98140', color: '#6ee7b7', bar: '#10b981' },
    info:    { bg: '#0c1a3a', border: '#3b82f640', color: '#93c5fd', bar: '#3b82f6' },
  };

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360,
    }}>
      {toasts.map(t => {
        const c = colors[t.type] || colors.info;
        return (
          <div key={t.id} style={{
            background: c.bg, border: `1px solid ${c.border}`,
            borderRadius: 14, padding: '14px 16px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            animation: 'slideIn .3s ease',
            boxShadow: '0 8px 32px rgba(0,0,0,.4)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: c.bar, borderRadius: '0 0 14px 14px' }} />
            <span style={{ fontSize: 18, flexShrink: 0 }}>{icons[t.type]}</span>
            <span style={{ fontSize: 13, color: c.color, fontWeight: 500, flex: 1, lineHeight: 1.4 }}>{t.message}</span>
            <button onClick={() => remove(t.id)} style={{
              background: 'none', border: 'none', color: '#475569',
              cursor: 'pointer', fontSize: 16, padding: 0, flexShrink: 0,
            }}>✕</button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   BELL ICON WITH DROPDOWN
───────────────────────────────────────────── */
export function AlertBell({ db }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pharma_seen_alerts') || '[]'); } catch { return []; }
  });
  const ref = useRef(null);

  // Generate alerts from real db
  const alerts = React.useMemo(() => {
    const list = [];
    const today = new Date();

    db.medicines.forEach(m => {
      const status = getMedStatus(m);
      const expDate = new Date(m.expiry);
      const daysLeft = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

      if (status === 'Expired') {
        list.push({
          id: `exp-${m.id}`,
          type: 'danger',
          icon: '🗑️',
          title: 'Expired Medicine',
          message: `${m.name} expired on ${m.expiry}`,
          time: 'Action required',
        });
      } else if (daysLeft <= 30 && daysLeft > 0) {
        list.push({
          id: `soon-${m.id}`,
          type: 'warning',
          icon: '⏳',
          title: 'Expiring Soon',
          message: `${m.name} expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
          time: `${m.expiry}`,
        });
      }

      if (status === 'Low Stock') {
        list.push({
          id: `low-${m.id}`,
          type: 'warning',
          icon: '📦',
          title: 'Low Stock',
          message: `${m.name} — only ${m.qty} left (min: ${m.minStock})`,
          time: 'Reorder needed',
        });
      }
    });

    db.purchases.filter(p => p.status === 'Pending').forEach(p => {
      list.push({
        id: `po-${p.id}`,
        type: 'info',
        icon: '🚚',
        title: 'Pending Order',
        message: `${p.po} from ${p.supplier} — PKR ${p.total.toLocaleString()}`,
        time: p.date,
      });
    });

    return list;
  }, [db]);

  const unseenCount = alerts.filter(a => !seen.includes(a.id)).length;

  // Auto-show toasts for new alerts
  const shownRef = useRef(new Set());
  useEffect(() => {
    alerts.forEach(a => {
      if (!shownRef.current.has(a.id) && !seen.includes(a.id)) {
        setTimeout(() => showToast(a.message, a.type), 500 + Math.random() * 1000);
        shownRef.current.add(a.id);
      }
    });
  }, [alerts]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllSeen = () => {
    const ids = alerts.map(a => a.id);
    setSeen(ids);
    localStorage.setItem('pharma_seen_alerts', JSON.stringify(ids));
  };

  const typeColors = {
    danger:  { bg: '#450a0a', border: '#ef444430', dot: '#ef4444', text: '#fca5a5' },
    warning: { bg: '#451a03', border: '#f59e0b30', dot: '#f59e0b', text: '#fcd34d' },
    info:    { bg: '#0c1a3a', border: '#3b82f630', dot: '#3b82f6', text: '#93c5fd' },
    success: { bg: '#052e16', border: '#10b98130', dot: '#10b981', text: '#6ee7b7' },
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button onClick={() => { setOpen(o => !o); if (!open) markAllSeen(); }} style={{
        position: 'relative', background: open ? '#1e293b' : 'transparent',
        border: '1px solid', borderColor: open ? '#334155' : 'transparent',
        borderRadius: 10, width: 38, height: 38,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all .15s', fontSize: 18,
      }}>
        🔔
        {unseenCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#ef4444', color: '#fff',
            fontSize: 10, fontWeight: 800,
            width: 18, height: 18, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #0a0f1e',
            animation: 'bellPulse 2s infinite',
          }}>{unseenCount > 9 ? '9+' : unseenCount}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 46, right: 0,
          width: 360, maxHeight: 480,
          background: '#0f172a', border: '1px solid #1e293b',
          borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,.6)',
          zIndex: 1000, overflow: 'hidden',
          animation: 'dropIn .2s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid #1e293b',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>🔔 Alerts</span>
              {alerts.length > 0 && (
                <span style={{ background: '#ef444420', color: '#fca5a5', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>
                  {alerts.length}
                </span>
              )}
            </div>
            {alerts.length > 0 && (
              <button onClick={markAllSeen} style={{
                background: 'none', border: 'none', color: '#10b981',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>Mark all read</button>
            )}
          </div>

          {/* Alert List */}
          <div style={{ maxHeight: 400, overflowY: 'auto', padding: '8px 0' }}>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#475569' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>All clear! No alerts.</div>
              </div>
            ) : (
              alerts.map(a => {
                const c = typeColors[a.type] || typeColors.info;
                const isSeen = seen.includes(a.id);
                return (
                  <div key={a.id} style={{
                    padding: '11px 16px', display: 'flex', gap: 11, alignItems: 'flex-start',
                    borderBottom: '1px solid #0f172a',
                    background: isSeen ? 'transparent' : `${c.bg}88`,
                    transition: 'background .2s',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: c.bg, border: `1px solid ${c.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>{a.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{a.title}</span>
                        {!isSeen && <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{a.message}</div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>{a.time}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Summary footer */}
          {alerts.length > 0 && (
            <div style={{
              padding: '10px 16px', borderTop: '1px solid #1e293b',
              display: 'flex', gap: 12, justifyContent: 'center',
            }}>
              {[
                { type: 'danger', label: 'Expired', count: alerts.filter(a => a.type === 'danger').length },
                { type: 'warning', label: 'Warning', count: alerts.filter(a => a.type === 'warning').length },
                { type: 'info', label: 'Info', count: alerts.filter(a => a.type === 'info').length },
              ].filter(x => x.count > 0).map(x => (
                <div key={x.type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: typeColors[x.type].dot }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{x.count} {x.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bellPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes dropIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}