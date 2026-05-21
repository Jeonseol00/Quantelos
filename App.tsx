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
  const loadTransactions = useFinancialStore(state => state.loadTransactions);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function boot() {
      await initDatabase();
      await syncEngine.initialize();
      
      const onboardingStatus = await getAppSetting('has_seen_onboarding');
      if (onboardingStatus !== 'true') {
        setHasSeenOnboarding(false);
      }
      
      await loadTransactions();
      await useFinancialStore.getState().loadLatestSnapshot();
      setIsDbReady(true);

      // Mulai pantau koneksi internet setelah database siap
      unsubscribe = NetInfo.addEventListener(state => {
        if (state.isConnected) {
          syncEngine.syncPendingTransactions().catch(err => 
            console.log('[Sync Engine Connection Trigger Error]', err)
          );
        }
      });
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

  if (!isDbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
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
  }
});
