'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';

// Define the pages/features that can have permissions set
export const PERMISSION_PAGES = [
  'dashboard', 'properties', 'billing', 'bills', 'reports', 'users', 'settings'
] as const;

export type PermissionPage = typeof PERMISSION_PAGES[number];
export type UserRole = User['role'];
export type RolePermissions = Record<UserRole, Partial<Record<PermissionPage, boolean>>>;

// Define default permissions
const defaultPermissions: RolePermissions = {
  Admin: {
    dashboard: true,
    properties: true,
    billing: true,
    bills: true,
    reports: true,
    users: true,
    settings: true,
  },
  'Data Entry': {
    dashboard: true,
    properties: true,
    billing: true,
    bills: true,
    reports: true,
    users: false,
    settings: false,
  },
  Viewer: {
    dashboard: true,
    properties: false,
    billing: false,
    bills: false,
    reports: false,
    users: false,
    settings: false,
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
    try {
      const storedPermissions = localStorage.getItem('rolePermissions');
      if (storedPermissions) {
        // Merge with defaults to ensure all roles/pages are present
        const parsed = JSON.parse(storedPermissions);
        const mergedPermissions = JSON.parse(JSON.stringify(defaultPermissions)); // Deep copy
        for (const role in mergedPermissions) {
          if (parsed[role]) {
            for (const page in mergedPermissions[role as UserRole]) {
               if (parsed[role][page] !== undefined) {
                 mergedPermissions[role][page] = parsed[role][page];
               }
            }
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

  const saveData = useCallback((newPermissions: RolePermissions) => {
    try {
      localStorage.setItem('rolePermissions', JSON.stringify(newPermissions));
    } catch (error) {
      console.error('Failed to save permissions to localStorage', error);
      toast({
        variant: 'destructive',
        title: 'Save Error',
        description: 'Could not save permission settings.',
      });
    }
  }, [toast]);

  const updatePermissions = (newPermissions: RolePermissions) => {
    setPermissions(newPermissions);
    saveData(newPermissions);
    toast({
      title: 'Permissions Saved',
      description: 'User role permissions have been updated.',
    });
  };

  const hasPermission = (role: UserRole, pagePath: string): boolean => {
    if (loading) return false; // Deny access while loading to prevent flashes of content
    if (role === 'Admin') return true; // Admins can always access everything

    const page = pagePath.split('/')[1] as PermissionPage;
    if (!PERMISSION_PAGES.includes(page)) {
        return true; // Allow access to utility pages like print-preview
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
