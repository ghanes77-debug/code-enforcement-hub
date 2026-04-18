import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

export default function OrdinanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { getOrdinanceById } = useApp();
  const ordinance = getOrdinanceById(id || '');

  if (!ordinance) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Ordinance not found</Text>
      </View>
    );
  }

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
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 60 : 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badgeRow}>
          <View style={[styles.sectionBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.sectionText, { color: colors.primaryForeground }]}>Sec. {ordinance.sectionNumber}</Text>
          </View>
          <View style={[styles.catBadge, { backgroundColor: colors.accent + '20', borderColor: colors.accent + '40' }]}>
            <Text style={[styles.catText, { color: colors.accent }]}>{ordinance.category}</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>{ordinance.title}</Text>

        <View style={[styles.summaryCard, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '30' }]}>
          <View style={styles.summaryHeader}>
            <Feather name="info" size={14} color={colors.primary} />
            <Text style={[styles.summaryLabel, { color: colors.primary }]}>Summary</Text>
          </View>
          <Text style={[styles.summaryText, { color: colors.foreground }]}>{ordinance.summary}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Full Text</Text>
        <View style={[styles.fullTextCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fullText, { color: colors.foreground }]}>{ordinance.fullText}</Text>
        </View>
      </ScrollView>
    </>
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
});
