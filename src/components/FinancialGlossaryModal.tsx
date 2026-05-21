import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { X, BookA, AlertTriangle, Search, Lightbulb } from 'lucide-react-native';
import { dangerouslyResetDatabase } from '../db/sqlcipher';

interface GlossaryProps {
  visible: boolean;
  onClose: () => void;
}

const terms = [
  {
    title: 'Omzet Kotor (Gross Revenue)',
    badge: 'Pendapatan',
    badgeColor: '#4EDEA3',
    desc: 'Total seluruh uang yang masuk dari pelanggan sebelum dipotong biaya apapun (sebelum potong ongkir, admin marketplace, atau modal barang).',
    importance: 'Metrik utama untuk melihat seberapa besar volume bisnis Anda.'
  },
  {
    title: 'HPP (Harga Pokok Penjualan)',
    badge: 'COGS',
    badgeColor: '#FFB4AB',
    desc: 'Modal dasar untuk memproduksi barang yang laku terjual. Contoh: Harga beli botol kosong + cairan parfum.',
    importance: 'Tanpa mengetahui HPP, Anda tidak akan pernah tahu apakah Anda menjual barang dengan untung atau rugi.'
  },
  {
    title: 'Laba Kotor (Gross Profit)',
    badge: 'Profit',
    badgeColor: '#4CD7F6',
    desc: 'Omzet Kotor dikurangi Potongan Admin Marketplace dan dikurangi HPP (Modal Barang). Ini adalah keuntungan kotor murni dari produk Anda.',
    importance: 'Menunjukkan efisiensi produksi dan harga jual produk Anda.'
  },
  {
    title: 'OPEX (Biaya Operasional)',
    badge: 'Pengeluaran',
    badgeColor: '#FFB4AB',
    desc: 'Pengeluaran untuk menjalankan bisnis di luar modal barang. Contoh: Gaji karyawan, iklan, sewa ruko, langganan software kasir.',
    importance: 'OPEX yang tidak terkontrol adalah penyebab utama bisnis gulung tikar meski omzet besar.'
  },
  {
    title: 'Laba Bersih (Net Profit)',
    badge: 'Profit',
    badgeColor: '#D0BCFF',
    desc: 'Uang keuntungan paling bersih setelah Laba Kotor dipotong OPEX. Ini adalah uang riil yang masuk ke kantong bisnis (EBITDA).',
    importance: 'Inilah hasil keringat Anda yang sebenarnya, yang bisa dibagikan sebagai dividen atau diputar kembali.'
  },
  {
    title: 'Aset Lancar (Current Assets)',
    badge: 'Neraca',
    badgeColor: '#4EDEA3',
    desc: 'Harta bisnis yang bisa segera diuangkan (biasanya dalam 1 tahun). Terdiri dari: Uang Kas, Piutang, dan Stok Gudang.',
    importance: 'Menentukan apakah bisnis Anda punya "Nafas" untuk bayar utang bulan depan.'
  },
  {
    title: 'Kewajiban (Liabilities)',
    badge: 'Neraca',
    badgeColor: '#FFB4AB',
    desc: 'Seluruh utang yang harus dibayar oleh bisnis Anda. Terdiri dari utang ke supplier bahan baku atau pinjaman bank.',
    importance: 'Utang bisa menjadi tuas pertumbuhan (leverage) asalkan rasio terhadap aset masih sehat.'
  },
  {
    title: 'Ekuitas (Kekayaan Bersih)',
    badge: 'Neraca',
    badgeColor: '#D0BCFF',
    desc: 'Total seluruh Aset bisnis Anda dikurangi Total seluruh Utang Anda. Ini menunjukkan nilai sejati perusahaan Anda saat ini.',
    importance: 'Metrik ultimat yang menunjukkan apakah bisnis Anda benar-benar bertambah kaya dari tahun ke tahun.'
  }
];

export default function FinancialGlossaryModal({ visible, onClose }: GlossaryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleFactoryReset = () => {
    Alert.alert(
      "⚠️ DEVELOPER RESET",
      "Apakah Anda yakin ingin menghapus SEMUA data transaksi, neraca, dan pengaturan? Aplikasi akan kembali seperti baru didownload (Factory Reset).",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Ya, Hapus Semua!", 
          style: "destructive",
          onPress: async () => {
            await dangerouslyResetDatabase();
            Alert.alert(
              "Berhasil Dihapus ✅", 
              "Semua data telah direset ke nol. Silakan TUTUP PAKSA (Force Close) aplikasi ini dan buka kembali untuk melihat tutorial awal."
            );
          }
        }
      ]
    );
  };

  const filteredTerms = terms.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <BookA color="#D0BCFF" size={24} />
              <Text style={styles.title}>Kamus Keuangan CFO</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#CBC3D7" size={24} />
            </TouchableOpacity>
          </View>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search color="#958EA0" size={20} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Cari istilah keuangan..."
              placeholderTextColor="#958EA0"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          {/* List Area */}
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.list}>
              {filteredTerms.map((term, index) => (
                <View key={index} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.termTitle}>{term.title}</Text>
                    <View style={[styles.badge, { borderColor: term.badgeColor, backgroundColor: term.badgeColor + '15' }]}>
                      <Text style={[styles.badgeText, { color: term.badgeColor }]}>{term.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.termDesc}>{term.desc}</Text>
                  
                  {term.importance && (
                    <View style={styles.importanceBox}>
                      <Lightbulb color="#D0BCFF" size={16} style={{ marginTop: 2 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.importanceLabel}>Kenapa ini penting?</Text>
                        <Text style={styles.importanceText}>{term.importance}</Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
              
              {filteredTerms.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Istilah tidak ditemukan.</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Sticky Footer */}
          <View style={styles.stickyFooter}>
            <TouchableOpacity style={styles.devResetButton} onPress={handleFactoryReset} activeOpacity={0.7}>
              <AlertTriangle color="#EF4444" size={20} />
              <View style={{ flex: 1 }}>
                <Text style={styles.devResetTitle}>Developer Reset Data</Text>
                <Text style={styles.devResetDesc}>Kembalikan aplikasi ke setelan pabrik untuk menguji ulang fitur tutorial Onboarding.</Text>
              </View>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 15, 0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#12121E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    paddingTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 0,
    overflow: 'hidden', // to contain the footer blur
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E4E1E9',
  },
  closeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    borderRadius: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#E4E1E9',
    fontSize: 16,
    height: '100%',
  },
  scrollArea: {
    paddingHorizontal: 24,
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderTopColor: 'rgba(208, 188, 255, 0.15)', // subtle gradient hint
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  termTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#E4E1E9',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  termDesc: {
    fontSize: 14,
    color: '#CBC3D7',
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 16,
  },
  importanceBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#D0BCFF',
  },
  importanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D0BCFF',
    marginBottom: 4,
  },
  importanceText: {
    fontSize: 13,
    color: '#958EA0',
    lineHeight: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#958EA0',
    fontSize: 14,
  },
  stickyFooter: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(18, 18, 30, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  devResetButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  devResetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 4,
  },
  devResetDesc: {
    fontSize: 11,
    color: '#958EA0',
    lineHeight: 16,
  }
});
