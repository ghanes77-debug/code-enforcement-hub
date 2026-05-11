import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack } from 'expo-router';
import Icon from '@/components/Icon';
import { useColors } from '@/hooks/useColors';
import { PERMISSION_CATEGORIES, useUserManagement } from '@/context/UserManagementContext';
import { PermissionLevel, RoleDefinition, RolePermissions } from '@/types/models';

const LEVELS: PermissionLevel[] = ['none', 'view', 'edit', 'admin'];

export default function RoleManagementScreen() {
  const colors = useColors();
  const { roles, canAdminUsers, updateRolePermissions } = useUserManagement();
  const [selectedRole, setSelectedRole] = useState<RoleDefinition>(roles[0]);
  const [draft, setDraft] = useState<RolePermissions>(roles[0].permissions);

  const selectRole = (role: RoleDefinition) => {
    setSelectedRole(role);
    setDraft(role.permissions);
  };

  const setLevel = (category: keyof RolePermissions, level: PermissionLevel) => {
    setDraft(prev => ({ ...prev, [category]: level }));
  };

  const save = () => {
    if (!canAdminUsers) {
      Alert.alert('Permission Required', 'Only authorized admins can update role permissions.');
      return;
    }
    try {
      updateRolePermissions(selectedRole.role, draft);
      Alert.alert('Role Updated', `${selectedRole.role} permissions were saved.`);
    } catch (error) {
      Alert.alert('Permission Required', error instanceof Error ? error.message : 'You do not have permission to update role permissions.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Role Management', headerStyle: { backgroundColor: colors.primary } as any, headerTintColor: colors.primaryForeground }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.webContent]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>FIXED SYSTEM ROLES</Text>
        <View style={styles.roleList}>
          {roles.map(role => (
            <TouchableOpacity key={role.role} style={[styles.roleCard, { backgroundColor: colors.card, borderColor: selectedRole.role === role.role ? colors.primary : colors.border }]} onPress={() => selectRole(role)}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.roleTitle, { color: colors.foreground }]}>{role.role}</Text>
                <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>{role.description}</Text>
              </View>
              {selectedRole.role === role.role && <Icon name="check-circle" size={18} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PERMISSION CATEGORIES</Text>
        <View style={[styles.permissionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.selectedTitle, { color: colors.foreground }]}>{selectedRole.role}</Text>
          <Text style={[styles.selectedDesc, { color: colors.mutedForeground }]}>{selectedRole.description}</Text>
          {PERMISSION_CATEGORIES.map(category => (
            <View key={category.key} style={[styles.permissionRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.categoryLabel, { color: colors.foreground }]}>{category.label}</Text>
              <View style={styles.levels}>{LEVELS.map(level => <LevelChip key={level} label={level} active={draft[category.key] === level} onPress={() => setLevel(category.key, level)} colors={colors} />)}</View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={save} disabled={!canAdminUsers}>
          <Text style={styles.saveText}>Save Role Permissions</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function LevelChip({ label, active, onPress, colors }: any) {
  return <TouchableOpacity style={[styles.levelChip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + '12' : colors.background }]} onPress={onPress}><Text style={[styles.levelText, { color: active ? colors.primary : colors.mutedForeground }]}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 80 },
  webContent: { maxWidth: 760, alignSelf: 'center', width: '100%' },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 8 },
  roleList: { gap: 10, marginBottom: 20 },
  roleCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  roleTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  roleDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17, marginTop: 3 },
  permissionCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 },
  selectedTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  selectedDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18, marginTop: 4, marginBottom: 10 },
  permissionRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 12 },
  categoryLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  levelText: { fontSize: 11, fontFamily: 'Inter_700Bold', textTransform: 'capitalize' },
  saveBtn: { alignItems: 'center', borderRadius: 10, padding: 14 },
  saveText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
