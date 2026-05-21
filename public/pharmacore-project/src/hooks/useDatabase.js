// src/hooks/useDatabase.js
// Real-time database hook - replaces static initialDB
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

function toAppMed(m) {
  return {
    id: m.id, name: m.name, category: m.category,
    barcode: m.barcode || '', batch: m.batch || '',
    expiry: m.expiry, qty: m.qty, mrp: parseFloat(m.mrp),
    pp: parseFloat(m.pp), mfr: m.mfr || '',
    minStock: m.min_stock,
  };
}

function toAppSale(s) {
  return {
    id: s.id, invoice: s.invoice, date: s.date,
    patient: s.patient, medId: s.med_id,
    qty: s.qty, total: parseFloat(s.total),
    discount: parseFloat(s.discount || 0), status: s.status,
  };
}

function toAppPurchase(p) {
  return {
    id: p.id, po: p.po, date: p.date,
    supplier: p.supplier, medId: p.med_id,
    qty: p.qty, price: parseFloat(p.price),
    total: parseFloat(p.total), status: p.status,
  };
}

export function useDatabase() {
  const [db, setDb] = useState({
    medicines: [], sales: [], purchases: [],
    bills: [], saleReturns: [],
    nextSaleId: 1, nextPurId: 1, nextBillId: 1,
    nextSRId: 1, nextMedId: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ── Initial fetch ──────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [medsRes, salesRes, purRes, billsRes] = await Promise.all([
        supabase.from('medicines').select('*').order('id'),
        supabase.from('sales').select('*').order('date', { ascending: false }),
        supabase.from('purchases').select('*').order('date', { ascending: false }),
        supabase.from('bills').select('*').order('date', { ascending: false }),
      ]);
      if (medsRes.error)  throw medsRes.error;
      if (salesRes.error) throw salesRes.error;
      if (purRes.error)   throw purRes.error;

      const medicines = medsRes.data.map(toAppMed);
      const sales     = salesRes.data.map(toAppSale);
      const purchases = purRes.data.map(toAppPurchase);
      const bills     = (billsRes.data || []);

      setDb({
        medicines, sales, purchases, bills, saleReturns: [],
        nextSaleId:  (sales.length     ? Math.max(...sales.map(s => s.id))     + 1 : 1),
        nextPurId:   (purchases.length ? Math.max(...purchases.map(p => p.id)) + 1 : 1),
        nextBillId:  (bills.length     ? Math.max(...bills.map(b => b.id))     + 1 : 1),
        nextMedId:   (medicines.length ? Math.max(...medicines.map(m => m.id)) + 1 : 1),
        nextSRId: 1,
      });
      setError(null);
    } catch (err) {
      console.error('DB fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Real-time subscriptions ────────────────────────────────────────
  useEffect(() => {
    const medSub = supabase.channel('medicines-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medicines' }, () => fetchAll())
      .subscribe();

    const saleSub = supabase.channel('sales-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => fetchAll())
      .subscribe();

    const purSub = supabase.channel('purchases-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, () => fetchAll())
      .subscribe();

    return () => {
      supabase.removeChannel(medSub);
      supabase.removeChannel(saleSub);
      supabase.removeChannel(purSub);
    };
  }, [fetchAll]);

  // ── updateDB: Supabase-powered ─────────────────────────────────────
  const updateDB = useCallback(async (updater) => {
    // Apply locally first (optimistic update)
    setDb(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      updater(next);
      return next;
    });
    // Then sync to Supabase
    await fetchAll();
  }, [fetchAll]);

  // ── DB API methods ─────────────────────────────────────────────────
  const addSale = useCallback(async (sale) => {
    const { error } = await supabase.from('sales').insert({
      invoice: sale.invoice, date: sale.date, patient: sale.patient,
      med_id: sale.medId, qty: sale.qty, total: sale.total,
      discount: sale.discount || 0, status: sale.status || 'Paid',
    });
    if (error) throw error;
    // Update medicine qty
    const med = db.medicines.find(m => m.id === sale.medId);
    if (med) {
      await supabase.from('medicines').update({ qty: med.qty - sale.qty }).eq('id', sale.medId);
    }
    await fetchAll();
  }, [db.medicines, fetchAll]);

  const addPurchase = useCallback(async (purchase) => {
    const { error } = await supabase.from('purchases').insert({
      po: purchase.po, date: purchase.date, supplier: purchase.supplier,
      med_id: purchase.medId, qty: purchase.qty,
      price: purchase.price, total: purchase.total,
      status: purchase.status || 'Pending',
    });
    if (error) throw error;
    await fetchAll();
  }, [fetchAll]);

  const updateMedicine = useCallback(async (id, updates) => {
    const dbUpdates = {};
    if (updates.qty       !== undefined) dbUpdates.qty        = updates.qty;
    if (updates.mrp       !== undefined) dbUpdates.mrp        = updates.mrp;
    if (updates.pp        !== undefined) dbUpdates.pp         = updates.pp;
    if (updates.expiry    !== undefined) dbUpdates.expiry     = updates.expiry;
    if (updates.minStock  !== undefined) dbUpdates.min_stock  = updates.minStock;
    if (updates.name      !== undefined) dbUpdates.name       = updates.name;
    if (updates.category  !== undefined) dbUpdates.category   = updates.category;
    const { error } = await supabase.from('medicines').update(dbUpdates).eq('id', id);
    if (error) throw error;
    await fetchAll();
  }, [fetchAll]);

  const addMedicine = useCallback(async (med) => {
    const { error } = await supabase.from('medicines').insert({
      name: med.name, category: med.category, barcode: med.barcode,
      batch: med.batch, expiry: med.expiry, qty: med.qty,
      mrp: med.mrp, pp: med.pp, mfr: med.mfr, min_stock: med.minStock,
    });
    if (error) throw error;
    await fetchAll();
  }, [fetchAll]);

  return { db, loading, error, updateDB, addSale, addPurchase, updateMedicine, addMedicine, refetch: fetchAll };
}