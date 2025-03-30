"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import Sidebar from './Sidebar';

export default function LayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                router.push('/auth');
            }
        };

        // Don't check auth on the auth page
        if (pathname !== '/auth') {
            checkAuth();
        }
    }, [pathname, router]);

    // Don't show sidebar on auth page
    if (pathname === '/auth') {
        return <>{children}</>;
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>

            <style jsx>{`
                .app-layout {
                    display: flex;
                    min-height: 100vh;
                }

                .main-content {
                    flex: 1;
                    margin-left: 300px;
                    padding: 2rem;
                    background: #f8f9fa;
                    min-height: 100vh;
                }

                @media (max-width: 768px) {
                    .main-content {
                        margin-left: 0;
                    }
                }
            `}</style>
        </div>
    );
} 