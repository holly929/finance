
export type Property = {
  id: string;
  'Property No'?: string;
  'Owner Name'?: string;
  'Phone Number'?: string;
  'Town'?: string;
  'Suburb'?: string;
  'Valuation List No.'?: string;
  'Account Number'?: string;
  'Property Type'?: 'Residential' | 'Commercial' | 'Industrial' | string;
  'Rateable Value'?: number;
  'Rate Impost'?: number;
  'Sanitation Charged'?: number;
  'Previous Balance'?: number;
  'Total Payment'?: number;
  created_at?: string;
  [key: string]: any;
};

export type BillStatus = 'Paid' | 'Pending' | 'Overdue' | string;

export type PropertyWithStatus = Property & {
  status: BillStatus;
};

export type Bill = {
  id: string;
  propertyId: string;
  propertySnapshot: Property; // This will be a JSONB field in Supabase
  generatedAt: string; // ISO Date string
  year: number;
  totalAmountDue: number;
  created_at?: string;
};

export type RevenueData = {
  month: string;
  revenue: number;
};

export type PaymentStatusData = {
  name: 'Paid' | 'Pending' | 'Overdue' | 'Unbilled';
  value: number;
  fill: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Data Entry' | 'Viewer';
  password?: string;
  photoURL?: string;
  created_at?: string;
};

export type RevenueByPropertyType = {
  name: string;
  revenue: number;
};
