import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { useUserManagement } from '@/context/UserManagementContext';
import StatusBadge from '@/components/StatusBadge';
import { NoticeStage } from '@/types/models';
import { useSettings } from '@/context/SettingsContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_COLOR: Record<NoticeStage, string> = {
  'First Notice':  '#2563eb',
  'Second Notice': '#d97706',
  'Final Notice':  '#dc2626',
};

const STAGE_DESC: Record<NoticeStage, string> = {
  'First Notice':  'Initial formal notification. Gives the responsible party the specified number of days to achieve compliance.',
  'Second Notice': 'Follow-up notice for uncorrected violations. Reduces the compliance window.',
  'Final Notice':  'Last warning before enforcement action. Compliance required within the specified timeframe.',
};

const ALL_STAGES: NoticeStage[] = ['First Notice', 'Second Notice', 'Final Notice'];

// ─── Template engine ──────────────────────────────────────────────────────────

interface InspectorInfo {
  name: string; role: string; department: string;
  badge: string; phone: string; email: string;
  cityName: string; cityAddress: string; cityPhone: string;
  openingFirst: string; openingSecond: string; openingFinal: string;
  closingDefault: string; closingFinal: string;
}

function buildNoticeContent(params: {
  caseNumber: string;
  rpName: string;
  propertyAddress: string;
  stage: NoticeStage;
  violations: { title: string; sectionNumber: string; description: string; deadline: string }[];
  dueDate: Date;
  info: InspectorInfo;
}): string {
  const { caseNumber, rpName, propertyAddress, stage, violations, dueDate, info } = params;

  const today     = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dueDateStr = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const opening =
    stage === 'First Notice'  ? info.openingFirst  :
    stage === 'Second Notice' ? info.openingSecond :
    info.openingFinal;

  const closing =
    stage === 'Final Notice' ? info.closingFinal : info.closingDefault;

  let body = '';
  body += `Date: ${today}\n`;
  body += `Case No.: ${caseNumber}\n`;
  body += `\nTo: ${rpName}\n`;
  body += `Re: ${propertyAddress}\n`;
  body += `\nDear ${rpName},\n\n`;
  body += `${opening}\n`;

  violations.forEach((v, i) => {
    body += `\n${i + 1}. VIOLATION: ${v.title}\n`;
    body += `   Ordinance Reference: Section ${v.sectionNumber}\n`;
    body += `   Description: ${v.description}\n`;
  });

  body += `\nYou are hereby required to correct ALL violations listed above no later than:\n\n    ${dueDateStr}\n\n`;
  body += `${closing}\n\n`;
  body += `If you have questions or wish to discuss compliance options, please contact:\n\n`;
  body += `    ${info.department}\n`;
  body += `    ${info.cityPhone}  |  ${info.cityAddress}\n\n`;
  body += `Respectfully,\n\n`;
  body += `${info.name}\n`;
  body += `${info.role}, ${info.department}\n`;
  body += `Badge No. ${info.badge}\n`;
  body += `Phone: ${info.phone}  |  Email: ${info.email}`;

  return body;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function GenerateNoticeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { caseId } = useLocalSearchParams<{ caseId?: string }>();
  const { cases, getCaseById, getPropertyById, getResponsiblePartyById, addNotice, updateCaseStatus } = useApp();
  const { settings } = useSettings();
  const { hasPermission } = useUserManagement();

  const [selectedCaseId, setSelectedCaseId] = useState<string>(caseId ?? '');
  const [stage, setStage] = useState<NoticeStage>('First Notice');
  const [selectedViolIds, setSelectedViolIds] = useState<string[]>([]);

  const activeCases = cases.filter(c => c.status !== 'Closed');
  const enfCase     = getCaseById(selectedCaseId);
  const property    = enfCase ? getPropertyById(enfCase.propertyId)            : undefined;
  const rp          = enfCase ? getResponsiblePartyById(enfCase.responsiblePartyId) : undefined;

  const getStageDays = (s: NoticeStage) =>
    s === 'First Notice'  ? settings.firstNoticeDays  :
    s === 'Second Notice' ? settings.secondNoticeDays :
    settings.finalNoticeDays;

  const stageDays  = getStageDays(stage);
  const dueDate    = (() => { const d = new Date(); d.setDate(d.getDate() + stageDays); return d; })();
  const dueDateStr = dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const toggleViol = (id: string) =>
    setSelectedViolIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectAllViols = () =>
    setSelectedViolIds(enfCase?.violations.map(v => v.id) ?? []);

  const handleGenerate = () => {
    if (!enfCase) { Alert.alert('Required', 'Please select a case.'); return; }
    if (selectedViolIds.length === 0) { Alert.alert('Required', 'Select at least one violation.'); return; }

    const selectedViols = enfCase.violations
      .filter(v => selectedViolIds.includes(v.id))
      .map(v => ({
        title: v.violationTitle,
        sectionNumber: v.ordinanceSectionNumber,
        description: v.violationDescription,
        deadline: v.complianceDeadline,
      }));

    const content = buildNoticeContent({
      caseNumber: enfCase.caseNumber,
      rpName: rp?.name ?? 'Property Owner',
      propertyAddress: property
        ? `${property.address}, ${property.city}, ${property.state} ${property.zip}`
        : 'Unknown Property',
      stage,
      violations: selectedViols,
      dueDate,
      info: {
        name:           settings.inspectorName,
        role:           settings.inspectorRole,
        department:     settings.inspectorDepartment,
        badge:          settings.inspectorBadge,
        phone:          settings.inspectorPhone,
        email:          settings.inspectorEmail,
        cityName:       settings.cityName,
        cityAddress:    settings.cityAddress,
        cityPhone:      settings.cityPhone,
        openingFirst:   settings.openingFirst,
        openingSecond:  settings.openingSecond,
        openingFinal:   settings.openingFinal,
        closingDefault: settings.closingDefault,
        closingFinal:   settings.closingFinal,
      },
    });

    try {
      const newNotice = addNotice(enfCase.id, {
        stage,
        createdAt: new Date().toISOString(),
        dueDate: dueDate.toISOString(),
        violationIds: selectedViolIds,
        content,
      });

      updateCaseStatus(enfCase.id, 'Notice Sent');

      router.replace(
        `/notices/preview?caseId=${enfCase.id}&noticeId=${newNotice.id}&stage=${encodeURIComponent(stage)}`
      );
    } catch (error) {
      Alert.alert('Permission Required', error instanceof Error ? error.message : 'You do not have permission to generate notices.');
    }
  };

  if (!hasPermission('notices', 'edit')) {
    return (
      <>
        <Stack.Screen options={{ title: 'Generate Notice', headerStyle: { backgroundColor: colors.primary } as any, headerTintColor: colors.primaryForeground }} />
        <View style={[styles.container, styles.restricted, { backgroundColor: colors.background }]}>
          <Feather name="lock" size={36} color={colors.mutedForeground} />
          <Text style={[styles.restrictedTitle, { color: colors.foreground }]}>Notice Generation Restricted</Text>
          <Text style={[styles.restrictedText, { color: colors.mutedForeground }]}>Your current role can view notices but cannot generate or send them.</Text>
        </View>
      </>
    );
  }

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
      <KeyboardAwareScrollViewCompat
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Platform.OS === 'web' ? 80 : 48,
          ...(Platform.OS === 'web' && { maxWidth: 720, alignSelf: 'center' as const, width: '100%' }),
        }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >

        {/* ── Step 1: Select Case ─────────────────────────────────── */}
        {!caseId && (
          <>
            <StepHeader step="1" title="Select Case" required colors={colors} />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {activeCases.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No active cases found.</Text>
              ) : activeCases.map((c, i) => {
                const prop = getPropertyById(c.propertyId);
                const selected = selectedCaseId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.caseRow,
                      i < activeCases.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                      selected && { backgroundColor: colors.primary + '08' },
                    ]}
                    onPress={() => { setSelectedCaseId(c.id); setSelectedViolIds([]); }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.caseRowTop}>
                        <Text style={[styles.caseNum, { color: selected ? colors.primary : colors.foreground }]}>
                          {c.caseNumber}
                        </Text>
                        <StatusBadge status={c.status} size="sm" />
                      </View>
                      {prop && (
                        <Text style={[styles.caseAddr, { color: colors.mutedForeground }]} numberOfLines={1}>
                          {prop.address}, {prop.city}
                        </Text>
                      )}
                    </View>
                    {selected && <Feather name="check-circle" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Case context banner (when caseId is locked in) */}
        {enfCase && caseId && (
          <View style={[styles.contextBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
            <Feather name="folder" size={14} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.contextCase, { color: colors.primary }]}>{enfCase.caseNumber}</Text>
              {property && (
                <Text style={[styles.contextAddr, { color: colors.primary + '99' }]} numberOfLines={1}>
                  {property.address}, {property.city}
                </Text>
              )}
            </View>
          </View>
        )}

        {enfCase && (
          <>
            {/* ── Step 2: Notice Stage ─────────────────────────────── */}
            <StepHeader step={caseId ? '1' : '2'} title="Notice Stage" required colors={colors} />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {ALL_STAGES.map((s, i) => {
                const sc    = STAGE_COLOR[s];
                const days  = getStageDays(s);
                const desc  = STAGE_DESC[s];
                const active = stage === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.stageRow,
                      i < ALL_STAGES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                      active && { backgroundColor: sc + '0a' },
                    ]}
                    onPress={() => setStage(s)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.stageRadio, { borderColor: active ? sc : colors.border }]}>
                      {active && <View style={[styles.stageRadioFill, { backgroundColor: sc }]} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.stageLabelRow}>
                        <Text style={[styles.stageLabel, { color: active ? sc : colors.foreground }]}>{s}</Text>
                        <View style={[styles.stageDaysPill, { backgroundColor: sc + '18' }]}>
                          <Text style={[styles.stageDaysText, { color: sc }]}>{days} days</Text>
                        </View>
                      </View>
                      <Text style={[styles.stageDesc, { color: colors.mutedForeground }]}>{desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Compliance date preview */}
            <View style={[styles.deadlineBanner, { backgroundColor: colors.primary + '0a', borderColor: colors.primary + '30' }]}>
              <Feather name="calendar" size={14} color={colors.primary} />
              <Text style={[styles.deadlineText, { color: colors.foreground }]}>
                Compliance Deadline: <Text style={{ fontFamily: 'Inter_700Bold', color: colors.primary }}>{dueDateStr}</Text>
              </Text>
            </View>

            {/* ── Step 3: Select Violations ────────────────────────── */}
            <View style={styles.stepTitleRow}>
              <StepHeader step={caseId ? '2' : '3'} title="Select Violations" required colors={colors} />
              {enfCase.violations.length > 1 && (
                <TouchableOpacity onPress={selectAllViols} activeOpacity={0.7}>
                  <Text style={[styles.selectAll, { color: colors.primary }]}>Select all</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {enfCase.violations.length === 0 ? (
                <View style={styles.noViolations}>
                  <Feather name="alert-triangle" size={20} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    No violations recorded on this case.
                  </Text>
                  <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
                    Add violations first before generating a notice.
                  </Text>
                </View>
              ) : enfCase.violations.map((v, i) => {
                const checked = selectedViolIds.includes(v.id);
                const vDue = v.complianceDeadline
                  ? new Date(v.complianceDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : null;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.violRow,
                      i < enfCase.violations.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                      checked && { backgroundColor: colors.primary + '06' },
                    ]}
                    onPress={() => toggleViol(v.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, {
                      borderColor: checked ? colors.primary : colors.border,
                      backgroundColor: checked ? colors.primary : 'transparent',
                    }]}>
                      {checked && <Feather name="check" size={12} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.violTitle, { color: colors.foreground }]}>{v.violationTitle}</Text>
                      <Text style={[styles.violMeta, { color: colors.mutedForeground }]}>
                        Sec. {v.ordinanceSectionNumber}
                        {vDue ? `  ·  Deadline: ${vDue}` : ''}
                      </Text>
                      {v.violationDescription ? (
                        <Text style={[styles.violDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                          {v.violationDescription}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Step 4: Auto-fill Preview ────────────────────────── */}
            <StepHeader step={caseId ? '3' : '4'} title="Auto-Filled Information" colors={colors} />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <InfoRow label="Recipient"       value={rp?.name ?? 'Property Owner'}             colors={colors} />
              <InfoRow label="Property"        value={property ? `${property.address}, ${property.city}` : '—'} colors={colors} />
              <InfoRow label="Case Number"     value={enfCase.caseNumber}                        colors={colors} />
              <InfoRow label="Notice Date"     value={new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} colors={colors} />
              <InfoRow label="Compliance By"   value={dueDateStr}                               colors={colors} />
              <InfoRow label="Inspector"       value={settings.inspectorName}                    colors={colors} />
              <InfoRow label="Badge No."       value={settings.inspectorBadge}                   colors={colors} last />
            </View>
          </>
        )}

        {/* ── Generate button ──────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.generateBtn,
            { backgroundColor: enfCase ? colors.primary : colors.border },
          ]}
          onPress={handleGenerate}
          activeOpacity={0.85}
          disabled={!enfCase}
        >
          <Feather name="file-text" size={18} color="#fff" />
          <Text style={styles.generateBtnText}>Generate & Preview Notice</Text>
        </TouchableOpacity>

      </KeyboardAwareScrollViewCompat>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepHeader({ step, title, required, colors }: { step: string; title: string; required?: boolean; colors: any }) {
  return (
    <View style={styles.stepHeader}>
      <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
        <Text style={styles.stepNum}>{step}</Text>
      </View>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>{title}</Text>
      {required && <Text style={[styles.requiredTag, { color: '#dc2626' }]}>Required</Text>}
    </View>
  );
}

function InfoRow({ label, value, colors, last }: { label: string; value: string; colors: any; last?: boolean }) {
  return (
    <View style={[
      styles.infoRow,
      !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    ]}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={2}>{value || '—'}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  restricted: { alignItems: 'center', justifyContent: 'center', padding: 28 },
  restrictedTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginTop: 12 },
  restrictedText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19, marginTop: 6 },

  contextBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 9, padding: 12, marginBottom: 18,
  },
  contextCase: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  contextAddr: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },

  stepHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 10, marginTop: 4,
  },
  stepBadge: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff' },
  stepTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', flex: 1 },
  requiredTag: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectAll: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 10 },

  card: { borderRadius: 10, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  emptyHint: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  // Case list
  caseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
  },
  caseRowTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  caseNum: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  caseAddr: { fontSize: 12, fontFamily: 'Inter_400Regular' },

  // Stage selector
  stageRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14,
  },
  stageRadio: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0,
  },
  stageRadioFill: { width: 8, height: 8, borderRadius: 4 },
  stageLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  stageLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  stageDaysPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  stageDaysText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  stageDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },

  // Deadline preview
  deadlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16,
  },
  deadlineText: { fontSize: 13, fontFamily: 'Inter_400Regular' },

  // Violations
  violRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 5, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0,
  },
  violTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  violMeta: { fontSize: 11, fontFamily: 'Inter_500Medium', marginBottom: 3 },
  violDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  noViolations: { alignItems: 'center', padding: 20, gap: 8 },

  // Auto-fill preview
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 10, paddingHorizontal: 14, gap: 12,
  },
  infoLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', flexShrink: 0 },
  infoValue: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1, textAlign: 'right' },

  // Generate button
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 10, padding: 16, marginTop: 6,
  },
  generateBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
