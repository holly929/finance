
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';

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
  updatePermissions: (newPermissions: RolePermissions) => void;
  hasPermission: (role: UserRole, page: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<RolePermissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    try {
      const savedPermissions = localStorage.getItem('permissions');
      if (savedPermissions) {
        const parsed = JSON.parse(savedPermissions);
        // Deep merge to ensure all roles and pages have defaults
        const mergedPermissions = JSON.parse(JSON.stringify(defaultPermissions));
         for (const role in mergedPermissions) {
          if (parsed[role]) {
            Object.assign(mergedPermissions[role], parsed[role]);
          }
        }
        setPermissions(mergedPermissions);
      } else {
        setPermissions(defaultPermissions);
      }
    } catch (error) {
      console.error('Failed to load permissions from localStorage', error);
      setPermissions(defaultPermissions);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePermissions = (newPermissions: RolePermissions) => {
    try {
        localStorage.setItem('permissions', JSON.stringify(newPermissions));
        setPermissions(newPermissions);
        toast({ title: 'Permissions Saved', description: 'User role permissions have been updated.' });
    } catch(error) {
        toast({ variant: 'destructive', title: 'Save Error', description: 'Could not save permissions to local storage.'});
    }
  };

  const hasPermission = (role: UserRole, pagePath: string): boolean => {
    if (role === 'Admin') return true;

    const page = pagePath.split('/')[1] as PermissionPage;
    if (!PERMISSION_PAGES.includes(page)) {
        return true; // Allow access to non-protected routes like / or sub-pages of properties
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
