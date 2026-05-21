import React, { useState } from 'react';
import { getMedStatus, CATEGORIES } from '../data/db';
import { MedStatusBadge, exportToCSV, exportToPDF, Empty } from '../components/ui';
import MedicineModal from '../components/MedicineModal';

export default function Inventory({ db, updateDB }) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState('');
  const [editMed, setEditMed] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const filtered = db.medicines.filter(m => {
    const s = getMedStatus(m);
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.barcode.includes(search)) return false;
    if (cat && m.category !== cat) return false;
    if (status && s !== status) return false;
    return true;
  });

  const handleEdit = (med) => { setEditMed(med); setShowModal(true); };
  const handleDelete = (id) => {
    if (!window.confirm('Delete this medicine? This cannot be undone.')) return;
    updateDB(d => { d.medicines = d.medicines.filter(m => m.id !== id); });
  };

  const handleExportCSV = () => {
    exportToCSV(
      [['Name', 'Category', 'Barcode', 'Batch', 'Expiry', 'Qty', 'MRP', 'Purchase Price', 'Manufacturer', 'Status'],
       ...filtered.map(m => [m.name, m.category, m.barcode, m.batch, m.expiry, m.qty, m.mrp, m.pp, m.mfr, getMedStatus(m)])],
      'inventory.csv'
    );
  };

  const handleExportPDF = () => {
    exportToPDF(
      'Inventory Report',
      ['Name', 'Category', 'Batch', 'Expiry', 'Qty', 'MRP', 'Status'],
      filtered.map(m => [m.name, m.category, m.batch, m.expiry, m.qty, 'PKR ' + m.mrp, getMedStatus(m)]),
      'inventory.pdf'
    );
  };

  return (
    <div>
      <div className="filters">
        <input type="search" placeholder="Search by name or barcode..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option>In Stock</option><option>Low Stock</option><option>Expired</option>
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{filtered.length} records</span>
        <button className="btn btn-sm" onClick={handleExportCSV}><i className="ti ti-download" aria-hidden="true" /> Export CSV</button>
        <button className="btn btn-sm" onClick={handleExportPDF}><i className="ti ti-file-type-pdf" aria-hidden="true" /> Export PDF</button>
      </div>

      <div className="card card-flush">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Medicine</th><th>Category</th><th>Batch</th><th>Expiry</th>
                <th>Qty</th><th>MRP</th><th>Purchase Price</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map(m => {
                const s = getMedStatus(m);
                return (
                  <tr key={m.id} className={s === 'Low Stock' ? 'row-low' : s === 'Expired' ? 'row-expired' : ''}>
                    <td>
                      <div className="td-med-name">{m.name}</div>
                      <div className="td-sub">{m.mfr} · {m.barcode}</div>
                    </td>
                    <td>{m.category}</td>
                    <td>{m.batch}</td>
                    <td>{m.expiry}</td>
                    <td><b>{m.qty}</b></td>
                    <td>PKR {m.mrp}</td>
                    <td>PKR {m.pp}</td>
                    <td><MedStatusBadge med={m} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm btn-icon" onClick={() => handleEdit(m)} title="Edit">
                          <i className="ti ti-edit" aria-hidden="true" />
                        </button>
                        <button className="btn btn-sm btn-icon" style={{ color: 'var(--danger-text)' }} onClick={() => handleDelete(m.id)} title="Delete">
                          <i className="ti ti-trash" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : <Empty text="No medicines found" />}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <MedicineModal
          db={db}
          updateDB={updateDB}
          editMed={editMed}
          onClose={() => { setShowModal(false); setEditMed(null); }}
        />
      )}
    </div>
  );
}
