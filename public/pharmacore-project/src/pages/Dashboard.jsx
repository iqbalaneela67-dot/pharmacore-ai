// PharmaCore AI — Central Data Store
// In production, replace with Supabase / Firebase / your backend API

// Helper: date string N days ago from today
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export const initialDB = {
  medicines: [
    { id: 1,  name: 'Panadol 500mg',        category: 'Analgesics',     barcode: '123456', batch: 'B001', expiry: '2026-12-31', qty: 150, mrp: 25,  pp: 18,  mfr: 'GSK',      minStock: 20 },
    { id: 2,  name: 'Augmentin 625mg',       category: 'Antibiotics',    barcode: '234567', batch: 'B002', expiry: '2025-08-15', qty: 8,   mrp: 320, pp: 240, mfr: 'GSK',      minStock: 15 },
    { id: 3,  name: 'Omeprazole 20mg',       category: 'Antacids',       barcode: '345678', batch: 'B003', expiry: '2026-06-30', qty: 200, mrp: 45,  pp: 30,  mfr: 'ICI',      minStock: 30 },
    { id: 4,  name: 'Metformin 500mg',       category: 'Antidiabetic',   barcode: '456789', batch: 'B004', expiry: '2024-11-30', qty: 60,  mrp: 18,  pp: 12,  mfr: 'Sami',     minStock: 25 },
    { id: 5,  name: 'Vitamin C 500mg',       category: 'Vitamins',       barcode: '567890', batch: 'B005', expiry: '2027-03-31', qty: 5,   mrp: 55,  pp: 38,  mfr: 'Abbott',   minStock: 20 },
    { id: 6,  name: 'Amlodipine 5mg',        category: 'Cardiac',        barcode: '678901', batch: 'B006', expiry: '2026-09-30', qty: 120, mrp: 85,  pp: 60,  mfr: 'Novartis', minStock: 20 },
    { id: 7,  name: 'Ciprofloxacin 500mg',   category: 'Antibiotics',    barcode: '789012', batch: 'B007', expiry: '2026-11-30', qty: 90,  mrp: 95,  pp: 70,  mfr: 'Getz',     minStock: 15 },
    { id: 8,  name: 'Atorvastatin 10mg',     category: 'Cardiac',        barcode: '890123', batch: 'B008', expiry: '2027-01-31', qty: 75,  mrp: 120, pp: 85,  mfr: 'Pfizer',   minStock: 20 },
    { id: 9,  name: 'Cetirizine 10mg',       category: 'Antihistamine',  barcode: '901234', batch: 'B009', expiry: '2026-05-30', qty: 12,  mrp: 35,  pp: 22,  mfr: 'AGP',      minStock: 25 },
    { id: 10, name: 'Pantoprazole 40mg',     category: 'Antacids',       barcode: '012345', batch: 'B010', expiry: '2026-08-31', qty: 180, mrp: 65,  pp: 45,  mfr: 'Getz',     minStock: 30 },
    { id: 11, name: 'Aspirin 75mg',          category: 'Cardiac',        barcode: '111222', batch: 'B011', expiry: '2027-06-30', qty: 300, mrp: 15,  pp: 9,   mfr: 'Bayer',    minStock: 50 },
    { id: 12, name: 'Amoxicillin 500mg',     category: 'Antibiotics',    barcode: '222333', batch: 'B012', expiry: '2026-10-31', qty: 110, mrp: 55,  pp: 38,  mfr: 'Atco',     minStock: 20 },
    { id: 13, name: 'Diclofenac 50mg',       category: 'Analgesics',     barcode: '333444', batch: 'B013', expiry: '2025-12-31', qty: 95,  mrp: 30,  pp: 20,  mfr: 'ICI',      minStock: 20 },
    { id: 14, name: 'Losartan 50mg',         category: 'Cardiac',        barcode: '444555', batch: 'B014', expiry: '2027-02-28', qty: 65,  mrp: 110, pp: 78,  mfr: 'Searle',   minStock: 15 },
    { id: 15, name: 'Multivitamin Tabs',     category: 'Vitamins',       barcode: '555666', batch: 'B015', expiry: '2027-05-31', qty: 14,  mrp: 280, pp: 200, mfr: 'Abbott',   minStock: 20 },
  ],

  sales: [
    // --- Today: May 19, 2026 ---
    { id:  1, invoice: 'INV-001', date: daysAgo(0), patient: 'Ahmad Raza',       medId: 1,  qty: 4,  total: 100,  discount: 0, status: 'Paid' },
    { id:  2, invoice: 'INV-002', date: daysAgo(0), patient: 'Sana Fatima',      medId: 7,  qty: 2,  total: 190,  discount: 0, status: 'Paid' },
    { id:  3, invoice: 'INV-003', date: daysAgo(0), patient: 'Bilal Sheikh',     medId: 3,  qty: 3,  total: 135,  discount: 0, status: 'Paid' },
    { id:  4, invoice: 'INV-004', date: daysAgo(0), patient: 'Hina Bashir',      medId: 8,  qty: 1,  total: 120,  discount: 0, status: 'Paid' },
    { id:  5, invoice: 'INV-005', date: daysAgo(0), patient: 'Farhan Qureshi',   medId: 11, qty: 6,  total: 90,   discount: 0, status: 'Paid' },
    { id:  6, invoice: 'INV-006', date: daysAgo(0), patient: 'Mehwish Noor',     medId: 14, qty: 2,  total: 220,  discount: 5, status: 'Paid' },
    { id:  7, invoice: 'INV-007', date: daysAgo(0), patient: 'Zain ul Abdin',    medId: 13, qty: 3,  total: 90,   discount: 0, status: 'Paid' },
    // --- Yesterday ---
    { id:  8, invoice: 'INV-008', date: daysAgo(1), patient: 'Sara Khan',        medId: 1,  qty: 2,  total: 50,   discount: 0, status: 'Paid' },
    { id:  9, invoice: 'INV-009', date: daysAgo(1), patient: 'Usman Malik',      medId: 6,  qty: 1,  total: 85,   discount: 5, status: 'Paid' },
    { id: 10, invoice: 'INV-010', date: daysAgo(1), patient: 'Nadia Hussain',    medId: 12, qty: 2,  total: 110,  discount: 0, status: 'Paid' },
    { id: 11, invoice: 'INV-011', date: daysAgo(1), patient: 'Tariq Mehmood',    medId: 10, qty: 3,  total: 195,  discount: 0, status: 'Paid' },
    { id: 12, invoice: 'INV-012', date: daysAgo(1), patient: 'Fatima Bibi',      medId: 8,  qty: 1,  total: 120,  discount: 0, status: 'Paid' },
    // --- 2 days ago ---
    { id: 13, invoice: 'INV-013', date: daysAgo(2), patient: 'Kamran Ali',       medId: 7,  qty: 1,  total: 95,   discount: 0, status: 'Paid' },
    { id: 14, invoice: 'INV-014', date: daysAgo(2), patient: 'Rukhsar Parveen',  medId: 3,  qty: 4,  total: 180,  discount: 0, status: 'Paid' },
    { id: 15, invoice: 'INV-015', date: daysAgo(2), patient: 'Imran Ashraf',     medId: 11, qty: 10, total: 150,  discount: 0, status: 'Paid' },
    { id: 16, invoice: 'INV-016', date: daysAgo(2), patient: 'Ambreen Sadiq',    medId: 14, qty: 1,  total: 110,  discount: 0, status: 'Paid' },
    // --- 3 days ago ---
    { id: 17, invoice: 'INV-017', date: daysAgo(3), patient: 'Hassan Akhtar',    medId: 1,  qty: 6,  total: 150,  discount: 0, status: 'Paid' },
    { id: 18, invoice: 'INV-018', date: daysAgo(3), patient: 'Asma Ijaz',        medId: 6,  qty: 2,  total: 170,  discount: 0, status: 'Paid' },
    { id: 19, invoice: 'INV-019', date: daysAgo(3), patient: 'Rehan Butt',       medId: 10, qty: 2,  total: 130,  discount: 0, status: 'Paid' },
    { id: 20, invoice: 'INV-020', date: daysAgo(3), patient: 'Noor Ul Ain',      medId: 12, qty: 3,  total: 165,  discount: 5, status: 'Paid' },
    // --- 4 days ago ---
    { id: 21, invoice: 'INV-021', date: daysAgo(4), patient: 'Waseem Akram',     medId: 8,  qty: 2,  total: 240,  discount: 0, status: 'Paid' },
    { id: 22, invoice: 'INV-022', date: daysAgo(4), patient: 'Shahida Bibi',     medId: 13, qty: 4,  total: 120,  discount: 0, status: 'Paid' },
    { id: 23, invoice: 'INV-023', date: daysAgo(4), patient: 'Adeel Chaudhry',   medId: 7,  qty: 2,  total: 190,  discount: 0, status: 'Paid' },
    // --- 5 days ago ---
    { id: 24, invoice: 'INV-024', date: daysAgo(5), patient: 'Rabia Kanwal',     medId: 1,  qty: 3,  total: 75,   discount: 0, status: 'Paid' },
    { id: 25, invoice: 'INV-025', date: daysAgo(5), patient: 'Naveed Iqbal',     medId: 6,  qty: 1,  total: 85,   discount: 0, status: 'Paid' },
    { id: 26, invoice: 'INV-026', date: daysAgo(5), patient: 'Samia Riaz',       medId: 10, qty: 4,  total: 260,  discount: 0, status: 'Paid' },
    { id: 27, invoice: 'INV-027', date: daysAgo(5), patient: 'Omer Farooq',      medId: 14, qty: 1,  total: 110,  discount: 0, status: 'Paid' },
    // --- 6 days ago ---
    { id: 28, invoice: 'INV-028', date: daysAgo(6), patient: 'Zara Shahid',      medId: 3,  qty: 2,  total: 90,   discount: 0, status: 'Paid' },
    { id: 29, invoice: 'INV-029', date: daysAgo(6), patient: 'Muneeb Ur Rehman', medId: 11, qty: 8,  total: 120,  discount: 0, status: 'Paid' },
    { id: 30, invoice: 'INV-030', date: daysAgo(6), patient: 'Iram Shafiq',      medId: 8,  qty: 1,  total: 120,  discount: 0, status: 'Paid' },
    // --- Older (last month) ---
    { id: 31, invoice: 'INV-031', date: daysAgo(8),  patient: 'Khalid Mehmood',  medId: 12, qty: 2,  total: 110,  discount: 0, status: 'Paid' },
    { id: 32, invoice: 'INV-032', date: daysAgo(10), patient: 'Fariha Naz',      medId: 1,  qty: 5,  total: 125,  discount: 0, status: 'Paid' },
    { id: 33, invoice: 'INV-033', date: daysAgo(12), patient: 'Shoaib Akhtar',   medId: 6,  qty: 2,  total: 170,  discount: 0, status: 'Paid' },
    { id: 34, invoice: 'INV-034', date: daysAgo(14), patient: 'Komal Anwar',     medId: 7,  qty: 3,  total: 285,  discount: 0, status: 'Paid' },
    { id: 35, invoice: 'INV-035', date: daysAgo(16), patient: 'Asif Iqbal',      medId: 10, qty: 2,  total: 130,  discount: 0, status: 'Paid' },
    { id: 36, invoice: 'INV-036', date: daysAgo(18), patient: 'Lubna Waheed',    medId: 8,  qty: 1,  total: 120,  discount: 0, status: 'Paid' },
    { id: 37, invoice: 'INV-037', date: daysAgo(20), patient: 'Rizwan Shah',     medId: 14, qty: 2,  total: 220,  discount: 0, status: 'Paid' },
    { id: 38, invoice: 'INV-038', date: daysAgo(22), patient: 'Saima Tariq',     medId: 13, qty: 4,  total: 120,  discount: 0, status: 'Paid' },
    { id: 39, invoice: 'INV-039', date: daysAgo(24), patient: 'Faisal Nawaz',    medId: 3,  qty: 3,  total: 135,  discount: 0, status: 'Paid' },
    { id: 40, invoice: 'INV-040', date: daysAgo(26), patient: 'Tahira Khanam',   medId: 11, qty: 5,  total: 75,   discount: 0, status: 'Paid' },
    { id: 41, invoice: 'INV-041', date: daysAgo(28), patient: 'Salman Raza',     medId: 6,  qty: 1,  total: 85,   discount: 0, status: 'Paid' },
    { id: 42, invoice: 'INV-042', date: daysAgo(30), patient: 'Maryam Siddiqui', medId: 12, qty: 2,  total: 110,  discount: 0, status: 'Paid' },
  ],

  purchases: [
    { id: 1, po: 'PO-001', date: daysAgo(25), supplier: 'MedCo Pvt Ltd',   medId: 1,  qty: 200, price: 18,  total: 3600,  status: 'Received' },
    { id: 2, po: 'PO-002', date: daysAgo(22), supplier: 'PharmaCare',       medId: 2,  qty: 50,  price: 240, total: 12000, status: 'Received' },
    { id: 3, po: 'PO-003', date: daysAgo(18), supplier: 'MedCo Pvt Ltd',   medId: 3,  qty: 300, price: 30,  total: 9000,  status: 'Received' },
    { id: 4, po: 'PO-004', date: daysAgo(15), supplier: 'Getz Pharma',      medId: 7,  qty: 150, price: 70,  total: 10500, status: 'Received' },
    { id: 5, po: 'PO-005', date: daysAgo(12), supplier: 'Pfizer Pakistan',  medId: 8,  qty: 100, price: 85,  total: 8500,  status: 'Received' },
    { id: 6, po: 'PO-006', date: daysAgo(10), supplier: 'Abbott Pakistan',  medId: 5,  qty: 80,  price: 38,  total: 3040,  status: 'Received' },
    { id: 7, po: 'PO-007', date: daysAgo(8),  supplier: 'Searle Company',   medId: 14, qty: 100, price: 78,  total: 7800,  status: 'Received' },
    { id: 8, po: 'PO-008', date: daysAgo(6),  supplier: 'Atco Laboratories',medId: 12, qty: 150, price: 38,  total: 5700,  status: 'Received' },
    { id: 9, po: 'PO-009', date: daysAgo(4),  supplier: 'Bayer Pakistan',   medId: 11, qty: 500, price: 9,   total: 4500,  status: 'Received' },
    { id: 10,po: 'PO-010', date: daysAgo(2),  supplier: 'Novartis Pharma',  medId: 6,  qty: 200, price: 60,  total: 12000, status: 'Received' },
    { id: 11,po: 'PO-011', date: daysAgo(1),  supplier: 'Getz Pharma',      medId: 10, qty: 200, price: 45,  total: 9000,  status: 'Pending'  },
    { id: 12,po: 'PO-012', date: daysAgo(0),  supplier: 'MedCo Pvt Ltd',   medId: 13, qty: 100, price: 20,  total: 2000,  status: 'Pending'  },
  ],

  saleReturns: [],
  purchaseReturns: [],

  bills: [
    {
      id: 1, invoice: 'BILL-001', patient: 'Rehman Sb', doctor: 'Dr. Imran', date: daysAgo(2),
      items: [
        { medId: 1,  name: 'Panadol 500mg',   qty: 2, mrp: 25, total: 50 },
        { medId: 3,  name: 'Omeprazole 20mg', qty: 1, mrp: 45, total: 45 },
      ],
      subtotal: 95, discount: 0, total: 95, payment: 'Cash'
    },
    {
      id: 2, invoice: 'BILL-002', patient: 'Zainab Akhtar', doctor: 'Dr. Saba', date: daysAgo(0),
      items: [
        { medId: 6,  name: 'Amlodipine 5mg',  qty: 1, mrp: 85,  total: 85  },
        { medId: 11, name: 'Aspirin 75mg',     qty: 2, mrp: 15,  total: 30  },
      ],
      subtotal: 115, discount: 5, total: 110, payment: 'JazzCash'
    },
  ],

  nextSaleId: 43,
  nextPurId: 13,
  nextBillId: 3,
  nextSRId: 1,
  nextPRId: 1,
  nextMedId: 16,
};

export const CATEGORIES = [
  'Antibiotics', 'Analgesics', 'Antacids', 'Vitamins',
  'Antidiabetic', 'Cardiac', 'Antihistamine', 'Other'
];

export const PAYMENT_MODES = ['Cash', 'Card', 'JazzCash', 'EasyPaisa', 'UBL', 'Credit'];

export function getMedStatus(med) {
  const exp = new Date(med.expiry);
  const now = new Date();
  if (exp < now) return 'Expired';
  if (med.qty <= med.minStock) return 'Low Stock';
  return 'In Stock';
}

export function formatPKR(amount) {
  return 'PKR ' + Number(amount).toLocaleString('en-PK');
}

export function today() {
  return new Date().toISOString().split('T')[0];
}

export function padId(n, prefix = '', len = 3) {
  return prefix + String(n).padStart(len, '0');
}

