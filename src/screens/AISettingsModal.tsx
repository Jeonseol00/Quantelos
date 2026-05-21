import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Linking, ActivityIndicator } from 'react-native';
import { X, KeySquare, ExternalLink, ShieldCheck } from 'lucide-react-native';
import { getAppSetting, setAppSetting } from '../db/sqlcipher';

interface AISettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AISettingsModal({ visible, onClose }: AISettingsModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (visible) {
      loadApiKey();
    }
  }, [visible]);

  const loadApiKey = async () => {
    setIsLoaded(false);
    const key = await getAppSetting('gemini_api_key');
    if (key) {
      setApiKey(key);
    } else {
      setApiKey('');
    }
    setIsLoaded(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await setAppSetting('gemini_api_key', apiKey.trim());
    setIsSaving(false);
    onClose();
  };

  const openGeminiConsole = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <KeySquare color="#D0BCFF" size={24} />
                <Text style={styles.title}>Pengaturan Keamanan AI</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color="#CBC3D7" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <Text style={styles.descText}>
                Quantelos menggunakan model BYOK (Bring Your Own Key). API Key Anda disimpan <Text style={{fontWeight: '700', color: '#4EDEA3'}}>secara lokal</Text> dengan enkripsi SQLCipher AES-256 dan tidak pernah dikirim ke server kami.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Google Gemini API Key</Text>
                {!isLoaded ? (
                  <View style={[styles.inputContainer, { justifyContent: 'center' }]}>
                    <ActivityIndicator color="#D0BCFF" size="small" />
                  </View>
                ) : (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Paste API Key Anda (AIzaSy...)"
                      placeholderTextColor="rgba(255, 255, 255, 0.2)"
                      value={apiKey}
                      onChangeText={setApiKey}
                      secureTextEntry={true}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.linkButton} onPress={openGeminiConsole}>
                <Text style={styles.linkText}>Dapatkan API Key gratis di AI Studio</Text>
                <ExternalLink color="#4CD7F6" size={14} />
              </TouchableOpacity>
            </View>

            {/* Footer Actions */}
            <View style={styles.footer}>
              <View style={styles.shieldRow}>
                <ShieldCheck color="#4EDEA3" size={16} />
                <Text style={styles.shieldText}>Local AES-256 Encrypted</Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} 
                onPress={handleSave}
                disabled={isSaving || !isLoaded}
              >
                <Text style={styles.saveBtnText}>{isSaving ? 'Menyimpan...' : 'Simpan Kunci Rahasia'}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 15, 0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  keyboardView: {
    width: '100%',
  },
  card: {
    backgroundColor: '#12121E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E4E1E9',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 24,
  },
  descText: {
    color: '#CBC3D7',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#958EA0',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: '#E4E1E9',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  linkText: {
    color: '#4CD7F6',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    paddingTop: 0,
  },
  shieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  shieldText: {
    color: '#4EDEA3',
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#D0BCFF',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D0BCFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  saveBtnText: {
    color: '#131318',
    fontSize: 16,
    fontWeight: '800',
  }
});
