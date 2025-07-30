
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

// In-memory store
let inMemoryProperties: Property[] = mockProperties;
let inMemoryHeaders: string[] = mockProperties.length > 0 ? Object.keys(mockProperties[0]).filter(key => key !== 'id') : ['Owner Name', 'Property No', 'Town', 'Rateable Value', 'Total Payment'];

export function PropertyProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const [properties, setPropertiesState] = useState<Property[]>(inMemoryProperties);
    const [headers, setHeadersState] = useState<string[]>(inMemoryHeaders);
    const [loading, setLoading] = useState(false);

    const setProperties = (newProperties: Property[], newHeaders: string[]) => {
        inMemoryProperties = newProperties;
        inMemoryHeaders = newHeaders;
        setPropertiesState(newProperties);
        setHeadersState(newHeaders);
    };
    
    const addProperty = (property: Omit<Property, 'id'>) => {
        const newProperty: Property = {
            id: `prop-${Date.now()}`,
            ...property
        };
        const updatedProperties = [...properties, newProperty];
        setProperties(updatedProperties, headers);
    };

    const updateProperty = (updatedProperty: Property) => {
        const updatedProperties = properties.map(p => p.id === updatedProperty.id ? updatedProperty : p);
        setProperties(updatedProperties, headers);
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
