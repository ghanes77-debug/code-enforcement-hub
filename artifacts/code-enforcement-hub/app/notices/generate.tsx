import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { NoticeStage, EnforcementCase } from '@/types/models';
import { CURRENT_USER } from '@/data/mockData';

const NOTICE_STAGES: NoticeStage[] = ['First Notice', 'Second Notice', 'Final Notice'];

function getDeadlineDays(stage: NoticeStage): number {
  if (stage === 'First Notice') return 14;
  if (stage === 'Second Notice') return 7;
  return 5;
}

function generateNoticeContent(
  enfCase: EnforcementCase,
  propertyAddress: string,
  rpName: string,
  stage: NoticeStage,
  violationIds: string[],
  ordinances: any[],
  dueDate: Date,
): string {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dueDateStr = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const violations = enfCase.violations.filter(v => violationIds.includes(v.id));

  let content = `CITY OF SPRINGFIELD\nDEPARTMENT OF CODE ENFORCEMENT\n\nNOTICE OF VIOLATION — ${stage.toUpperCase()}\n`;
  content += `\nDate: ${today}`;
  content += `\nCase No.: ${enfCase.caseNumber}`;
  content += `\n\nTo: ${rpName}`;
  content += `\nRe: ${propertyAddress}`;
  content += `\n\nDear ${rpName},`;
  content += `\n\nThis notice is to inform you that upon inspection of the above-referenced property, the following code violation(s) have been identified:`;

  violations.forEach((v, idx) => {
    content += `\n\n${idx + 1}. VIOLATION: ${v.violationTitle}`;
    content += `\n   Ordinance Reference: Section ${v.ordinanceSectionNumber}`;
    content += `\n   Description: ${v.violationDescription}`;
  });

  content += `\n\nYou are hereby required to correct all violations listed above by:\n\n    ${dueDateStr}\n`;

  if (stage === 'Final Notice') {
    content += `\nFAILURE TO COMPLY with this Final Notice may result in municipal prosecution, fines, and/or abatement by the City at the owner's expense. The City reserves the right to take legal action to enforce compliance.`;
  } else {
    content += `\nFailure to correct the violations within the time allowed may result in further enforcement action, including fines, penalties, and/or abatement at the owner's expense.`;
  }

  content += `\n\nIf you have questions or wish to discuss this matter, please contact the Code Enforcement Division at (555) 200-1000 or visit City Hall, 100 Government Plaza, Springfield, TX 75001.`;
  content += `\n\nRespectfully,`;
  content += `\n\n${CURRENT_USER.name}\n${CURRENT_USER.role}, ${CURRENT_USER.department}\nBadge No. ${CURRENT_USER.badgeNumber}`;
  content += `\nPhone: ${CURRENT_USER.phone}\nEmail: ${CURRENT_USER.email}`;

  return content;
}

