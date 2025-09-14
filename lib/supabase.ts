import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Only create clients if environment variables are properly configured
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Server-side client mit Service Role Key für Admin-Operationen
export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null;

// Helper function to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

// Helper function to get supabase client with error handling
export function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  }
  return supabase;
}

// Helper function to get admin client with error handling
export function getSupabaseAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin is not configured. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }
  return supabaseAdmin;
}