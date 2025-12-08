
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUserData } from './UserDataContext';
import { store } from '@/lib/store';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => void;
  updateAuthUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'rateease.user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { users } = useUserData();

  useEffect(() => {
    let isMounted = true;
    const checkUser = () => {
      try {
        const storedUserJson = localStorage.getItem(USER_STORAGE_KEY);
        if (storedUserJson) {
          const storedUser = JSON.parse(storedUserJson);
          if (isMounted) {
            // Find the full, up-to-date user object from the central store
            const fullUser = store.users.find(u => u.id === storedUser.id);
            setUser(fullUser || null);
          }
        }
      } catch (e) {
        console.error("Could not parse user from localStorage", e);
        localStorage.removeItem(USER_STORAGE_KEY);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    checkUser();

    // Listen for storage changes to sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === USER_STORAGE_KEY) {
            checkUser();
        }
    }
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (email: string, pass: string): Promise<User | null> => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);

    if (foundUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(foundUser));
      setUser(foundUser);
      return foundUser;
    }
    return null;
  };

  const logout = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    router.push('/login');
  }, [router]);

  const updateAuthUser = (updatedUser: User) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login';

    if (!user && !isAuthPage) {
        router.replace('/login');
    } else if (user && isAuthPage) {
        router.replace('/dashboard');
    }
  }, [user, pathname, router, loading]);
  
  const isAuthCheckPage = pathname === '/login';
  if (loading && !isAuthCheckPage) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      );
  }
  
  if (!user && !isAuthCheckPage) {
      return null;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateAuthUser }}>
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
