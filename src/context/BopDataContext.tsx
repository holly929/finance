
'use client';

import React, { createContext, useContext, useState } from 'react';
import type { Bop } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { sendNewPropertySms } from '@/lib/sms-service';

// In-memory store
let inMemoryBopData: Bop[] = [];
let inMemoryHeaders: string[] = ['Business Name', 'Owner Name', 'Phone Number', 'Town', 'Permit Fee', 'Payment'];

interface BopContextType {
    bopData: Bop[];
    headers: string[];
    setBopData: (data: Bop[], headers: string[]) => void;
    addBop: (bop: Omit<Bop, 'id'>) => void;
    updateBop: (updatedBop: Bop) => void;
    deleteBop: (id: string) => void;
    deleteBops: (ids: string[]) => void;
    deleteAllBop: () => void;
    loading: boolean;
}

const BopContext = createContext<BopContextType | undefined>(undefined);

export function BopProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const [bopData, setBopDataState] = useState<Bop[]>(inMemoryBopData);
    const [headers, setHeadersState] = useState<string[]>(inMemoryHeaders);
    const [loading, setLoading] = useState(false);

    const setBopData = (newData: Bop[], newHeaders: string[]) => {
        inMemoryBopData = newData;
        inMemoryHeaders = newHeaders;
        setBopDataState(newData);
        setHeadersState(newHeaders);
    };
    
    const addBop = (bop: Omit<Bop, 'id'>) => {
        const newBop: Bop = {
            id: `bop-${Date.now()}`,
            ...bop
        };
        const updatedBopData = [...bopData, newBop];
        setBopData(updatedBopData, headers);
        // Trigger SMS notification
        sendNewPropertySms(newBop);
    };

    const updateBop = (updatedBop: Bop) => {
        const updatedData = bopData.map(b => b.id === updatedBop.id ? updatedBop : b);
        setBopData(updatedData, headers);
    };

    const deleteBop = (id: string) => {
        const updatedData = bopData.filter(b => b.id !== id);
        setBopData(updatedData, headers);
    };
    
    const deleteBops = (ids: string[]) => {
        const updatedData = bopData.filter(b => !ids.includes(b.id));
        setBopData(updatedData, headers);
    }
    
    const deleteAllBop = () => {
        setBopData([], []);
    };

    return (
        <BopContext.Provider value={{ bopData, headers, setBopData, addBop, updateBop, deleteBop, deleteBops, deleteAllBop, loading }}>
            {children}
        </BopContext.Provider>
    );
}

export function useBopData() {
    const context = useContext(BopContext);
    if (context === undefined) {
        throw new Error('useBopData must be used within a BopProvider');
    }
    return context;
}
