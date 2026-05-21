import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, UIManager, Platform } from 'react-native';
import { useFinancialStore, FinancialTransaction as Transaction } from '../stores/financialStore';
import { Store, Megaphone, PackageOpen, CloudLightning, ChevronDown, ChevronUp } from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  limit?: number;
  filterType?: 'ALL' | 'INCOME' | 'EXPENSE';
  hideHeader?: boolean;
}

export default function TransactionHistory({ limit, filterType = 'ALL', hideHeader = false }: Props) {
  const transactions = useFinancialStore(state => state.transactions);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Proses filter
  let processedTxs = transactions;
  if (filterType !== 'ALL') {
    processedTxs = processedTxs.filter(tx => tx.type === filterType);
  }
  const recentTxs = limit ? processedTxs.slice(0, limit) : processedTxs;

  // Mengelompokkan transaksi berdasarkan Tanggal
  const groupedTxs = recentTxs.reduce((groups: Record<string, Transaction[]>, tx) => {
    const dateStr = tx.date || 'Tanpa Tanggal';
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(tx);
    return groups;
  }, {});

  const formatRupiah = (angka: number) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(angka);
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const renderIcon = (type: string, category: string) => {
    if (type === 'INCOME') {
      return (
        <View style={[styles.iconContainer, { borderColor: 'rgba(78, 222, 163, 0.3)' }]}>
          <Store color="#4EDEA3" size={20} />
        </View>
      );
    } else if (category === 'Iklan' || category === 'Marketing') {
      return (
        <View style={[styles.iconContainer, { borderColor: 'rgba(255, 180, 171, 0.3)' }]}>
          <Megaphone color="#FFB4AB" size={20} />
        </View>
      );
    } else if (category === 'Modal Awal' || type === 'CAPITAL') {
      return (
        <View style={[styles.iconContainer, { borderColor: 'rgba(208, 188, 255, 0.3)' }]}>
          <Store color="#D0BCFF" size={20} />
        </View>
      );
    }
    return (
      <View style={[styles.iconContainer, { borderColor: 'rgba(255, 180, 171, 0.3)' }]}>
        <PackageOpen color="#FFB4AB" size={20} />
      </View>
    );
  };

  const renderTransactionDetail = (item: Transaction) => {
    if (item.type === 'INCOME') {
      const grossMargin = item.amount - (item.admin_fee || 0) - (item.cogs || 0);
      const marginPercentage = item.amount > 0 ? ((grossMargin / item.amount) * 100).toFixed(1) : '0.0';

      return (
        <View style={styles.detailGrid}>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Pendapatan Kotor</Text>
            <Text style={styles.detailValueRp}>{formatRupiah(item.amount)}</Text>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Platform Fee</Text>
            <Text style={[styles.detailValueRp, { color: '#FFB4AB' }]}>- {formatRupiah(item.admin_fee || 0)}</Text>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Estimasi HPP</Text>
            <Text style={styles.detailValueRp}>- {formatRupiah(item.cogs || 0)}</Text>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Gross Margin</Text>
            <Text style={[styles.detailValueRp, { color: '#4EDEA3' }]}>{marginPercentage}%</Text>
          </View>
        </View>
      );
    }
    
    // Default fallback details
    return (
      <View style={styles.detailGrid}>
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>Detail Keterangan</Text>
          <Text style={styles.detailValueRp}>{item.description}</Text>
        </View>
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>Kategori Transaksi</Text>
          <Text style={styles.detailValueRp}>{item.category}</Text>
        </View>
      </View>
    );
  };

  if (recentTxs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Belum ada riwayat transaksi.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!hideHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>Riwayat Linimasa</Text>
        </View>
      )}

      <View style={styles.timelineContainer}>
        {/* The absolute vertical line for the timeline */}
        <View style={styles.timelineLine} />

        {Object.keys(groupedTxs).map((dateStr, idx) => {
          // Parse "DD/MM/YYYY" or whatever string format is saved. 
          // Simplification for the node: Split by "/" to get day
          const dateParts = dateStr.split('/');
          const day = dateParts[0] || '??';
          const monthIndex = parseInt(dateParts[1] || '1') - 1;
          const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
          const monthStr = months[monthIndex] || 'BLN';

          return (
            <View key={idx} style={styles.dateGroup}>
              {/* Date Node */}
              <View style={styles.dateNodeWrapper}>
                <View style={styles.dateNode}>
                  <Text style={styles.dateNodeDay}>{day}</Text>
                  <Text style={styles.dateNodeMonth}>{monthStr}</Text>
                </View>
                <View style={styles.dateLineConnector} />
              </View>

              {/* Transactions for this date */}
              <View style={styles.transactionsWrapper}>
                {groupedTxs[dateStr].map(item => {
                  const isIncome = item.type === 'INCOME';
                  const isCapital = item.type === 'CAPITAL';
                  const amountColor = isIncome ? '#4EDEA3' : isCapital ? '#D0BCFF' : '#FFB4AB';
                  const amountPrefix = (isIncome || isCapital) ? '+' : '-';
                  const isExpanded = expandedId === item.id;

                  return (
                    <TouchableOpacity 
                      key={item.id} 
                      style={styles.card}
                      activeOpacity={0.8}
                      onPress={() => toggleExpand(item.id)}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.cardLeft}>
                          {renderIcon(item.type, item.category)}
                          <View style={styles.textInfoContainer}>
                            <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
                            <View style={styles.badgeRow}>
                              <View style={styles.categoryBadge}>
                                <Text style={styles.categoryBadgeText} numberOfLines={1}>{item.category.toUpperCase()}</Text>
                              </View>
                              <Text style={styles.trxId} numberOfLines={1}>TRX-{item.id.slice(-5)}</Text>
                            </View>
                          </View>
                        </View>
                        
                        <View style={styles.cardRight}>
                          <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1}>
                            {amountPrefix}{formatRupiah(item.amount)}
                          </Text>
                          <View style={styles.syncRow}>
                            <CloudLightning color="#D0BCFF" size={12} />
                            <Text style={styles.syncText}>Synced</Text>
                          </View>
                        </View>
                      </View>

                      {/* Expandable Content */}
                      {isExpanded && (
                        <View style={styles.expandedSection}>
                          {renderTransactionDetail(item)}
                          <View style={styles.expandedActions}>
                            <TouchableOpacity style={styles.actionBtn}>
                              <Text style={styles.actionBtnText}>LIHAT BUKTI</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn}>
                              <Text style={styles.actionBtnText}>EDIT TRX</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {/* Expand/Collapse Indicator */}
                      <View style={styles.expandIconContainer}>
                        {isExpanded ? (
                          <ChevronUp color="#958EA0" size={16} />
                        ) : (
                          <ChevronDown color="#958EA0" size={16} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0,
    marginBottom: 20,
    marginTop: 12,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E4E1E9',
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: 40, // Space for the timeline nodes
  },
  timelineLine: {
    position: 'absolute',
    left: 26, // Exact center of the date node
    top: 24,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dateGroup: {
    marginBottom: 24,
    position: 'relative',
  },
  dateNodeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: -40, // Pull outside the padding
    top: 0,
    zIndex: 10,
  },
  dateNode: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#12121E',
    borderWidth: 1,
    borderColor: 'rgba(208, 188, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D0BCFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  dateNodeDay: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D0BCFF',
  },
  dateNodeMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: '#958EA0',
  },
  dateLineConnector: {
    width: 16,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  transactionsWrapper: {
    paddingLeft: 24,
    paddingTop: 8,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textInfoContainer: {
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1F1F25',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  description: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E4E1E9',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#958EA0',
    letterSpacing: 0.5,
  },
  trxId: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#958EA0',
  },
  expandIconContainer: {
    alignItems: 'center',
    marginTop: 8,
    opacity: 0.5,
  },
  expandedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailBox: {
    width: '45%',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#958EA0',
    marginBottom: 4,
  },
  detailValueRp: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E4E1E9',
  },
  expandedActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  actionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E4E1E9',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderStyle: 'dashed',
    marginTop: 24,
  },
  emptyText: {
    color: '#958EA0',
    fontWeight: '500',
  }
});
