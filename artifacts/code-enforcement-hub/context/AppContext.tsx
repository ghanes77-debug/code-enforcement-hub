import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EnforcementCase, Property, ResponsibleParty, Ordinance, CaseViolation, CaseNote, Notice, CaseStatus, NoticeStage } from '../types/models';
import { CASES, PROPERTIES, RESPONSIBLE_PARTIES, ORDINANCES } from '../data/mockData';

interface AppContextType {
  cases: EnforcementCase[];
  properties: Property[];
  responsibleParties: ResponsibleParty[];
  ordinances: Ordinance[];
  addCase: (newCase: Omit<EnforcementCase, 'id' | 'caseNumber'>) => EnforcementCase;
  updateCase: (id: string, updates: Partial<EnforcementCase>) => void;
  updateCaseStatus: (id: string, status: CaseStatus, note?: string) => void;
  addViolation: (caseId: string, violation: Omit<CaseViolation, 'id' | 'caseId'>) => void;
  addNote: (caseId: string, text: string, authorName: string) => void;
  addNotice: (caseId: string, notice: Omit<Notice, 'id' | 'caseId'>) => void;
  addProperty: (property: Omit<Property, 'id' | 'createdAt'>) => Property;
  addResponsibleParty: (party: Omit<ResponsibleParty, 'id'>) => ResponsibleParty;
  getCaseById: (id: string) => EnforcementCase | undefined;
  getPropertyById: (id: string) => Property | undefined;
  getResponsiblePartyById: (id: string) => ResponsibleParty | undefined;
  getOrdinanceById: (id: string) => Ordinance | undefined;
  getDashboardStats: () => { open: number; pending: number; closed: number; noticeSent: number; reinspection: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function generateCaseNumber(cases: EnforcementCase[]) {
  const year = new Date().getFullYear();
  const count = cases.filter(c => c.caseNumber.startsWith(`CE-${year}`)).length;
  return `CE-${year}-${String(count + 1).padStart(4, '0')}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<EnforcementCase[]>(CASES);
  const [properties, setProperties] = useState<Property[]>(PROPERTIES);
  const [responsibleParties, setResponsibleParties] = useState<ResponsibleParty[]>(RESPONSIBLE_PARTIES);
  const [ordinances] = useState<Ordinance[]>(ORDINANCES);

  const addCase = useCallback((newCase: Omit<EnforcementCase, 'id' | 'caseNumber'>): EnforcementCase => {
    const c: EnforcementCase = {
      ...newCase,
      id: generateId(),
      caseNumber: '',
    };
    setCases(prev => {
      c.caseNumber = generateCaseNumber(prev);
      return [...prev, c];
    });
    return c;
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

  const addNotice = useCallback((caseId: string, notice: Omit<Notice, 'id' | 'caseId'>) => {
    const n: Notice = { ...notice, id: generateId(), caseId };
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, notices: [...c.notices, n] } : c));
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
      addCase,
      updateCase,
      updateCaseStatus,
      addViolation,
      addNote,
      addNotice,
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
