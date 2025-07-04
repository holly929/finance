'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Bill } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface BillContextType {
    bills: Bill[];
    addBills: (newBills: Omit<Bill, 'id'>[]) => boolean;
    loading: boolean;
}

const BillContext = createContext<BillContextType | undefined>(undefined);

export function BillProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const [bills, setBillsState] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedData = localStorage.getItem('billData');
            if (storedData) {
                setBillsState(JSON.parse(storedData));
            }
        } catch (error) {
            console.error("Failed to load bill data from localStorage", error);
            toast({
                variant: 'destructive',
                title: 'Load Error',
                description: 'Could not load saved bill data.',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const saveData = useCallback((newBills: Bill[]): boolean => {
        try {
            localStorage.setItem('billData', JSON.stringify(newBills));
            return true;
        } catch (error) {
            console.error("Failed to save bill data to localStorage", error);
            toast({
                variant: 'destructive',
                title: 'Save Error',
                description: 'Could not save bill data. The generated bills will not be recorded.',
            });
            return false;
        }
    }, [toast]);

    const addBills = (newBillsData: Omit<Bill, 'id'>[]): boolean => {
        try {
            const billsToAdd: Bill[] = newBillsData.map((b, i) => ({
                ...b,
                id: `bill-${Date.now()}-${i}`,
            }));

            const updatedBills = [...bills, ...billsToAdd];
            const success = saveData(updatedBills);

            if (success) {
                setBillsState(updatedBills);
                return true;
            }
            return false;

        } catch (error) {
             console.error("Failed to create bills", error);
             toast({
                variant: 'destructive',
                title: 'Bill Creation Error',
                description: 'An unexpected error occurred while preparing the bills.',
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
