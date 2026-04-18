import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppSettings {
  inspectorName:       string;
  inspectorBadge:      string;
  inspectorRole:       string;
  inspectorPhone:      string;
  inspectorEmail:      string;
  inspectorDepartment: string;
  cityName:            string;
  departmentName:      string;
  cityAddress:         string;
  cityPhone:           string;
  firstNoticeDays:     number;
  secondNoticeDays:    number;
  finalNoticeDays:     number;
  openingFirst:        string;
  openingSecond:       string;
  openingFinal:        string;
  closingDefault:      string;
  closingFinal:        string;
}

interface SettingsContextType {
  settings:       AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings:  () => void;
  isLoaded:       boolean;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  inspectorName:       'Officer James Martinez',
  inspectorBadge:      'CE-104',
  inspectorRole:       'Inspector',
  inspectorPhone:      '(555) 200-1234',
  inspectorEmail:      'j.martinez@city.gov',
  inspectorDepartment: 'Code Enforcement Division',
  cityName:            'City of Springfield',
  departmentName:      'Department of Code Enforcement',
  cityAddress:         '100 Government Plaza, Springfield, TX 75001',
  cityPhone:           '(555) 200-1000',
  firstNoticeDays:     14,
  secondNoticeDays:    7,
  finalNoticeDays:     5,
  openingFirst:
    'Upon inspection of the above-referenced property, the following code violation(s) have been identified and must be corrected within the time period specified below.',
  openingSecond:
    'This is a SECOND NOTICE. Our records indicate that the violations cited below have not been corrected as required by our previous notice. Immediate corrective action is required.',
  openingFinal:
    'This is your FINAL NOTICE. Despite previous notifications, the violations listed below remain uncorrected. You must achieve full compliance by the deadline stated herein.',
  closingDefault:
    'Failure to correct all listed violations within the time allowed may result in further enforcement action, including escalating fines, civil penalties, and/or abatement at the property owner\'s expense.',
  closingFinal:
    'FAILURE TO COMPLY with this Final Notice may result in municipal prosecution, administrative fines not to exceed $2,000 per day per violation, and/or abatement of the violations by the City at the property owner\'s expense. The City reserves all rights to pursue any and all legal remedies available under applicable law.',
};

const STORAGE_KEY = '@ceh:settings';

// ─── Context ──────────────────────────────────────────────────────────────────

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setSettings({ ...DEFAULT_SETTINGS, ...parsed });
          } catch { /* ignore corrupt data */ }
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS)).catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
