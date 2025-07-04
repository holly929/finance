'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/context/PermissionsContext';
import { toast } from './use-toast';

export function useRequirePermission() {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, loading: permsLoading } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isLoading = authLoading || permsLoading;
    if (isLoading) {
      return; // Wait for auth and permissions state to load
    }

    if (!user) {
      // Not logged in, handled by AuthContext but as a fallback
      router.push('/');
      return;
    }

    if (!hasPermission(user.role, pathname)) {
      // Role not allowed for this page
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: "You don't have permission to view this page.",
      });
      router.push('/dashboard');
    }
  }, [user, authLoading, permsLoading, hasPermission, pathname, router]);
}
