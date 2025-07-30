
import { createClient } from '@supabase/supabase-js'
import type { Property, User, Bill } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Extend Supabase types to match your application's data structures
type SupabaseSchema = {
  public: {
    Tables: {
      properties: {
        Row: Property;
        Insert: Omit<Property, 'id'>;
        Update: Partial<Property>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'id'>;
        Update: Partial<User>;
      };
      bills: {
        Row: Bill;
        Insert: Omit<Bill, 'id'>;
        Update: Partial<Bill>;
      };
      settings: {
        Row: { id: string; key: string; value: any };
        Insert: { key: string; value: any };
        Update: { value?: any };
      },
       permissions: {
        Row: { id: string; role: string; permissions: any };
        Insert: { role: string; permissions: any };
        Update: { permissions?: any };
      };
    };
  };
};

export const supabase = createClient<SupabaseSchema>(supabaseUrl, supabaseAnonKey);
