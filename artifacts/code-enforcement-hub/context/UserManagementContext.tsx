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

const USERS_KEY = '@ceh:users';
const ROLES_KEY = '@ceh:roles';
const AUDIT_KEY = '@ceh:auditLog';
const CURRENT_USER_KEY = '@ceh:currentUserId';

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

const fullAdmin: RolePermissions = {
  caseManagement: 'admin',
  violations: 'admin',
  notices: 'admin',
  ordinanceLibrary: 'admin',
  aerialEvidence: 'admin',
  userAdminManagement: 'admin',
};

export const DEFAULT_ROLE_DEFINITIONS: RoleDefinition[] = [
  { role: 'Platform Super Admin', description: 'Full platform access across municipalities.', permissions: fullAdmin },
  { role: 'Municipal Admin', description: 'Municipal administrator with user, role, and enforcement management.', permissions: fullAdmin },
  {
    role: 'Code Enforcement Officer',
    description: 'Field enforcement user who manages cases, violations, notices, and evidence.',
    permissions: {
      caseManagement: 'edit',
      violations: 'edit',
      notices: 'edit',
      ordinanceLibrary: 'view',
      aerialEvidence: 'edit',
      userAdminManagement: 'none',
    },
  },
  {
    role: 'Authorized Pilot',
    description: 'Certified user authorized to conduct drone flights and upload aerial evidence.',
    permissions: {
      caseManagement: 'view',
      violations: 'view',
      notices: 'view',
      ordinanceLibrary: 'view',
      aerialEvidence: 'edit',
      userAdminManagement: 'none',
    },
  },
  {
    role: 'Supervisor / Reviewer',
    description: 'Reviewer with oversight access for cases, notices, and evidence.',
    permissions: {
      caseManagement: 'admin',
      violations: 'admin',
      notices: 'admin',
      ordinanceLibrary: 'edit',
      aerialEvidence: 'admin',
      userAdminManagement: 'view',
    },
  },
  {
    role: 'Read-Only Staff',
    description: 'Staff user with read-only access to enforcement records.',
    permissions: {
      caseManagement: 'view',
      violations: 'view',
      notices: 'view',
      ordinanceLibrary: 'view',
      aerialEvidence: 'view',
      userAdminManagement: 'none',
    },
  },
];

const now = new Date().toISOString();

const DEFAULT_USERS: PlatformUser[] = [
  {
    id: 'user-1',
    firstName: 'James',
    lastName: 'Martinez',
    displayName: 'Officer James Martinez',
    email: 'j.martinez@city.gov',
    phone: '(555) 200-1234',
    username: 'jmartinez',
    municipality: 'City of Springfield',
    municipalityId: 'springfield-tx',
    department: 'Code Enforcement Division',
    title: 'Inspector',
    role: 'Municipal Admin',
    isActive: true,
    tdlrCeNumber: 'TDLR-CE-104',
    pilotCertificationStatus: 'Certified',
    certificationId: 'FAA-107-104',
    certificationExpirationDate: '2027-12-31',
    trainingCompletionDate: '2025-01-15',
    createdAt: now,
    updatedAt: now,
    createdByUserId: 'system',
    createdByDisplayName: 'System Seed',
  },
  {
    id: 'user-2',
    firstName: 'Dana',
    lastName: 'Kim',
    displayName: 'Officer Dana Kim',
    email: 'd.kim@city.gov',
    phone: '(555) 200-1288',
    username: 'dkim',
    municipality: 'City of Springfield',
    municipalityId: 'springfield-tx',
    department: 'Code Enforcement Division',
    title: 'Authorized Drone Pilot',
    role: 'Authorized Pilot',
    isActive: true,
    tdlrCeNumber: 'TDLR-CE-118',
    pilotCertificationStatus: 'Certified',
    certificationId: 'FAA-107-118',
    certificationExpirationDate: '2027-08-30',
    trainingCompletionDate: '2025-03-10',
    createdAt: now,
    updatedAt: now,
    createdByUserId: 'system',
    createdByDisplayName: 'System Seed',
  },
  {
    id: 'user-3',
    firstName: 'Marcus',
    lastName: 'Reed',
    displayName: 'Sgt. Marcus Reed',
    email: 'm.reed@city.gov',
    phone: '(555) 200-1192',
    username: 'mreed',
    municipality: 'City of Springfield',
    municipalityId: 'springfield-tx',
    department: 'Code Enforcement Division',
    title: 'UAS Program Lead',
    role: 'Supervisor / Reviewer',
    isActive: true,
    tdlrCeNumber: 'TDLR-CE-092',
    pilotCertificationStatus: 'Certified',
    certificationId: 'FAA-107-092',
    certificationExpirationDate: '2028-01-20',
    trainingCompletionDate: '2024-11-04',
    createdAt: now,
    updatedAt: now,
    createdByUserId: 'system',
    createdByDisplayName: 'System Seed',
  },
];

