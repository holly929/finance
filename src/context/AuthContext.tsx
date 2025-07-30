
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const storedUser = localStorage.getItem('loggedInUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            // No local user, check supabase session (if you implement it)
            // For now, if no user in localStorage, they need to log in.
            if (pathname !== '/') {
               router.push('/');
            }
        }
      } catch (error) {
        console.error('Failed to load user', error);
        setUser(null);
        if (pathname !== '/') {
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };
    checkUser();
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
