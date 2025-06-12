import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
  };
  created_at?: string;
}

export function useSyncClerkWithSupabase() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [supabaseUser, setSupabaseUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAuthUser = async () => {
      if (!isLoaded || !isSignedIn || !user) {
        setSyncStatus('idle');
        setSupabaseUser(null);
        return;
      }

      try {
        setIsLoading(true);
        setSyncStatus('syncing');

        // Get the current authenticated user from Supabase Auth
        const { data: { user: authUser }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Failed to get Supabase auth user:', error);
          setSyncStatus('error');
        } else if (authUser) {
          console.log('Supabase auth user found:', authUser);
          setSupabaseUser(authUser);
          setSyncStatus('success');
        } else {
          console.log('No Supabase auth user found - user needs to authenticate with Supabase');
          setSyncStatus('error');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setSyncStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthUser();
  }, [isLoaded, isSignedIn, user]);

  return {
    syncStatus,
    supabaseUser,
    isLoading
  };
}