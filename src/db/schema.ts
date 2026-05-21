export const SCHEMA = `
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_transactions (
    id TEXT PRIMARY KEY,
    transaction_date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0.00,
    type TEXT NOT NULL DEFAULT 'EXPENSE',
    category TEXT NOT NULL DEFAULT 'Lainnya',
    platform TEXT DEFAULT 'Offline',
    admin_fee REAL DEFAULT 0,
    cogs REAL DEFAULT 0,
    sync_status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monthly_snapshots (
    id TEXT PRIMARY KEY,
    period TEXT NOT NULL,
    kas_bisnis REAL DEFAULT 0,
    piutang REAL DEFAULT 0,
    stok_gudang REAL DEFAULT 0,
    peralatan REAL DEFAULT 0,
    pinjaman REAL DEFAULT 0,
    utang_supplier REAL DEFAULT 0,
    reseller_aktif INTEGER DEFAULT 0,
    pesanan_bulan INTEGER DEFAULT 0,
    tujuan_bisnis TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
`;
