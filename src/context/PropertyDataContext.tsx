
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Property } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { mockProperties } from '@/lib/mock-data';

interface PropertyContextType {
    properties: Property[];
    headers: string[];
    setProperties: (properties: Property[], headers: string[]) => void;
    addProperty: (property: Omit<Property, 'id'>) => void;
    updateProperty: (updatedProperty: Property) => void;
    deleteProperty: (id: string) => void;
    deleteProperties: (ids: string[]) => void;
    deleteAllProperties: () => void;
    loading: boolean;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export function PropertyProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const [properties, setPropertiesState] = useState<Property[]>([]);
    const [headers, setHeadersState] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const setProperties = (newProperties: Property[], newHeaders: string[]) => {
        setPropertiesState(newProperties);
        setHeadersState(newHeaders);
        localStorage.setItem('properties', JSON.stringify(newProperties));
        localStorage.setItem('propertyHeaders', JSON.stringify(newHeaders));
    };

    useEffect(() => {
        setLoading(true);
        try {
            const savedProperties = localStorage.getItem('properties');
            const savedHeaders = localStorage.getItem('propertyHeaders');
            
            if (savedProperties) {
                setPropertiesState(JSON.parse(savedProperties));
            } else {
                setPropertiesState(mockProperties);
            }

            if (savedHeaders) {
                setHeadersState(JSON.parse(savedHeaders));
            } else if (mockProperties.length > 0) {
                 const firstItemKeys = Object.keys(mockProperties[0]);
                 const filteredKeys = firstItemKeys.filter(key => key !== 'id');
                 setHeadersState(filteredKeys);
            } else {
                setHeadersState(['Owner Name', 'Property No', 'Town', 'Rateable Value', 'Total Payment']);
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Load Error',
                description: 'Could not load property data from local storage.',
            });
            // Fallback to mock data if local storage fails
            setPropertiesState(mockProperties);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const addProperty = (property: Omit<Property, 'id'>) => {
        const newProperty: Property = {
            id: `prop-${Date.now()}`,
            ...property
        };
        const updatedProperties = [...properties, newProperty];
        setProperties(updatedProperties, headers); // Assume headers don't change on add
    };

    const updateProperty = (updatedProperty: Property) => {
        const updatedProperties = properties.map(p => p.id === updatedProperty.id ? updatedProperty : p);
        setProperties(updatedProperties, headers); // Assume headers don't change on update
    };

    const deleteProperty = (id: string) => {
        const updatedProperties = properties.filter(p => p.id !== id);
        setProperties(updatedProperties, headers);
    };
    
    const deleteProperties = (ids: string[]) => {
        const updatedProperties = properties.filter(p => !ids.includes(p.id));
        setProperties(updatedProperties, headers);
    }
    
    const deleteAllProperties = () => {
        setProperties([], []);
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
