import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, Alert } from 'react-native';
import { useFinancialStore } from '../stores/financialStore';
import HPPCalculatorModal from './HPPCalculatorModal';

export default function TransactionForm() {
  const addTransaction = useFinancialStore((state) => state.addTransaction);
  
  const [type, setType] = useState<'INCOME' | 'EXPENSE' | 'CAPITAL'>('INCOME');
  const [amount, setAmount] = useState('');
  const [adminFee, setAdminFee] = useState('');
  const [cogs, setCogs] = useState('');
  const [isHPPCalcVisible, setIsHPPCalcVisible] = useState(false);
  
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Penjualan Retail');
  const [platform, setPlatform] = useState('Offline');

  const categories = type === 'INCOME' 
    ? ['Penjualan Retail', 'Penjualan Grosir', 'Lainnya']
    : ['Iklan', 'Gaji Tim', 'Sewa & Utilitas', 'Software', 'Packaging', 'Lainnya'];
  const platforms = ['Offline', 'Shopee', 'Tokopedia', 'TikTok', 'Reseller'];

  const formatNumber = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(numericValue, 10));
  };

  const handleSave = async () => {
    if (!amount) {
      Alert.alert('Perhatian ⚠️', 'Nominal transaksi tidak boleh kosong! Anda harus mengisi jumlah uang.');
      return;
    }
    if (!description) {
      Alert.alert('Perhatian ⚠️', 'Detail keterangan wajib diisi! Ini penting agar AI dapat membaca histori pengeluaran/pemasukan Anda dengan akurat.');
      return;
    }

    // Bersihkan titik format ribuan sebelum masuk ke mesin hitung
    const rawAmount = parseFloat(amount.replace(/\./g, '')) || 0;
    const rawAdminFee = parseFloat(adminFee.replace(/\./g, '')) || 0;
    const rawCogs = parseFloat(cogs.replace(/\./g, '')) || 0;

    await addTransaction({
      id: Date.now().toString(), // Solusi permanen mencegah bug _$undefined
      amount: rawAmount,
      type,
      description,
      category: type === 'CAPITAL' ? 'Modal Awal' : category,
      platform: type === 'INCOME' ? platform : 'Offline',
      admin_fee: type === 'INCOME' ? rawAdminFee : 0,
      cogs: type === 'INCOME' ? rawCogs : 0,
      date: new Date().toLocaleDateString('id-ID'),
    });

    setAmount('');
    setAdminFee('');
    setCogs('');
    setDescription('');
    Keyboard.dismiss();
    
    // Memberikan jeda waktu (timeout) 300ms agar animasi penutupan Keyboard selesai.
    // Jika Alert dipanggil bersamaan dengan Keyboard.dismiss() di Android, Alert seringkali tidak muncul (dibatalkan oleh sistem).
    setTimeout(() => {
      Alert.alert('Sukses ✅', 'Transaksi berhasil disimpan ke Buku Kas!');
    }, 300);
  };

  return (
    <View style={styles.formContainer}>
      
      {/* Segmented Control (Tri-Type) */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segmentBtn, type === 'INCOME' && styles.segmentActive]}
          onPress={() => setType('INCOME')}
        >
          <Text style={[styles.segmentTxt, type === 'INCOME' && styles.segmentTxtActive]}>Uang Masuk</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, type === 'EXPENSE' && styles.segmentActive]}
          onPress={() => setType('EXPENSE')}
        >
          <Text style={[styles.segmentTxt, type === 'EXPENSE' && styles.segmentTxtActive]}>Uang Keluar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, type === 'CAPITAL' && styles.segmentActive]}
          onPress={() => setType('CAPITAL')}
        >
          <Text style={[styles.segmentTxt, type === 'CAPITAL' && styles.segmentTxtActive]}>Modal Awal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>NOMINAL</Text>
        <View style={styles.glassInputLarge}>
          <Text style={styles.currencyLarge}>Rp</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor="rgba(203, 195, 215, 0.3)"
            keyboardType="numeric"
            value={amount}
            onChangeText={(text) => setAmount(formatNumber(text))}
          />
        </View>
      </View>

      {type === 'INCOME' && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SUMBER PLATFORM</Text>
            <View style={styles.chipContainer}>
              {platforms.map((plat) => (
                <TouchableOpacity 
                  key={plat}
                  style={[styles.chip, platform === plat && styles.chipActive]}
                  onPress={() => setPlatform(plat)}
                >
                  <Text style={[styles.chipText, platform === plat && styles.chipTextActive]}>{plat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {platform !== 'Offline' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>BIAYA ADMIN MARKETPLACE</Text>
              <View style={styles.glassInput}>
                <Text style={styles.currencySmall}>Rp</Text>
                <TextInput
                  style={styles.subAmountInput}
                  placeholder="0"
                  placeholderTextColor="rgba(203, 195, 215, 0.3)"
                  keyboardType="numeric"
                  value={adminFee}
                  onChangeText={(text) => setAdminFee(formatNumber(text))}
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>HPP PER PRODUK</Text>
              <TouchableOpacity onPress={() => setIsHPPCalcVisible(true)}>
                <Text style={styles.editLink}>🧪 Kalkulator Formula</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.glassInput}>
              <Text style={styles.currencySmall}>Rp</Text>
              <TextInput
                style={styles.subAmountInput}
                placeholder="0"
                placeholderTextColor="rgba(203, 195, 215, 0.3)"
                keyboardType="numeric"
                value={cogs}
                onChangeText={(text) => setCogs(formatNumber(text))}
              />
            </View>
          </View>
        </>
      )}

      {type !== 'CAPITAL' && (
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>KATEGORI OTOMATIS</Text>
            <Text style={styles.editLink}>edit</Text>
          </View>
          <View style={styles.chipContainer}>
            {categories.map((cat, idx) => {
              // Simulated dot colors based on index
              const dotColors = ['#4EDEA3', '#4CD7F6', '#FFB4AB', '#D0BCFF', '#FFD166'];
              const dotColor = dotColors[idx % dotColors.length];
              
              return (
                <TouchableOpacity 
                  key={cat}
                  style={[styles.chipDark, category === cat && styles.chipDarkActive]}
                  onPress={() => setCategory(cat)}
                >
                  <View style={[styles.categoryDot, {backgroundColor: dotColor}]} />
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>KETERANGAN (OPSIONAL)</Text>
        <View style={[styles.glassInput, {paddingVertical: 12}]}>
          <TextInput
            style={styles.textArea}
            placeholder="Catatan transaksi..."
            placeholderTextColor="rgba(203, 195, 215, 0.3)"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
        <Text style={styles.saveButtonText}>Simpan Transaksi</Text>
      </TouchableOpacity>

      <HPPCalculatorModal
        visible={isHPPCalcVisible}
        onClose={() => setIsHPPCalcVisible(false)}
        onApply={(calculatedCOGS) => setCogs(formatNumber(calculatedCOGS.toString()))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120, // Bantalan raksasa agar tombol FAB tidak menutupi form bawah
    backgroundColor: 'transparent',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#35343A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: 'rgba(160, 120, 255, 0.2)', // primary-container/20
    borderWidth: 1,
    borderColor: 'rgba(208, 188, 255, 0.3)',
    shadowColor: 'rgba(208, 188, 255, 0.2)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  segmentTxt: {
    color: '#CBC3D7',
    fontWeight: '600',
    fontSize: 14,
  },
  segmentTxtActive: {
    color: '#D0BCFF',
    fontWeight: '700',
  },
  
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#958EA0',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  editLink: {
    color: '#D0BCFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  glassInputLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  currencyLarge: {
    fontSize: 36,
    fontWeight: '700',
    color: '#D0BCFF',
    marginRight: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '900',
    color: '#E4E1E9',
    textAlign: 'right',
    paddingVertical: 0,
  },
  
  glassInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  currencySmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBC3D7',
    marginRight: 12,
  },
  subAmountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#E4E1E9',
    textAlign: 'right',
    paddingVertical: 0,
  },
  textArea: {
    flex: 1,
    color: '#E4E1E9',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#494454',
    backgroundColor: '#1F1F25', // surface-container
  },
  chipActive: {
    borderColor: 'rgba(208, 188, 255, 0.4)',
    backgroundColor: 'rgba(208, 188, 255, 0.1)',
    shadowColor: 'rgba(208, 188, 255, 0.1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  chipText: {
    color: '#CBC3D7',
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#D0BCFF',
    fontWeight: '600',
  },
  
  chipDark: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(73, 68, 84, 0.5)', // outline-variant/50
    backgroundColor: '#2A292F', // surface-container-high
  },
  chipDarkActive: {
    borderColor: 'rgba(208, 188, 255, 0.4)',
    backgroundColor: 'rgba(208, 188, 255, 0.15)',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  
  saveButton: {
    backgroundColor: '#D0BCFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#D0BCFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  saveButtonText: {
    color: '#3C0091',
    fontSize: 18,
    fontWeight: '700',
  }
});
