import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Keyboard, Alert, Share } from 'react-native';
import { executeQuery, fetchQuery } from '../db/sqlcipher';
import { useFinancialStore } from '../stores/financialStore';
import { Wallet, CreditCard, ActivitySquare, CheckCheck, Share2 } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

interface SnapshotData {
  kas_bisnis: string;
  piutang: string;
  stok_gudang: string;
  peralatan: string;
  pinjaman: string;
  utang_supplier: string;
  reseller_aktif: string;
  pesanan_bulan: string;
  tujuan_bisnis: string;
}

const emptySnapshot: SnapshotData = {
  kas_bisnis: '', piutang: '', stok_gudang: '', peralatan: '',
  pinjaman: '', utang_supplier: '', reseller_aktif: '', pesanan_bulan: '', tujuan_bisnis: ''
};

/* ─────────────────────────────────────────────────────────────
 * StableInput — Memoized, self-contained input component.
 *
 * WHY THIS ARCHITECTURE:
 * On Android, when a parent re-renders while a TextInput is
 * gaining focus, React Native's native bridge can DROP or
 * STEAL the focus to another input. This creates the
 * "pindah-pindah" loop the user experienced.
 *
 * By making each input a React.memo component with its own
 * internal isFocused state, a focus event in Input A does NOT
 * cause Input B, C, D... to re-render. The parent only
 * re-renders when the VALUE changes (via onUpdate), and even
 * then, React.memo prevents unchanged siblings from updating.
 * ───────────────────────────────────────────────────────────── */
interface StableInputProps {
  fieldKey: string;
  label: string;
  value: string;
  placeholder: string;
  isCurrency: boolean;
  onUpdate: (fieldKey: string, value: string) => void;
}

const StableInput = memo(function StableInput({
  fieldKey,
  label,
  value,
  placeholder,
  isCurrency,
  onUpdate,
}: StableInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChangeText = useCallback(
    (text: string) => {
      onUpdate(fieldKey, text);
    },
    [fieldKey, onUpdate]
  );

  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
        {isCurrency && <Text style={styles.inputPrefix}>Rp</Text>}
        <TextInput
          style={styles.inputField}
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.2)"
          keyboardType="numeric"
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          blurOnSubmit={false}
        />
      </View>
    </View>
  );
});

