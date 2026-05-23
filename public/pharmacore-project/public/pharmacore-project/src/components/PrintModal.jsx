import React, { useRef } from 'react';

export default function PrintModal({ bill, onClose }) {
  const printRef = useRef();

  const doPrint = () => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Invoice - ${bill.invoice}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; font-size: 13px; color: #111; }
        h1 { color: #0f6e56; font-size: 20px; margin-bottom: 4px; }
        .sub { color: #666; font-size: 12px; margin-bottom: 16px; }
        .info { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { text-align: left; padding: 7px 10px; background: #0f6e56; color: #fff; font-size: 12px; }
        td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
        .totals { text-align: right; }
        .total-final { font-size: 16px; font-weight: bold; color: #0f6e56; }
        .footer { text-align: center; margin-top: 24px; color: #999; font-size: 11px; }
      </style></head><body>
      <h1>PharmaCore AI</h1>
      <div class="sub">Pro Pharmacy Management System</div>
      <div class="info">
        <div><b>Invoice #:</b> ${bill.invoice}</div>
        <div><b>Date:</b> ${bill.date}</div>
        <div><b>Patient:</b> ${bill.patient}</div>
        <div><b>Doctor:</b> ${bill.doctor || '—'}</div>
        <div><b>Payment:</b> ${bill.payment}</div>
      </div>
      <table>
        <thead><tr><th>Medicine</th><th>Qty</th><th>Rate (PKR)</th><th>Amount (PKR)</th></tr></thead>
        <tbody>${bill.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.mrp}</td><td>${i.total}</td></tr>`).join('')}</tbody>
      </table>
      <div class="totals">
        <div>Subtotal: PKR ${bill.subtotal}</div>
        <div>Discount: -PKR ${bill.discount}</div>
        <div class="total-final">Total: PKR ${bill.total}</div>
      </div>
      <div class="footer">Thank you for your visit. Get well soon!<br/>PharmaCore AI — pharmacore-ai.vercel.app</div>
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 540 }}>
        <div className="modal-header">
          <span className="modal-title"><i className="ti ti-receipt" aria-hidden="true" /> Invoice — {bill.invoice}</span>
          <button className="btn btn-sm btn-icon" onClick={onClose}><i className="ti ti-x" aria-hidden="true" /></button>
        </div>

        <div ref={printRef} style={{ fontSize: 13 }}>
          <div style={{ textAlign: 'center', paddingBottom: 14, borderBottom: '0.5px solid var(--border)', marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand)' }}>PharmaCore AI</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Pro Pharmacy Management System</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 20px', marginBottom: 14, fontSize: 12 }}>
            {[['Invoice#', bill.invoice], ['Date', bill.date], ['Patient', bill.patient], ['Doctor', bill.doctor || '—'], ['Payment', bill.payment]].map(([k, v]) => (
              <div key={k}><span style={{ color: 'var(--text-secondary)' }}>{k}: </span><b>{v}</b></div>
            ))}
          </div>

          <table style={{ marginBottom: 12 }}>
            <thead><tr><th>Medicine</th><th>Qty</th><th>Rate</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>
              {bill.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td>{item.qty}</td>
                  <td>PKR {item.mrp}</td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>PKR {item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 13 }}><span>Subtotal</span><span>PKR {bill.subtotal}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 13, color: 'var(--danger-text)' }}><span>Discount</span><span>-PKR {bill.discount}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 16, fontWeight: 700, color: 'var(--brand)', borderTop: '0.5px solid var(--border)', marginTop: 4 }}><span>Total</span><span>PKR {bill.total}</span></div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: 'var(--text-secondary)' }}>
            Thank you for your visit. Get well soon!
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={doPrint}>
            <i className="ti ti-printer" aria-hidden="true" /> Print Invoice
          </button>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
