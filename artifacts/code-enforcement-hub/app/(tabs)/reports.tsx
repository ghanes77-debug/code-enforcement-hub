import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

export default function ReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cases, properties } = useApp();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const totalCases = cases.length;
  const openCases = cases.filter(c => c.status === 'Open').length;
  const pendingCases = cases.filter(c => c.status === 'Pending').length;
  const closedCases = cases.filter(c => c.status === 'Closed').length;
  const noticeSentCases = cases.filter(c => c.status === 'Notice Sent').length;
  const reinspectionCases = cases.filter(c => c.status === 'Reinspection Needed').length;
  const totalViolations = cases.reduce((sum, c) => sum + c.violations.length, 0);
  const totalNotices = cases.reduce((sum, c) => sum + c.notices.length, 0);

  const violationsByOrdinance: Record<string, number> = {};
  cases.forEach(c => {
    c.violations.forEach(v => {
      const key = `Sec. ${v.ordinanceSectionNumber}`;
      violationsByOrdinance[key] = (violationsByOrdinance[key] || 0) + 1;
    });
  });

  const ordEntries = Object.entries(violationsByOrdinance).sort((a, b) => b[1] - a[1]);
  const maxViol = ordEntries.length > 0 ? ordEntries[0][1] : 1;

  const statusRows = [
    { label: 'Open', value: openCases, color: colors.statusOpen },
    { label: 'Pending', value: pendingCases, color: colors.statusPending },
    { label: 'Notice Sent', value: noticeSentCases, color: colors.statusNoticeSent },
    { label: 'Reinspection Needed', value: reinspectionCases, color: colors.statusReinspection },
    { label: 'Closed', value: closedCases, color: colors.statusClosed },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 120 : 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPadding + 12 }]}>
        <Text style={[styles.title, { color: colors.primaryForeground }]}>Reports</Text>
        <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.7)' }]}>Summary as of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
      </View>

      <View style={{ padding: 16 }}>
        {/* Overview Cards */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Overview</Text>
        <View style={styles.overviewGrid}>
          <MetricCard label="Total Cases" value={totalCases} color={colors.primary} colors={colors} />
          <MetricCard label="Total Violations" value={totalViolations} color={colors.statusReinspection} colors={colors} />
          <MetricCard label="Notices Issued" value={totalNotices} color={colors.statusNoticeSent} colors={colors} />
          <MetricCard label="Properties" value={properties.length} color={colors.statusClosed} colors={colors} />
        </View>

        {/* Status Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Case Status Breakdown</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {statusRows.map(({ label, value, color }) => (
            <View key={label} style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.foreground }]}>{label}</Text>
              <View style={styles.barRow}>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { backgroundColor: color, width: `${(value / (totalCases || 1)) * 100}%` as any }]} />
                </View>
                <Text style={[styles.barValue, { color: colors.mutedForeground }]}>{value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Violations by Ordinance */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Violations by Ordinance</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {ordEntries.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No violations recorded</Text>
          ) : ordEntries.map(([section, count]) => (
            <View key={section} style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.foreground }]}>{section}</Text>
              <View style={styles.barRow}>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { backgroundColor: colors.accent, width: `${(count / maxViol) * 100}%` as any }]} />
                </View>
                <Text style={[styles.barValue, { color: colors.mutedForeground }]}>{count}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function MetricCard({ label, value, color, colors }: any) {
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: color }]}>
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 12, marginTop: 8 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 10,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 14,
    gap: 4,
  },
  metricValue: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  metricLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  card: { borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 20, gap: 12 },
  statusRow: { gap: 6 },
  statusLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barBg: { flex: 1, height: 8, backgroundColor: '#e8edf3', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, minWidth: 4 },
  barValue: { fontSize: 12, fontFamily: 'Inter_600SemiBold', width: 24, textAlign: 'right' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', padding: 12 },
});
