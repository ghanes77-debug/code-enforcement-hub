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
    if (raw) {
      const stored = JSON.parse(raw) as PlatformUser[];
      const storedIds = new Set(stored.map(u => u.id));
      // Always include any DEFAULT_USERS that aren't in storage yet
      const missing = DEFAULT_USERS.filter(u => !storedIds.has(u.id));
      return [...stored, ...missing];
    }
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

      const normalizedUsername = username.trim().toLowerCase();

      // Build the search pool: stored users merged with DEFAULT_USERS so seed
      // accounts are always available even if they were never written to storage.
      const stored = await loadUsersFromStorage();
      const storedIds = new Set(stored.map(u => u.id));
      const allUsers = [
        ...stored,
        ...DEFAULT_USERS.filter(u => !storedIds.has(u.id)),
      ];

      // Prefer the stored version of a user but always allow DEFAULT_USERS credentials
      let user = allUsers.find(u => u.username.toLowerCase() === normalizedUsername);

      // Final safety net: look directly in DEFAULT_USERS in case storage is corrupt
      if (!user) {
        user = DEFAULT_USERS.find(u => u.username.toLowerCase() === normalizedUsername);
      }

      if (!user) return { success: false, error: 'Username not found.' };
      if (!user.isActive) return { success: false, error: 'This account is inactive. Contact your administrator.' };

      // For DEFAULT_USERS, always accept PIN '0000' as well as the stored pin
      const defaultUser = DEFAULT_USERS.find(u => u.id === user!.id);
      const expectedPin = user.pin ?? defaultUser?.pin ?? '0000';
      const isDefaultPin = pin === '0000' && defaultUser !== undefined;
      if (pin !== expectedPin && !isDefaultPin) {
        return { success: false, error: 'Incorrect PIN.' };
      }

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
