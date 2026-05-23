// PharmaCore AI — Central Data Store
// In production, replace with Supabase / Firebase / your backend API

export const initialDB = {
  medicines: [
    { id: 1, name: 'Panadol 500mg', category: 'Analgesics', barcode: '123456', batch: 'B001', expiry: '2026-12-31', qty: 150, mrp: 25, pp: 18, mfr: 'GSK', minStock: 20 },
    { id: 2, name: 'Augmentin 625mg', category: 'Antibiotics', barcode: '234567', batch: 'B002', expiry: '2025-08-15', qty: 8, mrp: 320, pp: 240, mfr: 'GSK', minStock: 15 },
    { id: 3, name: 'Omeprazole 20mg', category: 'Antacids', barcode: '345678', batch: 'B003', expiry: '2026-06-30', qty: 200, mrp: 45, pp: 30, mfr: 'ICI', minStock: 30 },
    { id: 4, name: 'Metformin 500mg', category: 'Antidiabetic', barcode: '456789', batch: 'B004', expiry: '2024-11-30', qty: 60, mrp: 18, pp: 12, mfr: 'Sami', minStock: 25 },
    { id: 5, name: 'Vitamin C 500mg', category: 'Vitamins', barcode: '567890', batch: 'B005', expiry: '2027-03-31', qty: 5, mrp: 55, pp: 38, mfr: 'Abbott', minStock: 20 },
    { id: 6, name: 'Amlodipine 5mg', category: 'Cardiac', barcode: '678901', batch: 'B006', expiry: '2026-09-30', qty: 120, mrp: 85, pp: 60, mfr: 'Novartis', minStock: 20 },
    { id: 7, name: 'Ciprofloxacin 500mg', category: 'Antibiotics', barcode: '789012', batch: 'B007', expiry: '2026-11-30', qty: 90, mrp: 95, pp: 70, mfr: 'Getz', minStock: 15 },
    { id: 8, name: 'Atorvastatin 10mg', category: 'Cardiac', barcode: '890123', batch: 'B008', expiry: '2027-01-31', qty: 75, mrp: 120, pp: 85, mfr: 'Pfizer', minStock: 20 },
    { id: 9, name: 'Cetirizine 10mg', category: 'Antihistamine', barcode: '901234', batch: 'B009', expiry: '2026-05-30', qty: 12, mrp: 35, pp: 22, mfr: 'AGP', minStock: 25 },
    { id: 10, name: 'Pantoprazole 40mg', category: 'Antacids', barcode: '012345', batch: 'B010', expiry: '2026-08-31', qty: 180, mrp: 65, pp: 45, mfr: 'Getz', minStock: 30 },
  ],
  sales: [
    { id: 1, invoice: 'INV-001', date: '2026-05-10', patient: 'Ahmed Ali', medId: 1, qty: 3, total: 75, discount: 0, status: 'Paid' },
    { id: 2, invoice: 'INV-002', date: '2026-05-11', patient: 'Sara Khan', medId: 3, qty: 2, total: 90, discount: 0, status: 'Paid' },
    { id: 3, invoice: 'INV-003', date: '2026-05-12', patient: 'Usman Malik', medId: 6, qty: 1, total: 85, discount: 5, status: 'Paid' },
    { id: 4, invoice: 'INV-004', date: '2026-05-13', patient: 'Fatima Bibi', medId: 7, qty: 2, total: 190, discount: 0, status: 'Paid' },
    { id: 5, invoice: 'INV-005', date: '2026-05-14', patient: 'Tariq Mehmood', medId: 1, qty: 5, total: 125, discount: 0, status: 'Paid' },
    { id: 6, invoice: 'INV-006', date: '2026-05-15', patient: 'Nadia Hussain', medId: 8, qty: 1, total: 120, discount: 0, status: 'Paid' },
  ],
  purchases: [
    { id: 1, po: 'PO-001', date: '2026-05-05', supplier: 'MedCo Pvt Ltd', medId: 1, qty: 100, price: 18, total: 1800, status: 'Received' },
    { id: 2, po: 'PO-002', date: '2026-05-07', supplier: 'PharmaCare', medId: 2, qty: 50, price: 240, total: 12000, status: 'Received' },
    { id: 3, po: 'PO-003', date: '2026-05-09', supplier: 'MedCo Pvt Ltd', medId: 3, qty: 200, price: 30, total: 6000, status: 'Received' },
    { id: 4, po: 'PO-004', date: '2026-05-11', supplier: 'Getz Pharma', medId: 7, qty: 100, price: 70, total: 7000, status: 'Pending' },
  ],
  saleReturns: [],
  purchaseReturns: [],
  bills: [
    {
      id: 1, invoice: 'BILL-001', patient: 'Rehman Sb', doctor: 'Dr. Imran', date: '2026-05-12',
      items: [
        { medId: 1, name: 'Panadol 500mg', qty: 2, mrp: 25, total: 50 },
        { medId: 3, name: 'Omeprazole 20mg', qty: 1, mrp: 45, total: 45 },
      ],
      subtotal: 95, discount: 0, total: 95, payment: 'Cash'
    },
  ],
  nextSaleId: 7,
  nextPurId: 5,
  nextBillId: 2,
  nextSRId: 1,
  nextPRId: 1,
  nextMedId: 11,
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
