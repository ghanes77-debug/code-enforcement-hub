import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CaseStatus, NoticeStage } from '../types/models';
import { useColors } from '../hooks/useColors';

interface StatusBadgeProps {
  status: CaseStatus | NoticeStage;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors = useColors();

  const getColors = () => {
    switch (status) {
      case 'Open': return { bg: colors.statusOpen + '20', text: colors.statusOpen, border: colors.statusOpen + '40' };
      case 'Pending': return { bg: colors.statusPending + '20', text: colors.statusPending, border: colors.statusPending + '40' };
      case 'Notice Sent': return { bg: colors.statusNoticeSent + '20', text: colors.statusNoticeSent, border: colors.statusNoticeSent + '40' };
      case 'Reinspection Needed': return { bg: colors.statusReinspection + '20', text: colors.statusReinspection, border: colors.statusReinspection + '40' };
      case 'Closed': return { bg: colors.statusClosed + '20', text: colors.statusClosed, border: colors.statusClosed + '40' };
      case 'First Notice': return { bg: '#e67e2220', text: '#e67e22', border: '#e67e2240' };
      case 'Second Notice': return { bg: '#8e44ad20', text: '#8e44ad', border: '#8e44ad40' };
      case 'Final Notice': return { bg: '#c0392b20', text: '#c0392b', border: '#c0392b40' };
      default: return { bg: colors.muted, text: colors.mutedForeground, border: colors.border };
    }
  };

  const { bg, text, border } = getColors();
  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: bg, borderColor: border },
      isSmall && styles.small,
    ]}>
      <Text style={[styles.text, { color: text }, isSmall && styles.smallText]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  smallText: {
    fontSize: 10,
  },
});
