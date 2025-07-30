
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';

interface UserContextType {
    users: User[];
    addUser: (user: Omit<User, 'id'>) => Promise<void>;
    updateUser: (updatedUser: User) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const defaultAdminUser: Omit<User, 'id'> = {
    name: 'Admin',
    email: 'admin@rateease.gov',
    role: 'Admin',
    password: 'password',
    photoURL: '',
};

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const [users, setUsersState] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error, count } = await supabase.from('users').select('*', { count: 'exact' });
            
            if (error) throw error;
            
            if (data) {
                if (data.length === 0) {
                    // This is the first run, create the default admin user
                    const { error: insertError } = await supabase.from('users').insert(defaultAdminUser);
                    if (insertError) {
                        console.error("Could not create default admin user:", insertError);
                        toast({ variant: 'destructive', title: 'Setup Error', description: 'Could not create the default admin user.' });
                    } else {
                        // Re-fetch after creation
                        const { data: newData, error: newError } = await supabase.from('users').select();
                        if (newError) throw newError;
                        if(newData) setUsersState(newData);
                    }
                } else {
                    setUsersState(data);
                }
            }
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Load Error',
                description: `Could not load user data: ${error.message}`,
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);


    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const addUser = async (user: Omit<User, 'id'>) => {
        const { error } = await supabase.from('users').insert(user);
        if (error) {
            toast({ variant: 'destructive', title: 'Save Error', description: error.message });
        } else {
            await fetchUsers();
        }
    };

    const updateUser = async (updatedUser: User) => {
        const { id, ...dataToUpdate } = updatedUser;
        const { error } = await supabase.from('users').update(dataToUpdate).eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Update Error', description: error.message });
        } else {
            await fetchUsers();
        }
    };

    const deleteUser = async (id: string) => {
        // Prevent deleting the default admin user by email check, in case ID changes.
        const userToDelete = users.find(u => u.id === id);
        if (userToDelete?.email === defaultAdminUser.email) {
            toast({ variant: 'destructive', title: 'Delete Error', description: 'The default admin user cannot be deleted.' });
            return;
        }
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Delete Error', description: error.message });
        } else {
            await fetchUsers();
        }
    };

    return (
        <UserContext.Provider value={{ users, addUser, updateUser, deleteUser, loading }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUserData() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUserData must be used within a UserProvider');
    }
    return context;
}
