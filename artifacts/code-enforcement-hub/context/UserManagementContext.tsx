import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuditActorSnapshot,
  AuditLogEntry,
  PermissionCategory,
  PermissionLevel,
  PlatformUser,
  RoleDefinition,
  RolePermissions,
  SystemRole,
} from '../types/models';
import { DEFAULT_USERS, DEFAULT_ROLE_DEFINITIONS } from '../data/defaultUsers';
import { useSession } from './SessionContext';

const USERS_KEY = '@ceh:users';
const ROLES_KEY = '@ceh:roles';
const AUDIT_KEY = '@ceh:auditLog';

export { DEFAULT_USERS, DEFAULT_ROLE_DEFINITIONS };

export const PERMISSION_CATEGORIES: { key: PermissionCategory; label: string }[] = [
  { key: 'caseManagement', label: 'Case Management' },
  { key: 'violations', label: 'Violations' },
  { key: 'notices', label: 'Notices' },
  { key: 'ordinanceLibrary', label: 'Ordinance Library' },
  { key: 'aerialEvidence', label: 'Aerial Evidence' },
  { key: 'userAdminManagement', label: 'User/Admin Management' },
];

export const SYSTEM_ROLES: SystemRole[] = [
  'Platform Super Admin',
  'Municipal Admin',
  'Code Enforcement Officer',
  'Authorized Pilot',
  'Supervisor / Reviewer',
  'Read-Only Staff',
];

