/* eslint-disable */
import React, { useState, useEffect } from 'react';
import './index.css';
import { getMedStatus } from './data/db';
import { useDatabase } from './hooks/useDatabase';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Billing from './pages/Billing';
import Returns from './pages/Returns';
import Reports from './pages/Reports';

import Login from './Login'; // ✅ FIXED
import ScannerModal from './components/ScannerModal';

// ─── Loading Screen ─────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      background: '#0a0f1e', color: '#10b981', fontFamily: 'sans-serif', gap: 16,
    }}>
      <div style={{ fontSize: 40 }}>💊</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>PharmaCore AI</div>
      <div style={{ fontSize: 13, color: '#475569' }}>Loading live data...</div>
    </div>
  );
}

// ─── Error Screen ─────────────────────────
function ErrorScreen({ error, onRetry }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      background: '#0a0f1e', color: '#f1f5f9',
    }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <div style={{ fontWeight: 700 }}>Database Error</div>
      <div style={{ fontSize: 12, color: '#64748b', maxWidth: 320, textAlign: 'center' }}>
        {error}
      </div>
      <button onClick={onRetry} style={{
        marginTop: 12, padding: '10px 24px',
        background: '#10b981', border: 'none',
        borderRadius: 8, cursor: 'pointer'
      }}>
        Retry
      </button>
    </div>
  );
}

// ─── Pages Map ─────────────────────────
const PAGES = {
  dashboard: Dashboard,
  inventory: Inventory,
  sales: Sales,
  purchases: Purchases,
  billing: Billing,
  returns: Returns,
  reports: Reports,
};

// ─── App ───────────────────────────────
export default function App() {

  // 🔐 AUTH STATE (ADDED)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // restore login from localStorage
  useEffect(() => {
    const auth = localStorage.getItem("auth");
    if (auth === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (user) => {
    if (user) localStorage.setItem("pharmacore_user", JSON.stringify(user));
    localStorage.setItem("auth", "true");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth");
    setIsLoggedIn(false);
  };

  // existing states
  const [page, setPage] = useState('dashboard');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState('');
  const [scannedMed, setScannedMed] = useState(null);

  const { db, loading, error, updateDB, refetch } = useDatabase();

  // 🔴 LOGIN GATE (IMPORTANT)
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} onRetry={refetch} />;

  const lowStockCount = db.medicines.filter(m => {
    const s = getMedStatus(m);
    return s === 'Low Stock' || s === 'Expired';
  }).length;

  const openScanner = (target = '') => {
    setScannerTarget(target);
    setScannedMed(null);
    setScannerOpen(true);
  };

  const PageComponent = PAGES[page] || Dashboard;

  return (
    <div className="app">

      <Sidebar
        page={page}
        setPage={setPage}
        onLogout={handleLogout}   // optional logout button
      />

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
            setScannerOpen(false);
            if (scannerTarget === 'billing') setPage('billing');
          }}
        />
      )}

    </div>
  );
}
