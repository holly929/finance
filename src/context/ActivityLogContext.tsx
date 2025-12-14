
'use client';

import React, { createContext, useContext, useState } from 'react';
import type { ActivityLog, User } from '@/lib/types';
import { store, saveStore } from '@/lib/store';
import { useAuth } from './AuthContext';

interface ActivityLogContextType {
    activityLogs: ActivityLog[];
    addLog: (action: string, details?: string) => void;
}

const ActivityLogContext = createContext<ActivityLogContextType | undefined>(undefined);

export function ActivityLogProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [activityLogs, setActivityLogsState] = useState<ActivityLog[]>(store.activityLogs);

    const setAndPersistLogs = (newLogs: ActivityLog[]) => {
        store.activityLogs = newLogs;
        setActivityLogsState(newLogs);
        saveStore();
    };

    const addLog = (action: string, details?: string) => {
        if (!user) {
            console.warn("Attempted to add a log without a logged-in user.");
            return;
        }

        const newLog: ActivityLog = {
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            action,
            details,
        };

        const updatedLogs = [newLog, ...store.activityLogs];
        setAndPersistLogs(updatedLogs);
    };

    return (
        <ActivityLogContext.Provider value={{ activityLogs, addLog }}>
            {children}
        </ActivityLogContext.Provider>
    );
}

export function useActivityLog() {
    const context = useContext(ActivityLogContext);
    if (context === undefined) {
        throw new Error('useActivityLog must be used within an ActivityLogProvider');
    }
    return context;
}