interface UserManagementContextType {
  users: PlatformUser[];
  roles: RoleDefinition[];
  auditLog: AuditLogEntry[];
  currentUser: PlatformUser;
  currentActor: AuditActorSnapshot;
  isLoaded: boolean;
  canAdminUsers: boolean;
  canViewUserAdmin: boolean;
  setCurrentUserId: (id: string) => void;
  createUser: (user: Omit<PlatformUser, 'id' | 'createdAt' | 'updatedAt' | 'createdByUserId' | 'createdByDisplayName' | 'updatedByUserId' | 'updatedByDisplayName'>) => PlatformUser;
  updateUser: (id: string, updates: Partial<PlatformUser>) => void;
  deactivateUser: (id: string) => void;
  updateRolePermissions: (role: SystemRole, permissions: RolePermissions) => void;
  getRolePermissions: (role: SystemRole) => RolePermissions;
  getEffectivePermissions: (user?: PlatformUser) => RolePermissions;
  hasPermission: (category: PermissionCategory, minimum?: PermissionLevel) => boolean;
  getApprovedPilots: (municipalityId?: string) => PlatformUser[];
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function permissionRank(level: PermissionLevel) {
  return { none: 0, view: 1, edit: 2, admin: 3 }[level];
}

function maxPermission(a: PermissionLevel, b: PermissionLevel) {
  return permissionRank(a) >= permissionRank(b) ? a : b;
}

export function UserManagementProvider({ children }: { children: React.ReactNode }) {
  const { session, updateSession } = useSession();
  const [users, setUsers] = useState<PlatformUser[]>(DEFAULT_USERS);
  const [roles, setRoles] = useState<RoleDefinition[]>(DEFAULT_ROLE_DEFINITIONS);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const currentUserId = session?.userId ?? DEFAULT_USERS[0].id;

  useEffect(() => {
    async function load() {
      const [usersRaw, rolesRaw, auditRaw] = await Promise.all([
        AsyncStorage.getItem(USERS_KEY),
        AsyncStorage.getItem(ROLES_KEY),
        AsyncStorage.getItem(AUDIT_KEY),
      ]);
      if (usersRaw) {
        const stored = JSON.parse(usersRaw) as PlatformUser[];
        const storedIds = new Set(stored.map((u: PlatformUser) => u.id));
        const missing = DEFAULT_USERS.filter(u => !storedIds.has(u.id));
        setUsers([...stored, ...missing]);
      }
      if (rolesRaw) setRoles(JSON.parse(rolesRaw));
      if (auditRaw) setAuditLog(JSON.parse(auditRaw));
      setIsLoaded(true);
    }
    load().catch(() => setIsLoaded(true));
  }, []);

  useEffect(() => { if (isLoaded) AsyncStorage.setItem(USERS_KEY, JSON.stringify(users)).catch(() => {}); }, [users, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(ROLES_KEY, JSON.stringify(roles)).catch(() => {}); }, [roles, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(AUDIT_KEY, JSON.stringify(auditLog)).catch(() => {}); }, [auditLog, isLoaded]);

  const currentUser = useMemo(
    () => users.find(user => user.id === currentUserId && user.isActive) ?? users.find(user => user.isActive) ?? DEFAULT_USERS[0],
    [users, currentUserId]
  );

  const currentActor = useMemo(() => ({ userId: currentUser.id, displayName: currentUser.displayName }), [currentUser]);

  const appendAudit = useCallback((entry: Omit<AuditLogEntry, 'id' | 'createdAt' | 'actorUserId' | 'actorDisplayName'>) => {
    const auditEntry: AuditLogEntry = {
      ...entry,
      id: generateId('audit'),
      createdAt: new Date().toISOString(),
      actorUserId: currentActor.userId,
      actorDisplayName: currentActor.displayName,
    };
    setAuditLog(prev => [auditEntry, ...prev]);
  }, [currentActor]);

  const getRolePermissions = useCallback((role: SystemRole) => (
    roles.find(definition => definition.role === role)?.permissions ?? DEFAULT_ROLE_DEFINITIONS.find(definition => definition.role === role)!.permissions
  ), [roles]);

  const getEffectivePermissions = useCallback((user: PlatformUser = currentUser) => {
    if (!user.isActive) {
      return Object.fromEntries(
        (['caseManagement', 'violations', 'notices', 'ordinanceLibrary', 'aerialEvidence', 'userAdminManagement'] as PermissionCategory[]).map(k => [k, 'none' as PermissionLevel])
      ) as RolePermissions;
    }
    const base = { ...getRolePermissions(user.role) };
    Object.entries(user.permissionOverrides ?? {}).forEach(([category, level]) => {
      if (level) {
        base[category as PermissionCategory] = maxPermission(base[category as PermissionCategory] ?? 'none', level);
      }
    });
    return base;
  }, [currentUser, getRolePermissions]);

  const hasPermission = useCallback((category: PermissionCategory, minimum: PermissionLevel = 'view') => {
    if (!currentUser.isActive) return false;
    const current = getEffectivePermissions(currentUser)[category] ?? 'none';
    return permissionRank(current) >= permissionRank(minimum);
  }, [currentUser, getEffectivePermissions]);

  const canAdminUsers = currentUser.role === 'Platform Super Admin' || currentUser.role === 'Municipal Admin' || hasPermission('userAdminManagement', 'admin');
  const canViewUserAdmin = canAdminUsers || hasPermission('userAdminManagement', 'view');

  const ensureUserAdminAllowed = useCallback((target?: Partial<PlatformUser>) => {
    if (!canAdminUsers) {
      throw new Error('Only authorized admins can manage users.');
    }
    if (currentUser.role !== 'Platform Super Admin' && target?.municipalityId && target.municipalityId !== currentUser.municipalityId) {
      throw new Error('Municipal Admins can only manage users in their own municipality.');
    }
    if (currentUser.role !== 'Platform Super Admin' && target?.role === 'Platform Super Admin') {
      throw new Error('Only Platform Super Admins can assign the Platform Super Admin role.');
    }
  }, [canAdminUsers, currentUser]);

  const setCurrentUserId = useCallback((id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    updateSession({
      userId: user.id,
      displayName: user.displayName,
      role: user.role,
      tenantId: user.municipalityId,
      municipalityName: user.municipality,
      departmentName: user.department,
      viewAsTenantId: undefined,
    });
  }, [users, updateSession]);

  const createUser = useCallback<UserManagementContextType['createUser']>((user) => {
    ensureUserAdminAllowed(user);
    const created: PlatformUser = {
      ...user,
      id: generateId('user'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByUserId: currentActor.userId,
      createdByDisplayName: currentActor.displayName,
      updatedByUserId: currentActor.userId,
      updatedByDisplayName: currentActor.displayName,
    };
    setUsers(prev => [...prev, created]);
    appendAudit({ action: 'Created User', targetType: 'user', targetId: created.id, targetDisplayName: created.displayName, details: `Assigned role: ${created.role}` });
    return created;
  }, [appendAudit, currentActor, ensureUserAdminAllowed]);

  const updateUser = useCallback((id: string, updates: Partial<PlatformUser>) => {
    let targetName = '';
    const target = users.find(user => user.id === id);
    ensureUserAdminAllowed({ ...target, ...updates });
    setUsers(prev => prev.map(user => {
      if (user.id !== id) return user;
      const next = {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedByUserId: currentActor.userId,
        updatedByDisplayName: currentActor.displayName,
      };
      targetName = next.displayName;
      return next;
    }));
    appendAudit({ action: 'Updated User', targetType: 'user', targetId: id, targetDisplayName: targetName || id, details: updates.role ? `Role changed to ${updates.role}` : updates.permissionOverrides ? 'Permission overrides updated' : 'Profile updated' });
  }, [appendAudit, currentActor, ensureUserAdminAllowed, users]);

  const deactivateUser = useCallback((id: string) => {
    const user = users.find(item => item.id === id);
    ensureUserAdminAllowed(user);
    setUsers(prev => prev.map(item => item.id === id ? {
      ...item,
      isActive: false,
      updatedAt: new Date().toISOString(),
      updatedByUserId: currentActor.userId,
      updatedByDisplayName: currentActor.displayName,
    } : item));
    appendAudit({ action: 'Deactivated User', targetType: 'user', targetId: id, targetDisplayName: user?.displayName ?? id });
  }, [appendAudit, currentActor, ensureUserAdminAllowed, users]);

  const updateRolePermissions = useCallback((role: SystemRole, permissions: RolePermissions) => {
    if (!canAdminUsers) {
      throw new Error('Only authorized admins can update role permissions.');
    }
    setRoles(prev => prev.map(definition => definition.role === role ? {
      ...definition,
      permissions,
      updatedAt: new Date().toISOString(),
      updatedByUserId: currentActor.userId,
      updatedByDisplayName: currentActor.displayName,
    } : definition));
    appendAudit({ action: 'Updated Role Permissions', targetType: 'role', targetId: role, targetDisplayName: role, details: 'Permission categories updated' });
  }, [appendAudit, canAdminUsers, currentActor]);

  const getApprovedPilots = useCallback((municipalityId?: string) => users.filter(user =>
    user.isActive &&
    user.pilotCertificationStatus === 'Certified' &&
    (user.role === 'Authorized Pilot' || user.role === 'Municipal Admin' || user.role === 'Supervisor / Reviewer') &&
    (!municipalityId || user.municipalityId === municipalityId)
  ), [users]);

  return (
    <UserManagementContext.Provider value={{
      users,
      roles,
      auditLog,
      currentUser,
      currentActor,
      isLoaded,
      canAdminUsers,
      canViewUserAdmin,
      setCurrentUserId,
      createUser,
      updateUser,
      deactivateUser,
      updateRolePermissions,
      getRolePermissions,
      getEffectivePermissions,
      hasPermission,
      getApprovedPilots,
    }}>
      {children}
    </UserManagementContext.Provider>
  );
}

export function useUserManagement() {
  const context = useContext(UserManagementContext);
  if (!context) throw new Error('useUserManagement must be used within UserManagementProvider');
  return context;
}
