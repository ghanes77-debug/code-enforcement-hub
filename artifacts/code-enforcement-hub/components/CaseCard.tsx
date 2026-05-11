import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from '@/components/Icon';
import { useRouter } from 'expo-router';
import { EnforcementCase, Property, ResponsibleParty } from '../types/models';
import { useColors } from '../hooks/useColors';
import StatusBadge from './StatusBadge';

interface CaseCardProps {
  enfCase: EnforcementCase;
  property?: Property;
  responsibleParty?: ResponsibleParty;
}

export default function CaseCard({ enfCase, property, responsibleParty }: CaseCardProps) {
  const colors = useColors();
  const router = useRouter();
  const openedDate = new Date(enfCase.openedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/cases/${enfCase.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.caseNumRow}>
          <Icon name="file-document-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.caseNum, { color: colors.mutedForeground }]}>{enfCase.caseNumber}</Text>
        </View>
        <StatusBadge status={enfCase.status} size="sm" />
      </View>

      {property && (
        <View style={styles.addressRow}>
          <Icon name="map-pin" size={13} color={colors.primary} />
          <Text style={[styles.address, { color: colors.foreground }]} numberOfLines={1}>
            {property.address}, {property.city}
          </Text>
        </View>
      )}

      {responsibleParty && (
        <View style={styles.partyRow}>
          <Icon name="user" size={13} color={colors.mutedForeground} />
          <Text style={[styles.party, { color: colors.mutedForeground }]} numberOfLines={1}>
            {responsibleParty.name}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.metaItem}>
          <Icon name="alert-triangle" size={12} color={colors.mutedForeground} />
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {enfCase.violations.length} violation{enfCase.violations.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="calendar" size={12} color={colors.mutedForeground} />
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>{openedDate}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  caseNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  caseNum: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  address: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  party: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e8edf3',
    paddingTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
