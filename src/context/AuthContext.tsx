
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUserData } from './UserDataContext';

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
  const { users, loading: usersLoading } = useUserData();

  useEffect(() => {
    if (usersLoading) {
      return; 
    }
    try {
      const storedUserJson = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUserJson) {
        const storedUser = JSON.parse(storedUserJson);
        const foundUser = users.find(u => u.id === storedUser.id);
        setUser(foundUser || null);
      }
    } catch (e) {
      console.error("Could not parse user from localStorage", e);
      localStorage.removeItem(USER_STORAGE_KEY);
    } finally {
        setLoading(false);
    }
  }, [users, usersLoading]);

  const login = async (email: string, pass: string): Promise<User | null> => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);

    if (foundUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(foundUser));
      setUser(foundUser);
      return foundUser;
    }
    return null;
  };

  const logout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    router.push('/login');
  };

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

  if (loading || (!user && pathname !== '/login')) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
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
