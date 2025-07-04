'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Property } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface PropertyContextType {
    properties: Property[];
    headers: string[];
    setProperties: (properties: Property[], headers: string[]) => void;
    addProperty: (property: Omit<Property, 'id'>) => void;
    updateProperty: (updatedProperty: Property) => void;
    deleteProperty: (id: string) => void;
    deleteProperties: (ids: string[]) => void;
    loading: boolean;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export function PropertyProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const [properties, setPropertiesState] = useState<Property[]>([]);
    const [headers, setHeadersState] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedData = localStorage.getItem('propertyData');
            const storedHeaders = localStorage.getItem('propertyHeaders');
            if (storedData && storedHeaders) {
                setPropertiesState(JSON.parse(storedData));
                setHeadersState(JSON.parse(storedHeaders));
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            toast({
                variant: 'destructive',
                title: 'Load Error',
                description: 'Could not load saved property data.',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const saveData = useCallback((newProperties: Property[], newHeaders: string[]) => {
        try {
            if (newProperties.length > 0) {
                localStorage.setItem('propertyData', JSON.stringify(newProperties));
                localStorage.setItem('propertyHeaders', JSON.stringify(newHeaders));
            } else {
                localStorage.removeItem('propertyData');
                localStorage.removeItem('propertyHeaders');
            }
        } catch (error) {
            console.error("Failed to save data to localStorage", error);
            toast({
                variant: 'destructive',
                title: 'Save Error',
                description: 'Could not save property data.',
            });
        }
    }, [toast]);

    const setProperties = (newProperties: Property[], newHeaders: string[]) => {
        setPropertiesState(newProperties);
        setHeadersState(newHeaders);
        saveData(newProperties, newHeaders);
    };

    const addProperty = (property: Omit<Property, 'id'>) => {
        const newProperty: Property = {
            id: `manual-${Date.now()}`,
            ...property,
        };
        const updatedProperties = [...properties, newProperty];
        let updatedHeaders = headers;

        if (properties.length === 0) {
            updatedHeaders = Object.keys(property);
        }

        setPropertiesState(updatedProperties);
        setHeadersState(updatedHeaders);
        saveData(updatedProperties, updatedHeaders);
    };

    const updateProperty = (updatedProperty: Property) => {
        const updatedProperties = properties.map(p => p.id === updatedProperty.id ? updatedProperty : p);
        setPropertiesState(updatedProperties);
        saveData(updatedProperties, headers);
    };

    const deleteProperty = (id: string) => {
        const updatedProperties = properties.filter(p => p.id !== id);
        setPropertiesState(updatedProperties);
        saveData(updatedProperties, headers);
    };
    
    const deleteProperties = (ids: string[]) => {
        const updatedProperties = properties.filter(p => !ids.includes(p.id));
        setPropertiesState(updatedProperties);
        saveData(updatedProperties, headers);
    }

    return (
        <PropertyContext.Provider value={{ properties, headers, setProperties, addProperty, updateProperty, deleteProperty, deleteProperties, loading }}>
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
