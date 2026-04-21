import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useUserManagement } from '@/context/UserManagementContext';

const fmt = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function AuditLogScreen() {
  const colors = useColors();
  const { auditLog } = useUserManagement();

  return (
    <>
      <Stack.Screen options={{ title: 'Audit Log', headerStyle: { backgroundColor: colors.primary } as any, headerTintColor: colors.primaryForeground }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.webContent]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>USER & ROLE CHANGES</Text>
        {auditLog.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="clipboard" size={34} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No audit entries yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>User and role changes will appear here with actor ID and display name snapshots.</Text>
          </View>
        ) : auditLog.map(entry => (
          <View key={entry.id} style={[styles.auditCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.auditHeader}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primary + '12' }]}>
                <Feather name={entry.targetType === 'role' ? 'shield' : 'user'} size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.action, { color: colors.foreground }]}>{entry.action}</Text>
                <Text style={[styles.target, { color: colors.mutedForeground }]}>{entry.targetDisplayName}</Text>
              </View>
              <Text style={[styles.time, { color: colors.mutedForeground }]}>{fmt(entry.createdAt)}</Text>
            </View>
            <View style={[styles.detailBox, { backgroundColor: colors.background }]}>
              <Text style={[styles.detail, { color: colors.mutedForeground }]}>Actor: {entry.actorDisplayName} ({entry.actorUserId})</Text>
              <Text style={[styles.detail, { color: colors.mutedForeground }]}>Target ID: {entry.targetId}</Text>
              {!!entry.details && <Text style={[styles.detail, { color: colors.mutedForeground }]}>{entry.details}</Text>}
            </View>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 80 },
  webContent: { maxWidth: 760, alignSelf: 'center', width: '100%' },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 8 },
  empty: { alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 28, gap: 8 },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  emptyText: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },
  auditCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  auditHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  action: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  target: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  time: { fontSize: 10, fontFamily: 'Inter_500Medium', maxWidth: 82, textAlign: 'right' },
  detailBox: { borderRadius: 8, padding: 9, marginTop: 10, gap: 3 },
  detail: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});
