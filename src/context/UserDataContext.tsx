'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  id: 'admin-001',
  name: 'Admin User',
  email: 'admin@rateease.gov',
  role: 'Admin',
  password: 'password',
  photoURL: '',
};


export function UserProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const [users, setUsersState] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUsers = localStorage.getItem('userData');
            if (storedUsers) {
                const parsedUsers = JSON.parse(storedUsers);
                // Ensure default admin exists and has a password
                const adminExists = parsedUsers.some((u: User) => u.id === defaultAdminUser.id);
                if (adminExists) {
                   setUsersState(parsedUsers.map((u: User) => u.id === defaultAdminUser.id ? {...u, password: u.password || 'password'} : u));
                } else {
                   setUsersState([defaultAdminUser, ...parsedUsers]);
                }
            } else {
                // If no users are stored, add the default admin
                setUsersState([defaultAdminUser]);
            }
        } catch (error) {
            console.error("Failed to load users from localStorage", error);
            toast({
                variant: 'destructive',
                title: 'Load Error',
                description: 'Could not load user data.',
            });
            setUsersState([defaultAdminUser]);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const saveData = useCallback((newUsers: User[]) => {
        try {
            localStorage.setItem('userData', JSON.stringify(newUsers));
        } catch (error) {
            console.error("Failed to save users to localStorage", error);
            toast({
                variant: 'destructive',
                title: 'Save Error',
                description: 'Could not save user data.',
            });
        }
    }, [toast]);

    const addUser = (user: Omit<User, 'id'>) => {
        const newUser: User = {
            id: `user-${Date.now()}`,
            ...user,
        };
        const updatedUsers = [...users, newUser];
        setUsersState(updatedUsers);
        saveData(updatedUsers);
    };

    const updateUser = (updatedUser: User) => {
        const updatedUsers = users.map(u => {
            if (u.id === updatedUser.id) {
                // Keep old password if new one isn't provided in the update
                const newPassword = updatedUser.password || u.password;
                return { ...u, ...updatedUser, password: newPassword };
            }
            return u;
        });
        setUsersState(updatedUsers);
        saveData(updatedUsers);
    };

    const deleteUser = (id: string) => {
        const updatedUsers = users.filter(u => u.id !== id);
        setUsersState(updatedUsers);
        saveData(updatedUsers);
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
