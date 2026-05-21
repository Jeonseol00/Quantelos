import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, StatusBar, TouchableOpacity } from 'react-native';
import { HelpCircle } from 'lucide-react-native';
import DashboardOverview from '../components/DashboardOverview';
import FinancialGlossaryModal from '../components/FinancialGlossaryModal';

export default function DashboardScreen() {
  const [glossaryVisible, setGlossaryVisible] = useState(false);

  return (
    <View style={styles.container}>
      
      {/* TopAppBar */}
      <View style={styles.topAppBar}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>U</Text>
        </View>
        <Text style={styles.logoText}>Quantelos CFO</Text>
        <TouchableOpacity 
          style={styles.helpButton} 
          onPress={() => setGlossaryVisible(true)}
        >
          <HelpCircle color="#E4E1E9" size={24} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 80, paddingBottom: 40 }}>
        
        <DashboardOverview />
        
      </ScrollView>

      <FinancialGlossaryModal 
        visible={glossaryVisible} 
        onClose={() => setGlossaryVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  topAppBar: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 64,
    backgroundColor: 'rgba(18, 18, 30, 0.8)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    zIndex: 50,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(208, 188, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#D0BCFF',
    fontSize: 16,
    fontWeight: '700',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#D0BCFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(208, 188, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  historySection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E4E1E9',
    marginBottom: 16,
    paddingHorizontal: 24,
  }
});
