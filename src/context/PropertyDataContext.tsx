
'use client';

import React, { createContext, useContext, useState } from 'react';
import type { Property } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { sendNewPropertySms } from '@/lib/sms-service';
import { store, saveStore } from '@/lib/store';

interface PropertyContextType {
    properties: Property[];
    headers: string[];
    setProperties: (properties: Property[], headers: string[]) => void;
    addProperty: (property: Omit<Property, 'id'>) => void;
    updateProperty: (updatedProperty: Property) => void;
    deleteProperty: (id: string) => void;
    deleteProperties: (ids: string[]) => void;
    deleteAllProperties: () => void;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export function PropertyProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const [properties, setPropertiesState] = useState<Property[]>(store.properties);
    const [headers, setHeadersState] = useState<string[]>(store.propertyHeaders);
    
    const setAndPersistProperties = (newProperties: Property[], newHeaders: string[]) => {
        store.properties = newProperties;
        store.propertyHeaders = newHeaders;
        setPropertiesState(newProperties);
        setHeadersState(newHeaders);
        saveStore();
    };
    
    const addProperty = (property: Omit<Property, 'id'>) => {
        const newProperty: Property = {
            id: `prop-${Date.now()}`,
            ...property
        };
        const updatedProperties = [...store.properties, newProperty];
        setAndPersistProperties(updatedProperties, headers);
        sendNewPropertySms(newProperty);
    };

    const updateProperty = (updatedProperty: Property) => {
        const updatedProperties = store.properties.map(p => p.id === updatedProperty.id ? updatedProperty : p);
        setAndPersistProperties(updatedProperties, headers);
    };

    const deleteProperty = (id: string) => {
        const updatedProperties = store.properties.filter(p => p.id !== id);
        setAndPersistProperties(updatedProperties, headers);
    };
    
    const deleteProperties = (ids: string[]) => {
        const updatedProperties = store.properties.filter(p => !ids.includes(p.id));
        setAndPersistProperties(updatedProperties, headers);
    }
    
    const deleteAllProperties = () => {
        setAndPersistProperties([], []);
    };

    return (
        <PropertyContext.Provider value={{ properties, headers, setProperties: setAndPersistProperties, addProperty, updateProperty, deleteProperty, deleteProperties, deleteAllProperties }}>
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