export default function GenerateNoticeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const { cases, getCaseById, getPropertyById, getResponsiblePartyById, addNotice, updateCaseStatus, ordinances } = useApp();

  const [selectedCaseId, setSelectedCaseId] = useState<string>(caseId || '');
  const [stage, setStage] = useState<NoticeStage>('First Notice');
  const [selectedViolationIds, setSelectedViolationIds] = useState<string[]>([]);

  const activeCases = cases.filter(c => c.status !== 'Closed');
  const selectedCase = getCaseById(selectedCaseId);
  const property = selectedCase ? getPropertyById(selectedCase.propertyId) : undefined;
  const rp = selectedCase ? getResponsiblePartyById(selectedCase.responsiblePartyId) : undefined;

  const toggleViolation = (id: string) => {
    setSelectedViolationIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    if (!selectedCase) {
      Alert.alert('Required', 'Please select a case.');
      return;
    }
    if (selectedViolationIds.length === 0) {
      Alert.alert('Required', 'Please select at least one violation.');
      return;
    }

    const deadlineDays = getDeadlineDays(stage);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + deadlineDays);

    const content = generateNoticeContent(
      selectedCase,
      property ? `${property.address}, ${property.city}, ${property.state} ${property.zip}` : 'Unknown Property',
      rp?.name || 'Property Owner',
      stage,
      selectedViolationIds,
      ordinances,
      dueDate,
    );

    const notice = {
      stage,
      createdAt: new Date().toISOString(),
      dueDate: dueDate.toISOString(),
      violationIds: selectedViolationIds,
      content,
    };

    addNotice(selectedCase.id, notice);
    updateCaseStatus(selectedCase.id, 'Notice Sent');

    router.push(`/notices/preview?caseId=${selectedCase.id}&content=${encodeURIComponent(content)}&stage=${encodeURIComponent(stage)}`);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Generate Notice',
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
        {/* Case Selection */}
        {!caseId && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select Case</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {activeCases.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No active cases</Text>
              ) : activeCases.map(c => {
                const prop = getPropertyById(c.propertyId);
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.caseOption,
                      { borderColor: selectedCaseId === c.id ? colors.primary : colors.border },
                      selectedCaseId === c.id && { backgroundColor: colors.primary + '08' },
                    ]}
                    onPress={() => { setSelectedCaseId(c.id); setSelectedViolationIds([]); }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.caseOptionRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.caseOptionNum, { color: colors.primary }]}>{c.caseNumber}</Text>
                        <Text style={[styles.caseOptionAddr, { color: colors.foreground }]} numberOfLines={1}>
                          {prop?.address || 'Unknown Address'}
                        </Text>
                      </View>
                      {selectedCaseId === c.id && <Feather name="check-circle" size={18} color={colors.primary} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {selectedCase && (
          <>
            <View style={[styles.infoBox, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '30' }]}>
              <Text style={[styles.infoTitle, { color: colors.primary }]}>{selectedCase.caseNumber}</Text>
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                {property ? `${property.address}, ${property.city}, ${property.state}` : 'Unknown Property'}
              </Text>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Responsible Party: {rp?.name || 'Unknown'}
              </Text>
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

            {/* Violation Selection */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select Violations to Include</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {selectedCase.violations.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No violations on this case</Text>
              ) : selectedCase.violations.map(v => (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    styles.violOption,
                    { borderColor: selectedViolationIds.includes(v.id) ? colors.primary : colors.border },
                    selectedViolationIds.includes(v.id) && { backgroundColor: colors.primary + '08' },
                  ]}
                  onPress={() => toggleViolation(v.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.violOptionRow}>
                    <View style={[
                      styles.checkbox,
                      { borderColor: selectedViolationIds.includes(v.id) ? colors.primary : colors.border },
                      selectedViolationIds.includes(v.id) && { backgroundColor: colors.primary },
                    ]}>
                      {selectedViolationIds.includes(v.id) && <Feather name="check" size={12} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.violTitle, { color: colors.foreground }]}>{v.violationTitle}</Text>
                      <Text style={[styles.violSection, { color: colors.mutedForeground }]}>Sec. {v.ordinanceSectionNumber}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Auto-fill Preview */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Auto-Filled Information</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <InfoLine label="To" value={rp?.name || 'Unknown'} colors={colors} />
              <InfoLine label="Property" value={property ? `${property.address}, ${property.city}` : 'Unknown'} colors={colors} />
              <InfoLine label="Compliance Days" value={`${getDeadlineDays(stage)} days from today`} colors={colors} />
              <InfoLine label="Inspector" value={CURRENT_USER.name} colors={colors} />
              <InfoLine label="Badge" value={CURRENT_USER.badgeNumber || ''} colors={colors} />
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.generateBtn, { backgroundColor: colors.primary }, !selectedCase && { opacity: 0.4 }]}
          onPress={handleGenerate}
          activeOpacity={0.8}
          disabled={!selectedCase}
        >
          <Feather name="file-text" size={18} color="#fff" />
          <Text style={styles.generateBtnText}>Generate Notice</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function InfoLine({ label, value, colors }: any) {
  return (
    <View style={[styles.infoLine, { borderBottomColor: colors.border }]}>
      <Text style={[styles.infoLineLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoLineValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 10, marginTop: 6 },
  card: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 16, gap: 8 },
  caseOption: { borderRadius: 8, borderWidth: 1, padding: 10 },
  caseOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  caseOptionNum: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  caseOptionAddr: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  infoBox: { borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 16, gap: 4 },
  infoTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  infoText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  stageRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  stageChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  stageText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  violOption: { borderRadius: 8, borderWidth: 1, padding: 10 },
  violOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  violTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  violSection: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  infoLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  infoLineLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  infoLineValue: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1, textAlign: 'right' },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
  },
  generateBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', padding: 12 },
});
