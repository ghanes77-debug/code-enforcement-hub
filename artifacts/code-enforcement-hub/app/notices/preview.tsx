import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { useSettings } from '@/context/SettingsContext';
import { useUserManagement } from '@/context/UserManagementContext';
import { NoticeStage, CaseViolation } from '@/types/models';

// ─── Stage color lookup ───────────────────────────────────────────────────────

const STAGE_COLOR: Record<string, string> = {
  'First Notice':  '#2563eb',
  'Second Notice': '#d97706',
  'Final Notice':  '#dc2626',
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function NoticePreviewScreen() {
  const colors = useColors();
  const router = useRouter();
  const { caseId, noticeId, stage: rawStage } =
    useLocalSearchParams<{ caseId?: string; noticeId?: string; stage?: string }>();

  const { getCaseById, getPropertyById, getResponsiblePartyById, markNoticeSent } = useApp();
  const { settings } = useSettings();
  const { hasPermission } = useUserManagement();
  const [markingAsSent, setMarkingAsSent] = useState(false);

  const enfCase  = caseId ? getCaseById(caseId) : undefined;
  const notice   = enfCase?.notices.find(n => n.id === noticeId);
  const property = enfCase ? getPropertyById(enfCase.propertyId) : undefined;
  const rp       = enfCase ? getResponsiblePartyById(enfCase.responsiblePartyId) : undefined;

  const stage = (notice?.stage ?? rawStage ?? 'First Notice') as NoticeStage;
  const color = STAGE_COLOR[stage] ?? colors.primary;

  const violations: CaseViolation[] = enfCase
    ? enfCase.violations.filter(v => notice?.violationIds.includes(v.id))
    : [];

  // ─── Date formatters ────────────────────────────────────────────────────────
  const fmtLong  = (iso?: string) => iso
    ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';
  const fmtShort = (iso?: string) => iso
    ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

  // ─── Actions ────────────────────────────────────────────────────────────────
  const handleSave = () =>
    Alert.alert(
      'Notice Saved',
      `This notice has been saved to Case ${enfCase?.caseNumber ?? ''} and can be found in the Notices tab.`,
      [{ text: 'OK' }]
    );

  const handleEdit = () => {
    if (!caseId) return;
    router.back();
  };

  const handleMarkAsSent = () => {
    if (!caseId || !noticeId) return;
    Alert.alert(
      'Mark as Sent',
      'Confirm that this notice has been physically mailed or hand-delivered to the responsible party. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Sent',
          onPress: async () => {
            setMarkingAsSent(true);
            try {
              markNoticeSent(caseId, noticeId);
              setTimeout(() => setMarkingAsSent(false), 400);
            } catch (error) {
              setMarkingAsSent(false);
              Alert.alert('Permission Required', error instanceof Error ? error.message : 'You do not have permission to mark notices as sent.');
            }
          },
        },
      ]
    );
  };

  const handleExport = () =>
    Alert.alert(
      'Export PDF',
      'PDF export will be available in a future update. To print this notice, use your device\'s print function.',
      [{ text: 'OK' }]
    );

  // ─── Not-found state ─────────────────────────────────────────────────────────
  if (!enfCase || !notice) {
    return (
      <View style={[styles.notFoundWrap, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Notice Preview',
            headerStyle: { backgroundColor: colors.primary } as any,
            headerTintColor: colors.primaryForeground,
            headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
          }}
        />
        <Feather name="file-text" size={40} color={colors.mutedForeground} />
        <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>Notice Not Found</Text>
        <Text style={[styles.notFoundSub, { color: colors.mutedForeground }]}>
          This notice could not be loaded. It may have been deleted.
        </Text>
        <TouchableOpacity
          style={[styles.goBackBtn, { borderColor: colors.primary }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.goBackBtnText, { color: colors.primary }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isSent = !!notice.sentAt;
  const canSendNotice = hasPermission('notices', 'edit');
  const rpAddr = rp?.address
    ? `${rp.address}, ${rp.city ?? ''}, ${rp.state ?? ''} ${rp.zip ?? ''}`.trim().replace(/,\s*,/, ',')
    : undefined;
  const propAddr = property
    ? `${property.address}, ${property.city}, ${property.state} ${property.zip}`
    : '—';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notice Preview',
          headerStyle: { backgroundColor: colors.primary } as any,
          headerTintColor: colors.primaryForeground,
          headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
          headerRight: () => (
            <TouchableOpacity onPress={handleExport} style={{ paddingHorizontal: 8 }}>
              <Feather name="download" size={20} color={colors.primaryForeground} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={[styles.root, { backgroundColor: colors.background }]}>

        {/* ── Status bar ─────────────────────────────────────────── */}
        <View style={[styles.statusBar, { backgroundColor: color + '10', borderBottomColor: color + '30' }]}>
          <View style={[styles.stagePill, { backgroundColor: color }]}>
            <Text style={styles.stagePillText}>{stage}</Text>
          </View>
          {isSent ? (
            <View style={[styles.sentPill, { backgroundColor: '#16a34a18', borderColor: '#16a34a40' }]}>
              <Feather name="check-circle" size={12} color="#16a34a" />
              <Text style={[styles.sentPillText, { color: '#16a34a' }]}>
                Sent {fmtShort(notice.sentAt)}
              </Text>
            </View>
          ) : (
            <View style={[styles.draftPill, { backgroundColor: '#d9770618', borderColor: '#d9770640' }]}>
              <Feather name="clock" size={12} color="#d97706" />
              <Text style={[styles.draftPillText, { color: '#d97706' }]}>Draft</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <Text style={[styles.noticeDateLabel, { color: color }]}>
            {fmtShort(notice.createdAt)}
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Letter paper ───────────────────────────────────────── */}
          <View style={styles.letterPaper}>

            {/* 1. Letterhead */}
            <View style={[styles.letterhead, { backgroundColor: colors.primary }]}>
              <View style={styles.letterheadSeal}>
                <Feather name="shield" size={22} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={styles.cityName}>{settings.cityName.toUpperCase()}</Text>
              <Text style={styles.deptName}>{settings.departmentName.toUpperCase()}</Text>
              <View style={styles.letterheadDivider} />
              <Text style={styles.deptContact}>
                {settings.cityAddress}  ·  {settings.cityPhone}
              </Text>
            </View>

            {/* 2. Notice type ribbon */}
            <View style={[styles.ribbon, { backgroundColor: color + '15', borderBottomColor: color + '35' }]}>
              <Text style={[styles.ribbonText, { color }]}>
                NOTICE OF VIOLATION — {stage.toUpperCase()}
              </Text>
            </View>

            {/* 3. Case metadata row */}
            <View style={[styles.metaRow, { borderBottomColor: '#e8edf3' }]}>
              <MetaCell label="Notice Date"  value={fmtLong(notice.createdAt)} />
              <View style={[styles.metaDivider, { backgroundColor: '#e8edf3' }]} />
              <MetaCell label="Case Number"  value={enfCase.caseNumber} />
              <View style={[styles.metaDivider, { backgroundColor: '#e8edf3' }]} />
              <MetaCell label="Compliance Deadline" value={fmtLong(notice.dueDate)} highlight color={color} />
            </View>

            {/* 4. Address block */}
            <View style={[styles.addrBlock, { borderBottomColor: '#e8edf3' }]}>
              <View style={styles.addrCol}>
                <Text style={styles.addrLabel}>TO (Responsible Party)</Text>
                <Text style={styles.addrName}>{rp?.name ?? '—'}</Text>
                {rpAddr && <Text style={styles.addrLine}>{rpAddr}</Text>}
                {rp?.phone && <Text style={styles.addrLine}>{rp.phone}</Text>}
                {rp?.email && <Text style={styles.addrLine}>{rp.email}</Text>}
              </View>
              <View style={styles.addrCol}>
                <Text style={styles.addrLabel}>SUBJECT PROPERTY</Text>
                <Text style={styles.addrName}>{property?.address ?? '—'}</Text>
                {property && (
                  <Text style={styles.addrLine}>
                    {property.city}, {property.state} {property.zip}
                  </Text>
                )}
                {property?.parcelNumber && (
                  <Text style={styles.addrLine}>Parcel: {property.parcelNumber}</Text>
                )}
              </View>
            </View>

            {/* 5. Salutation + Opening */}
            <View style={styles.section}>
              <Text style={styles.salutation}>Dear {rp?.name ?? 'Property Owner'},</Text>
              <Text style={styles.bodyText}>
                {stage === 'First Notice'  ? settings.openingFirst  :
                 stage === 'Second Notice' ? settings.openingSecond :
                 settings.openingFinal}
              </Text>
            </View>

            {/* 6. Violations */}
            <View style={[styles.violSection, { borderTopColor: '#e8edf3' }]}>
              <Text style={styles.violSectionTitle}>VIOLATIONS IDENTIFIED</Text>
              {violations.length === 0 ? (
                <Text style={styles.bodyText}>No violations specified.</Text>
              ) : violations.map((v, i) => (
                <View
                  key={v.id}
                  style={[
                    styles.violBlock,
                    i < violations.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e8edf3' },
                  ]}
                >
                  <View style={styles.violHeader}>
                    <View style={styles.violNumBadge}>
                      <Text style={styles.violNum}>{i + 1}</Text>
                    </View>
                    <Text style={styles.violTitle}>{v.violationTitle}</Text>
                  </View>
                  <View style={styles.violDetail}>
                    <View style={styles.violOrdRow}>
                      <Feather name="book-open" size={11} color="#666" />
                      <Text style={styles.violOrd}>
                        Ordinance Reference: Section {v.ordinanceSectionNumber}
                      </Text>
                    </View>
                    <Text style={styles.violDesc}>{v.violationDescription}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* 7. Compliance deadline callout */}
            <View style={[styles.deadlineCallout, { backgroundColor: color + '0c', borderColor: color + '35', borderLeftColor: color }]}>
              <Feather name="calendar" size={16} color={color} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.deadlineLabel, { color }]}>COMPLIANCE REQUIRED BY</Text>
                <Text style={[styles.deadlineDate, { color }]}>{fmtLong(notice.dueDate)}</Text>
                <Text style={styles.deadlineSub}>
                  All violations listed above must be fully corrected by this date.
                </Text>
              </View>
            </View>

            {/* 8. Closing paragraph */}
            <View style={styles.section}>
              <Text style={styles.bodyText}>
                {stage === 'Final Notice' ? settings.closingFinal : settings.closingDefault}
              </Text>
              <Text style={[styles.bodyText, { marginTop: 10 }]}>
                If you have questions, wish to schedule a compliance inspection, or need to discuss an
                extension, please contact the {settings.departmentName} before the deadline.
              </Text>
            </View>

            {/* 9. Inspector signature block */}
            <View style={[styles.signatureBlock, { borderTopColor: '#e8edf3', backgroundColor: '#f8fafc' }]}>
              <Text style={styles.signatureClose}>Respectfully submitted,</Text>
              <Text style={styles.inspectorName}>{settings.inspectorName}</Text>
              <Text style={styles.inspectorRole}>
                {settings.inspectorRole}, {settings.inspectorDepartment}
              </Text>
              {settings.inspectorBadge ? (
                <Text style={styles.inspectorDetail}>Badge No. {settings.inspectorBadge}</Text>
              ) : null}
              <View style={styles.signatureContactRow}>
                {settings.inspectorPhone ? (
                  <View style={styles.signatureContactItem}>
                    <Feather name="phone" size={11} color="#555" />
                    <Text style={styles.signatureContactText}>{settings.inspectorPhone}</Text>
                  </View>
                ) : null}
                {settings.inspectorEmail ? (
                  <View style={styles.signatureContactItem}>
                    <Feather name="mail" size={11} color="#555" />
                    <Text style={styles.signatureContactText}>{settings.inspectorEmail}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* 10. Footer */}
            <View style={[styles.letterFooter, { borderTopColor: '#e8edf3' }]}>
              <Text style={styles.footerText}>
                This is an official notice issued by the {settings.cityName} {settings.departmentName}
                {' '}pursuant to applicable municipal code. Retain this document for your records.
                {' '}Ref: {enfCase.caseNumber} · {stage}
              </Text>
            </View>
          </View>

          {/* ── Action buttons ──────────────────────────────────────── */}
          <View style={styles.actionGrid}>

            {/* Save Notice */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleSave}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primary + '15' }]}>
                <Feather name="save" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>Save Notice</Text>
              <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>Confirm saved to case</Text>
            </TouchableOpacity>

            {/* Edit Notice */}
            {canSendNotice && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={handleEdit}
                activeOpacity={0.75}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#7c3aed15' }]}>
                  <Feather name="edit-2" size={18} color="#7c3aed" />
                </View>
                <Text style={[styles.actionLabel, { color: colors.foreground }]}>Edit Notice</Text>
                <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>Go back &amp; regenerate</Text>
              </TouchableOpacity>
            )}

            {/* Mark as Sent */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                isSent
                  ? { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }
                  : { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={isSent || !canSendNotice ? undefined : handleMarkAsSent}
              activeOpacity={isSent || !canSendNotice ? 1 : 0.75}
              disabled={isSent || !canSendNotice}
            >
              {markingAsSent ? (
                <ActivityIndicator size="small" color="#16a34a" style={styles.actionIcon} />
              ) : (
                <View style={[styles.actionIcon, { backgroundColor: isSent ? '#16a34a20' : '#16a34a15' }]}>
                  <Feather name={isSent ? 'check-circle' : 'send'} size={18} color="#16a34a" />
                </View>
              )}
              <Text style={[styles.actionLabel, { color: isSent ? '#16a34a' : colors.foreground }]}>
                {isSent ? 'Notice Sent' : canSendNotice ? 'Mark as Sent' : 'View Only'}
              </Text>
              <Text style={[styles.actionSub, { color: isSent ? '#16a34a99' : colors.mutedForeground }]}>
                {isSent ? `Sent ${fmtShort(notice.sentAt)}` : canSendNotice ? 'Record delivery confirmation' : 'No send permission'}
              </Text>
            </TouchableOpacity>

            {/* Export PDF */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleExport}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#dc262615' }]}>
                <Feather name="file-text" size={18} color="#dc2626" />
              </View>
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>Export PDF</Text>
              <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>Coming in next update</Text>
            </TouchableOpacity>

          </View>

          {/* Done */}
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Feather name="check" size={18} color="#fff" />
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </>
  );
}

// ─── MetaCell ─────────────────────────────────────────────────────────────────

function MetaCell({ label, value, highlight, color }: {
  label: string; value: string; highlight?: boolean; color?: string;
}) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaCellLabel}>{label}</Text>
      <Text style={[styles.metaCellValue, highlight && color ? { color, fontFamily: 'Inter_700Bold' } : {}]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Status bar
  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 9, borderBottomWidth: 1,
  },
  stagePill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  stagePillText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.3 },
  sentPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1,
  },
  sentPillText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  draftPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1,
  },
  draftPillText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  noticeDateLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  scrollContent: {
    padding: 14,
    paddingBottom: Platform.OS === 'web' ? 80 : 50,
    gap: 14,
    ...Platform.select({ web: { maxWidth: 800, alignSelf: 'center' as const, width: '100%' } }),
  },

  // Letter paper
  letterPaper: {
    backgroundColor: '#fff',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  // 1. Letterhead
  letterhead: {
    paddingTop: 22, paddingBottom: 18, paddingHorizontal: 20,
    alignItems: 'center', gap: 3,
  },
  letterheadSeal: { marginBottom: 6 },
  cityName: {
    fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 3,
  },
  deptName: {
    fontSize: 10, fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.8)', letterSpacing: 1.5,
  },
  letterheadDivider: {
    width: 40, height: 1, backgroundColor: 'rgba(255,255,255,0.4)', marginVertical: 6,
  },
  deptContact: {
    fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.6)',
  },

  // 2. Ribbon
  ribbon: {
    paddingVertical: 9, paddingHorizontal: 20,
    alignItems: 'center', borderBottomWidth: 1,
  },
  ribbonText: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.2 },

  // 3. Metadata row
  metaRow: {
    flexDirection: 'row', borderBottomWidth: 1,
  },
  metaCell: {
    flex: 1, padding: 12, alignItems: 'center',
  },
  metaCellLabel: {
    fontSize: 9, fontFamily: 'Inter_600SemiBold', color: '#888',
    letterSpacing: 0.8, marginBottom: 4, textTransform: 'uppercase',
  },
  metaCellValue: {
    fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#1a1a1a', textAlign: 'center',
  },
  metaDivider: { width: 1, marginVertical: 10 },

  // 4. Address block
  addrBlock: {
    flexDirection: 'row', borderBottomWidth: 1,
  },
  addrCol: {
    flex: 1, padding: 14,
  },
  addrLabel: {
    fontSize: 9, fontFamily: 'Inter_700Bold', color: '#888',
    letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase',
  },
  addrName: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1a1a1a', marginBottom: 2 },
  addrLine: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#444', lineHeight: 18 },

  // 5. Salutation + body
  section: { padding: 18, gap: 10 },
  salutation: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#1a1a1a' },
  bodyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#222', lineHeight: 21 },

  // 6. Violations
  violSection: { borderTopWidth: 1, paddingTop: 14, paddingHorizontal: 18, paddingBottom: 4 },
  violSectionTitle: {
    fontSize: 10, fontFamily: 'Inter_700Bold', color: '#666',
    letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase',
  },
  violBlock: { paddingBottom: 14, marginBottom: 4 },
  violHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  violNumBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#1e3a5f', alignItems: 'center', justifyContent: 'center',
  },
  violNum: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff' },
  violTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1a1a1a', flex: 1 },
  violDetail: { paddingLeft: 32, gap: 5 },
  violOrdRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  violOrd: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#555' },
  violDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#444', lineHeight: 18 },

  // 7. Deadline callout
  deadlineCallout: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginHorizontal: 18, marginBottom: 4,
    borderWidth: 1, borderLeftWidth: 4, borderRadius: 6, padding: 14,
  },
  deadlineLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, marginBottom: 3 },
  deadlineDate: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  deadlineSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#555' },

  // 9. Signature block
  signatureBlock: {
    borderTopWidth: 1, padding: 18, gap: 3,
  },
  signatureClose: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#444', marginBottom: 8 },
  inspectorName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#1a1a1a' },
  inspectorRole: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#444' },
  inspectorDetail: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#555' },
  signatureContactRow: { flexDirection: 'row', gap: 16, marginTop: 6, flexWrap: 'wrap' },
  signatureContactItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  signatureContactText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#555' },

  // 10. Footer
  letterFooter: {
    borderTopWidth: 1, padding: 14, alignItems: 'center',
  },
  footerText: {
    fontSize: 10, fontFamily: 'Inter_400Regular', color: '#999',
    textAlign: 'center', lineHeight: 16,
  },

  // ── Action grid ──
  actionGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  actionBtn: {
    width: '47%', borderRadius: 10, borderWidth: 1,
    padding: 14, gap: 6, minHeight: 100,
    // TS workaround for flex: none without flex: '47%'
    flexGrow: 0, flexShrink: 1,
  },
  actionIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  actionSub: { fontSize: 11, fontFamily: 'Inter_400Regular' },

  // Done button
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 10, padding: 15,
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },

  // Not found
  notFoundWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32,
  },
  notFoundTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  notFoundSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 21 },
  goBackBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5 },
  goBackBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
