'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { api, getStoredToken } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMedecin: boolean;
  isSecretaire: boolean;
  isPatient: boolean;
  isStaff: boolean;
  isRealAdmin: boolean;
  roleOverride: 'auto' | 'admin' | 'medecin' | 'secretaire';
  setRoleOverride: (role: 'auto' | 'admin' | 'medecin' | 'secretaire') => void;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async (): Promise<User | null> => {
    try {
      const token = getStoredToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return null;
      }
      const userData = await api.getMe();
      setUser(userData);
      return userData;
    } catch {
      setUser(null);
      api.logout();
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    await api.login(email, password);
    const userData = await api.getMe();
    setUser(userData);
    return userData;
  };

  const register = async (data: any) => {
    return api.register(data);
  };

  const logout = () => {
    api.logout();
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const [roleOverride, setRoleOverrideState] = useState<'auto' | 'admin' | 'medecin' | 'secretaire'>('auto');

  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('clinique_role_preview') : null;
      if (saved && ['auto', 'admin', 'medecin', 'secretaire'].includes(saved)) {
        setRoleOverrideState(saved as any);
      }
    } catch {}
  }, []);

  const setRoleOverride = (role: 'auto' | 'admin' | 'medecin' | 'secretaire') => {
    setRoleOverrideState(role);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('clinique_role_preview', role);
      }
    } catch {}
  };

  const isRealAdmin = Boolean(user?.roles.includes('ROLE_ADMIN'));
  const isRealMedecin = Boolean(user?.roles.includes('ROLE_MEDECIN'));
  const isRealSecretaire = Boolean(user?.roles.includes('ROLE_SECRETAIRE'));

  // Effective active role (allows admin or staff to test / preview the exact view)
  const activeRole = (roleOverride !== 'auto' && (isRealAdmin || isRealMedecin || isRealSecretaire))
    ? roleOverride
    : (isRealAdmin ? 'admin' : isRealMedecin ? 'medecin' : isRealSecretaire ? 'secretaire' : 'patient');

  const isAdmin = activeRole === 'admin';
  const isMedecin = activeRole === 'medecin';
  const isSecretaire = activeRole === 'secretaire';
  const isStaff = Boolean(isAdmin || isMedecin || isSecretaire);
  const isPatient = Boolean(user?.roles.includes('ROLE_PATIENT') || (!isStaff && user));

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        isMedecin,
        isSecretaire,
        isPatient,
        isStaff,
        isRealAdmin,
        roleOverride,
        setRoleOverride,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
