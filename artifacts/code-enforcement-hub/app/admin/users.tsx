import React, { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { SYSTEM_ROLES, useUserManagement } from '@/context/UserManagementContext';
import { PlatformUser, SystemRole } from '@/types/models';

const blankUser = (municipalityId = 'springfield-tx', municipality = 'City of Springfield'): Omit<PlatformUser, 'id' | 'createdAt' | 'updatedAt' | 'createdByUserId' | 'createdByDisplayName' | 'updatedByUserId' | 'updatedByDisplayName'> => ({
  firstName: '',
  lastName: '',
  displayName: '',
  email: '',
  phone: '',
  username: '',
  municipality,
  municipalityId,
  department: 'Code Enforcement Division',
  title: '',
  role: 'Code Enforcement Officer',
  isActive: true,
  tdlrCeNumber: '',
  pilotCertificationStatus: 'Not Applicable',
  certificationId: '',
  certificationExpirationDate: '',
  trainingCompletionDate: '',
});

export default function UserManagementScreen() {
  const colors = useColors();
  const { users, currentUser, canAdminUsers, createUser, updateUser, deactivateUser, setCurrentUserId } = useUserManagement();
  const [selectedId, setSelectedId] = useState(users[0]?.id ?? '');
  const selectedUser = users.find(user => user.id === selectedId);
  const [draft, setDraft] = useState<any>(selectedUser ?? blankUser(currentUser.municipalityId, currentUser.municipality));
  const [isCreating, setIsCreating] = useState(false);

  const filteredUsers = useMemo(() => users.filter(user => currentUser.role === 'Platform Super Admin' || user.municipalityId === currentUser.municipalityId), [users, currentUser]);

  const selectUser = (user: PlatformUser) => {
    setIsCreating(false);
    setSelectedId(user.id);
    setDraft(user);
  };

  const startCreate = () => {
    setIsCreating(true);
    setSelectedId('');
    setDraft(blankUser(currentUser.municipalityId, currentUser.municipality));
  };

  const patch = (key: string, value: any) => setDraft((prev: any) => {
    const next = { ...prev, [key]: value };
    if ((key === 'firstName' || key === 'lastName') && !prev.displayName) {
      next.displayName = `${key === 'firstName' ? value : prev.firstName} ${key === 'lastName' ? value : prev.lastName}`.trim();
    }
    return next;
  });

  const save = () => {
    if (!canAdminUsers) {
      Alert.alert('Permission Required', 'Only authorized admins can manage users.');
      return;
    }
    if (!draft.firstName || !draft.lastName || !draft.displayName || !draft.email || !draft.username) {
      Alert.alert('Missing Required Fields', 'First name, last name, display name, email, and username are required.');
      return;
    }
    if (isCreating) {
      const created = createUser(draft);
      setIsCreating(false);
      setSelectedId(created.id);
      setDraft(created);
    } else if (selectedId) {
      updateUser(selectedId, draft);
    }
  };

  const deactivate = () => {
    if (!selectedId) return;
    Alert.alert('Deactivate User', 'Deactivate this user account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Deactivate', style: 'destructive', onPress: () => deactivateUser(selectedId) },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'User Management', headerStyle: { backgroundColor: colors.primary } as any, headerTintColor: colors.primaryForeground }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.webContent]}>
        {!canAdminUsers && (
          <View style={[styles.notice, { backgroundColor: colors.destructive + '10', borderColor: colors.destructive + '40' }]}>
            <Feather name="lock" size={16} color={colors.destructive} />
            <Text style={[styles.noticeText, { color: colors.destructive }]}>Read-only view. Your role cannot create, edit, deactivate, or assign users.</Text>
          </View>
        )}

        <View style={styles.topRow}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>USERS</Text>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={startCreate} disabled={!canAdminUsers}>
            <Feather name="user-plus" size={14} color="#fff" />
            <Text style={styles.addBtnText}>New User</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.userList}>
          {filteredUsers.map(user => (
            <TouchableOpacity key={user.id} style={[styles.userCard, { backgroundColor: colors.card, borderColor: selectedId === user.id ? colors.primary : colors.border }]} onPress={() => selectUser(user)}>
              <View style={[styles.avatar, { backgroundColor: user.isActive ? colors.primary : colors.border }]}>
                <Text style={styles.avatarText}>{user.displayName.split(' ').map(part => part[0]).join('').slice(0, 2)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.userName, { color: colors.foreground }]}>{user.displayName}</Text>
                <Text style={[styles.userMeta, { color: colors.mutedForeground }]}>{user.role} · {user.department}</Text>
                <Text style={[styles.userMeta, { color: colors.mutedForeground }]}>{user.email}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: user.isActive ? '#16a34a18' : '#dc262618' }]}>
                <Text style={[styles.statusText, { color: user.isActive ? '#15803d' : '#dc2626' }]}>{user.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{isCreating ? 'CREATE USER' : 'EDIT USER'}</Text>
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Field label="First Name" value={draft.firstName} onChangeText={(v: string) => patch('firstName', v)} colors={colors} />
          <Field label="Last Name" value={draft.lastName} onChangeText={(v: string) => patch('lastName', v)} colors={colors} />
          <Field label="Display Name" value={draft.displayName} onChangeText={(v: string) => patch('displayName', v)} colors={colors} />
          <Field label="Email" value={draft.email} onChangeText={(v: string) => patch('email', v)} colors={colors} />
          <Field label="Phone" value={draft.phone} onChangeText={(v: string) => patch('phone', v)} colors={colors} />
          <Field label="Username" value={draft.username} onChangeText={(v: string) => patch('username', v)} colors={colors} />
          <Field label="Municipality" value={draft.municipality} onChangeText={(v: string) => patch('municipality', v)} colors={colors} />
          <Field label="Municipality ID" value={draft.municipalityId} onChangeText={(v: string) => patch('municipalityId', v)} colors={colors} />
          <Field label="Department" value={draft.department} onChangeText={(v: string) => patch('department', v)} colors={colors} />
          <Field label="Title" value={draft.title} onChangeText={(v: string) => patch('title', v)} colors={colors} />
          <Field label="TDLR-CE Number" value={draft.tdlrCeNumber} onChangeText={(v: string) => patch('tdlrCeNumber', v)} colors={colors} />
          <Field label="Certification ID" value={draft.certificationId} onChangeText={(v: string) => patch('certificationId', v)} colors={colors} />
          <Field label="Certification Expiration Date" value={draft.certificationExpirationDate} onChangeText={(v: string) => patch('certificationExpirationDate', v)} colors={colors} placeholder="YYYY-MM-DD" />
          <Field label="Training Completion Date" value={draft.trainingCompletionDate} onChangeText={(v: string) => patch('trainingCompletionDate', v)} colors={colors} placeholder="YYYY-MM-DD" />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Role</Text>
          <View style={styles.chipWrap}>{SYSTEM_ROLES.map(role => <Chip key={role} label={role} active={draft.role === role} onPress={() => patch('role', role)} colors={colors} />)}</View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Pilot Certification Status</Text>
          <View style={styles.chipWrap}>{['Not Applicable', 'Pending', 'Certified', 'Expired', 'Suspended'].map(status => <Chip key={status} label={status} active={draft.pilotCertificationStatus === status} onPress={() => patch('pilotCertificationStatus', status)} colors={colors} />)}</View>

          <TouchableOpacity style={styles.toggleRow} onPress={() => patch('isActive', !draft.isActive)}>
            <Feather name={draft.isActive ? 'check-square' : 'square'} size={18} color={draft.isActive ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.toggleText, { color: colors.foreground }]}>Active account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={save} disabled={!canAdminUsers}>
            <Text style={styles.saveText}>{isCreating ? 'Create User' : 'Save Changes'}</Text>
          </TouchableOpacity>
          {!isCreating && selectedId && <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={() => setCurrentUserId(selectedId)}><Text style={[styles.secondaryText, { color: colors.primary }]}>Use as Current User</Text></TouchableOpacity>}
          {!isCreating && selectedId && <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.destructive + '50' }]} onPress={deactivate} disabled={!canAdminUsers}><Text style={[styles.secondaryText, { color: colors.destructive }]}>Deactivate</Text></TouchableOpacity>}
        </View>
      </ScrollView>
    </>
  );
}

function Field({ label, value, onChangeText, colors, placeholder }: any) {
  return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text><TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={value ?? ''} onChangeText={onChangeText} placeholder={placeholder || label} placeholderTextColor={colors.mutedForeground} /></View>;
}

function Chip({ label, active, onPress, colors }: any) {
  return <TouchableOpacity style={[styles.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + '12' : colors.background }]} onPress={onPress}><Text style={[styles.chipText, { color: active ? colors.primary : colors.mutedForeground }]}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 80 },
  webContent: { maxWidth: 760, alignSelf: 'center', width: '100%' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14 },
  noticeText: { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9 },
  addBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  userList: { gap: 10, marginBottom: 20 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
  userName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  userMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  formCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 14 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontSize: 13, fontFamily: 'Inter_400Regular' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  chipText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  toggleText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  actionRow: { gap: 10 },
  saveBtn: { alignItems: 'center', borderRadius: 10, padding: 14 },
  saveText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  secondaryBtn: { alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 13 },
  secondaryText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});
