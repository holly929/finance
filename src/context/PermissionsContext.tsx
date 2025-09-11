
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';

export const PERMISSION_PAGES = [
  'dashboard', 'properties', 'billing', 'bop', 'bop-billing', 'bills', 'defaulters', 'reports', 'users', 'settings', 'integrations', 'payment'
] as const;

export type PermissionPage = typeof PERMISSION_PAGES[number];
export type UserRole = User['role'];
export type RolePermissions = Record<UserRole, Partial<Record<PermissionPage, boolean>>>;

const defaultPermissions: RolePermissions = {
  Admin: {
    dashboard: true, properties: true, billing: true, bop: true, 'bop-billing': true, bills: true, defaulters: true, reports: true,
    users: true, settings: true, 'integrations': true, payment: true,
  },
  'Data Entry': {
    dashboard: true, properties: true, billing: true, bop: true, 'bop-billing': true, bills: true, defaulters: true, reports: true,
    users: false, settings: false, 'integrations': true, payment: true,
  },
  Viewer: {
    dashboard: true, properties: false, billing: false, bop: false, 'bop-billing': false, bills: false, defaulters: false, reports: false,
    users: false, settings: false, 'integrations': false, payment: true,
  },
};

interface PermissionsContextType {
  permissions: RolePermissions;
  loading: boolean;
  updatePermissions: (newPermissions: RolePermissions) => void;
  hasPermission: (role: UserRole, page: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// In-memory store
let inMemoryPermissions: RolePermissions = defaultPermissions;

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<RolePermissions>(inMemoryPermissions);
  const [loading, setLoading] = useState(false);

  const updatePermissions = (newPermissions: RolePermissions) => {
    inMemoryPermissions = newPermissions;
    setPermissions(newPermissions);
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

    