import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        // Get the most recent analytics data
        const { data: analytics, error } = await supabase
            .from('analytics')
            .select('*')
            .order('date', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('Error fetching analytics:', error);
            throw error;
        }

        if (!analytics) {
            return NextResponse.json({
                totalRevenue: 0,
                revenueGrowth: 0,
                activeClients: 0,
                clientGrowth: 0,
                documentsGenerated: 0,
                documentGrowth: 0,
                averageCompletionTime: 0,
                timeGrowth: 0
            });
        }

        return NextResponse.json({
            totalRevenue: analytics.total_revenue,
            revenueGrowth: analytics.revenue_growth,
            activeClients: analytics.active_clients,
            clientGrowth: analytics.client_growth,
            documentsGenerated: analytics.documents_generated,
            documentGrowth: analytics.document_growth,
            averageCompletionTime: analytics.average_completion_time,
            timeGrowth: analytics.time_growth
        });
    } catch (error) {
        console.error('Error in analytics API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics data' },
            { status: 500 }
        );
    }
} 