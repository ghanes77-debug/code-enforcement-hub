import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Icon from '@/components/Icon';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import StatusBadge from '@/components/StatusBadge';

export default function NoticeDetailScreen() {
  const { id, caseId } = useLocalSearchParams<{ id: string; caseId: string }>();
  const colors = useColors();
  const router = useRouter();
  const { getCaseById } = useApp();

  const enfCase = getCaseById(caseId ?? '');
  const notice  = enfCase?.notices.find(n => n.id === id);

  if (!notice || !enfCase) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Notice',
            headerStyle: { backgroundColor: colors.primary } as any,
            headerTintColor: colors.primaryForeground,
          }}
        />
        <Icon name="alert-circle" size={32} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Notice not found</Text>
      </View>
    );
  }

  const stageColor: Record<string, string> = {
    'First Notice':  '#2563eb',
    'Second Notice': '#d97706',
    'Final Notice':  '#dc2626',
  };
  const color = stageColor[notice.stage] ?? colors.primary;

  // Violations referenced by this notice
  const linkedViolations = enfCase.violations.filter(v => notice.violationIds.includes(v.id));

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <>
      <Stack.Screen
        options={{
          title: `Notice — ${notice.stage}`,
          headerStyle: { backgroundColor: colors.primary } as any,
          headerTintColor: colors.primaryForeground,
          headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Platform.OS === 'web' ? 60 : 40,
          ...(Platform.OS === 'web' && { maxWidth: 720, alignSelf: 'center' as const, width: '100%' }),
        }}
        showsVerticalScrollIndicator={false}
      >

        {/* Stage + status header */}
        <View style={[styles.stageHeader, { backgroundColor: color + '12', borderColor: color + '35' }]}>
          <StatusBadge status={notice.stage} />
          <View style={[styles.draftPill, { backgroundColor: notice.sentAt ? '#16a34a20' : '#d9770620', borderColor: notice.sentAt ? '#16a34a40' : '#d9770640' }]}>
            <Text style={[styles.draftPillText, { color: notice.sentAt ? '#16a34a' : '#d97706' }]}>
              {notice.sentAt ? 'Sent' : 'Draft'}
            </Text>
          </View>
        </View>

        {/* Key dates */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <DataRow label="Created"          value={fmt(notice.createdAt)}  colors={colors} />
          <DataRow label="Compliance Due"   value={fmt(notice.dueDate)}    colors={colors} />
          {notice.sentAt && <DataRow label="Sent"  value={fmt(notice.sentAt)}  colors={colors} />}
          <DataRow label="Violations"       value={`${notice.violationIds.length} included`} colors={colors} last />
        </View>

        {/* Violations list */}
        {linkedViolations.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Violations Included</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {linkedViolations.map((v, i) => (
                <View
                  key={v.id}
                  style={[
                    styles.violRow,
                    i < linkedViolations.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                  ]}
                >
                  <View style={[styles.sectionPill, { backgroundColor: colors.primary }]}>
                    <Text style={styles.sectionPillText}>{v.ordinanceSectionNumber}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.violTitle, { color: colors.foreground }]}>{v.violationTitle}</Text>
                    {v.violationDescription ? (
                      <Text style={[styles.violDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {v.violationDescription}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* View full notice */}
        {notice.content ? (
          <TouchableOpacity
            style={[styles.viewBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/notices/preview?caseId=${caseId}&noticeId=${notice.id}&stage=${encodeURIComponent(notice.stage)}`)}
            activeOpacity={0.8}
          >
            <Icon name="eye" size={16} color="#fff" />
            <Text style={styles.viewBtnText}>View Full Notice</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.noContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icon name="info" size={16} color={colors.mutedForeground} />
            <Text style={[styles.noContentText, { color: colors.mutedForeground }]}>
              Full notice text is not available for this record.
            </Text>
          </View>
        )}

      </ScrollView>
    </>
  );
}

function DataRow({ label, value, colors, last }: { label: string; value: string; colors: any; last?: boolean }) {
  return (
    <View style={[
      styles.dataRow,
      !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    ]}>
      <Text style={[styles.dataLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.dataValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 14, fontFamily: 'Inter_500Medium' },

  stageHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 14,
  },
  draftPill: {
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, borderWidth: 1,
  },
  draftPillText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  card: {
    borderRadius: 10, borderWidth: 1, marginBottom: 16, overflow: 'hidden',
  },
  dataRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14,
  },
  dataLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  dataValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  sectionLabel: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 10 },

  violRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12,
  },
  sectionPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, marginTop: 2 },
  sectionPillText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.4 },
  violTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  violDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },

  viewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 10, padding: 14,
  },
  viewBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },

  noContent: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 10, padding: 14,
  },
  noContentText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
});
