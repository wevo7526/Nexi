"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          router.push('/auth');
          return;
        }
        
        if (session) {
          console.log('Session established, redirecting to:', redirectTo);
          router.push(redirectTo);
        } else {
          console.log('No session found, redirecting to auth page');
          router.push('/auth');
        }
      } catch (err) {
        console.error('Error in auth callback:', err);
        router.push('/auth');
      }
    };

    handleCallback();
  }, [router, redirectTo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Completing sign in...</h1>
        <p className="text-gray-600">Please wait while we redirect you.</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    </div>
  );
} 