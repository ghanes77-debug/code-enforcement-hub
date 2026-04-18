import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Linking, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import StatusBadge from '@/components/StatusBadge';
import { CaseStatus, EnforcementCase, Property, ResponsibleParty } from '@/types/models';

// ─── Tab config ──────────────────────────────────────────────────────────────
const TABS = [
  { key: 'info',       label: 'Case Info',  icon: 'file-text'       },
  { key: 'property',   label: 'Property',   icon: 'home'            },
  { key: 'party',      label: 'Party',      icon: 'user'            },
  { key: 'violations', label: 'Violations', icon: 'alert-triangle'  },
  { key: 'photos',     label: 'Photos',     icon: 'camera'          },
  { key: 'notes',      label: 'Notes',      icon: 'edit-3'          },
  { key: 'notices',    label: 'Notices',    icon: 'mail'            },
  { key: 'history',    label: 'History',    icon: 'clock'           },
] as const;

type TabKey = typeof TABS[number]['key'];

const STATUS_OPTIONS: CaseStatus[] = ['Open', 'Pending', 'Notice Sent', 'Reinspection Needed', 'Closed'];

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { getCaseById, getPropertyById, getResponsiblePartyById, updateCaseStatus } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  const enfCase = getCaseById(id || '');

  if (!enfCase) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Feather name="folder" size={48} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Case not found</Text>
      </View>
    );
  }

  const property = getPropertyById(enfCase.propertyId);
  const responsibleParty = getResponsiblePartyById(enfCase.responsiblePartyId);

  const handleStatusChange = (status: CaseStatus) => {
    if (status === enfCase.status) return;
    Alert.alert(
      'Update Status',
      `Change case status to "${status}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Update', onPress: () => updateCaseStatus(enfCase.id, status) },
      ]
    );
  };

  // Badge counts for tabs that can have content
  const badgeCounts: Partial<Record<TabKey, number>> = {
    violations: enfCase.violations.length || 0,
    notes: enfCase.notes.length || 0,
    notices: enfCase.notices.length || 0,
    photos: enfCase.attachments.length || 0,
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: enfCase.caseNumber,
          headerStyle: { backgroundColor: colors.primary } as any,
          headerTintColor: colors.primaryForeground,
          headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>

        {/* ── Summary header ─────────────────────────────────────── */}
        <View style={[styles.summaryHeader, { backgroundColor: colors.primary }]}>
          <View style={styles.summaryRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryAddress} numberOfLines={1}>
                {property?.address ?? '—'}
              </Text>
              <Text style={styles.summarySub}>
                {property ? `${property.city}, ${property.state} ${property.zip}` : ''}
              </Text>
            </View>
            <StatusBadge status={enfCase.status} />
          </View>
          {/* Status quick-change chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusChips}
          >
            {STATUS_OPTIONS.map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusChip,
                  s === enfCase.status
                    ? { backgroundColor: '#ffffff30', borderColor: '#ffffff80' }
                    : { borderColor: '#ffffff40' },
                ]}
                onPress={() => handleStatusChange(s)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.statusChipText,
                  { color: s === enfCase.status ? '#fff' : 'rgba(255,255,255,0.65)' },
                  s === enfCase.status && { fontFamily: 'Inter_700Bold' },
                ]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Tab bar ────────────────────────────────────────────── */}
        <View style={[styles.tabBarWrapper, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarContent}
          >
            {TABS.map(({ key, label, icon }) => {
              const active = activeTab === key;
              const count = badgeCounts[key];
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.tab,
                    active && [styles.activeTab, { borderBottomColor: colors.primary }],
                  ]}
                  onPress={() => setActiveTab(key)}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={icon as any}
                    size={13}
                    color={active ? colors.primary : colors.mutedForeground}
                  />
                  <Text style={[styles.tabLabel, { color: active ? colors.primary : colors.mutedForeground }]}>
                    {label}
                  </Text>
                  {count !== undefined && count > 0 && (
                    <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.tabBadgeText}>{count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Tab content ────────────────────────────────────────── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 60 : 48 }}
          showsVerticalScrollIndicator={false}
          key={activeTab}
        >
          {activeTab === 'info'       && <CaseInfoTab enfCase={enfCase} colors={colors} />}
          {activeTab === 'property'   && <PropertyTab property={property} colors={colors} />}
          {activeTab === 'party'      && <PartyTab party={responsibleParty} colors={colors} />}
          {activeTab === 'violations' && <ViolationsTab enfCase={enfCase} colors={colors} router={router} />}
          {activeTab === 'photos'     && <PhotosTab enfCase={enfCase} colors={colors} router={router} />}
          {activeTab === 'notes'      && <NotesTab enfCase={enfCase} colors={colors} router={router} />}
          {activeTab === 'notices'    && <NoticesTab enfCase={enfCase} colors={colors} router={router} />}
          {activeTab === 'history'    && <HistoryTab enfCase={enfCase} colors={colors} />}
        </ScrollView>

      </View>
    </>
  );
}

// ─── Case Info tab ───────────────────────────────────────────────────────────
function CaseInfoTab({ enfCase, colors }: { enfCase: EnforcementCase; colors: any }) {
  const opened  = fmt(enfCase.openedDate, { year: 'numeric', month: 'long', day: 'numeric' });
  const closed  = enfCase.closedDate ? fmt(enfCase.closedDate, { year: 'numeric', month: 'long', day: 'numeric' }) : null;
  const age     = daysSince(enfCase.openedDate);

  return (
    <View style={{ gap: 14 }}>
      <SectionCard title="Case Information" icon="file-text" colors={colors}>
        <DataRow label="Case Number"   value={enfCase.caseNumber}          colors={colors} mono />
        <DataRow label="Status"        value={enfCase.status}              colors={colors} />
        <DataRow label="Opened"        value={opened}                      colors={colors} />
        {closed && <DataRow label="Closed" value={closed}                  colors={colors} />}
        <DataRow label="Days Open"     value={closed ? '—' : `${age} days`} colors={colors} />
        <DataRow label="Violations"    value={`${enfCase.violations.length}`} colors={colors} />
        <DataRow label="Notices"       value={`${enfCase.notices.length}`}    colors={colors} />
        <DataRow label="Notes"         value={`${enfCase.notes.length}`}      colors={colors} last />
      </SectionCard>

      {enfCase.generalNotes ? (
        <SectionCard title="General Notes" icon="edit-3" colors={colors}>
          <View style={{ padding: 14 }}>
            <Text style={[styles.prose, { color: colors.foreground }]}>{enfCase.generalNotes}</Text>
          </View>
        </SectionCard>
      ) : null}
    </View>
  );
}

// ─── Property tab ────────────────────────────────────────────────────────────
function PropertyTab({ property, colors }: { property: Property | undefined; colors: any }) {
  if (!property) {
    return <EmptyState icon="home" title="No property on file" subtitle="Property information was not attached to this case." colors={colors} />;
  }
  return (
    <View style={{ gap: 14 }}>
      <SectionCard title="Address" icon="map-pin" colors={colors}>
        <DataRow label="Street"    value={property.address}                               colors={colors} />
        <DataRow label="City"      value={property.city}                                  colors={colors} />
        <DataRow label="State"     value={property.state}                                 colors={colors} />
        <DataRow label="ZIP"       value={property.zip}                                   colors={colors} last />
      </SectionCard>

      <SectionCard title="Parcel Details" icon="grid" colors={colors}>
        <DataRow label="Parcel #"     value={property.parcelNumber  ?? 'Not on file'}  colors={colors} />
        <DataRow label="Lot / Block"  value={property.lotNumber     ?? 'Not on file'}  colors={colors} />
        <DataRow label="Subdivision"  value={property.subdivision   ?? 'Not on file'}  colors={colors} />
        <DataRow label="Property Type" value={property.propertyType ?? 'Not on file'}  colors={colors} />
        <DataRow label="Zoning Code"  value={property.zoningCode   ?? 'Not on file'}  colors={colors} last />
      </SectionCard>
    </View>
  );
}

// ─── Responsible Party tab ───────────────────────────────────────────────────
function PartyTab({ party, colors }: { party: ResponsibleParty | undefined; colors: any }) {
  if (!party) {
    return <EmptyState icon="user" title="No responsible party on file" subtitle="A responsible party has not been linked to this case." colors={colors} />;
  }
  return (
    <View style={{ gap: 14 }}>
      <SectionCard title="Contact" icon="user" colors={colors}>
        <DataRow label="Name"         value={party.name}                           colors={colors} />
        <DataRow label="Relationship" value={party.relationship ?? 'Not specified'} colors={colors} />
        <DataRow label="Phone"        value={party.phone ?? 'Not on file'}         colors={colors} />
        <DataRow label="Email"        value={party.email ?? 'Not on file'}         colors={colors} last />
      </SectionCard>

      {/* Quick actions for contact */}
      <View style={styles.contactActions}>
        {party.phone ? (
          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: colors.primary }]}
            onPress={() => Linking.openURL(`tel:${party.phone}`)}
            activeOpacity={0.8}
          >
            <Feather name="phone" size={16} color="#fff" />
            <Text style={styles.contactBtnText}>Call</Text>
          </TouchableOpacity>
        ) : null}
        {party.email ? (
          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => Linking.openURL(`mailto:${party.email}`)}
            activeOpacity={0.8}
          >
            <Feather name="mail" size={16} color={colors.primary} />
            <Text style={[styles.contactBtnText, { color: colors.primary }]}>Email</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {party.address ? (
        <SectionCard title="Mailing Address" icon="map-pin" colors={colors}>
          <DataRow label="Street" value={party.address}                       colors={colors} />
          <DataRow label="City"   value={party.city   ?? ''}                  colors={colors} />
          <DataRow label="State"  value={party.state  ?? ''}                  colors={colors} />
          <DataRow label="ZIP"    value={party.zip    ?? ''}                  colors={colors} last />
        </SectionCard>
      ) : null}
    </View>
  );
}

// ─── Violations tab ──────────────────────────────────────────────────────────
function ViolationsTab({ enfCase, colors, router }: any) {
  return (
    <View>
      <AddButton
        label="Add Violation"
        icon="alert-triangle"
        onPress={() => router.push(`/violations/add?caseId=${enfCase.id}`)}
        colors={colors}
      />
      {enfCase.violations.length === 0 ? (
        <EmptyState
          icon="alert-triangle"
          title="No violations recorded"
          subtitle="Tap 'Add Violation' to document an ordinance violation for this case."
          colors={colors}
        />
      ) : enfCase.violations.map((v: any, i: number) => (
        <View key={v.id} style={[styles.violCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.violHeader}>
            <View style={[styles.ordBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.ordBadgeText}>Sec. {v.ordinanceSectionNumber}</Text>
            </View>
            <StatusBadge status={v.noticeStage} size="sm" />
          </View>
          <Text style={[styles.violTitle, { color: colors.foreground }]}>{v.violationTitle}</Text>
          {v.violationDescription ? (
            <Text style={[styles.prose, { color: colors.mutedForeground, marginTop: 4 }]}>{v.violationDescription}</Text>
          ) : null}
          <View style={[styles.violFooter, { borderTopColor: colors.border }]}>
            <Feather name="calendar" size={12} color={colors.mutedForeground} />
            <Text style={[styles.violDeadline, { color: colors.mutedForeground }]}>
              Deadline: {fmt(v.complianceDeadline, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          {v.inspectorNotes ? (
            <Text style={[styles.inspNotes, { color: colors.mutedForeground, borderTopColor: colors.border }]}>
              Inspector notes: {v.inspectorNotes}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

// ─── Photos tab ──────────────────────────────────────────────────────────────
function PhotosTab({ enfCase, colors, router }: any) {
  const [fullscreenUri, setFullscreenUri] = useState<string | null>(null);

  return (
    <View>
      <AddButton
        label="Add Photo"
        icon="camera"
        onPress={() => router.push(`/photos/add?caseId=${enfCase.id}`)}
        colors={colors}
      />

      {enfCase.attachments.length === 0 ? (
        <EmptyState
          icon="camera"
          title="No photos attached"
          subtitle="Attach site photos to document property conditions and support enforcement actions."
          colors={colors}
        />
      ) : (
        <>
          {/* Fullscreen overlay */}
          {fullscreenUri && (
            <TouchableOpacity
              style={styles.fullscreenOverlay}
              onPress={() => setFullscreenUri(null)}
              activeOpacity={1}
            >
              <Image
                source={{ uri: fullscreenUri }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
              <View style={styles.fullscreenClose}>
                <Feather name="x" size={22} color="#fff" />
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.photoGrid}>
            {enfCase.attachments.map((a: any) => (
              <TouchableOpacity
                key={a.id}
                style={[styles.photoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setFullscreenUri(a.uri)}
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: a.uri }}
                  style={styles.photoThumbImage}
                  resizeMode="cover"
                />
                <View style={[styles.photoMeta, { borderTopColor: colors.border }]}>
                  <Text style={[styles.photoFilename, { color: colors.foreground }]} numberOfLines={1}>
                    {a.caption || a.filename}
                  </Text>
                  <Text style={[styles.photoDate, { color: colors.mutedForeground }]}>
                    {fmt(a.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ─── Notes tab ───────────────────────────────────────────────────────────────
function NotesTab({ enfCase, colors, router }: any) {
  return (
    <View>
      <AddButton
        label="Add Note"
        icon="edit-3"
        onPress={() => router.push(`/notes/add?caseId=${enfCase.id}`)}
        colors={colors}
      />
      {enfCase.notes.length === 0 ? (
        <EmptyState
          icon="edit-3"
          title="No inspection notes yet"
          subtitle="Use notes to record observations, conversations, and any relevant field details."
          colors={colors}
        />
      ) : [...enfCase.notes].reverse().map((note: any) => (
        <View key={note.id} style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.noteHeader}>
            <View style={[styles.avatarDot, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarInitial}>
                {(note.authorName ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.noteAuthor, { color: colors.foreground }]}>{note.authorName}</Text>
              <Text style={[styles.noteDate, { color: colors.mutedForeground }]}>
                {fmt(note.createdAt, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
          <Text style={[styles.noteText, { color: colors.foreground }]}>{note.text}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Notices tab ─────────────────────────────────────────────────────────────
function NoticesTab({ enfCase, colors, router }: any) {
  return (
    <View>
      <AddButton
        label="Generate Notice"
        icon="file-text"
        onPress={() => router.push(`/notices/generate?caseId=${enfCase.id}`)}
        colors={colors}
      />
      {enfCase.notices.length === 0 ? (
        <EmptyState
          icon="mail"
          title="No notices generated"
          subtitle="Generate a formal notice to inform the responsible party of violations and compliance deadlines."
          colors={colors}
        />
      ) : enfCase.notices.map((notice: any) => (
        <TouchableOpacity
          key={notice.id}
          style={[styles.noticeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push(`/notices/${notice.id}?caseId=${enfCase.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.noticeTop}>
            <StatusBadge status={notice.stage} />
            <View style={styles.noticeRight}>
              {notice.sentAt ? (
                <View style={styles.sentBadge}>
                  <Feather name="check-circle" size={12} color="#16a34a" />
                  <Text style={[styles.sentText, { color: '#16a34a' }]}>Sent</Text>
                </View>
              ) : (
                <Text style={[styles.draftLabel, { color: colors.mutedForeground }]}>Draft</Text>
              )}
              <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
            </View>
          </View>
          <View style={[styles.noticeMeta, { borderTopColor: colors.border }]}>
            <View style={styles.noticeMetaItem}>
              <Feather name="calendar" size={12} color={colors.mutedForeground} />
              <Text style={[styles.noticeMetaText, { color: colors.mutedForeground }]}>
                Created {fmt(notice.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.noticeMetaItem}>
              <Feather name="clock" size={12} color={colors.mutedForeground} />
              <Text style={[styles.noticeMetaText, { color: colors.mutedForeground }]}>
                Due {fmt(notice.dueDate, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── History tab ─────────────────────────────────────────────────────────────
function HistoryTab({ enfCase, colors }: any) {
  const history = [...(enfCase.statusHistory ?? [])].reverse();
  return (
    <View>
      {history.length === 0 ? (
        <EmptyState icon="clock" title="No status history" subtitle="Status changes will appear here." colors={colors} />
      ) : history.map((h: any, i: number) => (
        <View key={i} style={styles.historyRow}>
          <View style={styles.historyTrack}>
            <View style={[styles.historyDot, {
              backgroundColor: i === 0 ? colors.primary : colors.border,
              borderColor: colors.primary,
            }]} />
            {i < history.length - 1 && (
              <View style={[styles.historyLine, { backgroundColor: colors.border }]} />
            )}
          </View>
          <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <StatusBadge status={h.status} size="sm" />
            <Text style={[styles.historyDate, { color: colors.mutedForeground }]}>
              {fmt(h.date, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
            {h.note ? (
              <Text style={[styles.historyNote, { color: colors.foreground }]}>{h.note}</Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function SectionCard({ title, icon, children, colors }: {
  title: string; icon: string; children: React.ReactNode; colors: any;
}) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.sectionCardHeader, { borderBottomColor: colors.border }]}>
        <Feather name={icon as any} size={14} color={colors.primary} />
        <Text style={[styles.sectionCardTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function DataRow({ label, value, colors, mono, last }: {
  label: string; value: string; colors: any; mono?: boolean; last?: boolean;
}) {
  return (
    <View style={[styles.dataRow, !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Text style={[styles.dataLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.dataValue, { color: colors.foreground }, mono && styles.mono]} numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
  );
}

function AddButton({ label, icon, onPress, colors }: {
  label: string; icon: string; onPress: () => void; colors: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.addBtn, { borderColor: colors.primary + '60', backgroundColor: colors.primary + '08' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Feather name={icon as any} size={15} color={colors.primary} />
      <Text style={[styles.addBtnText, { color: colors.primary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ icon, title, subtitle, colors }: {
  icon: string; title: string; subtitle: string; colors: any;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '12' }]}>
        <Feather name={icon as any} size={28} color={colors.primary + '80'} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(iso: string, opts: Intl.DateTimeFormatOptions): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', opts);
  } catch {
    return iso;
  }
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 16, fontFamily: 'Inter_500Medium' },

  // Summary header
  summaryHeader: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, gap: 10 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  summaryAddress: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  summarySub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  statusChips: { flexDirection: 'row', gap: 6 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1 },
  statusChipText: { fontSize: 11, fontFamily: 'Inter_500Medium' },

  // Tab bar
  tabBarWrapper: { borderBottomWidth: 1 },
  tabBarContent: { paddingHorizontal: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {},
  tabLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  tabBadge: {
    minWidth: 16, height: 16,
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#fff' },

  // Section cards
  sectionCard: { borderRadius: 10, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  sectionCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionCardTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },

  // Data rows
  dataRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  dataLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  dataValue: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1.4, textAlign: 'right' },
  mono: { fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },

  // Prose
  prose: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },

  // Add button
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, borderWidth: 1, borderRadius: 9, borderStyle: 'dashed',
    padding: 13, marginBottom: 16,
  },
  addBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  emptySubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19 },

  // Violations
  violCard: { borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 10 },
  violHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  ordBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  ordBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.5 },
  violTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  violFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  violDeadline: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  inspNotes: { fontSize: 12, fontFamily: 'Inter_400Regular', fontStyle: 'italic', marginTop: 6, paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth },

  // Photos
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoCard: {
    width: '47%', borderRadius: 10, borderWidth: 1, overflow: 'hidden',
  },
  photoThumbImage: { width: '100%', height: 120 },
  photoMeta: { padding: 8, borderTopWidth: StyleSheet.hairlineWidth },
  photoFilename: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  photoDate: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  fullscreenOverlay: {
    position: 'absolute', top: -16, left: -16, right: -16, bottom: -16,
    backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 100,
    alignItems: 'center', justifyContent: 'center',
  },
  fullscreenImage: { width: '100%', height: '80%' },
  fullscreenClose: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    padding: 8,
  },
  photoThumb: {
    width: '47%', aspectRatio: 1,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  photoCaption: { fontSize: 11, fontFamily: 'Inter_400Regular' },

  // Notes
  noteCard: { borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 10 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatarDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  noteAuthor: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  noteDate: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  noteText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },

  // Notices
  noticeCard: { borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 10 },
  noticeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  noticeRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sentText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  draftLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  noticeMeta: { flexDirection: 'row', gap: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  noticeMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  noticeMetaText: { fontSize: 12, fontFamily: 'Inter_400Regular' },

  // History
  historyRow: { flexDirection: 'row', marginBottom: 6 },
  historyTrack: { width: 20, alignItems: 'center', paddingTop: 8 },
  historyDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  historyLine: { width: 2, flex: 1, marginTop: 4, marginBottom: -4 },
  historyCard: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 12, marginLeft: 10, marginBottom: 4, gap: 5 },
  historyDate: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  historyNote: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },

  // Contact actions (Party tab)
  contactActions: { flexDirection: 'row', gap: 10 },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 9, padding: 12 },
  contactBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
