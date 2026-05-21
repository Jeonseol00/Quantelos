import React, { useMemo, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing, TouchableOpacity } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { FinancialTransaction } from '../stores/financialStore';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface Props {
  transactions: FinancialTransaction[];
  selectedMonth: string; // e.g. "Mei 2026"
}

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80; // Fit perfectly in the glass panel
const CHART_HEIGHT = 140;

export default function CashFlowChart({ transactions, selectedMonth }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(4); // Default to last week (W5)

  // Parsing data
  const chartData = useMemo(() => {
    const monthMap: Record<string, string> = {
      'Januari': '1', 'Februari': '2', 'Maret': '3', 'April': '4',
      'Mei': '5', 'Juni': '6', 'Juli': '7', 'Agustus': '8',
      'September': '9', 'Oktober': '10', 'November': '11', 'Desember': '12'
    };
    const parts = selectedMonth.split(' ');
    const monthStr = monthMap[parts[0]] || '5';
    const yearStr = parts[1] || '2026';
    
    const dateSuffix1 = `/${monthStr}/${yearStr}`;
    const dateSuffix2 = `/${monthStr.padStart(2, '0')}/${yearStr}`;

    const filtered = transactions.filter(t => 
      t.date.endsWith(dateSuffix1) || t.date.endsWith(dateSuffix2)
    );

    const dailyData: Record<number, { income: number; expense: number }> = {};
    for (let i = 1; i <= 31; i++) {
      dailyData[i] = { income: 0, expense: 0 };
    }

    filtered.forEach(t => {
      const day = parseInt(t.date.split('/')[0], 10);
      if (day >= 1 && day <= 31) {
        if (t.type === 'INCOME') {
          dailyData[day].income += t.amount;
        } else if (t.type === 'EXPENSE') {
          dailyData[day].expense += t.amount;
        }
      }
    });

    const weeklyData = [
      { label: 'Minggu 1', in: 0, out: 0 },
      { label: 'Minggu 2', in: 0, out: 0 },
      { label: 'Minggu 3', in: 0, out: 0 },
      { label: 'Minggu 4', in: 0, out: 0 },
      { label: 'Minggu 5', in: 0, out: 0 },
    ];

    for (let day = 1; day <= 31; day++) {
      const weekIdx = Math.min(Math.floor((day - 1) / 7), 4);
      weeklyData[weekIdx].in += dailyData[day].income;
      weeklyData[weekIdx].out += dailyData[day].expense;
    }

    return weeklyData;
  }, [transactions, selectedMonth]);

  // Find max value to scale chart
  const maxVal = useMemo(() => {
    let max = 10000;
    chartData.forEach(d => {
      if (d.in > max) max = d.in;
      if (d.out > max) max = d.out;
    });
    return max * 1.25; // 25% top spacing
  }, [chartData]);

  // Animation Engine
  const growAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    growAnim.setValue(0);
    Animated.timing(growAnim, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [chartData]);

  const barWidth = 16;
  const barGap = 6;
  const groupSpacing = (CHART_WIDTH - 30 - (5 * (barWidth * 2 + barGap))) / 4;

  const renderYAxisLabels = () => {
    return [0, maxVal / 2, maxVal].map((val, idx) => {
      const yPos = CHART_HEIGHT - (val / maxVal) * CHART_HEIGHT;
      let labelStr = '0';
      if (val >= 1000000) labelStr = (val / 1000000).toFixed(1) + 'M';
      else if (val >= 1000) labelStr = (val / 1000).toFixed(0) + 'K';
      
      return (
        <SvgText
          key={idx}
          x={0}
          y={yPos === 0 ? 12 : (yPos === CHART_HEIGHT ? CHART_HEIGHT - 5 : yPos + 4)}
          fontSize="10"
          fill="rgba(255, 255, 255, 0.3)"
          fontWeight="600"
        >
          {labelStr}
        </SvgText>
      );
    });
  };

  const fmt = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);

  const activeData = activeIdx !== null ? chartData[activeIdx] : null;

  return (
    <View style={styles.container}>
      
      {/* Interactive Floating Tooltip (Glassmorphism card) */}
      <View style={styles.tooltipContainer}>
        {activeData ? (
          <View style={styles.tooltipCard}>
            <View style={styles.tooltipLeft}>
              <Text style={styles.tooltipLabel}>{activeData.label}</Text>
              <Text style={styles.tooltipSubLabel}>Detail Kas Mingguan</Text>
            </View>
            <View style={styles.tooltipValCol}>
              <View style={styles.tooltipValGroup}>
                <View style={[styles.dot, { backgroundColor: '#4EDEA3' }]} />
                <Text style={[styles.tooltipValText, { color: '#4EDEA3' }]}>{fmt(activeData.in)}</Text>
              </View>
              <View style={styles.tooltipValGroup}>
                <View style={[styles.dot, { backgroundColor: '#FFB4AB' }]} />
                <Text style={[styles.tooltipValText, { color: '#FFB4AB' }]}>{fmt(activeData.out)}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.tooltipCard, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={styles.hintText}>Ketuk grafik untuk detail mingguan</Text>
          </View>
        )}
      </View>

      <View style={styles.chartWrapper}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 25}>
          <Defs>
            {/* Emerald to Cyan Gradient */}
            <LinearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#4EDEA3" stopOpacity="1" />
              <Stop offset="100%" stopColor="#00F2FE" stopOpacity="0.4" />
            </LinearGradient>

            {/* Cyber Red to Sunset Pink Gradient */}
            <LinearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFB4AB" stopOpacity="1" />
              <Stop offset="100%" stopColor="#FF6B6B" stopOpacity="0.4" />
            </LinearGradient>
          </Defs>

          {/* Grid Lines */}
          <Line x1={30} y1={CHART_HEIGHT} x2={CHART_WIDTH} y2={CHART_HEIGHT} stroke="rgba(255, 255, 255, 0.08)" strokeWidth={1} />
          <Line x1={30} y1={CHART_HEIGHT / 2} x2={CHART_WIDTH} y2={CHART_HEIGHT / 2} stroke="rgba(255, 255, 255, 0.03)" strokeWidth={1} strokeDasharray="4,4" />
          <Line x1={30} y1={0} x2={CHART_WIDTH} y2={0} stroke="rgba(255, 255, 255, 0.03)" strokeWidth={1} strokeDasharray="4,4" />

          {/* Y-Axis Labels */}
          {renderYAxisLabels()}

          {/* Bars */}
          {chartData.map((data, index) => {
            const xGroupPos = 35 + (index * (barWidth * 2 + barGap + groupSpacing));
            const inHeight = (data.in / maxVal) * CHART_HEIGHT;
            const outHeight = (data.out / maxVal) * CHART_HEIGHT;
            const isActive = activeIdx === index;

            return (
              <React.Fragment key={index}>
                {/* Clickable transparent hot-spot boundary for touch interactions */}
                <Rect
                  x={xGroupPos - 6}
                  y={0}
                  width={barWidth * 2 + barGap + 12}
                  height={CHART_HEIGHT + 25}
                  fill="transparent"
                  onPress={() => setActiveIdx(index)}
                />

                {/* Income Bar (Gradient Neon Green) */}
                <AnimatedRect 
                  x={xGroupPos} 
                  y={growAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [CHART_HEIGHT, CHART_HEIGHT - inHeight]
                  })} 
                  width={barWidth} 
                  height={growAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, inHeight]
                  })} 
                  fill="url(#incomeGrad)" 
                  rx={3}
                  opacity={activeIdx === null || isActive ? 1 : 0.45}
                  onPress={() => setActiveIdx(index)}
                />
                
                {/* Expense Bar (Gradient Neon Red) */}
                <AnimatedRect 
                  x={xGroupPos + barWidth + barGap} 
                  y={growAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [CHART_HEIGHT, CHART_HEIGHT - outHeight]
                  })} 
                  width={barWidth} 
                  height={growAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, outHeight]
                  })} 
                  fill="url(#expenseGrad)" 
                  rx={3}
                  opacity={activeIdx === null || isActive ? 1 : 0.45}
                  onPress={() => setActiveIdx(index)}
                />

                {/* Day Label (W1 - W5) */}
                <SvgText 
                  x={xGroupPos + barWidth + (barGap / 2)} 
                  y={CHART_HEIGHT + 18} 
                  fontSize={10} 
                  fill={isActive ? '#D0BCFF' : '#958EA0'} 
                  fontWeight={isActive ? '800' : '500'}
                  textAnchor="middle"
                >
                  {`W${index + 1}`}
                </SvgText>

                {/* Active Indicator Glow Line */}
                {isActive && (
                  <Line 
                    x1={xGroupPos} 
                    y1={CHART_HEIGHT + 22} 
                    x2={xGroupPos + barWidth * 2 + barGap} 
                    y2={CHART_HEIGHT + 22} 
                    stroke="#D0BCFF" 
                    strokeWidth={2} 
                  />
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  tooltipContainer: {
    height: 80,
    marginBottom: 16,
    justifyContent: 'center',
  },
  tooltipCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tooltipLeft: {
    justifyContent: 'center',
  },
  tooltipLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D0BCFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tooltipSubLabel: {
    fontSize: 10,
    color: '#958EA0',
    fontWeight: '500',
    marginTop: 2,
  },
  tooltipValCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  tooltipValGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tooltipValText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 12,
    fontWeight: '600',
  },
  chartWrapper: {
    alignItems: 'center',
    width: '100%',
  }
});
