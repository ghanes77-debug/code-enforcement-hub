import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert,
} from 'react-native';
import Icon from '@/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useUserManagement } from '@/context/UserManagementContext';
import { useSession } from '@/context/SessionContext';
import { useApp } from '@/context/AppContext';

interface TenantSummary {
  tenantId: string;
  municipalityName: string;
  userCount: number;
  activeUserCount: number;
  totalCases: number;
  openCases: number;
}

export default function TenantManagementScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, users } = useUserManagement();
  const { session, updateSession } = useSession();
  const { cases: filteredCases } = useApp();

  if (currentUser.role !== 'Platform Super Admin') {
    return (
      <View style={[styles.restricted, { backgroundColor: colors.background }]}>
        <Icon name="lock" size={32} color={colors.mutedForeground} />
        <Text style={[styles.restrictedText, { color: colors.mutedForeground }]}>
          Tenant Management is only accessible to Platform Super Admins.
        </Text>
      </View>
    );
  }

  const tenants = useMemo<TenantSummary[]>(() => {
    const map = new Map<string, { name: string; users: typeof users }>();
    for (const u of users) {
      if (!map.has(u.municipalityId)) {
        map.set(u.municipalityId, { name: u.municipality, users: [] });
      }
      map.get(u.municipalityId)!.users.push(u);
    }
    return Array.from(map.entries())
      .filter(([id]) => id !== 'platform')
      .map(([tenantId, { name, users: tenantUsers }]) => ({
        tenantId,
        municipalityName: name,
        userCount: tenantUsers.length,
        activeUserCount: tenantUsers.filter(u => u.isActive).length,
        totalCases: 0,
        openCases: 0,
      }))
      .sort((a, b) => a.municipalityName.localeCompare(b.municipalityName));
  }, [users]);

  const viewingTenant = session?.viewAsTenantId;
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const handleViewAsTenant = (tenantId: string, name: string) => {
    if (viewingTenant === tenantId) {
      updateSession({ viewAsTenantId: undefined });
      Alert.alert('Tenant View Cleared', 'Now viewing all tenants.');
    } else {
      updateSession({ viewAsTenantId: tenantId });
      Alert.alert('Tenant View Active', `Now viewing data for ${name} only.`);
    }
  };

  const handleClearFilter = () => {
    updateSession({ viewAsTenantId: undefined });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPadding + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.primaryForeground }]}>Tenant Management</Text>
        <Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.6)' }]}>
          Platform Super Admin · All Municipalities
        </Text>
      </View>

      <View style={[styles.content, Platform.OS === 'web' && { maxWidth: 720, alignSelf: 'center' as any, width: '100%' }]}>

        {/* Active filter banner */}
        {viewingTenant && (
          <View style={[styles.filterBanner, { backgroundColor: colors.accent + '20', borderColor: colors.accent + '60' }]}>
            <Icon name="filter" size={16} color={colors.accent} />
            <Text style={[styles.filterBannerText, { color: colors.foreground }]}>
              Viewing: {tenants.find(t => t.tenantId === viewingTenant)?.municipalityName ?? viewingTenant}
            </Text>
            <TouchableOpacity onPress={handleClearFilter} style={styles.filterClearBtn}>
              <Icon name="x" size={14} color={colors.mutedForeground} />
              <Text style={[styles.filterClearText, { color: colors.mutedForeground }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Platform stats */}
        <View style={[styles.platformCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.platformIconWrap, { backgroundColor: colors.primary + '15' }]}>
            <Icon name="earth" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.platformCardTitle, { color: colors.foreground }]}>Platform Overview</Text>
            <Text style={[styles.platformCardSub, { color: colors.mutedForeground }]}>
              {tenants.length} municipality{tenants.length !== 1 ? 'ies' : ''} · {users.filter(u => u.municipalityId !== 'platform').length} total users
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MUNICIPALITIES</Text>

        {tenants.length === 0 && (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No municipalities found.</Text>
          </View>
        )}

        {tenants.map((tenant) => {
          const isViewing = viewingTenant === tenant.tenantId;
          return (
            <View
              key={tenant.tenantId}
              style={[
                styles.tenantCard,
                { backgroundColor: colors.card, borderColor: isViewing ? colors.primary : colors.border },
                isViewing && { borderWidth: 2 },
              ]}
            >
              <View style={styles.tenantHeader}>
                <View style={[styles.tenantIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Icon name="city" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tenantName, { color: colors.foreground }]}>{tenant.municipalityName}</Text>
                  <Text style={[styles.tenantId, { color: colors.mutedForeground }]}>{tenant.tenantId}</Text>
                </View>
                {isViewing && (
                  <View style={[styles.viewingBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.viewingBadgeText, { color: colors.primaryForeground }]}>Viewing</Text>
                  </View>
                )}
              </View>

              <View style={[styles.tenantStats, { borderTopColor: colors.border }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{tenant.activeUserCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active Users</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{tenant.userCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Users</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {isViewing ? filteredCases.length : '—'}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Cases</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.viewBtn,
                  {
                    backgroundColor: isViewing ? colors.destructive + '12' : colors.primary + '10',
                    borderColor: isViewing ? colors.destructive + '40' : colors.primary + '30',
                  },
                ]}
                onPress={() => handleViewAsTenant(tenant.tenantId, tenant.municipalityName)}
                activeOpacity={0.7}
              >
                <Icon
                  name={isViewing ? 'eye-off' : 'eye'}
                  size={14}
                  color={isViewing ? colors.destructive : colors.primary}
                />
                <Text style={[styles.viewBtnText, { color: isViewing ? colors.destructive : colors.primary }]}>
                  {isViewing ? 'Stop Viewing This Tenant' : 'View as This Tenant'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            When viewing as a tenant, your dashboard, cases, and reports are filtered to that municipality's records only. Clear the filter to return to platform-wide view.
          </Text>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  restricted: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  restrictedText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  headerSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  content: { padding: 16, gap: 12 },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  filterBannerText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  filterClearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterClearText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  platformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  platformIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  platformCardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  platformCardSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: -4,
    marginLeft: 2,
  },
  emptyState: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  tenantCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tenantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  tenantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tenantName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  tenantId: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  viewingBadge: {
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  viewingBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  tenantStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  statDivider: { width: 1, marginHorizontal: 8 },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    margin: 12,
    marginTop: 0,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 9,
  },
  viewBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
