import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { NoticeStage, Ordinance } from '@/types/models';

const NOTICE_STAGES: NoticeStage[] = ['First Notice', 'Second Notice', 'Final Notice'];

const DEADLINE_PRESETS = [
  { label: '5 days',  value: 5  },
  { label: '7 days',  value: 7  },
  { label: '10 days', value: 10 },
  { label: '15 days', value: 15 },
  { label: '30 days', value: 30 },
];

function deadlineDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function AddViolationScreen() {
  const colors = useColors();
  const router = useRouter();
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const { getCaseById, getPropertyById, addViolation, ordinances } = useApp();

  // Ordinance picker state
  const [search, setSearch] = useState('');
  const [selectedOrdId, setSelectedOrdId] = useState<string | null>(null);

  // Violation fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [customDays, setCustomDays] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [stage, setStage] = useState<NoticeStage>('First Notice');
  const [inspectorNotes, setInspectorNotes] = useState('');

  const enfCase = getCaseById(caseId ?? '');
  const property = enfCase ? getPropertyById(enfCase.propertyId) : undefined;
  const selectedOrd = ordinances.find(o => o.id === selectedOrdId);

  // Filter + group ordinances
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? ordinances.filter(o =>
          o.sectionNumber.toLowerCase().includes(q) ||
          o.title.toLowerCase().includes(q) ||
          o.category.toLowerCase().includes(q)
        )
      : ordinances;
  }, [ordinances, search]);

  const grouped = useMemo(() => {
    const map: Record<string, Ordinance[]> = {};
    filtered.forEach(o => {
      if (!map[o.category]) map[o.category] = [];
      map[o.category].push(o);
    });
    return map;
  }, [filtered]);

  const activeDays = useCustom ? (parseInt(customDays || '0', 10) || 0) : deadlineDays;

  const selectOrdinance = (ord: Ordinance) => {
    setSelectedOrdId(ord.id);
    if (!title) setTitle(ord.title);
    if (!description) setDescription(ord.summary);
  };

  const handleSave = (addAnother = false) => {
    if (!selectedOrdId || !selectedOrd) {
      Alert.alert('Required', 'Please select an ordinance section.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a violation title.');
      return;
    }
    if (activeDays <= 0) {
      Alert.alert('Invalid', 'Compliance deadline must be at least 1 day.');
      return;
    }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + activeDays);

    addViolation(caseId!, {
      ordinanceId: selectedOrdId,
      ordinanceSectionNumber: selectedOrd.sectionNumber,
      violationTitle: title.trim(),
      violationDescription: description.trim(),
      complianceDeadline: deadline.toISOString(),
      noticeStage: stage,
      inspectorNotes: inspectorNotes.trim() || undefined,
    });

    if (addAnother) {
      // Reset form, keep ordinance selection and stage
      setTitle('');
      setDescription('');
      setInspectorNotes('');
      setDeadlineDays(7);
      setUseCustom(false);
      setCustomDays('');
    } else {
      router.back();
    }
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
      <KeyboardAwareScrollViewCompat
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 80 : 48 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >

        {/* Case context */}
        {enfCase && (
          <View style={[styles.contextBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
            <Feather name="folder" size={14} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.contextCase, { color: colors.primary }]}>{enfCase.caseNumber}</Text>
              {property && (
                <Text style={[styles.contextAddr, { color: colors.primary + 'aa' }]} numberOfLines={1}>
                  {property.address}, {property.city}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* ── Ordinance Picker ─────────────────────────────────── */}
        <SectionHeader
          step="1"
          title="Select Ordinance Section"
          required
          colors={colors}
        />

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by section, title, or category…"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Selected ordinance preview */}
        {selectedOrd && (
          <View style={[styles.selectedPreview, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '40' }]}>
            <View style={[styles.sectionPill, { backgroundColor: colors.primary }]}>
              <Text style={styles.sectionPillText}>Sec. {selectedOrd.sectionNumber}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.selectedOrdTitle, { color: colors.primary }]}>{selectedOrd.title}</Text>
              <Text style={[styles.selectedOrdCat, { color: colors.primary + '90' }]}>{selectedOrd.category}</Text>
            </View>
            <Feather name="check-circle" size={18} color={colors.primary} />
          </View>
        )}

        {/* Grouped ordinance list */}
        {filtered.length === 0 ? (
          <View style={[styles.noResults, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={20} color={colors.mutedForeground} />
            <Text style={[styles.noResultsText, { color: colors.mutedForeground }]}>No ordinances match your search</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([category, ords]) => (
            <View key={category} style={{ marginBottom: 12 }}>
              <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>{category}</Text>
              <View style={[styles.ordinanceGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {ords.map((ord, i) => {
                  const selected = selectedOrdId === ord.id;
                  return (
                    <TouchableOpacity
                      key={ord.id}
                      style={[
                        styles.ordRow,
                        i < ords.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                        selected && { backgroundColor: colors.primary + '08' },
                      ]}
                      onPress={() => selectOrdinance(ord)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.sectionPill,
                        { backgroundColor: selected ? colors.primary : colors.primary + '18' },
                      ]}>
                        <Text style={[styles.sectionPillText, !selected && { color: colors.primary }]}>
                          {ord.sectionNumber}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.ordTitle, { color: colors.foreground }]} numberOfLines={1}>
                          {ord.title}
                        </Text>
                        <Text style={[styles.ordSummary, { color: colors.mutedForeground }]} numberOfLines={2}>
                          {ord.summary}
                        </Text>
                      </View>
                      {selected && <Feather name="check" size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}

        {/* ── Violation Details ─────────────────────────────────── */}
        <SectionHeader step="2" title="Violation Details" required colors={colors} />

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Field label="Violation Title *" colors={colors}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Brief, specific description of the violation"
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="next"
            />
          </Field>

          <Field label="Detailed Description" colors={colors}>
            <TextInput
              style={[styles.textarea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the exact conditions observed at the property…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Field>
        </View>

        {/* ── Compliance Deadline ───────────────────────────────── */}
        <SectionHeader step="3" title="Compliance Deadline" required colors={colors} />

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Preset chips */}
          <View style={styles.presetRow}>
            {DEADLINE_PRESETS.map(p => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.presetChip,
                  { borderColor: (!useCustom && deadlineDays === p.value) ? colors.primary : colors.border },
                  (!useCustom && deadlineDays === p.value) && { backgroundColor: colors.primary },
                ]}
                onPress={() => { setDeadlineDays(p.value); setUseCustom(false); }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.presetChipText,
                  { color: (!useCustom && deadlineDays === p.value) ? '#fff' : colors.mutedForeground },
                ]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.presetChip,
                { borderColor: useCustom ? colors.primary : colors.border },
                useCustom && { backgroundColor: colors.primary },
              ]}
              onPress={() => setUseCustom(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetChipText, { color: useCustom ? '#fff' : colors.mutedForeground }]}>Custom</Text>
            </TouchableOpacity>
          </View>

          {useCustom && (
            <View style={styles.customDaysRow}>
              <TextInput
                style={[styles.customDaysInput, { borderColor: colors.primary, color: colors.foreground, backgroundColor: colors.background }]}
                value={customDays}
                onChangeText={setCustomDays}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                maxLength={3}
              />
              <Text style={[styles.customDaysLabel, { color: colors.mutedForeground }]}>calendar days from today</Text>
            </View>
          )}

          {/* Computed deadline date */}
          {activeDays > 0 && (
            <View style={[styles.deadlinePreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="calendar" size={14} color={colors.primary} />
              <Text style={[styles.deadlinePreviewText, { color: colors.foreground }]}>
                Deadline: <Text style={{ fontFamily: 'Inter_700Bold', color: colors.primary }}>{deadlineDate(activeDays)}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* ── Notice Stage ──────────────────────────────────────── */}
        <SectionHeader step="4" title="Notice Stage" colors={colors} />

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {NOTICE_STAGES.map((s, i) => {
            const active = stage === s;
            const stageColors: Record<NoticeStage, string> = {
              'First Notice':  '#2563eb',
              'Second Notice': '#d97706',
              'Final Notice':  '#dc2626',
            };
            return (
              <TouchableOpacity
                key={s}
                style={[
                  styles.stageRow,
                  i < NOTICE_STAGES.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  active && { backgroundColor: stageColors[s] + '0c' },
                ]}
                onPress={() => setStage(s)}
                activeOpacity={0.7}
              >
                <View style={[styles.stageRadio, { borderColor: active ? stageColors[s] : colors.border }]}>
                  {active && <View style={[styles.stageRadioFill, { backgroundColor: stageColors[s] }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stageLabel, { color: active ? stageColors[s] : colors.foreground }]}>{s}</Text>
                  <Text style={[styles.stageHint, { color: colors.mutedForeground }]}>
                    {s === 'First Notice'  && 'Initial notification to the responsible party'}
                    {s === 'Second Notice' && 'Follow-up if violation is not remedied after first notice'}
                    {s === 'Final Notice'  && 'Final warning before enforcement action is taken'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Inspector Notes ───────────────────────────────────── */}
        <SectionHeader step="5" title="Inspector Notes" subtitle="Optional" colors={colors} />

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.textarea, { borderColor: 'transparent', color: colors.foreground, backgroundColor: 'transparent', minHeight: 80 }]}
            value={inspectorNotes}
            onChangeText={setInspectorNotes}
            placeholder="Additional field observations, measurements, or context…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* ── Action buttons ────────────────────────────────────── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleSave(false)}
            activeOpacity={0.8}
          >
            <Feather name="check" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Save Violation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addAnotherBtn, { borderColor: colors.primary + '50', backgroundColor: colors.primary + '0a' }]}
            onPress={() => handleSave(true)}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={16} color={colors.primary} />
            <Text style={[styles.addAnotherText, { color: colors.primary }]}>Save & Add Another</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAwareScrollViewCompat>
    </>
  );
}

// ─── Helper components ───────────────────────────────────────────────────────

function SectionHeader({
  step, title, subtitle, required, colors,
}: {
  step: string; title: string; subtitle?: string; required?: boolean; colors: any;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
        <Text style={styles.stepNum}>{step}</Text>
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {required && <Text style={[styles.requiredTag, { color: colors.destructive ?? '#dc2626' }]}>Required</Text>}
      {subtitle && <Text style={[styles.optionalTag, { color: colors.mutedForeground }]}>{subtitle}</Text>}
    </View>
  );
}

function Field({ label, children, colors }: { label: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {children}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  contextBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 9, padding: 12, marginBottom: 20,
  },
  contextCase: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  contextAddr: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 6,
  },
  stepBadge: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff' },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', flex: 1 },
  requiredTag: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  optionalTag: { fontSize: 11, fontFamily: 'Inter_400Regular' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 9,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },

  selectedPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 9, padding: 12, marginBottom: 12,
  },
  selectedOrdTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  selectedOrdCat: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },

  categoryLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  ordinanceGroup: { borderRadius: 10, borderWidth: 1, overflow: 'hidden' },

  ordRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 12,
  },
  ordTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  ordSummary: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },

  sectionPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, marginTop: 2 },
  sectionPillText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.5 },

  noResults: { borderWidth: 1, borderRadius: 10, padding: 24, alignItems: 'center', gap: 8, marginBottom: 14 },
  noResultsText: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  card: { borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 16, gap: 14 },

  field: { gap: 5 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  input: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14, fontFamily: 'Inter_400Regular',
  },
  textarea: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, fontFamily: 'Inter_400Regular',
    minHeight: 100, textAlignVertical: 'top',
    lineHeight: 21,
  },

  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  presetChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  presetChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  customDaysRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  customDaysInput: {
    width: 64, borderWidth: 1.5, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center',
  },
  customDaysLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 },

  deadlinePreview: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 4,
  },
  deadlinePreviewText: { fontSize: 13, fontFamily: 'Inter_400Regular' },

  stageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
  stageRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stageRadioFill: { width: 8, height: 8, borderRadius: 4 },
  stageLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  stageHint: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },

  actions: { gap: 10, marginTop: 6 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 10, padding: 15,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  addAnotherBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 10, padding: 13, borderWidth: 1,
  },
  addAnotherText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
