// data/db.js

import { supabase } from '../utils/supabaseClient';

// ─── Categories ───────────────────────────────────────────────
export const CATEGORIES = [
  'Antibiotics',
  'Analgesics',
  'Antacids',
  'Antihistamines',
  'Antidiabetics',
  'Antihypertensives',
  'Vitamins & Supplements',
  'Cough & Cold',
  'Dermatology',
  'Eye / Ear Drops',
  'Injections',
  'Syrups',
  'Other',
];

// ─── Payment Modes ────────────────────────────────────────────
export const PAYMENT_MODES = ['Cash', 'Card', 'JazzCash', 'EasyPaisa', 'Bank Transfer', 'Credit'];

// ─── Helpers ──────────────────────────────────────────────────

// Returns today's date as YYYY-MM-DD string
export const today = new Date().toISOString().split('T')[0];

// Pads a number with leading zeros: padId(5, 6) => '000005'
export function padId(num, length = 6) {
  return String(num).padStart(length, '0');
}

export function formatPKR(amount) {
  if (amount == null) return '—';
  return 'PKR ' + Number(amount).toLocaleString('en-PK');
}

export function getMedStatus(med) {
  if (!med) return 'Unknown';
  const today = new Date();
  const expiry = new Date(med.expiry);
  if (expiry < today) return 'Expired';
  if (med.qty <= med.minStock) return 'Low Stock';
  return 'In Stock';
}

// ─── Load all data from Supabase ──────────────────────────────
export async function loadDB() {
  const [medsRes, salesRes, purchasesRes] = await Promise.all([
    supabase.from('medicines').select('*').order('name'),
    supabase.from('sales').select('*').order('date', { ascending: false }),
    supabase.from('purchases').select('*').order('date', { ascending: false }),
  ]);

  if (medsRes.error) throw medsRes.error;
  if (salesRes.error) throw salesRes.error;
  if (purchasesRes.error) throw purchasesRes.error;

  // Map snake_case DB columns → camelCase for frontend
  const medicines = medsRes.data.map(m => ({
    id: m.id,
    name: m.name,
    category: m.category,
    barcode: m.barcode || '',
    batch: m.batch || '',
    expiry: m.expiry,
    qty: m.qty,
    mrp: m.mrp,
    pp: m.pp,
    mfr: m.mfr || '',
    minStock: m.min_stock ?? 10,
  }));

  const sales = salesRes.data.map(s => ({
    id: s.id,
    invoice: s.invoice,
    date: s.date,
    patient: s.patient,
    medId: s.med_id,
    qty: s.qty,
    total: s.total,
    discount: s.discount ?? 0,
    status: s.status,
  }));

  const purchases = purchasesRes.data.map(p => ({
    id: p.id,
    po: p.po,
    date: p.date,
    supplier: p.supplier,
    medId: p.med_id,
    qty: p.qty,
    price: p.price,
    total: p.total,
    status: p.status,
  }));

  return { medicines, sales, purchases };
}
