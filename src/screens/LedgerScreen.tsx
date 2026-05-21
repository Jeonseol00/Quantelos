import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import TransactionHistory from '../components/TransactionHistory';

export default function LedgerScreen() {
  const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      
      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <Text style={styles.subtitle}>Jejak riwayat seluruh aktivitas finansial</Text>
        <Text style={styles.title}>Buku Kas Induk</Text>
      </View>
      
      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'ALL' && styles.filterActiveAll]}
            onPress={() => setFilter('ALL')}
          >
            <Text style={[styles.filterText, filter === 'ALL' && styles.filterTextActive]}>SEMUA</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'INCOME' && styles.filterActiveIncome]}
            onPress={() => setFilter('INCOME')}
          >
            <Text style={[styles.filterText, filter === 'INCOME' && styles.filterTextActive]}>PEMASUKAN</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'EXPENSE' && styles.filterActiveExpense]}
            onPress={() => setFilter('EXPENSE')}
          >
            <Text style={[styles.filterText, filter === 'EXPENSE' && styles.filterTextActive]}>PENGELUARAN</Text>
          </TouchableOpacity>
          
          <View style={styles.filterDivider} />
          
          <TouchableOpacity style={styles.filterActionChip}>
            <Text style={styles.filterActionText}>FILTER</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterActionChip}>
            <Text style={styles.filterActionText}>EXPORT</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
      >
        {/* Mengirimkan filter yang dipilih ke komponen riwayat timeline */}
        <TransactionHistory filterType={filter} hideHeader={true} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  topAppBar: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 20,
    backgroundColor: 'rgba(18, 18, 30, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E4E1E9',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#958EA0',
    fontWeight: '500',
    marginBottom: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  filterContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterScroll: {
    paddingHorizontal: 24,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#494454',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  filterActiveAll: {
    borderColor: 'rgba(208, 188, 255, 0.4)',
    backgroundColor: 'rgba(208, 188, 255, 0.1)',
  },
  filterActiveIncome: {
    borderColor: 'rgba(78, 222, 163, 0.4)',
    backgroundColor: 'rgba(78, 222, 163, 0.1)',
  },
  filterActiveExpense: {
    borderColor: 'rgba(255, 180, 171, 0.4)',
    backgroundColor: 'rgba(255, 180, 171, 0.1)',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBC3D7',
    letterSpacing: 0.5,
  },
  filterTextActive: {
    color: '#E4E1E9',
    fontWeight: '800',
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#494454',
    marginHorizontal: 4,
  },
  filterActionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  filterActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#958EA0',
    letterSpacing: 0.5,
  },
});
