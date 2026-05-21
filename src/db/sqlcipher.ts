import * as SQLite from 'expo-sqlite';
import { SCHEMA } from './schema';

let dbInstance: SQLite.SQLiteDatabase | null = null;

// Membuka database SQLite standar (Cepat dan dioptimalkan untuk pemakaian pribadi)
export const openDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('zeta_cfo.db');
  }
  return dbInstance;
};

// Fungsi inisialisasi tabel saat startup
export const initDatabase = async () => {
  try {
    const db = await openDatabase();
    await db.execAsync(SCHEMA);
    
    // Migrasi Profesional: Menambahkan kolom 'category' ke tabel lama
    // Blok ini menangkap error secara senyap jika kolom sudah ada (tidak akan merusak flow)
    try {
      await db.execAsync(`ALTER TABLE financial_transactions ADD COLUMN category TEXT NOT NULL DEFAULT 'Lainnya';`);
      console.log('[SQLite] Migrasi Sukses: Kolom category berhasil disuntikkan ke tabel lama.');
    } catch (migError) {
      // Abaikan jika kolom sudah ada
    }

    // Migrasi E-Commerce (Fase 11)
    try { await db.execAsync(`ALTER TABLE financial_transactions ADD COLUMN platform TEXT DEFAULT 'Offline';`); } catch (e) {}
    try { await db.execAsync(`ALTER TABLE financial_transactions ADD COLUMN admin_fee REAL DEFAULT 0;`); } catch (e) {}
    try { await db.execAsync(`ALTER TABLE financial_transactions ADD COLUMN cogs REAL DEFAULT 0;`); } catch (e) {}

    console.log('[SQLite] Tabel Master Akuntansi berhasil divalidasi/diinisialisasi.');
  } catch (error) {
    console.error('[SQLite] Gagal menginisialisasi tabel:', error);
  }
};

export const executeQuery = async (query: string, params: any[] = []) => {
  const db = await openDatabase();
  return await db.runAsync(query, params);
};

export const fetchQuery = async (query: string, params: any[] = []) => {
  const db = await openDatabase();
  return await db.getAllAsync(query, params);
};

export const getAppSetting = async (key: string): Promise<string | null> => {
  try {
    const rows = await fetchQuery('SELECT value FROM app_settings WHERE key = ? LIMIT 1', [key]);
    if ((rows as any[]).length > 0) {
      return (rows as any[])[0].value;
    }
    return null;
  } catch (e) {
    console.error('Error getAppSetting:', e);
    return null;
  }
};

export async function setAppSetting(key: string, value: string) {
  try {
    const db = await openDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);`,
      [key, value]
    );
  } catch (error) {
    console.error('Error saving app setting:', error);
  }
}

/**
 * ⚠️ DEVELOPER ONLY: Completely wipes the local database to factory settings.
 * Useful for testing the onboarding flow.
 */
export async function dangerouslyResetDatabase() {
  const db = await openDatabase();
  const tables = ['financial_transactions', 'monthly_snapshots', 'app_settings'];
  for (const table of tables) {
    try {
      await db.runAsync(`DELETE FROM ${table};`);
      console.log(`[RESET] Cleared table: ${table}`);
    } catch (e) {
      console.warn(`[RESET] Skipped table ${table} (may not exist)`);
    }
  }
  console.log('Database factory reset successful!');
}
