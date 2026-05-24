import { create } from 'zustand';
import { supabase } from './supabase';

export const useStore = create((set, get) => ({
    // ─── State ───────────────────────────────────────────
    medicines: [],
    sales: [],
    purchases: [],
    bills: [],
    prescriptions: [],
    profiles: [],

    loading: {
        medicines: false,
        sales: false,
        purchases: false,
        bills: false,
        prescriptions: false,
        profiles: false,
    },

    lastFetched: {
        medicines: null,
        sales: null,
        purchases: null,
        bills: null,
        prescriptions: null,
        profiles: null,
    },

    // ─── Cache duration: 5 minutes ───────────────────────
    CACHE_MS: 5 * 60 * 1000,

    isFresh: (key) => {
        const last = get().lastFetched[key];
        if (!last) return false;
        return Date.now() - last < get().CACHE_MS;
    },

    // ─── Fetch functions ─────────────────────────────────
    fetchMedicines: async (force = false) => {
        if (!force && get().isFresh('medicines')) return;
        set(s => ({ loading: { ...s.loading, medicines: true } }));
        const { data } = await supabase.from('medicines').select('*').order('name');
        set(s => ({
            medicines: data || [],
            loading: { ...s.loading, medicines: false },
            lastFetched: { ...s.lastFetched, medicines: Date.now() },
        }));
    },

    fetchSales: async (force = false) => {
        if (!force && get().isFresh('sales')) return;
        set(s => ({ loading: { ...s.loading, sales: true } }));
        const { data } = await supabase.from('sales').select('*').order('date', { ascending: false });
        set(s => ({
            sales: data || [],
            loading: { ...s.loading, sales: false },
            lastFetched: { ...s.lastFetched, sales: Date.now() },
        }));
    },

    fetchPurchases: async (force = false) => {
        if (!force && get().isFresh('purchases')) return;
        set(s => ({ loading: { ...s.loading, purchases: true } }));
        const { data } = await supabase.from('purchases').select('*').order('date', { ascending: false });
        set(s => ({
            purchases: data || [],
            loading: { ...s.loading, purchases: false },
            lastFetched: { ...s.lastFetched, purchases: Date.now() },
        }));
    },

    fetchBills: async (force = false) => {
        if (!force && get().isFresh('bills')) return;
        set(s => ({ loading: { ...s.loading, bills: true } }));
        const { data } = await supabase.from('bills').select('*').order('created_at', { ascending: false });
        set(s => ({
            bills: data || [],
            loading: { ...s.loading, bills: false },
            lastFetched: { ...s.lastFetched, bills: Date.now() },
        }));
    },

    fetchPrescriptions: async (force = false) => {
        if (!force && get().isFresh('prescriptions')) return;
        set(s => ({ loading: { ...s.loading, prescriptions: true } }));
        const { data } = await supabase
            .from('prescriptions')
            .select('*, prescription_items(*)')
            .order('created_at', { ascending: false });
        set(s => ({
            prescriptions: data || [],
            loading: { ...s.loading, prescriptions: false },
            lastFetched: { ...s.lastFetched, prescriptions: Date.now() },
        }));
    },

    fetchProfiles: async (force = false) => {
        if (!force && get().isFresh('profiles')) return;
        set(s => ({ loading: { ...s.loading, profiles: true } }));
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        set(s => ({
            profiles: data || [],
            loading: { ...s.loading, profiles: false },
            lastFetched: { ...s.lastFetched, profiles: Date.now() },
        }));
    },

    // ─── Fetch all at once (for dashboard) ───────────────
    fetchAll: async (force = false) => {
        await Promise.all([
            get().fetchMedicines(force),
            get().fetchSales(force),
            get().fetchPurchases(force),
            get().fetchBills(force),
            get().fetchPrescriptions(force),
            get().fetchProfiles(force),
        ]);
    },

    // ─── Invalidate cache (call after add/edit/delete) ───
    invalidate: (key) => {
        set(s => ({
            lastFetched: { ...s.lastFetched, [key]: null }
        }));
    },

    invalidateAll: () => {
        set({
            lastFetched: {
                medicines: null, sales: null, purchases: null,
                bills: null, prescriptions: null, profiles: null,
            }
        });
    },
}));
