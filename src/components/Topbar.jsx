import React, { useState } from 'react';
import MedicineModal from './MedicineModal';
import SaleModal from './SaleModal';
import PurchaseModal from './PurchaseModal';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  inventory: 'Inventory Management',
  sales: 'Sales',
  purchases: 'Purchases',
  billing: 'Billing & Invoices',
  returns: 'Returns Log',
  reports: 'Reports & Analytics',
};

export default function Topbar({ page, db, updateDB, openScanner, lowStockCount }) {
  const [medModal, setMedModal] = useState(false);
  const [saleModal, setSaleModal] = useState(false);
  const [purModal, setPurModal] = useState(false);

  const handleAdd = () => {
    if (page === 'inventory') setMedModal(true);
    else if (page === 'sales') setSaleModal(true);
    else if (page === 'purchases') setPurModal(true);
  };

  const showAdd = ['inventory', 'sales', 'purchases'].includes(page);
  const addLabel = { inventory: 'Add Medicine', sales: 'New Sale', purchases: 'New Purchase' };

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">{PAGE_TITLES[page]}</span>
        <span className="live-badge">● Live</span>
        <div style={{ flex: 1 }} />

        <div className="notif-wrap">
          <button className="btn btn-sm btn-icon" aria-label="Alerts">
            <i className="ti ti-bell" aria-hidden="true" />
          </button>
          {lowStockCount > 0 && <span className="notif-dot" title={`${lowStockCount} alerts`} />}
        </div>

        <button className="btn btn-sm" onClick={() => openScanner('')}>
          <i className="ti ti-barcode" aria-hidden="true" /> Scanner
        </button>

        {showAdd && (
          <button className="btn btn-sm btn-primary" onClick={handleAdd}>
            <i className="ti ti-plus" aria-hidden="true" /> {addLabel[page]}
          </button>
        )}
      </div>

      {medModal && <MedicineModal db={db} updateDB={updateDB} onClose={() => setMedModal(false)} />}
      {saleModal && <SaleModal db={db} updateDB={updateDB} onClose={() => setSaleModal(false)} />}
      {purModal && <PurchaseModal db={db} updateDB={updateDB} onClose={() => setPurModal(false)} />}
    </>
  );
}
