import React from 'react';
import { getMedStatus } from '../data/db';

const STATUS_MAP = {
  'In Stock': 'success', 'Low Stock': 'warning', 'Expired': 'danger',
  'Paid': 'success', 'Pending': 'warning', 'Received': 'success',
  'Partial': 'info', 'Refunded': 'info',
};

export function StatusBadge({ status }) {
  const cls = STATUS_MAP[status] || 'gray';
  return <span className={`badge badge-${cls}`}>{status}</span>;
}

export function MedStatusBadge({ med }) {
  const s = getMedStatus(med);
  return <StatusBadge status={s} />;
}

export function exportToCSV(rows, filename) {
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(title, headers, rows, filename) {
  import('jspdf').then(({ default: jsPDF }) => {
    import('jspdf-autotable').then(() => {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setTextColor(15, 110, 86);
      doc.text('PharmaCore AI', 14, 16);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(title, 14, 24);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.autoTable({ head: [headers], body: rows, startY: 36, styles: { fontSize: 9 }, headStyles: { fillColor: [15, 110, 86] } });
      doc.save(filename);
    });
  });
}

export function Empty({ text = 'No records found' }) {
  return (
    <tr>
      <td colSpan={99} className="empty">
        <i className="ti ti-database-off" style={{ fontSize: 24, display: 'block', marginBottom: 8, color: 'var(--text-tertiary)' }} aria-hidden="true" />
        {text}
      </td>
    </tr>
  );
}
