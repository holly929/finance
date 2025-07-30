
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  updateAuthUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultAdminUser: Omit<User, 'id'> = {
    name: 'Admin',
    email: 'admin@rateease.gov',
    role: 'Admin',
    password: 'password',
    photoURL: '',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First, check for an existing user in localStorage
        const storedUser = localStorage.getItem('loggedInUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            // If no user in localStorage, it might be the first ever run.
            // Let's ensure a default admin exists in the database.
            const { count, error: countError } = await supabase.from('users').select('*', { count: 'exact', head: true });

            if (countError) {
              // Can't connect to DB, proceed with no user
              console.error("Database connection error on initial check:", countError);
            } else if (count === 0) {
              // If no users exist in the database, create the default admin.
              const { error: insertError } = await supabase.from('users').insert(defaultAdminUser);
              if (insertError) {
                console.error("Failed to create default admin user:", insertError);
              }
            }
            
            // If we are not on the login page, redirect there.
            if (pathname !== '/') {
               router.push('/');
            }
        }
      } catch (error) {
        console.error('Failed to initialize auth state', error);
        setUser(null);
        if (pathname !== '/') {
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, [router, pathname]);

  const logout = async () => {
    localStorage.removeItem('loggedInUser');
    setUser(null);
    router.push('/');
  };

  const updateAuthUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
  };

  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

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