interface UserManagementContextType {
  users: PlatformUser[];
  roles: RoleDefinition[];
  auditLog: AuditLogEntry[];
  currentUser: PlatformUser;
  currentActor: AuditActorSnapshot;
  isLoaded: boolean;
  canAdminUsers: boolean;
  setCurrentUserId: (id: string) => void;
  createUser: (user: Omit<PlatformUser, 'id' | 'createdAt' | 'updatedAt' | 'createdByUserId' | 'createdByDisplayName' | 'updatedByUserId' | 'updatedByDisplayName'>) => PlatformUser;
  updateUser: (id: string, updates: Partial<PlatformUser>) => void;
  deactivateUser: (id: string) => void;
  updateRolePermissions: (role: SystemRole, permissions: RolePermissions) => void;
  getRolePermissions: (role: SystemRole) => RolePermissions;
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

export function UserManagementProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<PlatformUser[]>(DEFAULT_USERS);
  const [roles, setRoles] = useState<RoleDefinition[]>(DEFAULT_ROLE_DEFINITIONS);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [currentUserId, setCurrentUserIdState] = useState('user-1');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const [usersRaw, rolesRaw, auditRaw, currentRaw] = await Promise.all([
        AsyncStorage.getItem(USERS_KEY),
        AsyncStorage.getItem(ROLES_KEY),
        AsyncStorage.getItem(AUDIT_KEY),
        AsyncStorage.getItem(CURRENT_USER_KEY),
      ]);
      if (usersRaw) setUsers(JSON.parse(usersRaw));
      if (rolesRaw) setRoles(JSON.parse(rolesRaw));
      if (auditRaw) setAuditLog(JSON.parse(auditRaw));
      if (currentRaw) setCurrentUserIdState(currentRaw);
      setIsLoaded(true);
    }
    load().catch(() => setIsLoaded(true));
  }, []);

  useEffect(() => { if (isLoaded) AsyncStorage.setItem(USERS_KEY, JSON.stringify(users)).catch(() => {}); }, [users, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(ROLES_KEY, JSON.stringify(roles)).catch(() => {}); }, [roles, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(AUDIT_KEY, JSON.stringify(auditLog)).catch(() => {}); }, [auditLog, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem(CURRENT_USER_KEY, currentUserId).catch(() => {}); }, [currentUserId, isLoaded]);

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

  const hasPermission = useCallback((category: PermissionCategory, minimum: PermissionLevel = 'view') => {
    const current = getRolePermissions(currentUser.role)[category] ?? 'none';
    return permissionRank(current) >= permissionRank(minimum);
  }, [currentUser.role, getRolePermissions]);

  const canAdminUsers = hasPermission('userAdminManagement', 'admin');

  const setCurrentUserId = useCallback((id: string) => setCurrentUserIdState(id), []);

  const createUser = useCallback<UserManagementContextType['createUser']>((user) => {
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
  }, [appendAudit, currentActor]);

  const updateUser = useCallback((id: string, updates: Partial<PlatformUser>) => {
    let targetName = '';
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
    appendAudit({ action: 'Updated User', targetType: 'user', targetId: id, targetDisplayName: targetName || id, details: updates.role ? `Role changed to ${updates.role}` : 'Profile updated' });
  }, [appendAudit, currentActor]);

  const deactivateUser = useCallback((id: string) => {
    const user = users.find(item => item.id === id);
    setUsers(prev => prev.map(item => item.id === id ? {
      ...item,
      isActive: false,
      updatedAt: new Date().toISOString(),
      updatedByUserId: currentActor.userId,
      updatedByDisplayName: currentActor.displayName,
    } : item));
    appendAudit({ action: 'Deactivated User', targetType: 'user', targetId: id, targetDisplayName: user?.displayName ?? id });
  }, [appendAudit, currentActor, users]);

  const updateRolePermissions = useCallback((role: SystemRole, permissions: RolePermissions) => {
    setRoles(prev => prev.map(definition => definition.role === role ? {
      ...definition,
      permissions,
      updatedAt: new Date().toISOString(),
      updatedByUserId: currentActor.userId,
      updatedByDisplayName: currentActor.displayName,
    } : definition));
    appendAudit({ action: 'Updated Role Permissions', targetType: 'role', targetId: role, targetDisplayName: role, details: 'Permission categories updated' });
  }, [appendAudit, currentActor]);

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
      setCurrentUserId,
      createUser,
      updateUser,
      deactivateUser,
      updateRolePermissions,
      getRolePermissions,
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
