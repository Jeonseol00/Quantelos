import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onApply: (totalCOGS: number) => void;
}

export default function HPPCalculatorModal({ visible, onClose, onApply }: Props) {
  // Fragrance Oil (Bibit)
  const [fragranceVol, setFragranceVol] = useState('15');
  const [fragrancePrice, setFragrancePrice] = useState('1.500');

  // Solvent (Alcohol/DPG)
  const [solventVol, setSolventVol] = useState('15');
  const [solventPrice, setSolventPrice] = useState('100');

  // Packaging & Bottle
  const [bottlePrice, setBottlePrice] = useState('5.000');
  const [packagingPrice, setPackagingPrice] = useState('2.000');

  const [totalHPP, setTotalHPP] = useState(0);

  // Helper format numbers
  const formatNumber = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(numericValue, 10));
  };

  const parseNumber = (text: string): number => {
    return parseFloat(text.replace(/\./g, '')) || 0;
  };

  // Dynamic calculations
  useEffect(() => {
    const fragV = parseFloat(fragranceVol) || 0;
    const fragP = parseNumber(fragrancePrice);
    
    const solvV = parseFloat(solventVol) || 0;
    const solvP = parseNumber(solventPrice);

    const botP = parseNumber(bottlePrice);
    const packP = parseNumber(packagingPrice);

    const calculated = (fragV * fragP) + (solvV * solvP) + botP + packP;
    setTotalHPP(calculated);
  }, [fragranceVol, fragrancePrice, solventVol, solventPrice, bottlePrice, packagingPrice]);

  const handleApply = () => {
    onApply(totalHPP);
    onClose();
  };

  const fmt = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          
          <View style={styles.header}>
            <Text style={styles.title}>🔬 Quantelos Recipe Engine</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Hitung Harga Pokok Produksi (HPP) parfum Anda secara eksak berdasarkan formulasi bahan baku produksi.
          </Text>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            
            {/* 1. Fragrance Oil (Bibit) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>🧪 BIBIT PARFUM (FRAGRANCE OIL)</Text>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Volume (ml)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="rgba(255, 255, 255, 0.2)"
                    value={fragranceVol}
                    onChangeText={setFragranceVol}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 2, marginLeft: 12 }]}>
                  <Text style={styles.inputLabel}>Harga / ml</Text>
                  <View style={styles.prefixInput}>
                    <Text style={styles.currency}>Rp</Text>
                    <TextInput
                      style={styles.textInputPrefix}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="rgba(255, 255, 255, 0.2)"
                      value={fragrancePrice}
                      onChangeText={(txt) => setFragrancePrice(formatNumber(txt))}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* 2. Solvent (Pelarut) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>💧 PELARUT (ALCOHOL / DPG)</Text>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Volume (ml)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="rgba(255, 255, 255, 0.2)"
                    value={solventVol}
                    onChangeText={setSolventVol}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 2, marginLeft: 12 }]}>
                  <Text style={styles.inputLabel}>Harga / ml</Text>
                  <View style={styles.prefixInput}>
                    <Text style={styles.currency}>Rp</Text>
                    <TextInput
                      style={styles.textInputPrefix}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="rgba(255, 255, 255, 0.2)"
                      value={solventPrice}
                      onChangeText={(txt) => setSolventPrice(formatNumber(txt))}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* 3. Botol & Cap */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>🧴 BOTOL & CAP (UNIT)</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Harga per Botol</Text>
                <View style={styles.prefixInput}>
                  <Text style={styles.currency}>Rp</Text>
                  <TextInput
                    style={styles.textInputPrefix}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="rgba(255, 255, 255, 0.2)"
                    value={bottlePrice}
                    onChangeText={(txt) => setBottlePrice(formatNumber(txt))}
                  />
                </View>
              </View>
            </View>

            {/* 4. Kotak & Stiker */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>📦 BOX PACKAGING & LABELLING</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Biaya per Pcs</Text>
                <View style={styles.prefixInput}>
                  <Text style={styles.currency}>Rp</Text>
                  <TextInput
                    style={styles.textInputPrefix}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="rgba(255, 255, 255, 0.2)"
                    value={packagingPrice}
                    onChangeText={(txt) => setPackagingPrice(formatNumber(txt))}
                  />
                </View>
              </View>
            </View>

          </ScrollView>

          {/* Real-time Calculation Panel */}
          <View style={styles.resultPanel}>
            <View>
              <Text style={styles.resultLabel}>ESTIMASI HPP FORMULA</Text>
              <Text style={styles.resultValue}>{fmt(totalHPP)}</Text>
            </View>
            
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyTxt}>Gunakan HPP</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '85%',
    backgroundColor: '#12121E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 0,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D0BCFF',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 8,
  },
  closeTxt: {
    color: '#958EA0',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#958EA0',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  scrollArea: {
    maxHeight: 340,
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D0BCFF',
    letterSpacing: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {},
  inputLabel: {
    color: '#958EA0',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    color: '#E4E1E9',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  prefixInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  currency: {
    color: '#958EA0',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },
  textInputPrefix: {
    flex: 1,
    color: '#E4E1E9',
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  resultPanel: {
    backgroundColor: 'rgba(78, 222, 163, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.25)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  resultLabel: {
    color: '#4EDEA3',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  resultValue: {
    color: '#E4E1E9',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  applyBtn: {
    backgroundColor: '#4EDEA3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  applyTxt: {
    color: '#0A0A0F',
    fontWeight: '700',
    fontSize: 13,
  },
});
