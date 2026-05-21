import { openDatabase } from './sqlcipher';
import * as SQLite from 'expo-sqlite';
import { supabase } from '../services/supabaseClient';

export class OutboxSyncEngine {
  private isSyncing = false;
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize() {
    this.db = await openDatabase();
  }

  async syncPendingTransactions() {
    if (this.isSyncing || !this.db) return;
    
    try {
      this.isSyncing = true;
      const pendingTx = await this.db.getAllAsync("SELECT * FROM financial_transactions WHERE sync_status = 'PENDING'");
      
      if (pendingTx.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(`[SYNC ENGINE] Mengirim ${pendingTx.length} transaksi tertunda ke Supabase...`);

      // Memformat data agar sesuai dengan skema PostgreSQL Supabase
      const payload = (pendingTx as any[]).map(tx => {
        // Konversi format tanggal lokal DD/MM/YYYY ke format ISO standard untuk PostgreSQL
        let formattedDate = tx.transaction_date;
        const dateParts = tx.transaction_date.split('/');
        if (dateParts.length === 3) {
          const day = dateParts[0].padStart(2, '0');
          const month = dateParts[1].padStart(2, '0');
          const year = dateParts[2];
          formattedDate = `${year}-${month}-${day}T00:00:00.000Z`;
        }

        return {
          id: tx.id,
          transaction_date: formattedDate,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          platform: tx.platform || 'Offline',
          admin_fee: tx.admin_fee || 0,
          cogs: tx.cogs || 0
        };
      });

      // Kirim batch data menggunakan bulk upsert ke Supabase
      const { error } = await supabase
        .from('financial_transactions')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        throw error;
      }

      // Update status lokal secara massal menggunakan transaction block demi performa tinggi
      await this.db.withTransactionAsync(async () => {
        for (const tx of pendingTx as any[]) {
          await this.db!.runAsync(
            "UPDATE financial_transactions SET sync_status = 'SYNCED' WHERE id = ?",
            [tx.id]
          );
        }
      });
      
      console.log('[SYNC ENGINE] Sinkronisasi berhasil.');
    } catch (error) {
      console.error("[SYNC ENGINE] Gagal menyinkronkan data:", error);
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncEngine = new OutboxSyncEngine();
