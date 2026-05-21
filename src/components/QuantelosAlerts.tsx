import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react-native';
import { useFinancialStore } from '../stores/financialStore';

export default function QuantelosAlerts() {
  const { totalBalance, latestSnapshot, transactions } = useFinancialStore();

  const selectedMonth = useMemo(() => {
    const now = new Date();
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  const metrics = useMemo(() => {
    const mMap: Record<string, string> = {
      'Januari':'1','Februari':'2','Maret':'3','April':'4','Mei':'5','Juni':'6',
      'Juli':'7','Agustus':'8','September':'9','Oktober':'10','November':'11','Desember':'12'
    };
    const parts = selectedMonth.split(' ');
    const ms = mMap[parts[0]] || '5';
    const yr = parts[1] || '2026';
    const s1 = `/${ms}/${yr}`;
    const s2 = `/${ms.padStart(2, '0')}/${yr}`;

    const filtered = transactions.filter(t => t.date.endsWith(s1) || t.date.endsWith(s2));
    const inc = filtered.filter(t => t.type === 'INCOME');
    const gi = inc.reduce((s, t) => s + t.amount, 0);
    const af = inc.reduce((s, t) => s + t.admin_fee, 0);
    const cg = inc.reduce((s, t) => s + t.cogs, 0);
    const ox = filtered.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const net = gi - af;
    return { gi, af, cg, ox, gp: net - cg, np: net - cg - ox };
  }, [transactions, selectedMonth]);

  const fmt = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.abs(n));

  const alertData = useMemo(() => {
    // 1. Kas Defisit (🔴 Red Alert)
    if (totalBalance < 0) {
      return {
        level: 'danger',
        title: '🔴 ALARM: SALDO KAS DEFISIT!',
        icon: <AlertTriangle color="#FF6B6B" size={20} />,
        borderColor: 'rgba(255, 107, 107, 0.4)',
        glowColor: 'rgba(255, 107, 107, 0.1)',
        message: `Saldo kas Anda saat ini bernilai negatif (-${fmt(totalBalance)}). Warren Buffett memperingatkan: Hentikan segala pengeluaran modal non-prioritas segera dan fokuslah pada penagihan piutang!`,
      };
    }

    // 2. Laba Bersih Negatif (🔴 Red Alert)
    if (metrics.np < 0) {
      return {
        level: 'danger',
        title: '🔴 PERINGATAN: LABA BERSIH DEFISIT!',
        icon: <AlertTriangle color="#FF6B6B" size={20} />,
        borderColor: 'rgba(255, 107, 107, 0.4)',
        glowColor: 'rgba(255, 107, 107, 0.1)',
        message: `Bisnis Anda mengalami rugi bersih sebesar ${fmt(metrics.np)} bulan ini. Warren Buffett menyarankan: Evaluasi kembali margin HPP parfum Anda atau pangkas biaya operasional pasif sekarang!`,
      };
    }

    // 3. Reseller Tidak Optimal (🟡 Yellow Alert)
    if (latestSnapshot && latestSnapshot.reseller_aktif > 3 && latestSnapshot.pesanan_bulan < latestSnapshot.reseller_aktif * 5) {
      return {
        level: 'warning',
        title: '🟡 PERINGATAN: PRODUKTIVITAS RESELLER RENDAH!',
        icon: <AlertTriangle color="#FFD166" size={20} />,
        borderColor: 'rgba(255, 209, 102, 0.4)',
        glowColor: 'rgba(255, 209, 102, 0.1)',
        message: `Anda memiliki ${latestSnapshot.reseller_aktif} reseller aktif namun hanya menghasilkan ${latestSnapshot.pesanan_bulan} pesanan. Elon Musk menyarankan: Buat kontes reseller atau diskon volume agresif minggu ini!`,
      };
    }

    // 4. Target Memo Kosong (🟡 Yellow Alert)
    if (latestSnapshot && (!latestSnapshot.tujuan_bisnis || !latestSnapshot.tujuan_bisnis.trim())) {
      return {
        level: 'warning',
        title: '🟡 PERINGATAN: TARGET BISNIS BELUM DISET!',
        icon: <AlertTriangle color="#FFD166" size={20} />,
        borderColor: 'rgba(255, 209, 102, 0.4)',
        glowColor: 'rgba(255, 209, 102, 0.1)',
        message: `Business Target Memo kosong untuk periode ${selectedMonth}. Robert Kiyosaki mengingatkan: Tanpa visi finansial tertulis, Anda hanya bekerja untuk uang, bukan membangun aset sejati!`,
      };
    }

    // 5. Kondisi Sehat Prima (🟢 Green State)
    return {
      level: 'success',
      title: '🟢 INDIKATOR BISNIS: SEHAT & PRIMA',
      icon: <CheckCircle2 color="#4EDEA3" size={20} />,
      borderColor: 'rgba(78, 222, 163, 0.3)',
      glowColor: 'rgba(78, 222, 163, 0.05)',
      message: `Saldo kas ${fmt(totalBalance)} dan Laba Bersih ${fmt(metrics.np)} aman. Warren Buffett bersenandung: Anda sedang membangun mesin uang parfum yang sangat kokoh. Pertahankan disiplin kas ini!`,
    };
  }, [totalBalance, latestSnapshot, metrics, selectedMonth]);

  return (
    <View style={[styles.container, { borderColor: alertData.borderColor, backgroundColor: alertData.glowColor }]}>
      <View style={styles.header}>
        {alertData.icon}
        <Text style={[styles.title, 
          alertData.level === 'danger' && styles.dangerText,
          alertData.level === 'warning' && styles.warningText,
          alertData.level === 'success' && styles.successText,
        ]}>
          {alertData.title}
        </Text>
      </View>
      <Text style={styles.message}>{alertData.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dangerText: {
    color: '#FF6B6B',
  },
  warningText: {
    color: '#FFD166',
  },
  successText: {
    color: '#4EDEA3',
  },
  message: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11.5,
    lineHeight: 18,
    fontWeight: '500',
  },
});
