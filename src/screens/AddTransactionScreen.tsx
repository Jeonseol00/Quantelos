import React from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import TransactionForm from '../components/TransactionForm';

export default function AddTransactionScreen() {
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      
      {/* Top App Bar — Matching Dashboard */}
      <View style={styles.topAppBar}>
        <Text style={styles.subtitle}>Fokus rekam jejak tanpa distraksi</Text>
        <Text style={styles.title}>Tambah Transaksi</Text>
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TransactionForm />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F', // Konsisten dengan Dark Glassmorphism global
  },
  topAppBar: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 24,
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
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 40,
  },
});
