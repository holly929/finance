
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Bill } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface BillContextType {
    bills: Bill[];
    addBills: (newBills: Omit<Bill, 'id'>[]) => Promise<boolean>;
    loading: boolean;
}

const BillContext = createContext<BillContextType | undefined>(undefined);

export function BillProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const [bills, setBillsState] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);

    const setBills = (newBills: Bill[]) => {
        setBillsState(newBills);
        localStorage.setItem('bills', JSON.stringify(newBills));
    };

    useEffect(() => {
        setLoading(true);
        try {
            const savedBills = localStorage.getItem('bills');
            if (savedBills) {
                setBillsState(JSON.parse(savedBills));
            }
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Load Error',
                description: 'Could not load bill data from local storage.',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const addBills = async (newBillsData: Omit<Bill, 'id'>[]): Promise<boolean> => {
        try {
            const billsWithIds: Bill[] = newBillsData.map(b => ({
                ...b,
                id: `bill-${Date.now()}-${Math.random()}`,
            }));
            const updatedBills = [...bills, ...billsWithIds];
            setBills(updatedBills);
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
