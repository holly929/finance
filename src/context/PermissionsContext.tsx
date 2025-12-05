
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { store, saveStore } from '@/lib/store';

export const PERMISSION_PAGES = [
  'dashboard', 'properties', 'billing', 'bop', 'bop-billing', 'bills', 'defaulters', 'reports', 'users', 'settings', 'integrations', 'payment'
] as const;

export type PermissionPage = typeof PERMISSION_PAGES[number];
export type UserRole = User['role'];
export type RolePermissions = Record<UserRole, Partial<Record<PermissionPage, boolean>>>;

interface PermissionsContextType {
  permissions: RolePermissions;
  loading: boolean;
  updatePermissions: (newPermissions: RolePermissions) => void;
  hasPermission: (role: UserRole, page: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<RolePermissions>(store.permissions);
  const [loading, setLoading] = useState(false);

  const updatePermissions = (newPermissions: RolePermissions) => {
    store.permissions = newPermissions;
    setPermissions(newPermissions);
    saveStore();
    toast({ title: 'Permissions Updated', description: 'User role permissions have been updated for this session.' });
  };

  const hasPermission = (role: UserRole, pagePath: string): boolean => {
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
