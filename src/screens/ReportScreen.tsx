import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import MonthlySnapshot from '../components/MonthlySnapshot';

export default function ReportScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      
      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <Text style={styles.subtitle}>📊 Neraca & Konteks</Text>
        <Text style={styles.title}>Laporan Bulanan</Text>
      </View>

      <MonthlySnapshot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
});
