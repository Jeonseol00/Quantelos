import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, PlusCircle, BookOpen, BarChart3 } from 'lucide-react-native';

import DashboardScreen from './src/screens/DashboardScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import LedgerScreen from './src/screens/LedgerScreen';
import ReportScreen from './src/screens/ReportScreen';
import AIChatSheet from './src/components/AIChatSheet';
import OnboardingGuide from './src/components/OnboardingGuide';
import NetInfo from '@react-native-community/netinfo';

import { initDatabase, getAppSetting, setAppSetting } from './src/db/sqlcipher';
import { useFinancialStore } from './src/stores/financialStore';
import { syncEngine } from './src/db/sync';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const loadTransactions = useFinancialStore(state => state.loadTransactions);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function boot() {
      try {
        console.log('[Quantelos Boot] Starting database validation...');
        await initDatabase();
        
        console.log('[Quantelos Boot] Initializing sync engines...');
        await syncEngine.initialize();
        
        console.log('[Quantelos Boot] Checking application onboarding settings...');
        const onboardingStatus = await getAppSetting('has_seen_onboarding');
        if (onboardingStatus !== 'true') {
          setHasSeenOnboarding(false);
        }
        
        console.log('[Quantelos Boot] Reading transactions ledger...');
        await loadTransactions();
        
        console.log('[Quantelos Boot] Loading current financial snapshot...');
        await useFinancialStore.getState().loadLatestSnapshot();
        
        console.log('[Quantelos Boot] System fully operational.');
        setIsDbReady(true);

        // Mulai pantau koneksi internet setelah database siap
        unsubscribe = NetInfo.addEventListener(state => {
          if (state.isConnected) {
            syncEngine.syncPendingTransactions().catch(err => 
              console.log('[Sync Engine Connection Trigger Error]', err)
            );
          }
        });
      } catch (err: any) {
        console.error('[Quantelos Core Crash]', err);
        setBootError(err?.message || String(err));
      }
    }

    boot();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleFinishOnboarding = async () => {
    await setAppSetting('has_seen_onboarding', 'true');
    setHasSeenOnboarding(true);
  };

  const handleResetDatabase = async () => {
    try {
      const { dangerouslyResetDatabase } = require('./src/db/sqlcipher');
      await dangerouslyResetDatabase();
      // Restart state
      setBootError(null);
      setIsDbReady(false);
      // Re-trigger boot manually
      const { initDatabase: reInit } = require('./src/db/sqlcipher');
      await reInit();
      await syncEngine.initialize();
      setHasSeenOnboarding(false);
      await loadTransactions();
      await useFinancialStore.getState().loadLatestSnapshot();
      setIsDbReady(true);
    } catch (e: any) {
      alert('Gagal mereset database: ' + e.message);
    }
  };

  if (bootError) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>🚨 Sistem Gagal Menginisialisasi</Text>
          <Text style={styles.errorSubtitle}>
            Quantelos CFO mendeteksi kegagalan pada saat memuat basis data lokal atau subsistem sinkronisasi.
          </Text>
          
          <View style={styles.logContainer}>
            <Text style={styles.logTitle}>Log Kesalahan Sistem:</Text>
            <Text style={styles.logText}>{bootError}</Text>
          </View>

          <Text style={styles.instructionText}>
            Ini biasanya disebabkan oleh ketidakcocokan native module Android. Coba hapus cache aplikasi atau lakukan reset brankas lokal di bawah ini:
          </Text>

          <View style={styles.buttonGroup}>
            <Text 
              style={styles.resetButton} 
              onPress={handleResetDatabase}
            >
              🔄 Hapus & Reset Brankas Lokal
            </Text>
            
            <Text 
              style={styles.retryButton} 
              onPress={() => {
                setBootError(null);
                setIsDbReady(false);
                // Trigger reload
                setIsDbReady(false);
              }}
            >
              Coba Lagi
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (!isDbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D0BCFF" />
        <Text style={styles.loadingText}>Membuka Buku Kas Quantelos...</Text>
      </View>
    );
  }

  if (!hasSeenOnboarding) {
    return <OnboardingGuide onComplete={handleFinishOnboarding} />;
  }

  return (
    <>
      {/* Menggunakan Router Tab di Bawah (Multi-Screen) */}
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: true,
            tabBarHideOnKeyboard: true, // PREVENT INFINITE LAYOUT LOOP ON ANDROID
            tabBarStyle: {
              backgroundColor: '#111118', // Deep dark for bottom tab
              borderTopWidth: 1,
              borderTopColor: 'rgba(255, 255, 255, 0.05)',
              elevation: 0, // Remove Android shadow
              height: 65,
              paddingBottom: 10,
              paddingTop: 10,
            },
            tabBarActiveTintColor: '#D0BCFF', // Primary glowing purple
            tabBarInactiveTintColor: '#64748B',
          }}
        >
          <Tab.Screen 
            name="Dasbor" 
            component={DashboardScreen} 
            options={{
              tabBarIcon: ({ color }) => <Home color={color} size={24} />
            }}
          />
          <Tab.Screen 
            name="Input" 
            component={AddTransactionScreen} 
            options={{
              tabBarIcon: ({ color }) => <PlusCircle color={color} size={24} />
            }}
          />
          <Tab.Screen 
            name="Buku Kas" 
            component={LedgerScreen} 
            options={{
              tabBarIcon: ({ color }) => <BookOpen color={color} size={24} />
            }}
          />
          <Tab.Screen 
            name="Laporan" 
            component={ReportScreen} 
            options={{
              tabBarIcon: ({ color }) => <BarChart3 color={color} size={24} />
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      
      {/* Overlay Obrolan AI tetap melayang bebas (Z-Index tinggi) agar bisa dibuka dari tab mana saja! */}
      <AIChatSheet />
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#958EA0',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorCard: {
    backgroundColor: '#111118',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  errorTitle: {
    color: '#FF6B6B',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorSubtitle: {
    color: '#958EA0',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  logContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    padding: 16,
    marginBottom: 20,
  },
  logTitle: {
    color: '#D0BCFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  logText: {
    color: '#E2E8F0',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  instructionText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonGroup: {
    flexDirection: 'column',
    gap: 12,
  },
  resetButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#FCA5A5',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 13,
    overflow: 'hidden',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 13,
    overflow: 'hidden',
  }
});
