import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, UIManager, Platform } from 'react-native';
import { CheckCircle, Circle, Lock, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useFinancialStore } from '../stores/financialStore';

export default function SaaSChecklist() {
  const navigation = useNavigation();
  const { transactions, latestSnapshot } = useFinancialStore();
  const [userDismissed, setUserDismissed] = useState(false);

  const hasCapital = transactions.some(t => t.type === 'CAPITAL');
  const hasSnapshot = latestSnapshot !== null;
  const hasSale = transactions.some(t => t.type === 'INCOME');

  const steps = [
    { id: 'capital', title: 'Setoran Modal Awal', isDone: hasCapital },
    { id: 'snapshot', title: 'Pengisian Neraca Aset', isDone: hasSnapshot },
    { id: 'sale', title: 'Pencatatan Penjualan Pertama', isDone: hasSale }
  ];

  const completedCount = steps.filter(s => s.isDone).length;
  const allCompleted = completedCount === 3;

  useEffect(() => {
    if (allCompleted) {
      setTimeout(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setUserDismissed(true);
      }, 3000);
    }
  }, [allCompleted]);

  const handleDismiss = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setUserDismissed(true);
  };

  if (allCompleted || userDismissed) {
    return null;
  }

  // Find the first undone step
  const activeStepIndex = steps.findIndex(s => !s.isDone);

  const navigateToStep = (id: string) => {
    if (id === 'capital' || id === 'sale') {
      // @ts-ignore - mengabaikan tipe strict untuk navigasi sederhana
      navigation.navigate('Input');
    } else if (id === 'snapshot') {
      // @ts-ignore
      navigation.navigate('Laporan');
    }
  };

  const renderItem = (step: typeof steps[0], index: number) => {
    const isCompleted = step.isDone;
    const isActive = index === activeStepIndex;
    const isLocked = !isCompleted && !isActive;

    if (isCompleted) {
      return (
        <View key={step.id} style={[styles.itemRow, styles.itemCompleted]}>
          <CheckCircle color="#4EDEA3" size={24} />
          <Text style={[styles.itemTitle, styles.itemTitleDone]}>{step.title}</Text>
        </View>
      );
    }

    if (isActive) {
      return (
        <TouchableOpacity 
          key={step.id} 
          style={[styles.itemRow, styles.itemActive]} 
          activeOpacity={0.7}
          onPress={() => navigateToStep(step.id)}
        >
          <View style={styles.activeIconWrapper}>
            <View style={styles.activePulse} />
            <Circle color="#D0BCFF" size={24} />
          </View>
          <Text style={[styles.itemTitle, styles.itemTitleActive]}>{step.title}</Text>
          <ArrowRight color="#D0BCFF" size={20} />
        </TouchableOpacity>
      );
    }

    return (
      <View key={step.id} style={[styles.itemRow, styles.itemLocked]}>
        <Lock color="#958EA0" size={24} />
        <Text style={[styles.itemTitle, styles.itemTitleLocked]}>{step.title}</Text>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Langkah Awal Bisnis</Text>
          <Text style={styles.subtitle}>Selesaikan konfigurasi untuk mengaktifkan AI Analysis.</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{completedCount}/3 Selesai</Text>
        </View>
      </View>
      
      <View style={styles.list}>
        {steps.map((step, index) => renderItem(step, index))}
      </View>
      
      <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
        <Text style={styles.dismissText}>Sembunyikan Panduan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(42, 41, 47, 0.8)', // surface-container-high
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopColor: 'rgba(208, 188, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E4E1E9',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#958EA0',
    lineHeight: 20,
  },
  badge: {
    backgroundColor: 'rgba(208, 188, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(208, 188, 255, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D0BCFF',
    letterSpacing: -0.2,
  },
  list: {
    gap: 8,
    marginBottom: 24,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 16,
  },
  itemCompleted: {
    opacity: 0.6,
  },
  itemActive: {
    backgroundColor: 'rgba(208, 188, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(208, 188, 255, 0.4)',
    shadowColor: '#D0BCFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  itemLocked: {
    opacity: 0.4,
  },
  activeIconWrapper: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#D0BCFF',
    borderRadius: 12,
    opacity: 0.2,
    // Note: For a true pulse we'd use Animated API, 
    // but static glowing orb works great for native feeling.
  },
  itemTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  itemTitleDone: {
    color: '#958EA0',
    textDecorationLine: 'line-through',
  },
  itemTitleActive: {
    color: '#D0BCFF',
    fontWeight: '700',
  },
  itemTitleLocked: {
    color: '#958EA0',
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dismissText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  }
});
