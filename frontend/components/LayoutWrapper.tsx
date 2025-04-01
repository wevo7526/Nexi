"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { supabase, checkAuth } from '../lib/supabaseClient';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initialize = async () => {
      try {
        // Skip auth check for auth page and home page
        if (pathname === '/auth' || pathname === '/') {
          setIsLoading(false);
          return;
        }

        const { session, error } = await checkAuth();
        if (error) throw error;
        
        if (!session) {
          // Only redirect to auth if we're not already there
          if (pathname !== '/auth') {
            router.push('/auth');
          }
          return;
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize the application');
        setIsLoading(false);
      }
    };

    initialize();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' && pathname !== '/auth') {
        router.push('/auth');
      } else if (event === 'SIGNED_IN' && pathname === '/auth') {
        router.push('/consultant');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  // Don't show sidebar on auth page or home page
  const shouldShowSidebar = !['/auth', '/'].includes(pathname);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {shouldShowSidebar && (
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg transition-transform duration-200 ease-in-out">
          <Sidebar />
        </div>
      )}
      <main className={`flex-1 transition-all duration-200 ease-in-out ${shouldShowSidebar ? 'ml-64' : 'ml-0'}`}>
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  );
} 