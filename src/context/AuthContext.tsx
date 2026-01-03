
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  updateAuthUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'rateease.user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkUser = useCallback(() => {
    try {
      const storedUserJson = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUserJson) {
        const storedUser = JSON.parse(storedUserJson);
        const fullUser = store.users.find(u => u.id === storedUser.id);
        setUser(fullUser || null);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("Could not parse user from localStorage", e);
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUser();

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === USER_STORAGE_KEY) {
            checkUser();
        }
    }
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkUser]);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    router.push('/login');
  }, [router]);

  const updateAuthUser = (updatedUser: User) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, updateAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
