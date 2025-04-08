import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Create a Supabase client configured to use cookies
        const supabase = createRouteHandlerClient({ cookies });

        // Get the current user's session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error('Session error:', sessionError);
            return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
        }

        if (!session?.user) {
            return NextResponse.json({ error: 'No active session' }, { status: 401 });
        }

        // Query analytics data for the current user
        const { data: analytics, error: dbError } = await supabase
            .from('analytics')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            // Return default values if no data exists
            return NextResponse.json({
                total_revenue: 0,
                revenue_growth: 0,
                active_clients: 0,
                client_growth: 0,
                documents_generated: 0,
                document_growth: 0,
                average_completion_time: 0,
                time_growth: 0
            });
        }

        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Error in analytics API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 