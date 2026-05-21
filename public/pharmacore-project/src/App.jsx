import React, { useState, useCallback, useEffect } from 'react';
import './index.css';
import { initialDB, getMedStatus } from './data/db';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Billing from './pages/Billing';
import Returns from './pages/Returns';
import Reports from './pages/Reports';
import ScannerModal from './components/ScannerModal';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [db, setDb] = useState(() => {
    try {
      const saved = localStorage.getItem('pharmacore_db');
      return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(initialDB));
    } catch {
      return JSON.parse(JSON.stringify(initialDB));
    }
  });
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState('');
  const [scannedMed, setScannedMed] = useState(null);

  useEffect(() => {
    localStorage.setItem('pharmacore_db', JSON.stringify(db));
  }, [db]);

  const updateDB = useCallback((updater) => {
    setDb(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      updater(next);
      return next;
    });
  }, []);

  const lowStockCount = db.medicines.filter(m => {
    const s = getMedStatus(m);
    return s === 'Low Stock' || s === 'Expired';
  }).length;

  const openScanner = (target = '') => {
    setScannerTarget(target);
    setScannedMed(null);
    setScannerOpen(true);
  };

  const pages = { dashboard: Dashboard, inventory: Inventory, sales: Sales, purchases: Purchases, billing: Billing, returns: Returns, reports: Reports };
  const PageComponent = pages[page] || Dashboard;

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} />
      <div className="main">
        <Topbar
          page={page}
          db={db}
          updateDB={updateDB}
          openScanner={openScanner}
          lowStockCount={lowStockCount}
        />
        <div className="content">
          <PageComponent
            db={db}
            updateDB={updateDB}
            openScanner={openScanner}
            scannedMed={scannedMed}
            setScannedMed={setScannedMed}
          />
        </div>
      </div>

      {scannerOpen && (
        <ScannerModal
          db={db}
          target={scannerTarget}
          onClose={() => setScannerOpen(false)}
          onScanned={(med) => {
            setScannedMed(med);
            if (scannerTarget === 'billing') {
              setScannerOpen(false);
              setPage('billing');
            }
          }}
        />
      )}
    </div>
  );
}