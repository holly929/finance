
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Bill } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { sendBillGeneratedSms } from '@/lib/sms-service';

interface BillContextType {
    bills: Bill[];
    addBills: (newBills: Omit<Bill, 'id'>[]) => Promise<boolean>;
    loading: boolean;
}

const BillContext = createContext<BillContextType | undefined>(undefined);

// In-memory store
let inMemoryBills: Bill[] = [];

export function BillProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const [bills, setBillsState] = useState<Bill[]>(inMemoryBills);
    const [loading, setLoading] = useState(false);

    const setBills = (newBills: Bill[]) => {
        inMemoryBills = newBills;
        setBillsState(newBills);
    };

    const addBills = async (newBillsData: Omit<Bill, 'id'>[]): Promise<boolean> => {
        try {
            const billsWithIds: Bill[] = newBillsData.map(b => ({
                ...b,
                id: `bill-${Date.now()}-${Math.random()}`,
            }));
            const updatedBills = [...bills, ...billsWithIds];
            setBills(updatedBills);

            // Trigger SMS notifications for the newly created bills
            sendBillGeneratedSms(billsWithIds);
            
            return true;
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Bill Creation Error',
                description: 'An unexpected error occurred while creating bills.',
            });
            return false;
        }
    };

    return (
        <BillContext.Provider value={{ bills, addBills, loading }}>
            {children}
        </BillContext.Provider>
    );
}

export function useBillData() {
    const context = useContext(BillContext);
    if (context === undefined) {
        throw new Error('useBillData must be used within a BillProvider');
    }
    return context;
}
