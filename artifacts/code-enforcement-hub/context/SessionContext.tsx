import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlatformUser, TenantSession } from '../types/models';
import { DEFAULT_USERS } from '../data/defaultUsers';

const SESSION_KEY = '@ceh:session';
const USERS_KEY = '@ceh:users';

const DEFAULT_ENABLED_MODULES = [
  'cases',
  'violations',
  'notices',
  'evidence',
  'reports',
  'ordinances',
];

interface SessionContextType {
  session: TenantSession | null;
  isSessionLoaded: boolean;
  login: (username: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateSession: (updates: Partial<TenantSession>) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

function buildSession(user: PlatformUser): TenantSession {
  return {
    userId: user.id,
    displayName: user.displayName,
    role: user.role,
    tenantId: user.municipalityId,
    municipalityName: user.municipality,
    departmentName: user.department,
    enabledModules: DEFAULT_ENABLED_MODULES,
    loggedInAt: new Date().toISOString(),
  };
}

async function loadUsersFromStorage(): Promise<PlatformUser[]> {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as PlatformUser[];
  } catch {
    // fall through
  }
  return DEFAULT_USERS;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<TenantSession | null>(null);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then(raw => {
        if (raw) setSession(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setIsSessionLoaded(true));
  }, []);

  const persist = useCallback(async (s: TenantSession | null) => {
    try {
      if (s) {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s));
      } else {
        await AsyncStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // storage failure is non-fatal
    }
    setSession(s);
  }, []);

  const login = useCallback(
    async (username: string, pin: string): Promise<{ success: boolean; error?: string }> => {
      if (!username.trim()) return { success: false, error: 'Username is required.' };
      if (!pin.trim()) return { success: false, error: 'PIN is required.' };

      const users = await loadUsersFromStorage();
      const user = users.find(
        u => u.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (!user) return { success: false, error: 'Username not found.' };
      if (!user.isActive) return { success: false, error: 'This account is inactive. Contact your administrator.' };

      const expectedPin = user.pin ?? '0000';
      if (pin !== expectedPin) return { success: false, error: 'Incorrect PIN.' };

      const newSession = buildSession(user);
      await persist(newSession);
      return { success: true };
    },
    [persist]
  );

  const logout = useCallback(async () => {
    await persist(null);
  }, [persist]);

  const updateSession = useCallback(
    (updates: Partial<TenantSession>) => {
      setSession(prev => {
        if (!prev) return prev;
        const next = { ...prev, ...updates };
        AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    []
  );

  return (
    <SessionContext.Provider value={{ session, isSessionLoaded, login, logout, updateSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
