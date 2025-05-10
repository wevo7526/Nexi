import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
    try {
        const { data: team, error } = await supabase
            .from('team_members')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(team);
    } catch (error) {
        console.error('Error fetching team:', error);
        return NextResponse.json(
            { error: 'Failed to fetch team' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const { data: teamMember, error } = await supabase
            .from('team_members')
            .insert([
                {
                    name: body.name,
                    email: body.email,
                    role: body.role,
                    department: body.department
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(teamMember);
    } catch (error) {
        console.error('Error creating team member:', error);
        return NextResponse.json(
            { error: 'Failed to create team member' },
            { status: 500 }
        );
    }
} 