
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<User | null>;
  logout: () => void;
  updateAuthUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const storedUser = localStorage.getItem('loggedInUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            // No local user, check supabase session
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: userData, error } = await supabase.from('users').select().eq('id', session.user.id).single();
                if (error) throw error;
                setUser(userData);
                localStorage.setItem('loggedInUser', JSON.stringify(userData));
            } else {
               router.push('/');
            }
        }
      } catch (error) {
        console.error('Failed to load user', error);
        setUser(null);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  const login = async (email: string, password?: string): Promise<User | null> => {
    // In a real app, you'd use Supabase Auth. For now, we query the users table.
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('users')
            .select()
            .eq('email', email)
            .single();

        if (error || !data) {
             console.error("Login error:", error?.message);
             return null;
        }

        // WARNING: This is NOT secure password validation.
        // It's a placeholder for the demo to work without full Supabase auth setup.
        if (data.password === password) {
            setUser(data);
            localStorage.setItem('loggedInUser', JSON.stringify(data));
            return data;
        }
        return null;

    } catch (error: any) {
        console.error("Login error:", error.message);
        return null;
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('loggedInUser');
    setUser(null);
    // await supabase.auth.signOut(); // Would use this in a real Supabase Auth setup
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
