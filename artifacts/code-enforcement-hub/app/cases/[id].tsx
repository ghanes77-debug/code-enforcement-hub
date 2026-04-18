import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import StatusBadge from '@/components/StatusBadge';
import { CaseStatus } from '@/types/models';

const TABS = ['Info', 'Violations', 'Notes', 'Notices', 'History'] as const;
type Tab = typeof TABS[number];

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getCaseById, getPropertyById, getResponsiblePartyById, updateCaseStatus } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('Info');

  const enfCase = getCaseById(id || '');
  if (!enfCase) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Case not found</Text>
      </View>
    );
  }

  const property = getPropertyById(enfCase.propertyId);
  const responsibleParty = getResponsiblePartyById(enfCase.responsiblePartyId);

  const handleStatusChange = (status: CaseStatus) => {
    Alert.alert(
      'Update Status',
      `Change case status to "${status}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Update', onPress: () => updateCaseStatus(enfCase.id, status) },
      ]
    );
  };

  const STATUS_OPTIONS: CaseStatus[] = ['Open', 'Pending', 'Notice Sent', 'Reinspection Needed', 'Closed'];

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
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <StatusBadge status={enfCase.status} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusOptions}>
            {STATUS_OPTIONS.map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusChip,
                  { borderColor: s === enfCase.status ? colors.primary : colors.border },
                  s === enfCase.status && { backgroundColor: colors.primary },
                ]}
                onPress={() => handleStatusChange(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.statusChipText, { color: s === enfCase.status ? '#fff' : colors.mutedForeground }]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && [styles.activeTab, { borderBottomColor: colors.primary }]]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 60 : 40 }}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'Info' && (
            <InfoTab enfCase={enfCase} property={property} responsibleParty={responsibleParty} colors={colors} />
          )}
          {activeTab === 'Violations' && (
            <ViolationsTab enfCase={enfCase} colors={colors} router={router} />
          )}
          {activeTab === 'Notes' && (
            <NotesTab enfCase={enfCase} colors={colors} router={router} />
          )}
          {activeTab === 'Notices' && (
            <NoticesTab enfCase={enfCase} colors={colors} router={router} />
          )}
          {activeTab === 'History' && (
            <HistoryTab enfCase={enfCase} colors={colors} />
          )}
        </ScrollView>
      </View>
    </>
  );
}

function InfoTab({ enfCase, property, responsibleParty, colors }: any) {
  const openedDate = new Date(enfCase.openedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <View style={{ gap: 14 }}>
      <InfoCard title="Case Information" colors={colors}>
        <InfoRow label="Case Number" value={enfCase.caseNumber} colors={colors} />
        <InfoRow label="Opened" value={openedDate} colors={colors} />
        <InfoRow label="Status" value={enfCase.status} colors={colors} />
        <InfoRow label="Violations" value={`${enfCase.violations.length}`} colors={colors} />
      </InfoCard>
      {property && (
        <InfoCard title="Property" colors={colors}>
          <InfoRow label="Address" value={`${property.address}`} colors={colors} />
          <InfoRow label="City, State" value={`${property.city}, ${property.state} ${property.zip}`} colors={colors} />
          {property.parcelNumber && <InfoRow label="Parcel #" value={property.parcelNumber} colors={colors} />}
          {property.lotNumber && <InfoRow label="Lot" value={property.lotNumber} colors={colors} />}
          {property.subdivision && <InfoRow label="Subdivision" value={property.subdivision} colors={colors} />}
          {property.propertyType && <InfoRow label="Type" value={property.propertyType} colors={colors} />}
          {property.zoningCode && <InfoRow label="Zoning" value={property.zoningCode} colors={colors} />}
        </InfoCard>
      )}
      {responsibleParty && (
        <InfoCard title="Responsible Party" colors={colors}>
          <InfoRow label="Name" value={responsibleParty.name} colors={colors} />
          {responsibleParty.phone && <InfoRow label="Phone" value={responsibleParty.phone} colors={colors} />}
          {responsibleParty.email && <InfoRow label="Email" value={responsibleParty.email} colors={colors} />}
          {responsibleParty.relationship && <InfoRow label="Relationship" value={responsibleParty.relationship} colors={colors} />}
          {responsibleParty.address && (
            <InfoRow label="Mailing Address" value={`${responsibleParty.address}, ${responsibleParty.city}, ${responsibleParty.state}`} colors={colors} />
          )}
        </InfoCard>
      )}
      {enfCase.generalNotes ? (
        <InfoCard title="General Notes" colors={colors}>
          <Text style={[{ fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, color: colors.foreground }]}>
            {enfCase.generalNotes}
          </Text>
        </InfoCard>
      ) : null}
    </View>
  );
}

function ViolationsTab({ enfCase, colors, router }: any) {
  return (
    <View>
      <TouchableOpacity
        style={[styles.addBtn, { borderColor: colors.primary }]}
        onPress={() => router.push(`/violations/add?caseId=${enfCase.id}`)}
        activeOpacity={0.7}
      >
        <Feather name="plus" size={16} color={colors.primary} />
        <Text style={[styles.addBtnText, { color: colors.primary }]}>Add Violation</Text>
      </TouchableOpacity>
      {enfCase.violations.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="alert-triangle" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No violations added</Text>
        </View>
      ) : enfCase.violations.map((v: any) => (
        <View key={v.id} style={[styles.violCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.violHeader}>
            <View style={[styles.sectionBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.sectionText}>Sec. {v.ordinanceSectionNumber}</Text>
            </View>
            <StatusBadge status={v.noticeStage} size="sm" />
          </View>
          <Text style={[styles.violTitle, { color: colors.foreground }]}>{v.violationTitle}</Text>
          <Text style={[styles.violDesc, { color: colors.mutedForeground }]}>{v.violationDescription}</Text>
          <View style={styles.deadlineRow}>
            <Feather name="calendar" size={13} color={colors.mutedForeground} />
            <Text style={[styles.deadlineText, { color: colors.mutedForeground }]}>
              Deadline: {new Date(v.complianceDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          {v.inspectorNotes && (
            <Text style={[styles.inspNotes, { color: colors.mutedForeground, borderTopColor: colors.border }]}>
              Notes: {v.inspectorNotes}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

function NotesTab({ enfCase, colors, router }: any) {
  return (
    <View>
      <TouchableOpacity
        style={[styles.addBtn, { borderColor: colors.primary }]}
        onPress={() => router.push(`/notes/add?caseId=${enfCase.id}`)}
        activeOpacity={0.7}
      >
        <Feather name="edit-3" size={16} color={colors.primary} />
        <Text style={[styles.addBtnText, { color: colors.primary }]}>Add Note</Text>
      </TouchableOpacity>
      {enfCase.notes.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="edit" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No notes yet</Text>
        </View>
      ) : enfCase.notes.map((note: any) => (
        <View key={note.id} style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.noteHeader}>
            <Feather name="user" size={13} color={colors.primary} />
            <Text style={[styles.noteAuthor, { color: colors.primary }]}>{note.authorName}</Text>
            <Text style={[styles.noteDate, { color: colors.mutedForeground }]}>
              {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <Text style={[styles.noteText, { color: colors.foreground }]}>{note.text}</Text>
        </View>
      ))}
    </View>
  );
}

function NoticesTab({ enfCase, colors, router }: any) {
  return (
    <View>
      <TouchableOpacity
        style={[styles.addBtn, { borderColor: colors.primary }]}
        onPress={() => router.push(`/notices/generate?caseId=${enfCase.id}`)}
        activeOpacity={0.7}
      >
        <Feather name="file-text" size={16} color={colors.primary} />
        <Text style={[styles.addBtnText, { color: colors.primary }]}>Generate Notice</Text>
      </TouchableOpacity>
      {enfCase.notices.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="mail" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No notices generated</Text>
        </View>
      ) : enfCase.notices.map((notice: any) => (
        <TouchableOpacity
          key={notice.id}
          style={[styles.noticeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push(`/notices/${notice.id}?caseId=${enfCase.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.noticeHeader}>
            <StatusBadge status={notice.stage} />
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.noticeDate, { color: colors.mutedForeground }]}>
            Created: {new Date(notice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
          <Text style={[styles.noticeDate, { color: colors.mutedForeground }]}>
            Due: {new Date(notice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
          {notice.sentAt && (
            <View style={styles.sentBadge}>
              <Feather name="check-circle" size={12} color={colors.statusClosed} />
              <Text style={[styles.sentText, { color: colors.statusClosed }]}>Sent</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function HistoryTab({ enfCase, colors }: any) {
  return (
    <View>
      {enfCase.statusHistory.map((h: any, i: number) => (
        <View key={i} style={styles.historyRow}>
          <View style={styles.historyLine}>
            <View style={[styles.historyDot, { backgroundColor: colors.primary }]} />
            {i < enfCase.statusHistory.length - 1 && <View style={[styles.historyConnector, { backgroundColor: colors.border }]} />}
          </View>
          <View style={[styles.historyContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <StatusBadge status={h.status} size="sm" />
            <Text style={[styles.historyDate, { color: colors.mutedForeground }]}>
              {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
            {h.note && <Text style={[styles.historyNote, { color: colors.foreground }]}>{h.note}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

function InfoCard({ title, children, colors }: any) {
  return (
    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.infoCardTitle, { color: colors.foreground, borderBottomColor: colors.border }]}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value, colors }: any) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusBanner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  statusOptions: { flexDirection: 'row', gap: 6, paddingTop: 4 },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusChipText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  tabBar: { borderBottomWidth: 1, flexGrow: 0 },
  tab: { paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: {},
  tabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  infoCard: { borderRadius: 10, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  infoCardTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    padding: 12,
    borderBottomWidth: 1,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  infoLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  infoValue: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1.5, textAlign: 'right' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    padding: 12,
    marginBottom: 14,
  },
  addBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  violCard: { borderRadius: 10, borderWidth: 1, padding: 13, marginBottom: 10 },
  violHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  sectionText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.5 },
  violTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 5 },
  violDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, marginBottom: 8 },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  deadlineText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  inspNotes: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 8, paddingTop: 8, borderTopWidth: 1, fontStyle: 'italic' },
  noteCard: { borderRadius: 10, borderWidth: 1, padding: 13, marginBottom: 10 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  noteAuthor: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1 },
  noteDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  noteText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  noticeCard: { borderRadius: 10, borderWidth: 1, padding: 13, marginBottom: 10 },
  noticeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  noticeDate: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  sentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  sentText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  historyRow: { flexDirection: 'row', marginBottom: 4 },
  historyLine: { width: 24, alignItems: 'center', paddingTop: 6 },
  historyDot: { width: 10, height: 10, borderRadius: 5 },
  historyConnector: { width: 2, flex: 1, marginTop: 4 },
  historyContent: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 12, marginLeft: 8, marginBottom: 8, gap: 5 },
  historyDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  historyNote: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  empty: { alignItems: 'center', padding: 32, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
