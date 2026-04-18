import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import CaseCard from '@/components/CaseCard';
import { CaseStatus } from '@/types/models';

const STATUSES: (CaseStatus | 'All')[] = ['All', 'Open', 'Pending', 'Notice Sent', 'Reinspection Needed', 'Closed'];

export default function CasesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cases, properties, responsibleParties } = useApp();
  const [filter, setFilter] = useState<CaseStatus | 'All'>('All');
  const [search, setSearch] = useState('');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const filtered = cases.filter(c => {
    const matchStatus = filter === 'All' || c.status === filter;
    const prop = properties.find(p => p.id === c.propertyId);
    const matchSearch = !search ||
      c.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
      prop?.address.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPadding + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.primaryForeground }]}>Cases</Text>
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/cases/new')}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.newBtnText}>New Case</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={[styles.searchInput, { color: colors.primaryForeground }]}
            placeholder="Search cases or addresses..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
        style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      >
        {STATUSES.map(s => (
          <TouchableOpacity
            key={s}
            style={[
              styles.chip,
              { borderColor: filter === s ? colors.primary : colors.border },
              filter === s && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFilter(s)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.chipText,
              { color: filter === s ? colors.primaryForeground : colors.mutedForeground }
            ]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Case List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Platform.OS === 'web' ? 120 : 100,
          ...(Platform.OS === 'web' && { maxWidth: 720, alignSelf: 'center' as const, width: '100%' }),
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {filtered.length} case{filtered.length !== 1 ? 's' : ''}
        </Text>
        {filtered.map(c => (
          <CaseCard
            key={c.id}
            enfCase={c}
            property={properties.find(p => p.id === c.propertyId)}
            responsibleParty={responsibleParties.find(rp => rp.id === c.responsiblePartyId)}
          />
        ))}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Feather name="folder" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No cases found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  filterBar: { borderBottomWidth: 1, maxHeight: 52 },
  filterScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'center',
  },
  chipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  count: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 10 },
  empty: { alignItems: 'center', padding: 40, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
