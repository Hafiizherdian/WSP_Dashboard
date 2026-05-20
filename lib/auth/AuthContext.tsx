'use client';

// lib/auth/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SessionUser, can, Permission, canAccessArea, getAccessibleAreas } from './types';

interface AuthContextValue {
  user:    SessionUser | null;
  loading: boolean;
  logout:  () => Promise<void>;
  can:     (permission: Permission) => boolean;
  canAccessArea: (area: string) => boolean;
  getAccessibleAreas: () => string[];
}

const AuthCtx = createContext<AuthContextValue>({
  user: null, loading: true,
  logout: async () => {},
  can: () => false,
  canAccessArea: () => false,
  getAccessibleAreas: () => [],
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        // console.log('[AuthContext] User data from API:', d?.data);
        setUser(d?.data ?? null);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/login';
  }, []);

  const checkPerm = useCallback(
    (permission: Permission) => user ? can(user.role, permission) : false,
    [user]
  );

  const checkAreaAccess = useCallback(
    (area: string) => {
      const hasAccess = user ? canAccessArea(user, area) : false;
      // console.log('[AuthContext] Area access check:', { 
      //   user: user?.username, 
      //   role: user?.role, 
      //   userAreas: user?.allowed_areas, 
      //   requestedArea: area, 
      //   hasAccess 
      // });
      return hasAccess;
    },
    [user]
  );

  const getAccessible = useCallback(
    () => user ? getAccessibleAreas(user) : [],
    [user]
  );

  return (
    <AuthCtx.Provider value={{ user, loading, logout, can: checkPerm, canAccessArea: checkAreaAccess, getAccessibleAreas: getAccessible }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);