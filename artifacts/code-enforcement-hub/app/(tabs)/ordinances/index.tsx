import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

const CATEGORIES = ['All', 'Property Maintenance', 'Nuisance Abatement', 'Vehicles', 'Building Standards', 'Public Health', 'Signs'];

export default function OrdinancesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ordinances } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const filtered = ordinances.filter(o => {
    const matchCat = category === 'All' || o.category === category;
    const matchSearch = !search ||
      o.sectionNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.summary.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPadding + 12 }]}>
        <Text style={[styles.title, { color: colors.primaryForeground }]}>Ordinance Library</Text>
        <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.7)' }]}>{ordinances.length} ordinances</Text>
        <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={[styles.searchInput, { color: colors.primaryForeground }]}
            placeholder="Search by section or title..."
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catScroll}
        style={[styles.catBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.chip,
              { borderColor: category === cat ? colors.accent : colors.border },
              category === cat && { backgroundColor: colors.accent },
            ]}
            onPress={() => setCategory(cat)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.chipText,
              { color: category === cat ? '#fff' : colors.mutedForeground }
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 120 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map(ord => (
          <TouchableOpacity
            key={ord.id}
            style={[styles.ordCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/ordinances/${ord.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.ordHeader}>
              <View style={[styles.sectionBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.sectionNum, { color: colors.primaryForeground }]}>Sec. {ord.sectionNumber}</Text>
              </View>
              <View style={[styles.catChip, { backgroundColor: colors.accent + '20', borderColor: colors.accent + '40' }]}>
                <Text style={[styles.catText, { color: colors.accent }]}>{ord.category}</Text>
              </View>
            </View>
            <Text style={[styles.ordTitle, { color: colors.foreground }]}>{ord.title}</Text>
            <Text style={[styles.ordSummary, { color: colors.mutedForeground }]} numberOfLines={2}>
              {ord.summary}
            </Text>
            <View style={styles.readMore}>
              <Text style={[styles.readMoreText, { color: colors.primary }]}>Read full text</Text>
              <Feather name="chevron-right" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Feather name="book" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No ordinances found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  catBar: { borderBottomWidth: 1 },
  catScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  ordCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  ordHeader: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' },
  sectionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  sectionNum: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  catChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1 },
  catText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  ordTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  ordSummary: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, marginBottom: 10 },
  readMore: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  readMoreText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  empty: { alignItems: 'center', padding: 40, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
