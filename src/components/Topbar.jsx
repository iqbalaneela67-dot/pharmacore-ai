/* eslint-disable */
import React, { useState } from 'react';
import MedicineModal from './MedicineModal';
import SaleModal from './SaleModal';
import PurchaseModal from './PurchaseModal';
import { AlertBell, ToastContainer } from './AlertSystem';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  inventory: 'Inventory Management',
  sales: 'Sales',
  purchases: 'Purchases',
  billing: 'Billing & Invoices',
  returns: 'Returns Log',
  reports: 'Reports & Analytics',
};

export default function Topbar({ page, db, updateDB, openScanner, lowStockCount, user, onLogout }) {
  const [medModal, setMedModal] = useState(false);
  const [saleModal, setSaleModal] = useState(false);
  const [purModal, setPurModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleAdd = () => {
    if (page === 'inventory') setMedModal(true);
    else if (page === 'sales') setSaleModal(true);
    else if (page === 'purchases') setPurModal(true);
  };

  const showAdd = ['inventory', 'sales', 'purchases'].includes(page);
  const addLabel = { inventory: 'Add Medicine', sales: 'New Sale', purchases: 'New Purchase' };
  const roleColor = { Admin: '#10b981', Pharmacist: '#3b82f6', Cashier: '#f59e0b' };

  return (
    <>
      <style>{`
        .topbar { 
          height: auto; min-height: 52px; padding: 8px 16px;
          display: flex; align-items: center; gap: 8px;
          flex-wrap: wrap;
        }
        .tb-title-wrap { display: flex; align-items: center; gap: 8px; }
        .user-menu-wrap { position: relative; }
        .user-btn {
          display: flex; align-items: center; gap: 8px;
          background: #1e293b; border: 1px solid #334155;
          border-radius: 10px; padding: 6px 12px;
          cursor: pointer; color: #e2e8f0; font-size: 13px;
          font-weight: 600; transition: all .15s;
          font-family: inherit;
        }
        .user-btn:hover { border-color: #10b981; }
        .user-avatar {
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; color: #0f172a;
        }
        .user-role {
          font-size: 10px; font-weight: 600; padding: 2px 6px;
          border-radius: 6px; color: #0f172a;
        }
        .user-dropdown {
          position: absolute; right: 0; top: calc(100% + 8px);
          background: #1e293b; border: 1px solid #334155;
          border-radius: 12px; padding: 8px;
          min-width: 180px; z-index: 999;
          box-shadow: 0 8px 32px rgba(0,0,0,.4);
        }
        .user-dd-info { padding: 8px 10px 10px; border-bottom: 1px solid #334155; margin-bottom: 6px; }
        .user-dd-name { font-size: 13px; font-weight: 700; color: #f1f5f9; }
        .user-dd-role { font-size: 11px; color: #64748b; margin-top: 2px; }
        .user-dd-btn {
          width: 100%; padding: 8px 10px; border-radius: 8px;
          background: none; border: none; color: #fca5a5;
          font-size: 13px; font-weight: 600; cursor: pointer;
          text-align: left; display: flex; align-items: center; gap: 8px;
          transition: background .15s; font-family: inherit;
        }
        .user-dd-btn:hover { background: rgba(239,68,68,.1); }

        @media (max-width: 600px) {
          .topbar { padding: 8px 10px; gap: 6px; }
          .topbar-title { font-size: 13px !important; }
          .btn { font-size: 11px !important; padding: 5px 8px !important; }
          .user-btn { padding: 5px 8px; font-size: 12px; }
          .tb-hide-mobile { display: none !important; }
        }
      `}</style>

      <ToastContainer />

      <div className="topbar">
        <div className="tb-title-wrap">
          <span className="topbar-title">{PAGE_TITLES[page]}</span>
          <span className="live-badge">● Live</span>
        </div>
        <div style={{ flex: 1 }} />

        {/* Alert Bell */}
        {db && <AlertBell db={db} />}

        <button className="btn btn-sm tb-hide-mobile" onClick={() => openScanner('')}>
          <i className="ti ti-barcode" aria-hidden="true" /> Scanner
        </button>

        {showAdd && (
          <button className="btn btn-sm btn-primary" onClick={handleAdd}>
            <i className="ti ti-plus" aria-hidden="true" />
            <span className="tb-hide-mobile">{addLabel[page]}</span>
          </button>
        )}

        {user && (
          <div className="user-menu-wrap">
            <button className="user-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="user-avatar" style={{ background: roleColor[user.role] || '#10b981' }}>
                {user.name?.[0] || 'U'}
              </div>
              <span className="tb-hide-mobile">{user.name}</span>
              <span className="user-role" style={{ background: roleColor[user.role] || '#10b981' }}>
                {user.role}
              </span>
              <i className="ti ti-chevron-down" style={{ fontSize: 12, color: '#64748b' }} />
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-dd-info">
                  <div className="user-dd-name">{user.name}</div>
                  <div className="user-dd-role">{user.role} · PharmaCore AI</div>
                </div>
                <button className="user-dd-btn" onClick={() => { setShowUserMenu(false); onLogout && onLogout(); }}>
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {medModal && <MedicineModal db={db} updateDB={updateDB} onClose={() => setMedModal(false)} />}
      {saleModal && <SaleModal db={db} updateDB={updateDB} onClose={() => setSaleModal(false)} />}
      {purModal && <PurchaseModal db={db} updateDB={updateDB} onClose={() => setPurModal(false)} />}
    </>
  );
}