
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Bill } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';

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

    const fetchBills = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('bills').select();
            if (error) throw error;
            if (data) {
                setBillsState(data);
            }
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Load Error',
                description: `Could not load bill data: ${error.message}`,
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchBills();
    }, [fetchBills]);

    const addBills = async (newBillsData: Omit<Bill, 'id'>[]): Promise<boolean> => {
        try {
            const { error } = await supabase.from('bills').insert(newBillsData);

            if (error) {
                 toast({
                    variant: 'destructive',
                    title: 'Save Error',
                    description: `Could not save bill data: ${error.message}`,
                });
                return false;
            }

            await fetchBills();
            return true;
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Bill Creation Error',
                description: `An unexpected error occurred: ${error.message}`,
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
