import { Property, Bop, RevenueData, Payment } from './types';

const mockPayments: Payment[] = [
  { id: 'pay-1', amount: 100, date: '2025-08-15T10:00:00Z', method: 'mtn' },
  { id: 'pay-2', amount: 50, date: '2025-09-01T14:30:00Z', method: 'vodafone' },
];

export const mockProperties: Property[] = [
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

export const mockBops: Bop[] = [
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

export const mockRevenue: RevenueData[] = [
  { month: 'Jan', revenue: 75000 },
  { month: 'Feb', revenue: 92000 },
  { month: 'Mar', revenue: 110000 },
  { month: 'Apr', revenue: 85000 },
  { month: 'May', revenue: 125000 },
  { month: 'Jun', revenue: 65000 },
];

export const mockPropertyDataForAI = ``;
export const mockComparablePropertiesForAI = ``;