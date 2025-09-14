'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { createContext, useContext, useEffect, useState } from 'react';
import { ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { onAuthStateChange } from '@/lib/supabase-auth';

interface SupabaseContextType {
  user: User | null;
  loading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  loading: true,
});

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

function SupabaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SupabaseContext.Provider value={{ user, loading }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SupabaseProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </SupabaseProvider>
    </SessionProvider>
  );
}