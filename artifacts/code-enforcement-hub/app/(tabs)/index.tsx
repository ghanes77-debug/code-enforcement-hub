import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { useSettings } from '@/context/SettingsContext';
import { useUserManagement } from '@/context/UserManagementContext';
import { useSession } from '@/context/SessionContext';
import CaseCard from '@/components/CaseCard';

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { cases, properties, responsibleParties, getDashboardStats } = useApp();
  const { settings } = useSettings();
  const { currentUser, hasPermission } = useUserManagement();
  const { session } = useSession();
  const isPSA = currentUser.role === 'Platform Super Admin';
  const viewingTenantId = session?.viewAsTenantId;
  const municipalityLabel = viewingTenantId
    ? `Viewing: ${viewingTenantId}`
    : currentUser.municipality;
  const stats = getDashboardStats();
  const isWide = screenWidth >= 580;

  const recentCases = cases
    .filter(c => c.status !== 'Closed')
    .sort((a, b) => new Date(b.openedDate).getTime() - new Date(a.openedDate).getTime())
    .slice(0, 3);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPadding + 16,
        paddingBottom: bottomPadding + 100,
        paddingHorizontal: 16,
        ...(Platform.OS === 'web' && { maxWidth: 720, alignSelf: 'center' as const, width: '100%' }),
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good morning,</Text>
          <Text style={[styles.userName, { color: colors.foreground }]}>{currentUser.displayName.replace(/^Officer\\s+/, '')}</Text>
        </View>
        <View style={[styles.badgeBox, { backgroundColor: colors.primary }]}>
          <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>{settings.inspectorBadge}</Text>
        </View>
      </View>

      {/* Municipality / Department Banner */}
      <View style={[styles.deptBanner, { backgroundColor: colors.primary }]}>
        <MaterialCommunityIcons name="shield-check" size={20} color={colors.accent} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.deptText, { color: colors.primaryForeground }]}>{settings.inspectorDepartment}</Text>
          <Text style={[styles.muniText, { color: colors.accent }]}>{municipalityLabel}</Text>
        </View>
        {isPSA && !viewingTenantId && (
          <View style={[styles.psaBadge, { backgroundColor: colors.accent + '25', borderColor: colors.accent + '60' }]}>
            <Text style={[styles.psaBadgeText, { color: colors.accent }]}>All Tenants</Text>
          </View>
        )}
        {isPSA && viewingTenantId && (
          <View style={[styles.psaBadge, { backgroundColor: '#f59e0b25', borderColor: '#f59e0b60' }]}>
            <Text style={[styles.psaBadgeText, { color: '#f59e0b' }]}>Filtered View</Text>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <View style={[styles.statsGrid, isWide && { flexWrap: 'nowrap' }]}>
        <StatCard label="Open" value={stats.open} color={colors.statusOpen} icon="folder" colors={colors} wide={isWide} />
        <StatCard label="Pending" value={stats.pending} color={colors.statusPending} icon="clock" colors={colors} wide={isWide} />
        <StatCard label="Notice Sent" value={stats.noticeSent} color={colors.statusNoticeSent} icon="mail" colors={colors} wide={isWide} />
        <StatCard label="Closed" value={stats.closed} color={colors.statusClosed} icon="check-circle" colors={colors} wide={isWide} />
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
      <View style={styles.quickActions}>
        {hasPermission('caseManagement', 'edit') && (
          <QuickAction
            icon="plus-circle"
            label="New Case"
            color={colors.primary}
            colors={colors}
            onPress={() => router.push('/cases/new')}
          />
        )}
        <QuickAction
          icon="book"
          label="Search Ordinances"
          color={colors.accent}
          colors={colors}
          onPress={() => router.push('/ordinances/')}
        />
        {hasPermission('notices', 'edit') && (
          <QuickAction
            icon="file-text"
            label="Generate Notice"
            color={colors.statusNoticeSent}
            colors={colors}
            onPress={() => router.push('/notices/generate')}
          />
        )}
      </View>

      {/* Recent Active Cases */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active Cases</Text>
      {recentCases.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No active cases</Text>
      ) : (
        recentCases.map(c => (
          <CaseCard
            key={c.id}
            enfCase={c}
            property={properties.find(p => p.id === c.propertyId)}
            responsibleParty={responsibleParties.find(rp => rp.id === c.responsiblePartyId)}
          />
        ))
      )}

      <TouchableOpacity
        style={[styles.viewAllBtn, { borderColor: colors.primary }]}
        onPress={() => router.push('/cases/')}
        activeOpacity={0.7}
      >
        <Text style={[styles.viewAllText, { color: colors.primary }]}>View All Cases</Text>
        <Feather name="arrow-right" size={16} color={colors.primary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({ label, value, color, icon, colors, wide }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }, wide && { minWidth: 0 }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, color, colors, onPress }: any) {
  return (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.qaIcon, { backgroundColor: color + '15' }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.qaLabel, { color: colors.foreground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  greeting: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  userName: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  badgeBox: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  badgeText: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  deptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  deptText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  muniText: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 1 },
  psaBadge: {
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  psaBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  quickAction: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  qaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', padding: 20 },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 6,
    marginTop: 4,
  },
  viewAllText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
