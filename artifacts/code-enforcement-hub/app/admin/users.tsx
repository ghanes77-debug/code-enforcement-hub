import React, { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { PERMISSION_CATEGORIES, SYSTEM_ROLES, useUserManagement } from '@/context/UserManagementContext';
import { PermissionCategory, PermissionLevel, PlatformUser } from '@/types/models';

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
  permissionOverrides: {},
  isActive: true,
  tdlrCeNumber: '',
  pilotCertificationStatus: 'Not Applicable',
  certificationId: '',
  certificationExpirationDate: '',
  trainingCompletionDate: '',
});

export default function UserManagementScreen() {
  const colors = useColors();
  const { users, currentUser, canAdminUsers, canViewUserAdmin, createUser, updateUser, deactivateUser, setCurrentUserId } = useUserManagement();
  const [selectedId, setSelectedId] = useState(users[0]?.id ?? '');
  const selectedUser = users.find(user => user.id === selectedId);
  const [draft, setDraft] = useState<any>(selectedUser ?? blankUser(currentUser.municipalityId, currentUser.municipality));
  const [isCreating, setIsCreating] = useState(false);

  const filteredUsers = useMemo(() => users.filter(user => currentUser.role === 'Platform Super Admin' || user.municipalityId === currentUser.municipalityId), [users, currentUser]);
  const assignableRoles = useMemo(() => (
    currentUser.role === 'Platform Super Admin' ? SYSTEM_ROLES : SYSTEM_ROLES.filter(role => role !== 'Platform Super Admin')
  ), [currentUser.role]);

  if (!canViewUserAdmin) {
    return (
      <>
        <Stack.Screen options={{ title: 'User Management', headerStyle: { backgroundColor: colors.primary } as any, headerTintColor: colors.primaryForeground }} />
        <View style={[styles.blocked, { backgroundColor: colors.background }]}>
          <Feather name="lock" size={36} color={colors.mutedForeground} />
          <Text style={[styles.blockedTitle, { color: colors.foreground }]}>User Management Restricted</Text>
          <Text style={[styles.blockedText, { color: colors.mutedForeground }]}>Your current role does not include permission to view or manage platform users.</Text>
        </View>
      </>
    );
  }

  const selectUser = (user: PlatformUser) => {
    setIsCreating(false);
    setSelectedId(user.id);
    setDraft(user);
  };

  const startCreate = () => {
    if (!canAdminUsers) return;
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
    try {
      if (isCreating) {
        const created = createUser(draft);
        setIsCreating(false);
        setSelectedId(created.id);
        setDraft(created);
      } else if (selectedId) {
        updateUser(selectedId, draft);
      }
    } catch (error) {
      Alert.alert('Permission Required', error instanceof Error ? error.message : 'You do not have permission to save this user.');
    }
  };

  const deactivate = () => {
    if (!selectedId) return;
    Alert.alert('Deactivate User', 'Deactivate this user account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: () => {
          try {
            deactivateUser(selectedId);
          } catch (error) {
            Alert.alert('Permission Required', error instanceof Error ? error.message : 'You do not have permission to deactivate this user.');
          }
        },
      },
    ]);
  };

  const setOverride = (category: PermissionCategory, level?: PermissionLevel) => {
    patch('permissionOverrides', {
      ...(draft.permissionOverrides ?? {}),
      [category]: level,
    });
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
          <Field label="First Name" value={draft.firstName} onChangeText={(v: string) => patch('firstName', v)} colors={colors} disabled={!canAdminUsers} />
          <Field label="Last Name" value={draft.lastName} onChangeText={(v: string) => patch('lastName', v)} colors={colors} disabled={!canAdminUsers} />
          <Field label="Display Name" value={draft.displayName} onChangeText={(v: string) => patch('displayName', v)} colors={colors} disabled={!canAdminUsers} />
          <Field label="Email" value={draft.email} onChangeText={(v: string) => patch('email', v)} colors={colors} disabled={!canAdminUsers} />
          <Field label="Phone" value={draft.phone} onChangeText={(v: string) => patch('phone', v)} colors={colors} disabled={!canAdminUsers} />
          <Field label="Username" value={draft.username} onChangeText={(v: string) => patch('username', v)} colors={colors} disabled={!canAdminUsers} />
          <Field label="Municipality" value={draft.municipality} onChangeText={(v: string) => patch('municipality', v)} colors={colors} disabled={!canAdminUsers || currentUser.role !== 'Platform Super Admin'} />
          <Field label="Municipality ID" value={draft.municipalityId} onChangeText={(v: string) => patch('municipalityId', v)} colors={colors} disabled={!canAdminUsers || currentUser.role !== 'Platform Super Admin'} />
          <Field label="Department" value={draft.department} onChangeText={(v: string) => patch('department', v)} colors={colors} disabled={!canAdminUsers} />
          <Field label="Title" value={draft.title} onChangeText={(v: string) => patch('title', v)} colors={colors} disabled={!canAdminUsers} />
          <Field label="TDLR-CE Number" value={draft.tdlrCeNumber} onChangeText={(v: string) => patch('tdlrCeNumber', v)} colors={colors} disabled={!canAdminUsers} />
          <Field label="Certification ID" value={draft.certificationId} onChangeText={(v: string) => patch('certificationId', v)} colors={colors} disabled={!canAdminUsers} />
          <Field label="Certification Expiration Date" value={draft.certificationExpirationDate} onChangeText={(v: string) => patch('certificationExpirationDate', v)} colors={colors} placeholder="YYYY-MM-DD" disabled={!canAdminUsers} />
          <Field label="Training Completion Date" value={draft.trainingCompletionDate} onChangeText={(v: string) => patch('trainingCompletionDate', v)} colors={colors} placeholder="YYYY-MM-DD" disabled={!canAdminUsers} />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Role</Text>
          <View style={styles.chipWrap}>{assignableRoles.map(role => <Chip key={role} label={role} active={draft.role === role} onPress={() => canAdminUsers && patch('role', role)} colors={colors} disabled={!canAdminUsers} />)}</View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Pilot Certification Status</Text>
          <View style={styles.chipWrap}>{['Not Applicable', 'Pending', 'Certified', 'Expired', 'Suspended'].map(status => <Chip key={status} label={status} active={draft.pilotCertificationStatus === status} onPress={() => canAdminUsers && patch('pilotCertificationStatus', status)} colors={colors} disabled={!canAdminUsers} />)}</View>

          <View style={[styles.overridesCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.overrideTitle, { color: colors.foreground }]}>Optional Extra Permission Toggles</Text>
            <Text style={[styles.overrideHelp, { color: colors.mutedForeground }]}>These can grant special access above the user’s fixed role without changing their role.</Text>
            {PERMISSION_CATEGORIES.map(category => (
              <View key={category.key} style={styles.overrideRow}>
                <Text style={[styles.overrideLabel, { color: colors.foreground }]}>{category.label}</Text>
                <View style={styles.chipWrap}>
                  <Chip label="Inherit" active={!draft.permissionOverrides?.[category.key]} onPress={() => canAdminUsers && setOverride(category.key, undefined)} colors={colors} disabled={!canAdminUsers} />
                  {(['view', 'edit', 'admin'] as PermissionLevel[]).map(level => (
                    <Chip key={level} label={level} active={draft.permissionOverrides?.[category.key] === level} onPress={() => canAdminUsers && setOverride(category.key, level)} colors={colors} disabled={!canAdminUsers} />
                  ))}
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.toggleRow} onPress={() => canAdminUsers && patch('isActive', !draft.isActive)} disabled={!canAdminUsers}>
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

function Field({ label, value, onChangeText, colors, placeholder, disabled }: any) {
  return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text><TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background, opacity: disabled ? 0.65 : 1 }]} value={value ?? ''} onChangeText={onChangeText} placeholder={placeholder || label} placeholderTextColor={colors.mutedForeground} editable={!disabled} /></View>;
}

function Chip({ label, active, onPress, colors, disabled }: any) {
  return <TouchableOpacity style={[styles.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + '12' : colors.background, opacity: disabled ? 0.65 : 1 }]} onPress={onPress} disabled={disabled}><Text style={[styles.chipText, { color: active ? colors.primary : colors.mutedForeground }]}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 80 },
  webContent: { maxWidth: 760, alignSelf: 'center', width: '100%' },
  blocked: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  blockedTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginTop: 12 },
  blockedText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19, marginTop: 6 },
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
  overridesCard: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  overrideTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  overrideHelp: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16, marginBottom: 10 },
  overrideRow: { marginBottom: 8 },
  overrideLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  actionRow: { gap: 10 },
  saveBtn: { alignItems: 'center', borderRadius: 10, padding: 14 },
  saveText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  secondaryBtn: { alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 13 },
  secondaryText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});
