import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EnforcementCase, Property, ResponsibleParty, Ordinance,
  CaseViolation, CaseNote, Attachment, Notice, CaseStatus, PermissionCategory, PermissionLevel,
} from '../types/models';
import { CASES, PROPERTIES, RESPONSIBLE_PARTIES, ORDINANCES } from '../data/mockData';
import { useUserManagement } from './UserManagementContext';
import { useSession } from './SessionContext';

const STORAGE_KEYS = {
  cases: '@ceh:cases',
  properties: '@ceh:properties',
  responsibleParties: '@ceh:responsibleParties',
  version: '@ceh:dataVersion',
};

// Increment when mock data structure changes so clients reload fresh seed data
const DATA_VERSION = 'v5-tenant-aware';

interface AppContextType {
  cases: EnforcementCase[];
  properties: Property[];
  responsibleParties: ResponsibleParty[];
  ordinances: Ordinance[];
  isLoaded: boolean;
  addCase: (newCase: Omit<EnforcementCase, 'id' | 'caseNumber'>) => EnforcementCase;
  updateCase: (id: string, updates: Partial<EnforcementCase>) => void;
  updateCaseStatus: (id: string, status: CaseStatus, note?: string) => void;
  addViolation: (caseId: string, violation: Omit<CaseViolation, 'id' | 'caseId'>) => void;
  updateViolation: (caseId: string, violationId: string, updates: Partial<CaseViolation>) => void;
  deleteViolation: (caseId: string, violationId: string) => void;
  addNote: (caseId: string, text: string, authorName: string) => void;
  deleteNote: (caseId: string, noteId: string) => void;
  addAttachment: (caseId: string, attachment: Omit<Attachment, 'id' | 'caseId'>) => void;
  deleteAttachment: (caseId: string, attachmentId: string) => void;
  addNotice: (caseId: string, notice: Omit<Notice, 'id' | 'caseId'>) => Notice;
  markNoticeSent: (caseId: string, noticeId: string) => void;
  addProperty: (property: Omit<Property, 'id' | 'createdAt'>) => Property;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  addResponsibleParty: (party: Omit<ResponsibleParty, 'id'>) => ResponsibleParty;
  updateResponsibleParty: (id: string, updates: Partial<ResponsibleParty>) => void;
  getCaseById: (id: string) => EnforcementCase | undefined;
  getPropertyById: (id: string) => Property | undefined;
  getResponsiblePartyById: (id: string) => ResponsibleParty | undefined;
  getOrdinanceById: (id: string) => Ordinance | undefined;
  getDashboardStats: () => { open: number; pending: number; closed: number; noticeSent: number; reinspection: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function generateCaseNumber(existingCases: EnforcementCase[]): string {
  const year = new Date().getFullYear();
  const yearCases = existingCases.filter(c => c.caseNumber.startsWith(`CE-${year}`));
  return `CE-${year}-${String(yearCases.length + 1).padStart(4, '0')}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { currentActor, hasPermission } = useUserManagement();
  const { session } = useSession();

  const [allCases, setAllCases] = useState<EnforcementCase[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [responsibleParties, setResponsibleParties] = useState<ResponsibleParty[]>([]);
  const [ordinances] = useState<Ordinance[]>(ORDINANCES);
  const [isLoaded, setIsLoaded] = useState(false);

  const allCasesRef = useRef<EnforcementCase[]>([]);
  const propertiesRef = useRef<Property[]>([]);
  const responsiblePartiesRef = useRef<ResponsibleParty[]>([]);

  useEffect(() => { allCasesRef.current = allCases; }, [allCases]);
  useEffect(() => { propertiesRef.current = properties; }, [properties]);
  useEffect(() => { responsiblePartiesRef.current = responsibleParties; }, [responsibleParties]);

  // ─── Tenant-filtered view of cases ───────────────────────────────────────────
  const cases: EnforcementCase[] = (() => {
    if (!session) return [];
    const isPSA = session.role === 'Platform Super Admin';
    const filterTenant = session.viewAsTenantId ?? (isPSA ? undefined : session.tenantId);
    if (!filterTenant) return allCases;
    return allCases.filter(c => c.municipalityId === filterTenant);
  })();

  // ─── Load from AsyncStorage (or seed with mock data) ──────────────────────
  useEffect(() => {
    async function load() {
      try {
        const storedVersion = await AsyncStorage.getItem(STORAGE_KEYS.version);
        const versionMismatch = storedVersion !== DATA_VERSION;

        if (versionMismatch) {
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.cases,
            STORAGE_KEYS.properties,
            STORAGE_KEYS.responsibleParties,
          ]);
          await AsyncStorage.setItem(STORAGE_KEYS.version, DATA_VERSION);
        }

        const [casesRaw, propsRaw, rpRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.cases),
          AsyncStorage.getItem(STORAGE_KEYS.properties),
          AsyncStorage.getItem(STORAGE_KEYS.responsibleParties),
        ]);

        setAllCases(casesRaw ? JSON.parse(casesRaw) : CASES);
        setProperties(propsRaw ? JSON.parse(propsRaw) : PROPERTIES);
        setResponsibleParties(rpRaw ? JSON.parse(rpRaw) : RESPONSIBLE_PARTIES);
      } catch {
        setAllCases(CASES);
        setProperties(PROPERTIES);
        setResponsibleParties(RESPONSIBLE_PARTIES);
      } finally {
        setIsLoaded(true);
      }
    }
    load();
  }, []);

  // ─── Persist to AsyncStorage ──────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.cases, JSON.stringify(allCases)).catch(() => {});
  }, [allCases, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(properties)).catch(() => {});
  }, [properties, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.responsibleParties, JSON.stringify(responsibleParties)).catch(() => {});
  }, [responsibleParties, isLoaded]);

  // ─── Permission helpers ───────────────────────────────────────────────────
  const requirePermission = useCallback((category: PermissionCategory, level: PermissionLevel = 'edit') => {
    if (!hasPermission(category, level)) {
      throw new Error('Your current role does not have permission to perform this action.');
    }
  }, [hasPermission]);

  // ─── Case actions ─────────────────────────────────────────────────────────
  const addCase = useCallback((newCase: Omit<EnforcementCase, 'id' | 'caseNumber'>): EnforcementCase => {
    requirePermission('caseManagement', 'edit');
    const caseNumber = generateCaseNumber(allCasesRef.current);
    const created: EnforcementCase = {
      ...newCase,
      id: generateId(),
      caseNumber,
      municipalityId: newCase.municipalityId ?? session?.tenantId ?? '',
      createdByUserId: currentActor.userId,
      createdByDisplayName: currentActor.displayName,
      updatedByUserId: currentActor.userId,
      updatedByDisplayName: currentActor.displayName,
    };
    setAllCases(prev => [...prev, created]);
    return created;
  }, [currentActor, requirePermission, session]);

  const updateCase = useCallback((id: string, updates: Partial<EnforcementCase>) => {
    requirePermission('caseManagement', 'edit');
    setAllCases(prev => prev.map(c => c.id === id ? {
      ...c,
      ...updates,
      updatedByUserId: currentActor.userId,
      updatedByDisplayName: currentActor.displayName,
    } : c));
  }, [currentActor, requirePermission]);

  const updateCaseStatus = useCallback((id: string, status: CaseStatus, note?: string) => {
    requirePermission('caseManagement', 'edit');
    setAllCases(prev => prev.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        status,
        closedDate: status === 'Closed' ? new Date().toISOString() : c.closedDate,
        updatedByUserId: currentActor.userId,
        updatedByDisplayName: currentActor.displayName,
        statusHistory: [...c.statusHistory, {
          status,
          date: new Date().toISOString(),
          note,
          changedByUserId: currentActor.userId,
          changedByDisplayName: currentActor.displayName,
        }],
      };
    }));
  }, [currentActor, requirePermission]);

  const addViolation = useCallback((caseId: string, violation: Omit<CaseViolation, 'id' | 'caseId'>) => {
    requirePermission('violations', 'edit');
    const v: CaseViolation = {
      ...violation,
      id: generateId(),
      caseId,
      createdByUserId: currentActor.userId,
      createdByDisplayName: currentActor.displayName,
    };
    setAllCases(prev => prev.map(c => c.id === caseId ? { ...c, violations: [...c.violations, v] } : c));
  }, [currentActor, requirePermission]);

  const updateViolation = useCallback((caseId: string, violationId: string, updates: Partial<CaseViolation>) => {
    requirePermission('violations', 'edit');
    setAllCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      return {
        ...c,
        violations: c.violations.map(v => v.id === violationId ? {
          ...v,
          ...updates,
          updatedByUserId: currentActor.userId,
          updatedByDisplayName: currentActor.displayName,
        } : v),
      };
    }));
  }, [currentActor, requirePermission]);

  const deleteViolation = useCallback((caseId: string, violationId: string) => {
    requirePermission('violations', 'admin');
    setAllCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      return { ...c, violations: c.violations.filter(v => v.id !== violationId) };
    }));
  }, [requirePermission]);

  const addNote = useCallback((caseId: string, text: string, authorName: string) => {
    requirePermission('caseManagement', 'edit');
    const note: CaseNote = {
      id: generateId(),
      caseId,
      text,
      authorName,
      createdAt: new Date().toISOString(),
      createdByUserId: currentActor.userId,
      createdByDisplayName: currentActor.displayName,
    };
    setAllCases(prev => prev.map(c => c.id === caseId ? { ...c, notes: [...c.notes, note] } : c));
  }, [currentActor, requirePermission]);

  const deleteNote = useCallback((caseId: string, noteId: string) => {
    requirePermission('caseManagement', 'admin');
    setAllCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      return { ...c, notes: c.notes.filter(n => n.id !== noteId) };
    }));
  }, [requirePermission]);

  const addAttachment = useCallback((caseId: string, attachment: Omit<Attachment, 'id' | 'caseId'>) => {
    if (attachment.captureMethod === 'drone') {
      requirePermission('aerialEvidence', 'edit');
    } else if (!hasPermission('caseManagement', 'edit') && !hasPermission('aerialEvidence', 'edit')) {
      throw new Error('Permission denied: requires edit access to case management or aerial evidence');
    }
    const a: Attachment = {
      ...attachment,
      id: generateId(),
      caseId,
      createdByUserId: attachment.createdByUserId ?? currentActor.userId,
      createdByDisplayName: attachment.createdByDisplayName ?? currentActor.displayName,
    };
    setAllCases(prev => prev.map(c => c.id === caseId ? { ...c, attachments: [...c.attachments, a] } : c));
  }, [currentActor, hasPermission, requirePermission]);

  const deleteAttachment = useCallback((caseId: string, attachmentId: string) => {
    requirePermission('aerialEvidence', 'admin');
    setAllCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      return { ...c, attachments: c.attachments.filter(a => a.id !== attachmentId) };
    }));
  }, [requirePermission]);

  const addNotice = useCallback((caseId: string, notice: Omit<Notice, 'id' | 'caseId'>): Notice => {
    requirePermission('notices', 'edit');
    const n: Notice = {
      ...notice,
      id: generateId(),
      caseId,
      createdByUserId: currentActor.userId,
      createdByDisplayName: currentActor.displayName,
    };
    setAllCases(prev => prev.map(c => c.id === caseId ? { ...c, notices: [...c.notices, n] } : c));
    return n;
  }, [currentActor, requirePermission]);

  const markNoticeSent = useCallback((caseId: string, noticeId: string) => {
    requirePermission('notices', 'edit');
    const sentAt = new Date().toISOString();
    setAllCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      return {
        ...c,
        notices: c.notices.map(n => n.id === noticeId ? { ...n, sentAt } : n),
      };
    }));
  }, [requirePermission]);

  const addProperty = useCallback((property: Omit<Property, 'id' | 'createdAt'>): Property => {
    requirePermission('caseManagement', 'edit');
    const p: Property = { ...property, id: generateId(), createdAt: new Date().toISOString() };
    setProperties(prev => [...prev, p]);
    return p;
  }, [requirePermission]);

  const updateProperty = useCallback((id: string, updates: Partial<Property>) => {
    requirePermission('caseManagement', 'edit');
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [requirePermission]);

  const addResponsibleParty = useCallback((party: Omit<ResponsibleParty, 'id'>): ResponsibleParty => {
    requirePermission('caseManagement', 'edit');
    const rp: ResponsibleParty = { ...party, id: generateId() };
    setResponsibleParties(prev => [...prev, rp]);
    return rp;
  }, [requirePermission]);

  const updateResponsibleParty = useCallback((id: string, updates: Partial<ResponsibleParty>) => {
    requirePermission('caseManagement', 'edit');
    setResponsibleParties(prev => prev.map(rp => rp.id === id ? { ...rp, ...updates } : rp));
  }, [requirePermission]);

  const getCaseById = useCallback((id: string) => allCases.find(c => c.id === id), [allCases]);
  const getPropertyById = useCallback((id: string) => properties.find(p => p.id === id), [properties]);
  const getResponsiblePartyById = useCallback((id: string) => responsibleParties.find(rp => rp.id === id), [responsibleParties]);
  const getOrdinanceById = useCallback((id: string) => ordinances.find(o => o.id === id), [ordinances]);

  const getDashboardStats = useCallback(() => ({
    open: cases.filter(c => c.status === 'Open').length,
    pending: cases.filter(c => c.status === 'Pending').length,
    closed: cases.filter(c => c.status === 'Closed').length,
    noticeSent: cases.filter(c => c.status === 'Notice Sent').length,
    reinspection: cases.filter(c => c.status === 'Reinspection Needed').length,
  }), [cases]);

  return (
    <AppContext.Provider value={{
      cases,
      properties,
      responsibleParties,
      ordinances,
      isLoaded,
      addCase,
      updateCase,
      updateCaseStatus,
      addViolation,
      updateViolation,
      deleteViolation,
      addNote,
      deleteNote,
      addAttachment,
      deleteAttachment,
      addNotice,
      markNoticeSent,
      addProperty,
      updateProperty,
      addResponsibleParty,
      updateResponsibleParty,
      getCaseById,
      getPropertyById,
      getResponsiblePartyById,
      getOrdinanceById,
      getDashboardStats,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
