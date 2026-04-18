import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import StatusBadge from '@/components/StatusBadge';

export default function NoticeDetailScreen() {
  const { id, caseId } = useLocalSearchParams<{ id: string; caseId: string }>();
  const colors = useColors();
  const router = useRouter();
  const { getCaseById } = useApp();

  const enfCase = getCaseById(caseId || '');
  const notice = enfCase?.notices.find(n => n.id === id);

  if (!notice || !enfCase) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Notice not found</Text>
      </View>
    );
  }

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
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 60 : 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <StatusBadge status={notice.stage} />
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Created</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>
              {new Date(notice.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Compliance Due</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>
              {new Date(notice.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Status</Text>
            <Text style={[styles.value, { color: notice.sentAt ? colors.statusClosed : colors.statusPending }]}>
              {notice.sentAt ? 'Sent' : 'Draft'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Violations</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>{notice.violationIds.length}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.viewBtn, { backgroundColor: colors.primary }]}
          onPress={() => Alert.alert('Notice Preview', 'Full preview available from the Notice Generator.', [{ text: 'OK' }])}
          activeOpacity={0.8}
        >
          <Feather name="file-text" size={16} color="#fff" />
          <Text style={styles.viewBtnText}>View Notice Content</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 16, gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e8edf3' },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  value: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 14,
  },
  viewBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
