import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on Supabase Auth
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    avatar_url?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface Database {
  public: {
    Tables: {
      // Remove custom users table - we now use auth.users
      user_uploaded_csv: {
        Row: {
          id: number;
          user_id: string | null; // This will reference auth.uid()
          file_name: string | null;
          file_data: ArrayBuffer | null;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          file_name?: string | null;
          file_data?: ArrayBuffer | null;
          status?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          file_name?: string | null;
          file_data?: ArrayBuffer | null;
          status?: string | null;
          created_at?: string | null;
        };
      };
    };
  };
}