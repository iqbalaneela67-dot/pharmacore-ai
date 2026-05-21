import React, { useState } from 'react';

export default function ScannerModal({ db, target, onClose, onScanned }) {
  const [input, setInput] = useState('');
  const [found, setFound] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const lookup = (code) => {
    const q = (code || input).trim().toLowerCase();
    if (!q) return;
    const med = db.medicines.find(m => m.barcode === q || m.barcode === code || m.name.toLowerCase().includes(q));
    setNotFound(!med);
    setFound(med || null);
  };

  const simulateScan = () => {
    setScanning(true);
    setFound(null);
    setNotFound(false);
    setTimeout(() => {
      const med = db.medicines[Math.floor(Math.random() * db.medicines.length)];
      setInput(med.barcode);
      setFound(med);
      setScanning(false);
    }, 1500);
  };

  const getStatusColor = (m) => {
    const exp = new Date(m.expiry);
    if (exp < new Date()) return 'var(--danger)';
    if (m.qty <= m.minStock) return 'var(--warning)';
    return 'var(--success)';
  };

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title"><i className="ti ti-barcode" aria-hidden="true" /> Barcode Scanner</span>
          <button className="btn btn-sm btn-icon" onClick={onClose}><i className="ti ti-x" aria-hidden="true" /></button>
        </div>

        <div className={`scanner-box ${scanning ? 'scanning' : ''}`} onClick={simulateScan} role="button" tabIndex={0}>
          <div className="scanner-icon"><i className="ti ti-scan" aria-hidden="true" /></div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{scanning ? 'Scanning...' : 'Click to Simulate Scan'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Or type barcode manually below</div>
        </div>

        <div className="input-group">
          <label>Barcode / Medicine Name</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type barcode or name..."
              onKeyDown={e => e.key === 'Enter' && lookup()}
              autoFocus
            />
            <button className="btn btn-primary" onClick={() => lookup()}>
              <i className="ti ti-search" aria-hidden="true" />
            </button>
          </div>
        </div>

        {notFound && (
          <div style={{ color: 'var(--danger-text)', background: 'var(--danger-bg)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
            No medicine found for: <b>{input}</b>
          </div>
        )}

        {found && (
          <div className="card" style={{ marginTop: 4 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--brand)', marginBottom: 10 }}>{found.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 13, marginBottom: 12 }}>
              {[
                ['Category', found.category], ['MRP', `PKR ${found.mrp}`],
                ['Stock', `${found.qty} units`], ['Expiry', found.expiry],
                ['Batch', found.batch], ['Manufacturer', found.mfr],
                ['Purchase Price', `PKR ${found.pp}`], ['Min Stock', found.minStock],
              ].map(([k, v]) => (
                <div key={k}><span style={{ color: 'var(--text-secondary)' }}>{k}: </span><b>{v}</b></div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {target === 'billing' && (
                <button className="btn btn-primary btn-sm" onClick={() => onScanned(found)}>
                  <i className="ti ti-plus" aria-hidden="true" /> Add to Bill
                </button>
              )}
              <button className="btn btn-sm" onClick={onClose}>
                <i className="ti ti-check" aria-hidden="true" /> Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
