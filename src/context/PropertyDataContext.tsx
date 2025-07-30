
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Property } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';

interface PropertyContextType {
    properties: Property[];
    headers: string[];
    setProperties: (properties: Property[], headers: string[]) => Promise<void>;
    addProperty: (property: Omit<Property, 'id'>) => Promise<void>;
    updateProperty: (updatedProperty: Property) => Promise<void>;
    deleteProperty: (id: string) => Promise<void>;
    deleteProperties: (ids: string[]) => Promise<void>;
    deleteAllProperties: () => Promise<void>;
    loading: boolean;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export function PropertyProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const [properties, setPropertiesState] = useState<Property[]>([]);
    const [headers, setHeadersState] = useState<string[]>(['Owner Name', 'Property No', 'Town', 'Rateable Value', 'Total Payment']);
    const [loading, setLoading] = useState(true);

    const fetchProperties = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('properties').select();
            if (error) throw error;
            if (data) {
                setPropertiesState(data);
                if (data.length > 0) {
                     // Dynamically determine headers from all properties
                    const allKeys = data.reduce<Set<string>>((acc, curr) => {
                        Object.keys(curr).forEach(key => key !== 'id' && acc.add(key));
                        return acc;
                    }, new Set());
                    const newHeaders = Array.from(allKeys);
                    // Prioritize a specific order for common headers
                    const priorityHeaders = ['Owner Name', 'Property No', 'Town', 'Suburb', 'Rateable Value', 'Total Payment', 'Phone Number'];
                    const sortedHeaders = newHeaders.sort((a, b) => {
                        const aIndex = priorityHeaders.indexOf(a);
                        const bIndex = priorityHeaders.indexOf(b);
                        if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
                        if (aIndex === -1) return 1;
                        if (bIndex === -1) return -1;
                        return aIndex - bIndex;
                    });
                    setHeadersState(sortedHeaders);
                } else {
                    setHeadersState(['Owner Name', 'Property No', 'Town', 'Rateable Value', 'Total Payment']);
                }
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Load Error',
                description: 'Could not load property data from the database.',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    const setProperties = async (newProperties: Property[], newHeaders: string[]) => {
        setLoading(true);
        try {
            // This can be a complex operation, let's clear existing and insert new
            await supabase.from('properties').delete().neq('id', 'a-value-that-never-matches'); // Clear all
            const { error } = await supabase.from('properties').insert(newProperties.map(({ id, ...rest }) => rest)); // Supabase assigns IDs
            if (error) throw error;
            await fetchProperties();
            setHeadersState(newHeaders); // Manually set headers from import
        } catch (error: any) {
            toast({
                variant: 'destructive', title: 'Import Error',
                description: error.message || 'Failed to save imported properties.'
            });
        } finally {
             setLoading(false);
        }
    };

    const addProperty = async (property: Omit<Property, 'id'>) => {
        const { error } = await supabase.from('properties').insert(property).select();
        if (error) {
            toast({ variant: 'destructive', title: 'Save Error', description: error.message });
        } else {
            await fetchProperties();
        }
    };

    const updateProperty = async (updatedProperty: Property) => {
        const { id, ...dataToUpdate } = updatedProperty;
        const { error } = await supabase.from('properties').update(dataToUpdate).eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Update Error', description: error.message });
        } else {
             await fetchProperties();
        }
    };

    const deleteProperty = async (id: string) => {
        const { error } = await supabase.from('properties').delete().eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Delete Error', description: error.message });
        } else {
            await fetchProperties();
        }
    };
    
    const deleteProperties = async (ids: string[]) => {
        const { error } = await supabase.from('properties').delete().in('id', ids);
        if (error) {
            toast({ variant: 'destructive', title: 'Delete Error', description: error.message });
        } else {
            await fetchProperties();
        }
    }
    
    const deleteAllProperties = async () => {
       const { error } = await supabase.from('properties').delete().neq('id', 'a-value-that-never-matches');
        if (error) {
            toast({ variant: 'destructive', title: 'Delete Error', description: error.message });
        } else {
            await fetchProperties();
        }
    };

    return (
        <PropertyContext.Provider value={{ properties, headers, setProperties, addProperty, updateProperty, deleteProperty, deleteProperties, deleteAllProperties, loading }}>
            {children}
        </PropertyContext.Provider>
    );
}

export function usePropertyData() {
    const context = useContext(PropertyContext);
    if (context === undefined) {
        throw new Error('usePropertyData must be used within a PropertyProvider');
    }
    return context;
}
