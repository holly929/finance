
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Bill } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { sendBillGeneratedSms } from '@/lib/sms-service';
import { store, saveStore } from '@/lib/store';

interface BillContextType {
    bills: Bill[];
    addBills: (newBills: Omit<Bill, 'id'>[]) => Promise<boolean>;
}

const BillContext = createContext<BillContextType | undefined>(undefined);

export function BillProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const [bills, setBillsState] = useState<Bill[]>([]);

    useEffect(() => {
        setBillsState(store.bills);
    }, []);

    const setBills = (newBills: Bill[]) => {
        store.bills = newBills;
        setBillsState(newBills);
        saveStore();
    };

    const addBills = async (newBillsData: Omit<Bill, 'id'>[]): Promise<boolean> => {
        try {
            const billsWithIds: Bill[] = newBillsData.map(b => ({
                ...b,
                id: `bill-${Date.now()}-${Math.random()}`,
            }));
            const updatedBills = [...bills, ...billsWithIds];
            setBills(updatedBills);

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
        <BillContext.Provider value={{ bills, addBills }}>
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
