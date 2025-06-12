import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { useLinkClerkToSupabase } from './useLinkClerkToSupabase';

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
  
  // Link Clerk session to Supabase
  const { refreshSession } = useLinkClerkToSupabase();

  useEffect(() => {
    const checkAuthUser = async () => {
      if (!isLoaded) {
        return;
      }

      if (!isSignedIn || !user) {
        setSyncStatus('idle');
        setSupabaseUser(null);
        return;
      }

      try {
        setIsLoading(true);
        setSyncStatus('syncing');

        // Wait a moment for the session to be set by useLinkClerkToSupabase
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get the current authenticated user from Supabase Auth
        const { data: { user: authUser }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Failed to get Supabase auth user:', error);
          // Try to refresh the session once
          await refreshSession();
          
          // Try again after refresh
          const { data: { user: retryUser }, error: retryError } = await supabase.auth.getUser();
          
          if (retryError || !retryUser) {
            console.error('Still no Supabase auth user after refresh:', retryError);
            setSyncStatus('error');
          } else {
            console.log('Supabase auth user found after refresh:', retryUser);
            setSupabaseUser(retryUser);
            setSyncStatus('success');
          }
        } else if (authUser) {
          console.log('Supabase auth user found:', authUser);
          setSupabaseUser(authUser);
          setSyncStatus('success');
        } else {
          console.log('No Supabase auth user found - JWT integration may not be configured');
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
  }, [isLoaded, isSignedIn, user, refreshSession]);

  return {
    syncStatus,
    supabaseUser,
    isLoading,
    refreshSession
  };
}