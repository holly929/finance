
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

// In-memory store
let inMemoryUsers: User[] = [defaultAdminUser];


export function UserProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const [users, setUsersState] = useState<User[]>(inMemoryUsers);
    const [loading, setLoading] = useState(false);

    const setUsers = (newUsers: User[]) => {
        inMemoryUsers = newUsers;
        setUsersState(newUsers);
    };

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
