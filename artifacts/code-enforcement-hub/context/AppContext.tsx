import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EnforcementCase, Property, ResponsibleParty, Ordinance,
  CaseViolation, CaseNote, Attachment, Notice, CaseStatus,
} from '../types/models';
import { CASES, PROPERTIES, RESPONSIBLE_PARTIES, ORDINANCES } from '../data/mockData';

const STORAGE_KEYS = {
  cases: '@ceh:cases',
  properties: '@ceh:properties',
  responsibleParties: '@ceh:responsibleParties',
  version: '@ceh:dataVersion',
};

// Increment this string whenever mock data changes structurally
// so all clients automatically reload fresh seed data.
const DATA_VERSION = 'v4-notice-content';

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
  addNote: (caseId: string, text: string, authorName: string) => void;
  addAttachment: (caseId: string, attachment: Omit<Attachment, 'id' | 'caseId'>) => void;
  addNotice: (caseId: string, notice: Omit<Notice, 'id' | 'caseId'>) => Notice;
  markNoticeSent: (caseId: string, noticeId: string) => void;
  addProperty: (property: Omit<Property, 'id' | 'createdAt'>) => Property;
  addResponsibleParty: (party: Omit<ResponsibleParty, 'id'>) => ResponsibleParty;
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
  const [cases, setCases] = useState<EnforcementCase[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [responsibleParties, setResponsibleParties] = useState<ResponsibleParty[]>([]);
  const [ordinances] = useState<Ordinance[]>(ORDINANCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Refs to always have the latest values synchronously (avoid stale closures)
  const casesRef = useRef<EnforcementCase[]>([]);
  const propertiesRef = useRef<Property[]>([]);
  const responsiblePartiesRef = useRef<ResponsibleParty[]>([]);

  // Keep refs in sync
  useEffect(() => { casesRef.current = cases; }, [cases]);
  useEffect(() => { propertiesRef.current = properties; }, [properties]);
  useEffect(() => { responsiblePartiesRef.current = responsibleParties; }, [responsibleParties]);

  // ─── Load from AsyncStorage (or seed with mock data) ────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const storedVersion = await AsyncStorage.getItem(STORAGE_KEYS.version);
        const versionMismatch = storedVersion !== DATA_VERSION;

        if (versionMismatch) {
          // Clear all stored data so fresh mock data is loaded
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

        const loadedCases: EnforcementCase[] = casesRaw ? JSON.parse(casesRaw) : CASES;
        const loadedProperties: Property[] = propsRaw ? JSON.parse(propsRaw) : PROPERTIES;
        const loadedRPs: ResponsibleParty[] = rpRaw ? JSON.parse(rpRaw) : RESPONSIBLE_PARTIES;

        setCases(loadedCases);
        setProperties(loadedProperties);
        setResponsibleParties(loadedRPs);
      } catch {
        // If storage fails, fall back to mock data
        setCases(CASES);
        setProperties(PROPERTIES);
        setResponsibleParties(RESPONSIBLE_PARTIES);
      } finally {
        setIsLoaded(true);
      }
    }
    load();
  }, []);

  // ─── Persist to AsyncStorage whenever state changes ──────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.cases, JSON.stringify(cases)).catch(() => {});
  }, [cases, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(properties)).catch(() => {});
  }, [properties, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.responsibleParties, JSON.stringify(responsibleParties)).catch(() => {});
  }, [responsibleParties, isLoaded]);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  // Uses ref so case number is computed synchronously from the current list
  const addCase = useCallback((newCase: Omit<EnforcementCase, 'id' | 'caseNumber'>): EnforcementCase => {
    const caseNumber = generateCaseNumber(casesRef.current);
    const created: EnforcementCase = { ...newCase, id: generateId(), caseNumber };
    setCases(prev => [...prev, created]);
    return created;
  }, []);

  const updateCase = useCallback((id: string, updates: Partial<EnforcementCase>) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const updateCaseStatus = useCallback((id: string, status: CaseStatus, note?: string) => {
    setCases(prev => prev.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        status,
        closedDate: status === 'Closed' ? new Date().toISOString() : c.closedDate,
        statusHistory: [...c.statusHistory, { status, date: new Date().toISOString(), note }],
      };
    }));
  }, []);

  const addViolation = useCallback((caseId: string, violation: Omit<CaseViolation, 'id' | 'caseId'>) => {
    const v: CaseViolation = { ...violation, id: generateId(), caseId };
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, violations: [...c.violations, v] } : c));
  }, []);

  const addNote = useCallback((caseId: string, text: string, authorName: string) => {
    const note: CaseNote = { id: generateId(), caseId, text, authorName, createdAt: new Date().toISOString() };
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, notes: [...c.notes, note] } : c));
  }, []);

  const addAttachment = useCallback((caseId: string, attachment: Omit<Attachment, 'id' | 'caseId'>) => {
    const a: Attachment = { ...attachment, id: generateId(), caseId };
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, attachments: [...c.attachments, a] } : c));
  }, []);

  const addNotice = useCallback((caseId: string, notice: Omit<Notice, 'id' | 'caseId'>): Notice => {
    const n: Notice = { ...notice, id: generateId(), caseId };
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, notices: [...c.notices, n] } : c));
    return n;
  }, []);

  const markNoticeSent = useCallback((caseId: string, noticeId: string) => {
    const sentAt = new Date().toISOString();
    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      return {
        ...c,
        notices: c.notices.map(n => n.id === noticeId ? { ...n, sentAt } : n),
      };
    }));
  }, []);

  const addProperty = useCallback((property: Omit<Property, 'id' | 'createdAt'>): Property => {
    const p: Property = { ...property, id: generateId(), createdAt: new Date().toISOString() };
    setProperties(prev => [...prev, p]);
    return p;
  }, []);

  const addResponsibleParty = useCallback((party: Omit<ResponsibleParty, 'id'>): ResponsibleParty => {
    const rp: ResponsibleParty = { ...party, id: generateId() };
    setResponsibleParties(prev => [...prev, rp]);
    return rp;
  }, []);

  const getCaseById = useCallback((id: string) => cases.find(c => c.id === id), [cases]);
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
      addNote,
      addAttachment,
      addNotice,
      markNoticeSent,
      addProperty,
      addResponsibleParty,
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
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
