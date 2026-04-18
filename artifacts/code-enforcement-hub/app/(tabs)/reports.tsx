import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NoticeRow {
  noticeId: string;
  caseNumber: string;
  caseId: string;
  stage: string;
  dueDate: string;
  daysRelative: number; // negative = overdue
  stageColor: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STAGE_COLOR: Record<string, string> = {
  'First Notice':  '#2563eb',
  'Second Notice': '#d97706',
  'Final Notice':  '#dc2626',
};

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function absStr(n: number) { return Math.abs(n).toString(); }

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ReportsScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const { cases, ordinances } = useApp();
  const topPad  = Platform.OS === 'web' ? 67 : insets.top;

  // ── Case counts ─────────────────────────────────────────────────────────────
  const total         = cases.length;
  const openCount     = cases.filter(c => c.status === 'Open').length;
  const pendingCount  = cases.filter(c => c.status === 'Pending').length;
  const noticeSent    = cases.filter(c => c.status === 'Notice Sent').length;
  const reinspection  = cases.filter(c => c.status === 'Reinspection Needed').length;
  const closedCount   = cases.filter(c => c.status === 'Closed').length;
  const activeCount   = total - closedCount;

  // ── Violation counts ─────────────────────────────────────────────────────────
  const totalViolations = cases.reduce((s, c) => s + c.violations.length, 0);
  const totalNotices    = cases.reduce((s, c) => s + c.notices.length, 0);

  // ── Notices due ──────────────────────────────────────────────────────────────
  const today = useMemo(() => new Date(), []);

  const noticeRows = useMemo((): NoticeRow[] => {
    const rows: NoticeRow[] = [];
    cases.forEach(c => {
      c.notices.forEach(n => {
        if (n.sentAt) return; // already delivered — skip
        const due  = new Date(n.dueDate);
        const diff = daysBetween(today, due); // positive = days remaining, negative = overdue
        rows.push({
          noticeId: n.id,
          caseId: c.id,
          caseNumber: c.caseNumber,
          stage: n.stage,
          dueDate: n.dueDate,
          daysRelative: diff,
          stageColor: STAGE_COLOR[n.stage] ?? colors.primary,
        });
      });
    });
    return rows.sort((a, b) => a.daysRelative - b.daysRelative); // overdue first
  }, [cases, today, colors.primary]);

  const overdueNotices  = noticeRows.filter(r => r.daysRelative < 0);
  const dueSoonNotices  = noticeRows.filter(r => r.daysRelative >= 0 && r.daysRelative <= 7);
  const upcomingNotices = noticeRows.filter(r => r.daysRelative > 7);

  // ── Violations by category ───────────────────────────────────────────────────
  const violByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    cases.forEach(c => {
      c.violations.forEach(v => {
        const ord = ordinances.find(o => o.id === v.ordinanceId);
        const cat = ord?.category ?? 'Other';
        map[cat] = (map[cat] ?? 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [cases, ordinances]);

  const maxCatCount = violByCategory[0]?.[1] ?? 1;

  // ── Violations by ordinance section ─────────────────────────────────────────
  const violBySection = useMemo(() => {
    const map: Record<string, { count: number; title: string }> = {};
    cases.forEach(c => {
      c.violations.forEach(v => {
        const key = `Sec. ${v.ordinanceSectionNumber}`;
        if (!map[key]) {
          const ord = ordinances.find(o => o.id === v.ordinanceId);
          map[key] = { count: 0, title: ord?.title ?? v.violationTitle };
        }
        map[key].count += 1;
      });
    });
    return Object.entries(map)
      .map(([section, { count, title }]) => ({ section, count, title }))
      .sort((a, b) => b.count - a.count);
  }, [cases, ordinances]);

  const maxSecCount = violBySection[0]?.count ?? 1;

  // ── Closed-case compliance rate ──────────────────────────────────────────────
  const complianceRate = total > 0 ? Math.round((closedCount / total) * 100) : 0;

  // ── Status rows ──────────────────────────────────────────────────────────────
  const statusRows = [
    { label: 'Open',                value: openCount,    color: colors.statusOpen },
    { label: 'Pending',             value: pendingCount, color: colors.statusPending },
    { label: 'Notice Sent',         value: noticeSent,   color: colors.statusNoticeSent },
    { label: 'Reinspection Needed', value: reinspection, color: colors.statusReinspection },
    { label: 'Closed',              value: closedCount,  color: colors.statusClosed },
  ];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 120 : 100 }}
      showsVerticalScrollIndicator={false}
    >

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPad + 14 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Reports</Text>
            <Text style={styles.headerSub}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <View style={[styles.headerBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Feather name="bar-chart-2" size={16} color="#fff" />
            <Text style={styles.headerBadgeText}>{total} cases</Text>
          </View>
        </View>

        {/* Compact KPI strip */}
        <View style={styles.kpiStrip}>
          <KpiChip label="Active" value={activeCount} color="#60a5fa" />
          <View style={styles.kpiDivider} />
          <KpiChip label="Violations" value={totalViolations} color="#f59e0b" />
          <View style={styles.kpiDivider} />
          <KpiChip label="Notices" value={totalNotices} color="#a78bfa" />
          <View style={styles.kpiDivider} />
          <KpiChip label="Closed" value={closedCount} color="#34d399" />
        </View>
      </View>

      <View style={styles.body}>

        {/* ── Case Status ──────────────────────────────────────────────── */}
        <SectionHeader title="Case Status" icon="folder" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

          {/* Stacked bar */}
          {total > 0 && (
            <View style={styles.stackedBarWrap}>
              <View style={styles.stackedBar}>
                {statusRows.map(s => s.value > 0 && (
                  <View
                    key={s.label}
                    style={[
                      styles.stackedSegment,
                      { backgroundColor: s.color, flex: s.value },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.stackedLegend}>
                {statusRows.filter(s => s.value > 0).map(s => (
                  <View key={s.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                    <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Rows */}
          {statusRows.map(({ label, value, color }, i) => (
            <View
              key={label}
              style={[
                styles.statusRow,
                i < statusRows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.statusRowLeft}>
                <View style={[styles.statusDot, { backgroundColor: color }]} />
                <Text style={[styles.statusLabel, { color: colors.foreground }]}>{label}</Text>
              </View>
              <View style={styles.statusRowRight}>
                <View style={[styles.statusBar, { backgroundColor: color + '22' }]}>
                  <View
                    style={[
                      styles.statusBarFill,
                      { backgroundColor: color, width: `${(value / (total || 1)) * 100}%` as any },
                    ]}
                  />
                </View>
                <Text style={[styles.statusCount, { color: colors.foreground }]}>{value}</Text>
                <Text style={[styles.statusPct, { color: colors.mutedForeground }]}>
                  {total > 0 ? `${Math.round((value / total) * 100)}%` : '—'}
                </Text>
              </View>
            </View>
          ))}

          {/* Compliance rate footer */}
          <View style={[styles.complianceFooter, { borderTopColor: colors.border, backgroundColor: colors.statusClosed + '0a' }]}>
            <Feather name="check-circle" size={14} color={colors.statusClosed} />
            <Text style={[styles.complianceText, { color: colors.statusClosed }]}>
              {complianceRate}% overall compliance rate
            </Text>
            <Text style={[styles.complianceSub, { color: colors.mutedForeground }]}>
              ({closedCount} of {total} cases closed)
            </Text>
          </View>
        </View>

        {/* ── Notices Due ──────────────────────────────────────────────── */}
        <SectionHeader title="Notices Due" icon="clock" colors={colors} />

        {/* Summary chips */}
        <View style={styles.noticesSummary}>
          <NoticeSummaryChip
            label="Overdue"
            count={overdueNotices.length}
            color="#dc2626"
            icon="alert-triangle"
            colors={colors}
          />
          <NoticeSummaryChip
            label="Due within 7 days"
            count={dueSoonNotices.length}
            color="#d97706"
            icon="clock"
            colors={colors}
          />
          <NoticeSummaryChip
            label="Upcoming"
            count={upcomingNotices.length}
            color={colors.primary}
            icon="calendar"
            colors={colors}
          />
        </View>

        {/* Detail rows */}
        {noticeRows.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="check-circle" size={24} color={colors.statusClosed} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All notices delivered</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              No pending compliance deadlines.
            </Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {noticeRows.map((row, i) => {
              const overdue  = row.daysRelative < 0;
              const dueSoon  = !overdue && row.daysRelative <= 7;
              const rowColor = overdue ? '#dc2626' : dueSoon ? '#d97706' : colors.primary;
              const badge    = overdue
                ? `${absStr(row.daysRelative)}d overdue`
                : row.daysRelative === 0
                ? 'Due today'
                : `${row.daysRelative}d remaining`;

              return (
                <View
                  key={row.noticeId}
                  style={[
                    styles.noticeRow,
                    i < noticeRows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                    overdue && { backgroundColor: '#dc262606' },
                  ]}
                >
                  <View style={[styles.stageTag, { backgroundColor: row.stageColor + '18', borderColor: row.stageColor + '40' }]}>
                    <Text style={[styles.stageTagText, { color: row.stageColor }]}>{row.stage}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.noticeCaseNum, { color: colors.foreground }]}>{row.caseNumber}</Text>
                    <Text style={[styles.noticeDueDate, { color: colors.mutedForeground }]}>
                      Due {new Date(row.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={[styles.dueBadge, { backgroundColor: rowColor + '18', borderColor: rowColor + '40' }]}>
                    {overdue && <Feather name="alert-circle" size={10} color={rowColor} />}
                    <Text style={[styles.dueBadgeText, { color: rowColor }]}>{badge}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Violations by Category ────────────────────────────────────── */}
        <SectionHeader title="Violations by Category" icon="tag" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {violByCategory.length === 0 ? (
            <Text style={[styles.emptyInline, { color: colors.mutedForeground }]}>No violations recorded.</Text>
          ) : violByCategory.map(([cat, count], i) => (
            <View
              key={cat}
              style={[
                styles.barRow,
                i < violByCategory.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.barLabelWrap}>
                <Text style={[styles.barLabel, { color: colors.foreground }]}>{cat}</Text>
                <Text style={[styles.barCount, { color: colors.mutedForeground }]}>{count} violation{count !== 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.barTrackWrap}>
                <View style={[styles.barTrack, { backgroundColor: colors.accent + '20' }]}>
                  <View
                    style={[
                      styles.barFill,
                      { backgroundColor: colors.accent, width: `${(count / maxCatCount) * 100}%` as any },
                    ]}
                  />
                </View>
                <Text style={[styles.barNum, { color: colors.foreground }]}>{count}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Violations by Ordinance ───────────────────────────────────── */}
        <SectionHeader title="Violations by Ordinance" icon="book-open" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {violBySection.length === 0 ? (
            <Text style={[styles.emptyInline, { color: colors.mutedForeground }]}>No violations recorded.</Text>
          ) : violBySection.map(({ section, count, title }, i) => (
            <View
              key={section}
              style={[
                styles.barRow,
                i < violBySection.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.barLabelWrap}>
                <View style={styles.ordinanceLabelRow}>
                  <View style={[styles.sectionPill, { backgroundColor: colors.primary }]}>
                    <Text style={styles.sectionPillText}>{section}</Text>
                  </View>
                  <Text style={[styles.barLabel, { color: colors.foreground }]} numberOfLines={1}>{title}</Text>
                </View>
                <Text style={[styles.barCount, { color: colors.mutedForeground }]}>
                  {count} violation{count !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.barTrackWrap}>
                <View style={[styles.barTrack, { backgroundColor: colors.primary + '18' }]}>
                  <View
                    style={[
                      styles.barFill,
                      { backgroundColor: colors.primary, width: `${(count / maxSecCount) * 100}%` as any },
                    ]}
                  />
                </View>
                <Text style={[styles.barNum, { color: colors.foreground }]}>{count}</Text>
              </View>
            </View>
          ))}
        </View>

      </View>
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.kpiChip}>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, icon, colors }: { title: string; icon: string; colors: any }) {
  return (
    <View style={styles.sectionHeader}>
      <Feather name={icon as any} size={14} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
    </View>
  );
}

function NoticeSummaryChip({
  label, count, color, icon, colors,
}: { label: string; count: number; color: string; icon: string; colors: any }) {
  return (
    <View style={[
      styles.noticeSummaryChip,
      { backgroundColor: colors.card, borderColor: count > 0 ? color + '50' : colors.border },
    ]}>
      <View style={[styles.noticeSummaryIcon, { backgroundColor: color + '15' }]}>
        <Feather name={icon as any} size={14} color={count > 0 ? color : colors.mutedForeground} />
      </View>
      <Text style={[styles.noticeSummaryCount, { color: count > 0 ? color : colors.mutedForeground }]}>
        {count}
      </Text>
      <Text style={[styles.noticeSummaryLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: { paddingHorizontal: 16, paddingBottom: 18 },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  headerTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  headerBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#fff' },

  // KPI strip
  kpiStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8,
  },
  kpiChip: { flex: 1, alignItems: 'center', gap: 2 },
  kpiValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  kpiLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.6)' },
  kpiDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 4 },

  // Body
  body: {
    padding: 14,
    gap: 0,
    ...Platform.select({ web: { maxWidth: 720, alignSelf: 'center' as const, width: '100%' } }),
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginTop: 20, marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },

  // Card
  card: {
    borderRadius: 12, borderWidth: 1,
    overflow: 'hidden', marginBottom: 2,
  },

  // Stacked bar
  stackedBarWrap: { padding: 14, paddingBottom: 12 },
  stackedBar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 10 },
  stackedSegment: {},
  stackedLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontFamily: 'Inter_400Regular' },

  // Status rows
  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 11, paddingHorizontal: 14,
  },
  statusRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 158 },
  statusDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  statusLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  statusRowRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBar: { flex: 1, height: 7, borderRadius: 4, overflow: 'hidden' },
  statusBarFill: { height: 7, borderRadius: 4, minWidth: 3 },
  statusCount: { fontSize: 13, fontFamily: 'Inter_700Bold', width: 22, textAlign: 'right' },
  statusPct: { fontSize: 11, fontFamily: 'Inter_400Regular', width: 32, textAlign: 'right' },

  // Compliance footer
  complianceFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1,
  },
  complianceText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  complianceSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },

  // Notice summary chips
  noticesSummary: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  noticeSummaryChip: {
    flex: 1, borderRadius: 10, borderWidth: 1,
    padding: 12, gap: 4, alignItems: 'center',
  },
  noticeSummaryIcon: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  noticeSummaryCount: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  noticeSummaryLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', textAlign: 'center' },

  // Notice rows
  noticeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  stageTag: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, flexShrink: 0,
  },
  stageTagText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  noticeCaseNum: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 1 },
  noticeDueDate: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  dueBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, flexShrink: 0,
  },
  dueBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  // Bar chart rows
  barRow: {
    paddingHorizontal: 14, paddingVertical: 11, gap: 6,
  },
  barLabelWrap: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8,
  },
  barLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1 },
  barCount: { fontSize: 11, fontFamily: 'Inter_400Regular', flexShrink: 0 },
  barTrackWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, minWidth: 4 },
  barNum: { fontSize: 12, fontFamily: 'Inter_700Bold', width: 20, textAlign: 'right' },

  // Ordinance section pill
  ordinanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  sectionPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  sectionPillText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.3 },

  // Empty states
  emptyCard: {
    borderRadius: 12, borderWidth: 1, padding: 28,
    alignItems: 'center', gap: 8, marginBottom: 2,
  },
  emptyTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  emptyInline: {
    fontSize: 13, fontFamily: 'Inter_400Regular',
    textAlign: 'center', padding: 20,
  },
});
