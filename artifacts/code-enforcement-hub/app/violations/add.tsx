import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { NoticeStage } from '@/types/models';

const NOTICE_STAGES: NoticeStage[] = ['First Notice', 'Second Notice', 'Final Notice'];

export default function AddViolationScreen() {
  const colors = useColors();
  const router = useRouter();
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const { getCaseById, addViolation, ordinances } = useApp();

  const [selectedOrdinance, setSelectedOrdinance] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('7');
  const [stage, setStage] = useState<NoticeStage>('First Notice');
  const [inspectorNotes, setInspectorNotes] = useState('');

  const selectedOrd = ordinances.find(o => o.id === selectedOrdinance);

  const handleAdd = () => {
    if (!selectedOrdinance) {
      Alert.alert('Required', 'Please select an ordinance section.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a violation title.');
      return;
    }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + parseInt(deadlineDays || '7', 10));

    addViolation(caseId!, {
      ordinanceId: selectedOrdinance,
      ordinanceSectionNumber: selectedOrd?.sectionNumber || '',
      violationTitle: title.trim(),
      violationDescription: description.trim(),
      complianceDeadline: deadline.toISOString(),
      noticeStage: stage,
      inspectorNotes: inspectorNotes.trim() || undefined,
    });

    Alert.alert('Violation Added', 'The violation has been added to the case.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Violation',
          headerStyle: { backgroundColor: colors.primary } as any,
          headerTintColor: colors.primaryForeground,
          headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Ordinance Picker */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ordinance Section</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {ordinances.map(ord => (
            <TouchableOpacity
              key={ord.id}
              style={[
                styles.ordOption,
                { borderColor: selectedOrdinance === ord.id ? colors.primary : colors.border },
                selectedOrdinance === ord.id && { backgroundColor: colors.primary + '08' },
              ]}
              onPress={() => {
                setSelectedOrdinance(ord.id);
                if (!title) setTitle(ord.title);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.ordOptionRow}>
                <View style={[styles.ordBadge, { backgroundColor: selectedOrdinance === ord.id ? colors.primary : colors.secondary }]}>
                  <Text style={[styles.ordBadgeText, { color: selectedOrdinance === ord.id ? '#fff' : colors.foreground }]}>
                    {ord.sectionNumber}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ordTitle, { color: colors.foreground }]} numberOfLines={1}>{ord.title}</Text>
                  <Text style={[styles.ordCat, { color: colors.mutedForeground }]}>{ord.category}</Text>
                </View>
                {selectedOrdinance === ord.id && <Feather name="check-circle" size={18} color={colors.primary} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Violation Details */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Violation Details</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Violation Title *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Brief description of violation"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Detailed Description</Text>
            <TextInput
              style={[styles.textarea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the specific violation observed..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Compliance Deadline (Days)</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                value={deadlineDays}
                onChangeText={setDeadlineDays}
                keyboardType="numeric"
                placeholder="7"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>
        </View>

        {/* Notice Stage */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Notice Stage</Text>
        <View style={styles.stageRow}>
          {NOTICE_STAGES.map(s => (
            <TouchableOpacity
              key={s}
              style={[
                styles.stageChip,
                { borderColor: stage === s ? colors.primary : colors.border },
                stage === s && { backgroundColor: colors.primary },
              ]}
              onPress={() => setStage(s)}
              activeOpacity={0.7}
            >
              <Text style={[styles.stageText, { color: stage === s ? '#fff' : colors.mutedForeground }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inspector Notes */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Inspector Notes (Optional)</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.textarea, { borderColor: 'transparent', color: colors.foreground, backgroundColor: 'transparent' }]}
            value={inspectorNotes}
            onChangeText={setInspectorNotes}
            placeholder="Additional observations or notes..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={handleAdd}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add Violation</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 10, marginTop: 4 },
  card: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 16, gap: 12 },
  ordOption: { borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 8 },
  ordOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ordBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  ordBadgeText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  ordTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  ordCat: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  field: { gap: 5 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  row: { flexDirection: 'row', gap: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  stageRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  stageChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  stageText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