export default function MonthlySnapshot() {
  const [data, setData] = useState<SnapshotData>(emptySnapshot);

  const handleExport = async () => {
    const transactions = useFinancialStore.getState().transactions;
    if (!transactions || transactions.length === 0) {
      Alert.alert('Perhatian ⚠️', 'Tidak ada data transaksi di Buku Kas untuk diekspor!');
      return;
    }

    try {
      const csvHeaders = 'Tanggal,Keterangan,Tipe,Nominal,Biaya Admin,HPP,Kategori,Platform\n';
      const csvRows = transactions.map(t => {
        const cleanDesc = t.description ? t.description.replace(/"/g, '""').replace(/\n/g, ' ') : '';
        const cleanCat = t.category ? t.category.replace(/"/g, '""') : '';
        const cleanPlat = t.platform ? t.platform.replace(/"/g, '""') : 'Offline';
        return `"${t.date}","${cleanDesc}","${t.type}",${t.amount},${t.admin_fee || 0},${t.cogs || 0},"${cleanCat}","${cleanPlat}"`;
      }).join('\n');

      const csvContent = csvHeaders + csvRows;

      // Buat file fisik di penyimpanan temporer lokal aplikasi (.csv)
      const fileUri = FileSystem.cacheDirectory + 'Laporan_Buku_Kas_Quantelos.csv';
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: 'utf8',
      });

      // Bagikan file fisik asli menggunakan expo-sharing
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Unduh & Ekspor Laporan Keuangan Quantelos',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        // Fallback jika sharing file tidak didukung
        await Share.share({
          message: csvContent,
          title: 'Buku Kas Quantelos CFO',
        });
      }
    } catch (error: any) {
      Alert.alert('Gagal Ekspor ⚠️', error.message);
    }
  };

  const [currentPeriod] = useState(() => {
    const now = new Date();
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  });

  const formatNumber = useCallback((text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(numericValue, 10));
  }, []);

  useEffect(() => {
    loadSnapshot();
  }, []);

  const loadSnapshot = async () => {
    try {
      const rows = await fetchQuery(
        `SELECT * FROM monthly_snapshots WHERE period = ? LIMIT 1`, [currentPeriod]
      );
      if ((rows as any[]).length > 0) {
        const row = (rows as any[])[0];
        setData({
          kas_bisnis: row.kas_bisnis ? formatNumber(String(row.kas_bisnis)) : '',
          piutang: row.piutang ? formatNumber(String(row.piutang)) : '',
          stok_gudang: row.stok_gudang ? formatNumber(String(row.stok_gudang)) : '',
          peralatan: row.peralatan ? formatNumber(String(row.peralatan)) : '',
          pinjaman: row.pinjaman ? formatNumber(String(row.pinjaman)) : '',
          utang_supplier: row.utang_supplier ? formatNumber(String(row.utang_supplier)) : '',
          reseller_aktif: row.reseller_aktif ? String(row.reseller_aktif) : '',
          pesanan_bulan: row.pesanan_bulan ? String(row.pesanan_bulan) : '',
          tujuan_bisnis: row.tujuan_bisnis || '',
        });
      }
    } catch (e) {
      console.error('[Snapshot] Load error:', e);
    }
  };

  const handleSave = async () => {
    try {
      const parse = (v: string) => parseFloat(v.replace(/\./g, '')) || 0;
      
      await executeQuery(`DELETE FROM monthly_snapshots WHERE period = ?`, [currentPeriod]);
      await executeQuery(
        `INSERT INTO monthly_snapshots (id, period, kas_bisnis, piutang, stok_gudang, peralatan, pinjaman, utang_supplier, reseller_aktif, pesanan_bulan, tujuan_bisnis) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Date.now().toString(), currentPeriod,
          parse(data.kas_bisnis), parse(data.piutang), parse(data.stok_gudang),
          parse(data.peralatan), parse(data.pinjaman), parse(data.utang_supplier),
          parseInt(data.reseller_aktif) || 0, parseInt(data.pesanan_bulan) || 0,
          data.tujuan_bisnis
        ]
      );
      await useFinancialStore.getState().loadLatestSnapshot();
      
      Keyboard.dismiss();
      Alert.alert('✅ Sinkronisasi Selesai', `Data keuangan bulan ${currentPeriod} telah difinalisasi ke Buku Besar Induk.`);
    } catch (e) {
      console.error('[Snapshot] Save error:', e);
    }
  };

  /* ─────────────────────────────────────────────────────────
   * CRITICAL: useCallback with STABLE reference.
   * This single callback is shared by ALL StableInput instances.
   * Because it uses the functional form of setData (prev => ...),
   * it does NOT depend on `data` and thus NEVER changes identity.
   * This is what makes React.memo actually work.
   * ───────────────────────────────────────────────────────── */
  const handleFieldUpdate = useCallback((fieldKey: string, rawValue: string) => {
    const numericValue = rawValue.replace(/[^0-9]/g, '');
    const formatted = numericValue
      ? new Intl.NumberFormat('id-ID').format(parseInt(numericValue, 10))
      : '';
    setData(prev => ({ ...prev, [fieldKey]: formatted }));
  }, []);

  const handleTextFieldUpdate = useCallback((fieldKey: string, value: string) => {
    setData(prev => ({ ...prev, [fieldKey]: value }));
  }, []);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.title}>Laporan Data Bulanan</Text>
        <Text style={styles.subtitle}>
          Sinkronisasi aset, kewajiban, dan metrik operasional ke buku besar utama untuk periode {currentPeriod}.
        </Text>
      </View>

      {/* Aset Section */}
      <View style={[styles.card, styles.cardAsset]}>
        <View style={styles.cardHeader}>
          <Wallet color="#4EDEA3" size={24} />
          <Text style={styles.cardTitle}>Pembaruan Aset</Text>
        </View>
        <StableInput fieldKey="stok_gudang" label="Stok Gudang" value={data.stok_gudang} placeholder="0" isCurrency={true} onUpdate={handleFieldUpdate} />
        <StableInput fieldKey="piutang" label="Piutang Usaha" value={data.piutang} placeholder="0" isCurrency={true} onUpdate={handleFieldUpdate} />
        <StableInput fieldKey="kas_bisnis" label="Kas Bisnis (Rekening)" value={data.kas_bisnis} placeholder="0" isCurrency={true} onUpdate={handleFieldUpdate} />
        <StableInput fieldKey="peralatan" label="Aset Peralatan & Inventaris" value={data.peralatan} placeholder="0" isCurrency={true} onUpdate={handleFieldUpdate} />
      </View>

      {/* Kewajiban Section */}
      <View style={[styles.card, styles.cardLiability]}>
        <View style={styles.cardHeader}>
          <CreditCard color="#FFB4AB" size={24} />
          <Text style={styles.cardTitle}>Kewajiban & Liabilitas</Text>
        </View>
        <StableInput fieldKey="utang_supplier" label="Utang Supplier" value={data.utang_supplier} placeholder="0" isCurrency={true} onUpdate={handleFieldUpdate} />
        <StableInput fieldKey="pinjaman" label="Utang Bank" value={data.pinjaman} placeholder="0" isCurrency={true} onUpdate={handleFieldUpdate} />
      </View>

      {/* Metrik Operasional */}
      <View style={[styles.card, styles.cardMetrics]}>
        <View style={styles.cardHeader}>
          <ActivitySquare color="#4CD7F6" size={24} />
          <Text style={styles.cardTitle}>Metrik Operasional</Text>
        </View>
        <StableInput fieldKey="reseller_aktif" label="Jumlah Reseller Aktif" value={data.reseller_aktif} placeholder="0" isCurrency={false} onUpdate={handleTextFieldUpdate} />
        <StableInput fieldKey="pesanan_bulan" label="Total Pesanan Bulan Ini" value={data.pesanan_bulan} placeholder="0" isCurrency={false} onUpdate={handleTextFieldUpdate} />
      </View>

      {/* Memo */}
      <View style={styles.memoSection}>
        <Text style={styles.inputLabel}>Business Target Memo</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Catatan strategis, deviasi target, atau proyeksi bulan depan..."
          placeholderTextColor="rgba(255, 255, 255, 0.2)"
          multiline
          value={data.tujuan_bisnis}
          onChangeText={(v) => setData(prev => ({ ...prev, tujuan_bisnis: v }))}
          blurOnSubmit={false}
        />
      </View>

      {/* Action Button */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
        <CheckCheck color="#131318" size={24} />
        <Text style={styles.saveBtnText}>Finalisasi Laporan Bulanan</Text>
      </TouchableOpacity>

      {/* Quantelos Export Panel */}
      <View style={styles.exportCard}>
        <Text style={styles.exportTitle}>🧪 EKSPOR BUKU KAS</Text>
        <Text style={styles.exportDesc}>
          Unduh laporan transaksi langsung ke penyimpanan hp Anda (melalui menu 'Simpan ke File') atau bagikan ke WhatsApp/Email dalam format CSV (.csv) yang kompatibel dengan Microsoft Excel & Google Sheets.
        </Text>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.8}>
          <Share2 color="#4CD7F6" size={20} />
          <Text style={styles.exportBtnText}>Unduh & Ekspor (.csv)</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E4E1E9',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#958EA0',
    lineHeight: 22,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardAsset: {
    borderLeftWidth: 4,
    borderLeftColor: '#4EDEA3',
  },
  cardLiability: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFB4AB',
  },
  cardMetrics: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CD7F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E4E1E9',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#958EA0',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputContainerFocused: {
    borderColor: '#4CD7F6',
    backgroundColor: 'rgba(76, 215, 246, 0.05)',
  },
  inputPrefix: {
    fontSize: 14,
    fontWeight: '600',
    color: '#958EA0',
    marginRight: 12,
  },
  inputField: {
    flex: 1,
    color: '#E4E1E9',
    fontSize: 16,
    fontWeight: '600',
    height: '100%',
  },
  memoSection: {
    marginBottom: 32,
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    color: '#E4E1E9',
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#D0BCFF',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#D0BCFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  saveBtnText: {
    color: '#131318',
    fontSize: 16,
    fontWeight: '800',
  },
  exportCard: {
    marginTop: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
  },
  exportTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4CD7F6',
    letterSpacing: 1,
    marginBottom: 8,
  },
  exportDesc: {
    color: '#958EA0',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(76, 215, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(76, 215, 246, 0.25)',
    paddingVertical: 14,
    borderRadius: 12,
  },
  exportBtnText: {
    color: '#4CD7F6',
    fontSize: 14,
    fontWeight: '700',
  }
});
