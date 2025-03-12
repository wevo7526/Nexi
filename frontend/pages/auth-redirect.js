"use client";

import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/router';

export default function AuthRedirect() {
    const router = useRouter();
    const { redirectTo } = router.query; // Get the intended destination

    useEffect(() => {
        const checkSession = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                console.error("Error fetching session:", error);
                router.push('/auth'); // Redirect to auth page on error
                return;
            }
            if (user) {
                // Redirect to intended page or default to "/consultant"
                router.push(redirectTo ? decodeURIComponent(redirectTo) : '/consultant');
            } else {
                router.push('/auth'); // Redirect to auth if no session
            }
        };
        checkSession();
    }, [redirectTo, router]);

    return <p>Redirecting...</p>; // Loading message
}
