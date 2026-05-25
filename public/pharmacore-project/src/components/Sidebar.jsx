/* eslint-disable */
import React, { useState } from 'react';

const NAV = [
  { section: 'Main', items: [
    { id: 'dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
    { id: 'inventory', icon: 'ti-package', label: 'Inventory' },
  ]},
  { section: 'Transactions', items: [
    { id: 'sales', icon: 'ti-shopping-cart', label: 'Sales' },
    { id: 'purchases', icon: 'ti-truck', label: 'Purchases' },
    { id: 'billing', icon: 'ti-receipt', label: 'Billing' },
  ]},
  { section: 'Reports', items: [
    { id: 'prescriptions', icon: 'ti-file-text', label: 'Prescriptions' },
    { id: 'patients', icon: 'ti-users', label: 'Patients' },
    { id: 'returns', icon: 'ti-arrow-back', label: 'Returns' },
    { id: 'reports', icon: 'ti-chart-bar', label: 'Reports' },
  ]},
];

export default function Sidebar({ page, setPage }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <style>{`
        .mob-toggle {
          display: none; position: fixed; top: 12px; left: 12px; z-index: 1100;
          background: #10b981; border: none; border-radius: 10px;
          width: 38px; height: 38px; align-items: center; justify-content: center;
          cursor: pointer; color: #fff; font-size: 18px;
        }
        .mob-overlay {
          display: none; position: fixed; inset: 0; background: rgba(0,0,0,.6);
          z-index: 1050; backdrop-filter: blur(2px);
        }
        @media (max-width: 768px) {
          .mob-toggle { display: flex !important; }
          .sidebar {
            position: fixed !important; left: 0; top: 0; bottom: 0; z-index: 1060;
            transform: translateX(-100%); transition: transform .25s ease;
            width: 240px !important;
          }
          .sidebar.mob-open { transform: translateX(0) !important; }
          .mob-overlay.mob-open { display: block !important; }
          .main { margin-left: 0 !important; }
        }
      `}</style>

      {/* Mobile Toggle */}
      <button className="mob-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        <i className={`ti ${mobileOpen ? 'ti-x' : 'ti-menu-2'}`} />
      </button>

      {/* Mobile Overlay */}
      <div className={`mob-overlay ${mobileOpen ? 'mob-open' : ''}`} onClick={() => setMobileOpen(false)} />

      <div className={`sidebar ${mobileOpen ? 'mob-open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3 }}>
            <div className="logo-mark">
              <i className="ti ti-pill" style={{ fontSize: 16, color: '#fff' }} aria-hidden="true" />
            </div>
            <span className="logo-name">PharmaCore</span>
          </div>
          <div className="logo-sub">Pro Pharmacy Management</div>
        </div>

        <div className="nav-section">
          {NAV.map(group => (
            <div key={group.section}>
              <div className="nav-label">{group.section}</div>
              {group.items.map(item => (
                <div
                  key={item.id}
                  className={`nav-item ${page === item.id ? 'active' : ''}`}
                  onClick={() => { setPage(item.id); setMobileOpen(false); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setPage(item.id)}
                >
                  <i className={`ti ${item.icon}`} aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">v2.0 Pro · PharmaCore AI</div>
      </div>
    </>
  );
}
