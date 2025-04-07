import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface TeamMember {
    id: string;
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string;
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        const { data: teamMembers, error } = await supabase
            .from('users')
            .select('*')
            .order('full_name', { ascending: true });

        if (error) throw error;

        return NextResponse.json(teamMembers);
    } catch (error) {
        console.error('Error fetching team members:', error);
        return NextResponse.json(
            { error: 'Failed to fetch team members' },
            { status: 500 }
        );
    }
} 