
// This file acts as a centralized in-memory database for the application.
// All data contexts will read from and write to this single source of truth,
// ensuring that data is shared and consistent across all user sessions
// within the same server process.

import type { Property, Bop, Bill, User, Payment } from './types';
import { PERMISSION_PAGES, type RolePermissions, type UserRole } from '@/context/PermissionsContext';

// --- Default Data ---

const defaultAdminUser: User = {
    id: 'user-0',
    name: 'Admin',
    email: 'admin@rateease.gov',
    role: 'Admin',
    password: 'password',
    photoURL: '',
};

const mockPayments: Payment[] = [
  { id: 'pay-1', amount: 100, date: '2025-08-15T10:00:00Z', method: 'mtn' },
  { id: 'pay-2', amount: 50, date: '2025-09-01T14:30:00Z', method: 'vodafone' },
];

const mockProperties: Property[] = [
  {
    id: 'prop-1',
    'Property No': 'P001',
    'Owner Name': 'John Doe',
    'Phone Number': '123-456-7890',
    'Town': 'Accra',
    'Suburb': 'East Legon',
    'Valuation List No.': 'VL001',
    'Account Number': 'AN001',
    'Property Type': 'Residential',
    'Rateable Value': 10000,
    'Rate Impost': 0.05,
    'Sanitation Charged': 200,
    'Previous Balance': 50,
    'Total Payment': 150,
    payments: mockPayments,
    created_at: '2025-01-15T09:00:00Z',
  }
];

const mockBops: Bop[] = [
  {
    id: 'bop-1',
    'Business Name': 'Jane\'s Shop',
    'Owner Name': 'Jane Doe',
    'Phone Number': '098-765-4321',
    'Town': 'Tema',
    'Permit Fee': 500,
    'Payment': 150,
    payments: mockPayments,
    created_at: '2025-02-20T11:00:00Z',
  }
];

const defaultPermissions: RolePermissions = {
  Admin: {
    dashboard: true, properties: true, billing: true, bop: true, 'bop-billing': true, bills: true, defaulters: true, reports: true,
    users: true, settings: true, 'integrations': true, payment: true,
  },
  'Data Entry': {
    dashboard: true, properties: true, billing: true, bop: true, 'bop-billing': true, bills: true, defaulters: true, reports: true,
    users: false, settings: false, 'integrations': true, payment: true,
  },
  Viewer: {
    dashboard: true, properties: false, billing: false, bop: false, 'bop-billing': false, bills: false, defaulters: false, reports: false,
    users: false, settings: false, 'integrations': false, payment: true,
  },
};


// --- Central Store ---

interface AppStore {
    properties: Property[];
    propertyHeaders: string[];
    bops: Bop[];
    bopHeaders: string[];
    bills: Bill[];
    users: User[];
    permissions: RolePermissions;
    settings: { [key: string]: any };
}

export const store: AppStore = {
    properties: [],
    propertyHeaders: ['Owner Name', 'Property No', 'Town', 'Rateable Value', 'Total Payment'],
    bops: [],
    bopHeaders: ['Business Name', 'Owner Name', 'Phone Number', 'Town', 'Permit Fee', 'Payment'],
    bills: [],
    users: [defaultAdminUser],
    permissions: defaultPermissions,
    settings: {},
};

// Function to save the entire store to a persistent mechanism.
// In this mock environment, it does nothing, but in a real app,
// it would write to a file or database. This concept is important.
export function saveStore() {
    // In a real application, you would add logic here to save the `store` object.
    // For example: fs.writeFileSync('path/to/database.json', JSON.stringify(store));
    // Since we can't do that here, we rely on the object being in memory for the session.
}
