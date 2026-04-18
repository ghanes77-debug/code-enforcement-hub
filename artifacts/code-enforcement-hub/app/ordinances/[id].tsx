import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

export default function OrdinanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getOrdinanceById, cases, getPropertyById } = useApp();
  const ordinance = getOrdinanceById(id || '');

  const [pickerVisible, setPickerVisible] = useState(false);

  if (!ordinance) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, marginTop: 8, fontFamily: 'Inter_500Medium' }}>
          Ordinance not found
        </Text>
      </View>
    );
  }

  const openCases = cases.filter(c => c.status !== 'Closed');

  const handleSelectCase = (caseId: string) => {
    setPickerVisible(false);
    router.push(`/violations/add?caseId=${caseId}&ordinanceId=${ordinance.id}`);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: `Sec. ${ordinance.sectionNumber}`,
          headerStyle: { backgroundColor: colors.primary } as any,
          headerTintColor: colors.primaryForeground,
          headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Platform.OS === 'web' ? 120 : 100,
          ...(Platform.OS === 'web' && { maxWidth: 720, alignSelf: 'center' as const, width: '100%' }),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.sectionBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.sectionText, { color: colors.primaryForeground }]}>
              Sec. {ordinance.sectionNumber}
            </Text>
          </View>
          <View style={[styles.catBadge, { backgroundColor: colors.accent + '20', borderColor: colors.accent + '40' }]}>
            <Text style={[styles.catText, { color: colors.accent }]}>{ordinance.category}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground }]}>{ordinance.title}</Text>

        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '30' }]}>
          <View style={styles.summaryHeader}>
            <Feather name="info" size={14} color={colors.primary} />
            <Text style={[styles.summaryLabel, { color: colors.primary }]}>Summary</Text>
          </View>
          <Text style={[styles.summaryText, { color: colors.foreground }]}>{ordinance.summary}</Text>
        </View>

        {/* Full text */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Full Text</Text>
        <View style={[styles.fullTextCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fullText, { color: colors.foreground }]}>{ordinance.fullText}</Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Use in violation CTA */}
        <TouchableOpacity
          style={[styles.useBtn, { backgroundColor: colors.primary }]}
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.85}
        >
          <Feather name="alert-triangle" size={18} color="#fff" />
          <Text style={styles.useBtnText}>Use in Case Violation</Text>
        </TouchableOpacity>

        <Text style={[styles.ctaHint, { color: colors.mutedForeground }]}>
          Select an open case to log this ordinance as a violation
        </Text>
      </ScrollView>

      {/* Case picker modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPickerVisible(false)}>
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 20 : 12),
              },
            ]}
            onPress={() => {}}
          >
            {/* Sheet handle */}
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                  Select a Case
                </Text>
                <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>
                  Adding violation for Sec. {ordinance.sectionNumber} — {ordinance.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPickerVisible(false)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Ordinance pill */}
            <View style={[styles.ordPill, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '35' }]}>
              <View style={[styles.ordPillBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.ordPillBadgeText}>{ordinance.sectionNumber}</Text>
              </View>
              <Text style={[styles.ordPillTitle, { color: colors.primary }]} numberOfLines={1}>
                {ordinance.title}
              </Text>
            </View>

            {/* Case list */}
            {openCases.length === 0 ? (
              <View style={styles.noOpenCases}>
                <Feather name="folder" size={28} color={colors.mutedForeground} />
                <Text style={[styles.noOpenCasesText, { color: colors.mutedForeground }]}>
                  No open cases found.
                </Text>
                <Text style={[styles.noOpenCasesHint, { color: colors.mutedForeground }]}>
                  Create a new case first, then add a violation.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={{ maxHeight: 340 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {openCases.map((c, i) => {
                  const property = getPropertyById(c.propertyId);
                  const isLast = i === openCases.length - 1;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.caseRow,
                        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                      ]}
                      onPress={() => handleSelectCase(c.id)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={styles.caseRowTop}>
                          <Text style={[styles.caseNum, { color: colors.foreground }]}>{c.caseNumber}</Text>
                          <StatusPill status={c.status} colors={colors} />
                        </View>
                        {property && (
                          <Text style={[styles.caseAddr, { color: colors.mutedForeground }]} numberOfLines={1}>
                            {property.address}, {property.city}
                          </Text>
                        )}
                        <Text style={[styles.caseViolCount, { color: colors.mutedForeground }]}>
                          {c.violations.length} violation{c.violations.length !== 1 ? 's' : ''} recorded
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function StatusPill({ status, colors }: { status: string; colors: any }) {
  const palette: Record<string, string> = {
    'Open': '#2563eb',
    'Pending': '#d97706',
    'Notice Sent': '#7c3aed',
    'Reinspection Needed': '#dc2626',
    'Closed': '#16a34a',
  };
  const color = palette[status] ?? colors.mutedForeground;
  return (
    <View style={[styles.statusPill, { backgroundColor: color + '18', borderColor: color + '40' }]}>
      <Text style={[styles.statusPillText, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  sectionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  sectionText: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  catText: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  title: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 14, lineHeight: 28 },

  summaryCard: { borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 20 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  summaryLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },

  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  fullTextCard: { borderRadius: 10, borderWidth: 1, padding: 14 },
  fullText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 23 },

  divider: { height: 1, marginVertical: 24 },

  useBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 10, paddingVertical: 15,
  },
  useBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  ctaHint: { textAlign: 'center', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 8 },

  // Modal sheet
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
    paddingHorizontal: 16, paddingTop: 10,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14,
  },
  sheetTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  sheetSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },

  ordPill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 14,
  },
  ordPillBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  ordPillBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.5 },
  ordPillTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1 },

  noOpenCases: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  noOpenCasesText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
  noOpenCasesHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },

  caseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 13,
  },
  caseRowTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  caseNum: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  caseAddr: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  caseViolCount: { fontSize: 11, fontFamily: 'Inter_400Regular' },

  statusPill: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 5, borderWidth: 1,
  },
  statusPillText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
});
