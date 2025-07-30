
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface UserContextType {
    users: User[];
    addUser: (user: Omit<User, 'id'>) => void;
    updateUser: (updatedUser: User) => void;
    deleteUser: (id: string) => void;
    loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const defaultAdminUser: User = {
    id: 'user-0',
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

    const setUsers = (newUsers: User[]) => {
        setUsersState(newUsers);
        localStorage.setItem('users', JSON.stringify(newUsers));
    };

    useEffect(() => {
        setLoading(true);
        try {
            const savedUsers = localStorage.getItem('users');
            if (savedUsers) {
                const parsedUsers = JSON.parse(savedUsers);
                // Ensure default admin always exists
                const adminExists = parsedUsers.some((u: User) => u.email === defaultAdminUser.email);
                if (!adminExists) {
                    setUsers([defaultAdminUser, ...parsedUsers]);
                } else {
                    setUsersState(parsedUsers);
                }
            } else {
                setUsers([defaultAdminUser]);
            }
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Load Error',
                description: 'Could not load user data from local storage.',
            });
            setUsers([defaultAdminUser]);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const addUser = (user: Omit<User, 'id'>) => {
        const newUser: User = {
            id: `user-${Date.now()}`,
            ...user
        };
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
    };

    const updateUser = (updatedUser: User) => {
        const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
        setUsers(updatedUsers);
    };

    const deleteUser = (id: string) => {
        const userToDelete = users.find(u => u.id === id);
        if (userToDelete?.email === defaultAdminUser.email) {
            toast({ variant: 'destructive', title: 'Delete Error', description: 'The default admin user cannot be deleted.' });
            return;
        }
        const updatedUsers = users.filter(u => u.id !== id);
        setUsers(updatedUsers);
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
