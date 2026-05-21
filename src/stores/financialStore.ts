import { create } from 'zustand';
import { executeQuery, fetchQuery } from '../db/sqlcipher';
import { syncEngine } from '../db/sync';

export interface FinancialTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'CAPITAL';
  category: string;
  platform: string;
  admin_fee: number;
  cogs: number;
}

export interface MonthlySnapshotData {
  id: string;
  period: string;
  kas_bisnis: number;
  piutang: number;
  stok_gudang: number;
  peralatan: number;
  pinjaman: number;
  utang_supplier: number;
  reseller_aktif: number;
  pesanan_bulan: number;
  tujuan_bisnis: string;
}

interface FinancialState {
  transactions: FinancialTransaction[];
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  totalGrossIncome: number;
  totalAdminFees: number;
  totalCogs: number;
  grossProfit: number;
  totalOpex: number;
  netProfit: number;
  opexByCategory: Record<string, number>;
  latestSnapshot: MonthlySnapshotData | null;
  addTransaction: (tx: FinancialTransaction) => Promise<void>;
  loadTransactions: () => Promise<void>;
  loadLatestSnapshot: () => Promise<void>;
}

export const useFinancialStore = create<FinancialState>((set) => ({
  transactions: [],
  totalBalance: 0,
  totalIncome: 0,
  totalExpense: 0,
  totalGrossIncome: 0,
  totalAdminFees: 0,
  totalCogs: 0,
  grossProfit: 0,
  totalOpex: 0,
  netProfit: 0,
  opexByCategory: {},
  latestSnapshot: null,
  
  addTransaction: async (tx) => {
    try {
      await executeQuery(
        `INSERT INTO financial_transactions (id, transaction_date, description, amount, type, category, platform, admin_fee, cogs, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tx.id, tx.date, tx.description, tx.amount, tx.type, tx.category, tx.platform, tx.admin_fee, tx.cogs, 'PENDING']
      );

      // Memicu sinkronisasi latar belakang ke Supabase secara aman
      syncEngine.syncPendingTransactions().catch(err => 
        console.log('[Sync Engine AddTransaction Trigger Error]', err)
      );
      
      set((state) => {
        const newTxs = [tx, ...state.transactions];
        
        // Pemisahan Uang Modal (Tidak masuk perhitungan penjualan)
        const capitals = newTxs.filter(t => t.type === 'CAPITAL').reduce((sum, t) => sum + t.amount, 0);

        // E-Commerce Calculations
        const incomes = newTxs.filter(t => t.type === 'INCOME');
        const grossIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
        const adminFees = incomes.reduce((sum, t) => sum + t.admin_fee, 0);
        const cogs = incomes.reduce((sum, t) => sum + t.cogs, 0);
        
        // OPEX = Seluruh pengeluaran operasional
        const expenses = newTxs.filter(t => t.type === 'EXPENSE');
        const opex = expenses.reduce((sum, t) => sum + t.amount, 0);
        
        // OPEX Breakdown per Kategori
        const opexByCat: Record<string, number> = {};
        expenses.forEach(t => {
          opexByCat[t.category] = (opexByCat[t.category] || 0) + t.amount;
        });
        
        // P&L Waterfall: Revenue → Gross Profit → Net Profit
        const netSettlement = grossIncome - adminFees;
        const gProfit = netSettlement - cogs;
        const nProfit = gProfit - opex;

        return {
          transactions: newTxs,
          totalGrossIncome: grossIncome,
          totalAdminFees: adminFees,
          totalCogs: cogs,
          totalIncome: netSettlement,
          totalExpense: opex,
          totalOpex: opex,
          grossProfit: gProfit,
          totalBalance: netSettlement + capitals - opex,
          netProfit: nProfit,
          opexByCategory: opexByCat
        };
      });
    } catch (error) {
      console.error('[Zustand] Gagal merekam transaksi:', error);
    }
  },
  
  loadTransactions: async () => {
    try {
      // ORDER BY DESC agar transaksi terbaru tampil paling atas di Riwayat
      const rows = await fetchQuery(`SELECT * FROM financial_transactions ORDER BY transaction_date DESC`);
      
      const loadedTxs: FinancialTransaction[] = (rows as any[]).map(row => ({
        id: row.id,
        date: row.transaction_date,
        description: row.description,
        amount: row.amount,
        type: row.type,
        category: row.category || 'Lainnya',
        platform: row.platform || 'Offline',
        admin_fee: row.admin_fee || 0,
        cogs: row.cogs || 0
      }));

      // Pemisahan Uang Modal (Tidak masuk perhitungan penjualan)
      const capitals = loadedTxs.filter(t => t.type === 'CAPITAL').reduce((sum, t) => sum + t.amount, 0);

      // E-Commerce Calculations
      const incomes = loadedTxs.filter(t => t.type === 'INCOME');
      const grossIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
      const adminFees = incomes.reduce((sum, t) => sum + t.admin_fee, 0);
      const cogs = incomes.reduce((sum, t) => sum + t.cogs, 0);
      
      // OPEX = Seluruh pengeluaran operasional
      const expenses = loadedTxs.filter(t => t.type === 'EXPENSE');
      const opex = expenses.reduce((sum, t) => sum + t.amount, 0);
      
      // OPEX Breakdown per Kategori
      const opexByCat: Record<string, number> = {};
      expenses.forEach(t => {
        opexByCat[t.category] = (opexByCat[t.category] || 0) + t.amount;
      });
      
      // P&L Waterfall
      const netSettlement = grossIncome - adminFees;
      const gProfit = netSettlement - cogs;
      const nProfit = gProfit - opex;
      
      set({ 
        transactions: loadedTxs, 
        totalGrossIncome: grossIncome,
        totalAdminFees: adminFees,
        totalCogs: cogs,
        totalIncome: netSettlement,
        totalExpense: opex,
        totalOpex: opex,
        grossProfit: gProfit,
        totalBalance: netSettlement + capitals - opex,
        netProfit: nProfit,
        opexByCategory: opexByCat
      });
    } catch (error) {
      console.error('[Zustand] Gagal memuat brankas lokal:', error);
    }
  },

  loadLatestSnapshot: async () => {
    try {
      // Ambil snapshot terbaru berdasarkan waktu pembuatan
      const rows = await fetchQuery(`SELECT * FROM monthly_snapshots ORDER BY created_at DESC LIMIT 1`);
      if ((rows as any[]).length > 0) {
        const row = (rows as any[])[0];
        set({
          latestSnapshot: {
            id: row.id,
            period: row.period,
            kas_bisnis: row.kas_bisnis || 0,
            piutang: row.piutang || 0,
            stok_gudang: row.stok_gudang || 0,
            peralatan: row.peralatan || 0,
            pinjaman: row.pinjaman || 0,
            utang_supplier: row.utang_supplier || 0,
            reseller_aktif: row.reseller_aktif || 0,
            pesanan_bulan: row.pesanan_bulan || 0,
            tujuan_bisnis: row.tujuan_bisnis || '',
          }
        });
      } else {
        set({ latestSnapshot: null });
      }
    } catch (error) {
      console.error('[Zustand] Gagal memuat snapshot bulanan:', error);
    }
  }
}));
