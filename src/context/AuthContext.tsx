
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => User | null;
  logout: () => void;
  updateAuthUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to initialize auth state from localStorage', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (email: string, pass: string): User | null => {
    const storedUsers = localStorage.getItem('users');
    let users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
    
    // One-time check to create default admin if no users exist
    if (users.length === 0 && email === 'admin@rateease.gov' && pass === 'password') {
        const defaultAdminUser: User = {
            id: 'user-0',
            name: 'Admin',
            email: 'admin@rateease.gov',
            role: 'Admin',
            password: 'password',
            photoURL: '',
        };
        users = [defaultAdminUser];
        localStorage.setItem('users', JSON.stringify(users));
    }

    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('loggedInUser', JSON.stringify(foundUser));
      return foundUser;
    }
    return null;
  };

  const logout = () => {
    localStorage.removeItem('loggedInUser');
    setUser(null);
    router.push('/');
  };

  const updateAuthUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
  };

  // This effect handles protecting routes
  useEffect(() => {
    if (loading) return; // Don't do anything while loading
    
    const isAuthPage = pathname === '/';

    if (!user && !isAuthPage) {
        // If not logged in and not on the login page, redirect to login
        router.push('/');
    } else if (user && isAuthPage) {
        // If logged in and on the login page, redirect to dashboard
        router.push('/dashboard');
    }
  }, [user, loading, pathname, router]);


  if (loading || (!user && pathname !== '/')) {
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
