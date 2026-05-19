import React from 'react';

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
    { id: 'returns', icon: 'ti-arrow-back', label: 'Returns' },
    { id: 'reports', icon: 'ti-chart-bar', label: 'Reports' },
  ]},
];

export default function Sidebar({ page, setPage }) {
  return (
    <div className="sidebar">
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
                onClick={() => setPage(item.id)}
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
  );
}
