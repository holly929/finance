
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { supabase } from '@/lib/supabase-client';

export const PERMISSION_PAGES = [
  'dashboard', 'properties', 'billing', 'bills', 'reports', 'users', 'settings', 'integrations'
] as const;

export type PermissionPage = typeof PERMISSION_PAGES[number];
export type UserRole = User['role'];
export type RolePermissions = Record<UserRole, Partial<Record<PermissionPage, boolean>>>;

const defaultPermissions: RolePermissions = {
  Admin: {
    dashboard: true, properties: true, billing: true, bills: true, reports: true,
    users: true, settings: true, 'integrations': true,
  },
  'Data Entry': {
    dashboard: true, properties: true, billing: true, bills: true, reports: true,
    users: false, settings: false, 'integrations': true,
  },
  Viewer: {
    dashboard: true, properties: false, billing: false, bills: false, reports: false,
    users: false, settings: false, 'integrations': false,
  },
};

interface PermissionsContextType {
  permissions: RolePermissions;
  loading: boolean;
  updatePermissions: (newPermissions: RolePermissions) => Promise<void>;
  hasPermission: (role: UserRole, page: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<RolePermissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('permissions').select('role, permissions');
      if (error) throw error;

      if (data && data.length > 0) {
        const fetchedPermissions = data.reduce((acc, { role, permissions }) => {
          if (role) acc[role as UserRole] = permissions;
          return acc;
        }, {} as Partial<RolePermissions>);

        const mergedPermissions = JSON.parse(JSON.stringify(defaultPermissions));
         for (const role in mergedPermissions) {
          if (fetchedPermissions[role as UserRole]) {
            Object.assign(mergedPermissions[role as UserRole], fetchedPermissions[role as UserRole]);
          }
        }
        setPermissions(mergedPermissions);
      } else {
        setPermissions(defaultPermissions);
      }
    } catch (error: any) {
      console.error('Failed to load permissions from Supabase', error);
      setPermissions(defaultPermissions);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const updatePermissions = async (newPermissions: RolePermissions) => {
    setLoading(true);
    try {
       for (const role in newPermissions) {
            const { data, error } = await supabase
                .from('permissions')
                .upsert(
                    { role: role, permissions: newPermissions[role as UserRole] },
                    { onConflict: 'role' }
                );
            if (error) throw error;
        }
        setPermissions(newPermissions);
        toast({ title: 'Permissions Saved', description: 'User role permissions have been updated.' });
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Save Error', description: `Could not save permissions: ${error.message}` });
    } finally {
        setLoading(false);
    }
  };

  const hasPermission = (role: UserRole, pagePath: string): boolean => {
    if (loading) return false;
    if (role === 'Admin') return true;

    const page = pagePath.split('/')[1] as PermissionPage;
    if (!PERMISSION_PAGES.includes(page)) {
        return true; 
    }

    return permissions[role]?.[page] ?? false;
  };

  return (
    <PermissionsContext.Provider value={{ permissions, loading, updatePermissions, hasPermission }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
