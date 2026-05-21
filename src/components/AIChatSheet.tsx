import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings } from 'lucide-react-native';
import AISettingsModal from '../screens/AISettingsModal';
import { generateGeminiResponse } from '../services/geminiPipeline';
import { useFinancialStore } from '../stores/financialStore';
import { getAppSetting } from '../db/sqlcipher';

export default function AIChatSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { transactions, latestSnapshot } = useFinancialStore();

  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Halo! Saya Quantelos, Moderator Dewan Komisaris Anda. Panel eksekutif kita (Warren Buffett, Elon Musk, dan Robert Kiyosaki) sudah siap. Apa yang ingin Anda diskusikan tentang laporan keuangan kita?' }
  ]);

  const buildContextString = () => {
    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalIncome - totalExpense;

    let context = `DATA KEUANGAN SAAT INI:\n- Total Pendapatan: Rp ${totalIncome.toLocaleString('id-ID')}\n- Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}\n- Laba/Rugi Bersih: Rp ${netProfit.toLocaleString('id-ID')}\n`;
    
    if (latestSnapshot) {
      context += `- Kas Bisnis: Rp ${latestSnapshot.kas_bisnis}\n- Stok Gudang: Rp ${latestSnapshot.stok_gudang}\n- Utang Supplier: Rp ${latestSnapshot.utang_supplier}\n- Target Bisnis: ${latestSnapshot.tujuan_bisnis || 'Belum ditentukan'}\n`;
    }
    return context;
  };

  const renderFormattedMessage = (text: string, isAi: boolean) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const trimmedLine = line.trim();
      
      // Deteksi bullet points
      const isBullet = trimmedLine.startsWith('*') || trimmedLine.startsWith('-');
      
      // Deteksi headers
      const isHeading = line.startsWith('#');
      
      // Bersihkan karakter markdown luar
      let cleanLine = line.replace(/^[#\s]+/, '');
      if (isBullet) {
        cleanLine = `• ${trimmedLine.replace(/^[*\-\s]+/, '')}`;
      }

      // Hapus sisa-sisa asterisk tunggal (*) yang sering dipakai untuk cetak miring (italics)
      // agar tidak mengotori UI dengan karakter bintang mentah.
      cleanLine = cleanLine.replace(/\*(?!\*)([^*]+)\*/g, '$1');
      cleanLine = cleanLine.replace(/\*/g, ''); // Pembersihan total bintang liar yang tersisa

      // Pisahkan teks untuk menebalkan pola **text** (karena bintang sudah dihapus di atas,
      // kita harus hati-hati. Lebih baik pisahkan teks sebelum membersihkan bintang liar!)
      
      return (
        <Text 
          key={lineIdx} 
          style={[
            styles.messageText, 
            isAi ? styles.aiText : styles.userText,
            isHeading && styles.headingText,
            isBullet && styles.bulletText,
            { marginBottom: 8, lineHeight: 22 }
          ]}
        >
          {cleanLine}
        </Text>
      );
    });
  };

  const handleSend = async () => {
    if (!query.trim()) return;
    
    const userQuery = query.trim();
    setMessages(prev => [...prev, { role: 'user', text: userQuery }]);
    setQuery('');
    setIsLoading(true);
    
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const apiKey = await getAppSetting('gemini_api_key');
      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'ai', text: 'Sistem Quantelos terkunci. Silakan masukkan Gemini API Key Anda di menu Pengaturan (ikon roda gigi di atas) untuk memulai simulasi Dewan Komisaris.' }]);
        setIsLoading(false);
        return;
      }

      const financialContext = buildContextString();
      
      // Ambil 6 pesan terakhir (3 pasang diskusi tanya-jawab) untuk memori konteks sesi
      const recentHistory = messages
        .slice(1) // Lewati salam pembuka pertama Quantelos
        .slice(-6)
        .map(m => `${m.role === 'user' ? 'Pengguna' : 'Quantelos/Tokoh'}: ${m.text.slice(0, 300)}`)
        .join('\n\n');

      const megaPrompt = `
Anda adalah Quantelos, sebuah sistem AI canggih yang bertindak sebagai Moderator Rapat Dewan Komisaris untuk bisnis pengguna. Di dalam ruangan rapat ini, Anda mensimulasikan perdebatan 3 tokoh bisnis legendaris:
1. Warren Buffett (Konservatif, sangat peduli pada arus kas positif, efisiensi, dan keamanan dana cadangan).
2. Elon Musk (Agresif, gila inovasi, selalu menyarankan untuk mengambil risiko besar, bakar uang untuk dominasi pasar, dan pivot produk).
3. Robert Kiyosaki (Fokus keras pada perbedaan aset dan liabilitas, serta pentingnya menggunakan utang untuk membeli aset yang menghasilkan kas).

Data Keuangan Perusahaan Pengguna saat ini:
${financialContext}

HISTORI DISKUSI SEBELUMNYA (Gunakan ini sebagai memori konteks agar saran berkelanjutan):
${recentHistory || 'Tidak ada diskusi sebelumnya (ini adalah pertanyaan pertama).'}

Pertanyaan/Pernyataan Pengguna Terbaru: "${userQuery}"

INSTRUKSI KRITIS (AGAR OUTPUT TIDAK TERPOTONG):
1. Tuliskan dialog pendek berdurasi cepat (maksimal 2 kalimat untuk setiap giliran tokoh berbicara). Pastikan perdebatan sengit, langsung menuju inti masalah, dan mencerminkan filosofi ekstrem masing-masing tokoh.
2. Batasi debat hanya dalam 1 putaran (setiap tokoh berbicara tepat 1 kali).
3. Setelah debat selesai, Quantelos (sebagai Moderator) harus memberikan rangkuman berupa 3 langkah taktis "Arahan Eksekusi Final" yang paling logis dilakukan pengguna saat ini berdasarkan riwayat diskusi.
4. Gunakan bahasa Indonesia yang tajam dan dramatis. Jangan gunakan simbol asterisk (*) sama sekali di dalam seluruh output Anda (tulis nama tokoh secara normal tanpa pembungkus bintang ganda). Jangan gunakan karakter tag pagar (#).
`;

      const responseText = await generateGeminiResponse(apiKey, megaPrompt);
      
      setMessages(prev => [...prev, { role: 'ai', text: responseText }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `[ERROR]: ${error.message}` }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  if (!isOpen) {
    return (
      <TouchableOpacity style={styles.fabContainer} onPress={() => setIsOpen(true)}>
        <LinearGradient colors={['#A078FF', '#D0BCFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <KeyboardAvoidingView 
        style={styles.sheetOverlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHeaderRow}>
            <TouchableOpacity style={styles.dragHandleContainer} onPress={() => setIsOpen(false)}>
              <View style={styles.dragHandle} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsIcon} onPress={() => setShowSettings(true)}>
              <Settings color="#958EA0" size={20} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sheetTitle}>Quantelos Board of Directors</Text>
          
          <ScrollView 
            style={styles.chatArea} 
            contentContainerStyle={{ paddingBottom: 40 }}
            ref={scrollViewRef} 
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg, idx) => (
              <View key={idx} style={[styles.bubble, msg.role === 'ai' ? styles.aiBubble : styles.userBubble]}>
                {renderFormattedMessage(msg.text, msg.role === 'ai')}
              </View>
            ))}
            {isLoading && (
              <View style={[styles.bubble, styles.aiBubble, { width: 60, alignItems: 'center' }]}>
                <ActivityIndicator color="#D0BCFF" size="small" />
              </View>
            )}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Minta saran strategis..."
              placeholderTextColor="rgba(203, 195, 215, 0.3)"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity onPress={handleSend} disabled={isLoading}>
              <LinearGradient colors={isLoading ? ['#494454', '#494454'] : ['#A078FF', '#D0BCFF']} style={styles.sendBtn}>
                <Text style={styles.sendIcon}>➤</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <AISettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    shadowColor: '#D0BCFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    color: '#3C0091',
    fontWeight: '700',
    fontSize: 32,
    marginTop: -4,
  },
  sheetOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  sheet: {
    height: 500,
    backgroundColor: '#12121E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 30,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
    marginBottom: 8,
  },
  dragHandleContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
  },
  settingsIcon: {
    position: 'absolute',
    right: 0,
    padding: 8,
  },
  sheetTitle: {
    color: '#D0BCFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
  },
  chatArea: {
    flex: 1,
    marginBottom: 16,
  },
  bubble: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: '85%',
  },
  aiBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  userBubble: {
    backgroundColor: 'rgba(208, 188, 255, 0.1)',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(208, 188, 255, 0.2)',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  aiText: {
    color: '#CBC3D7',
  },
  userText: {
    color: '#D0BCFF',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    color: '#E4E1E9',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    marginRight: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: '#3C0091',
    fontSize: 16,
  },
  boldText: {
    fontWeight: '800',
    color: '#D0BCFF',
  },
  headingText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4CD7F6',
    marginTop: 12,
    marginBottom: 6,
  },
  bulletText: {
    marginLeft: 8,
    color: '#E4E1E9',
  }
});
