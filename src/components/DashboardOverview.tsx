import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, NativeSyntheticEvent, NativeScrollEvent, Animated, Easing } from 'react-native';
import { useFinancialStore } from '../stores/financialStore';
import Svg, { Circle, G } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
import SaaSChecklist from './SaaSChecklist';
import CashFlowChart from './CashFlowChart';
import TransactionHistory from './TransactionHistory';
import QuantelosAlerts from './QuantelosAlerts';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function DashboardOverview() {
  const { totalBalance, latestSnapshot, transactions } = useFinancialStore();
  const [activePage, setActivePage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const [selectedMonth] = useState(() => {
    const now = new Date();
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  });

  const mm = useMemo(() => {
    const mMap: Record<string,string> = {'Januari':'1','Februari':'2','Maret':'3','April':'4','Mei':'5','Juni':'6','Juli':'7','Agustus':'8','September':'9','Oktober':'10','November':'11','Desember':'12'};
    const p = selectedMonth.split(' ');
    const ms = mMap[p[0]]||'5', yr = p[1]||'2026';
    const s1 = `/${ms}/${yr}`, s2 = `/${ms.padStart(2,'0')}/${yr}`;
    const f = transactions.filter(t => t.date.endsWith(s1)||t.date.endsWith(s2));
    const inc = f.filter(t=>t.type==='INCOME');
    const gi = inc.reduce((s,t)=>s+t.amount,0);
    const af = inc.reduce((s,t)=>s+t.admin_fee,0);
    const cg = inc.reduce((s,t)=>s+t.cogs,0);
    const ox = f.filter(t=>t.type==='EXPENSE').reduce((s,t)=>s+t.amount,0);
    const net = gi-af;
    return {gi,af,cg,ox,gp:net-cg,np:net-cg-ox};
  }, [transactions, selectedMonth]);

  const fmt = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);

  // Animated Engine for Donut
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // SVG stroke props cannot use native driver
    }).start();
  }, [mm]);

  // Donut
  const tot = mm.gi+mm.ox; const iR = tot?mm.gi/tot*100:0; const eR = tot?mm.ox/tot*100:0;
  const sz=140,sw=18,rd=(sz-sw)/2,ci=2*Math.PI*rd,eOff=ci-(eR/100)*ci;

  const animatedStrokeDashoffset = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [ci, eOff]
  });

  // Mini donut
  const ms2=70,mw=8,mr2=(ms2-mw)/2,mc=2*Math.PI*mr2;
  const sg=mm.gi||1;
  const pp=Math.max(0,mm.np)/sg*100, cp=mm.cg/sg*100, ap=mm.af/sg*100, op=mm.ox/sg*100;
  const cO=mc-(cp/100)*mc, aO=mc-((cp+ap)/100)*mc, oO=mc-((cp+ap+op)/100)*mc;

  // Balance
  const aL=(latestSnapshot?.kas_bisnis||0)+(latestSnapshot?.piutang||0)+(latestSnapshot?.stok_gudang||0);
  const kw=(latestSnapshot?.pinjaman||0)+(latestSnapshot?.utang_supplier||0);
  const nw=aL+(latestSnapshot?.peralatan||0)-kw;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActivePage(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  };
  const goTo = (i: number) => { scrollRef.current?.scrollTo({x:i*SCREEN_WIDTH,animated:true}); setActivePage(i); };

  const tabs = ['Ringkasan','P&L Bulanan','Neraca Aset'];

  return (
    <View>
      <SaaSChecklist />
      <QuantelosAlerts />

      {/* Sleek Paging Indicator (Replaces Text Tabs) */}
      <View style={s.pagingContainer}>
        {[0, 1, 2].map((_, i) => (
          <View key={i} style={[s.pageDot, activePage === i && s.pageLine]} />
        ))}
      </View>

      {/* Pager */}
      <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} style={{flexGrow:0}}>

        {/* === PAGE 1: Ringkasan === */}
        <View style={{width:SCREEN_WIDTH,paddingHorizontal:24}}>
          <View style={s.centerBlock}>
            <Text style={s.labelTop}>SALDO KAS BERSIH</Text>
            <Text style={s.bigNumGlow} adjustsFontSizeToFit numberOfLines={1}>{fmt(totalBalance)}</Text>
            <View style={s.trendPill}>
              <Text style={s.trendText}>↗ +12.5% bulan ini</Text>
            </View>
          </View>

          <View style={s.glassPanel}>
            <View style={s.donutBox}>
              <Svg width={sz} height={sz}><G rotation="-90" origin={`${sz/2},${sz/2}`}>
                <Circle stroke="#1F1F25" fill="none" cx={sz/2} cy={sz/2} r={rd} strokeWidth={sw}/>
                <Circle stroke="#4EDEA3" fill="none" cx={sz/2} cy={sz/2} r={rd} strokeWidth={sw} strokeDasharray={`${ci} ${ci}`} strokeDashoffset={0} strokeLinecap="round"/>
                <AnimatedCircle stroke="#FFB4AB" fill="none" cx={sz/2} cy={sz/2} r={rd} strokeWidth={sw} strokeDasharray={`${ci} ${ci}`} strokeDashoffset={animatedStrokeDashoffset} strokeLinecap="round"/>
              </G></Svg>
              <View style={s.donutMid}>
                <Text style={s.donutLbl}>Rasio Arus Kas</Text>
                <Text style={s.donutTxt}>1.8 : 1</Text>
              </View>
            </View>

            <View style={s.legendRow}>
              <View style={s.legendBox}>
                <View style={[s.legendDot, {backgroundColor: '#4EDEA3', shadowColor: '#4EDEA3'}]} />
                <Text style={s.legendLabel}>Uang Masuk</Text>
                <Text style={s.legendVal}>{iR.toFixed(0)}%</Text>
              </View>
              <View style={s.legendBox}>
                <View style={[s.legendDot, {backgroundColor: '#FFB4AB', shadowColor: '#FFB4AB'}]} />
                <Text style={s.legendLabel}>Uang Keluar</Text>
                <Text style={s.legendVal}>{eR.toFixed(0)}%</Text>
              </View>
            </View>
          </View>

          <View style={s.splitRow}>
            <View style={[s.glassPanel, s.splitCard, {borderTopColor: '#4EDEA3'}]}>
              <Text style={[s.splitLabel, {color: '#4EDEA3'}]}>↓ Total Pemasukan</Text>
              <Text style={s.splitVal} adjustsFontSizeToFit numberOfLines={1}>{fmt(mm.gi)}</Text>
              <Text style={s.splitSub}>Bulan ini</Text>
            </View>
            <View style={[s.glassPanel, s.splitCard, {borderTopColor: '#FFB4AB'}]}>
              <Text style={[s.splitLabel, {color: '#FFB4AB'}]}>↑ Total Pengeluaran</Text>
              <Text style={s.splitVal} adjustsFontSizeToFit numberOfLines={1}>{fmt(mm.ox)}</Text>
              <Text style={s.splitSub}>Bulan ini</Text>
            </View>
          </View>

          {/* Riwayat Terbaru dipsindah ke sini agar tinggi halaman 1 ikut bertambah */}
          <View style={{marginTop: 32}}>
            <Text style={{fontSize: 18, fontWeight: '800', color: '#E4E1E9', marginBottom: 16}}>Riwayat Terbaru</Text>
            <TransactionHistory limit={3} hideHeader={true} />
          </View>
          
        </View>

        {/* === PAGE 2: P&L === */}
        <ScrollView style={{width:SCREEN_WIDTH}} contentContainerStyle={{paddingHorizontal:24,paddingBottom:20}} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          
          <View style={[s.glassPanel, {marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]}>
            <View>
              <Text style={s.splitSub}>PERIODE P&L</Text>
              <Text style={s.splitVal}>{selectedMonth}</Text>
            </View>
          </View>

          <View style={[s.glassPanel, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}]}>
            <View>
              <Text style={s.bLabel}>Rasio Margin</Text>
              <Text style={s.splitSub}>Gross Profit vs Expenses</Text>
              <View style={{flexDirection: 'row', gap: 12, marginTop: 12}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}><View style={{width:10,height:10,backgroundColor:'#D0BCFF',borderRadius:2}}/><Text style={s.splitVal}>{pp.toFixed(0)}% Laba</Text></View>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}><View style={{width:10,height:10,backgroundColor:'#4CD7F6',borderRadius:2}}/><Text style={s.splitSub}>{op.toFixed(0)}% Biaya</Text></View>
              </View>
            </View>
            <View style={{width:ms2,height:ms2,alignItems:'center',justifyContent:'center'}}>
              <Svg width={ms2} height={ms2}><G rotation="-90" origin={`${ms2/2},${ms2/2}`}>
                <Circle stroke="#1F1F25" fill="none" cx={ms2/2} cy={ms2/2} r={mr2} strokeWidth={mw}/>
                <Circle stroke="#D0BCFF" fill="none" cx={ms2/2} cy={ms2/2} r={mr2} strokeWidth={mw} strokeDasharray={mc} strokeDashoffset={0} strokeLinecap="round" />
                <Circle stroke="#4CD7F6" fill="none" cx={ms2/2} cy={ms2/2} r={mr2} strokeWidth={mw} strokeDasharray={mc} strokeDashoffset={aO} strokeLinecap="round" />
              </G></Svg>
            </View>
          </View>

          <View style={{flexDirection:'row',gap:16,marginBottom:16}}>
            <View style={[s.glassPanel, {flex: 1, padding: 16}]}>
              <Text style={s.splitSub}>OMZET KOTOR</Text>
              <Text style={[s.splitVal, {fontSize: 18, marginTop: 4}]} adjustsFontSizeToFit numberOfLines={1}>{fmt(mm.gi)}</Text>
            </View>
            <View style={[s.glassPanel, {flex: 1, padding: 16}]}>
              <Text style={s.splitSub}>POTONGAN ADMIN</Text>
              <Text style={[s.splitVal, {fontSize: 18, color: '#FFB4AB', marginTop: 4}]} adjustsFontSizeToFit numberOfLines={1}>-{fmt(mm.af)}</Text>
            </View>
          </View>

          <View style={[s.glassPanel, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}]}>
            <View>
              <Text style={s.splitSub}>MODAL BARANG (HPP)</Text>
              <Text style={[s.splitSub, {fontSize: 12}]}>Cost of Goods Sold</Text>
            </View>
            <Text style={s.splitVal}>-{fmt(mm.cg)}</Text>
          </View>

          <View style={s.glowPanel}>
            <Text style={[s.splitSub, {color: '#4EDEA3', letterSpacing: 2}]}>✨ LABA BERSIH</Text>
            <Text style={s.superGlow} adjustsFontSizeToFit numberOfLines={1}>{fmt(mm.np)}</Text>
            <View style={s.trendPill}>
              <Text style={s.trendText}>↗ Laba Aktif</Text>
            </View>
          </View>

        </ScrollView>

        {/* === PAGE 3: Neraca === */}
        <ScrollView style={{width:SCREEN_WIDTH}} contentContainerStyle={{paddingHorizontal:24,paddingBottom:20}} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          
          <View style={[s.glassPanel, {marginBottom: 16, padding: 20}]}>
            <Text style={[s.bLabel, {marginBottom: 16}]}>Arus Kas Mingguan</Text>
            <CashFlowChart transactions={transactions} selectedMonth={selectedMonth} />
          </View>

          {latestSnapshot ? (
            <View style={{gap:16}}>
              <View style={[s.glassPanel, {alignItems: 'flex-start'}]}>
                <Text style={s.splitSub}>Total Ekuitas (Net Worth)</Text>
                <Text style={[s.bigNumGlow, {fontSize: 36, marginBottom: 16}]} adjustsFontSizeToFit numberOfLines={1}>{fmt(nw)}</Text>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 4}}>
                  <Text style={[s.splitVal, {color: '#4EDEA3', fontSize: 13}]}>+ Aset</Text>
                  <Text style={[s.splitVal, {color: '#4EDEA3', fontSize: 13}]}>{fmt(aL)}</Text>
                </View>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}>
                  <Text style={[s.splitVal, {color: '#FFB4AB', fontSize: 13}]}>- Liabilitas</Text>
                  <Text style={[s.splitVal, {color: '#FFB4AB', fontSize: 13}]}>{fmt(kw)}</Text>
                </View>
              </View>

              <View style={[s.glassPanel, {flexDirection: 'row', alignItems: 'center', gap: 12}]}>
                <View style={{backgroundColor: 'rgba(76, 215, 246, 0.2)', padding: 10, borderRadius: 8}}><Text>🛒</Text></View>
                <View>
                  <Text style={s.splitSub}>Konteks Operasional</Text>
                  <Text style={s.splitVal}>{latestSnapshot.reseller_aktif} Reseller Aktif</Text>
                  <Text style={s.splitSub}>{latestSnapshot.pesanan_bulan} Pesanan /bln</Text>
                </View>
              </View>

              <View style={s.glassPanel}>
                <Text style={[s.bLabel, {marginBottom: 16}]}>Distribusi Aset</Text>
                {[['Kas & Bank', latestSnapshot.kas_bisnis||0], ['Piutang', latestSnapshot.piutang||0], ['Stok', latestSnapshot.stok_gudang||0]].map(([lbl, val], i) => (
                  <View key={i} style={{marginBottom: 12}}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
                      <Text style={s.splitVal}>{lbl as string}</Text>
                      <Text style={s.splitVal}>{fmt(val as number)}</Text>
                    </View>
                    <View style={s.trackBar}><View style={[s.fillBar, {width: `${Math.min(100, Math.max(5, (val as number)/aL*100))}%`, backgroundColor: '#4EDEA3'}]} /></View>
                  </View>
                ))}
              </View>

              <View style={s.glassPanel}>
                <Text style={[s.bLabel, {marginBottom: 16}]}>Komposisi Liabilitas</Text>
                {[['Utang Supplier', latestSnapshot.utang_supplier||0], ['Pinjaman Bank', latestSnapshot.pinjaman||0]].map(([lbl, val], i) => (
                  <View key={i} style={{marginBottom: 12}}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
                      <Text style={s.splitVal}>{lbl as string}</Text>
                      <Text style={s.splitVal}>{fmt(val as number)}</Text>
                    </View>
                    <View style={s.trackBar}><View style={[s.fillBar, {width: `${kw ? Math.min(100, Math.max(5, (val as number)/kw*100)) : 0}%`, backgroundColor: '#FFB4AB'}]} /></View>
                  </View>
                ))}
              </View>

            </View>
          ) : (
            <View style={[s.glassPanel, {alignItems: 'center', paddingVertical: 40}]}>
              <Text style={s.splitVal}>Belum ada data neraca.</Text>
              <Text style={s.splitSub}>Isi data di tab "Laporan".</Text>
            </View>
          )}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  pagingContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 24, marginTop: 8 },
  pageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  pageLine: { width: 24, backgroundColor: '#D0BCFF', shadowColor: '#D0BCFF', shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.8, shadowRadius: 8, elevation: 4 },
  
  centerBlock: { alignItems: 'center', marginBottom: 32 },
  labelTop: { color: '#CBC3D7', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  bigNumGlow: { color: '#D0BCFF', fontSize: 44, fontWeight: '800', letterSpacing: -1.5, textShadowColor: 'rgba(208, 188, 255, 0.4)', textShadowOffset: {width: 0, height: 0}, textShadowRadius: 20 },
  trendPill: { marginTop: 12, backgroundColor: 'rgba(78, 222, 163, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(78, 222, 163, 0.2)' },
  trendText: { color: '#4EDEA3', fontSize: 12, fontWeight: '600' },
  
  glassPanel: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', shadowColor: '#D0BCFF', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.02, shadowRadius: 16, elevation: 0 },
  glowPanel: { backgroundColor: 'rgba(78, 222, 163, 0.05)', borderRadius: 16, padding: 32, borderWidth: 1, borderColor: 'rgba(78, 222, 163, 0.3)', alignItems: 'center', shadowColor: '#4EDEA3', shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.2, shadowRadius: 20, elevation: 0 },
  superGlow: { color: '#E4E1E9', fontSize: 36, fontWeight: '800', marginVertical: 8 },
  
  donutBox: { alignItems: 'center', justifyContent: 'center', height: 180 },
  donutMid: { position: 'absolute', alignItems: 'center' },
  donutLbl: { fontSize: 10, color: '#CBC3D7', fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  donutTxt: { fontSize: 18, fontWeight: '800', color: '#E4E1E9' },
  
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 16 },
  legendBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8, shadowOffset: {width: 0, height: 0}, shadowOpacity: 1, shadowRadius: 6 },
  legendLabel: { fontSize: 10, color: '#CBC3D7', fontWeight: '600', marginBottom: 2 },
  legendVal: { fontSize: 14, color: '#E4E1E9', fontWeight: '700' },
  
  splitRow: { flexDirection: 'row', gap: 16, marginTop: 16 },
  splitCard: { flex: 1, padding: 16, borderTopWidth: 2 },
  splitLabel: { fontSize: 11, fontWeight: '700', marginBottom: 8 },
  splitVal: { fontSize: 18, color: '#E4E1E9', fontWeight: '700' },
  splitSub: { fontSize: 11, color: '#958EA0', marginTop: 4 },
  
  bLabel: { fontSize: 16, color: '#E4E1E9', fontWeight: '700' },
  trackBar: { width: '100%', height: 6, backgroundColor: '#2A292F', borderRadius: 3, overflow: 'hidden' },
  fillBar: { height: '100%', borderRadius: 3 }
});
