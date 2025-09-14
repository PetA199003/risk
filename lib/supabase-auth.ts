import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'PROJEKTLEITER' | 'MITARBEITER';
}

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signUpWithEmail(email: string, password: string, name?: string) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || '',
        role: 'MITARBEITER'
      }
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signOut() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email!,
    name: user.user_metadata?.name,
    role: user.user_metadata?.role || 'MITARBEITER'
  };
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  if (!isSupabaseConfigured()) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  const supabase = getSupabaseClient();
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}