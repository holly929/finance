
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string, users: User[]) => User | null;
  logout: () => void;
  updateAuthUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In-memory store for the logged-in user
let inMemoryUser: User | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(inMemoryUser);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This effect runs only once on mount to set the initial state
    setUser(inMemoryUser);
    setLoading(false);
  }, []);

  const login = (email: string, pass: string, users: User[]): User | null => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);

    if (foundUser) {
      inMemoryUser = foundUser;
      setUser(foundUser);
      return foundUser;
    }
    return null;
  };

  const logout = () => {
    inMemoryUser = null;
    setUser(null);
    router.push('/login');
  };

  const updateAuthUser = (updatedUser: User) => {
    inMemoryUser = updatedUser;
    setUser(updatedUser);
  };

  // This effect handles protecting routes
  useEffect(() => {
    if (loading) return; // Don't run this effect until initial state is set

    const isAuthPage = pathname === '/login';

    if (!user && !isAuthPage) {
        // If not logged in and not on the login page, redirect to login
        router.push('/login');
    } else if (user && isAuthPage) {
        // If logged in and on the login page, redirect to dashboard
        router.push('/dashboard');
    }
  }, [user, pathname, router, loading]);

  if (loading) {
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
