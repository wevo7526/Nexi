import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface ProjectTeamMember {
    user: {
        full_name: string;
    };
}

interface ProjectTask {
    id: string;
    status: string;
}

interface ProjectDocument {
    id: string;
}

interface Project {
    id: string;
    name: string;
    description: string;
    client_id: string;
    start_date: string;
    end_date: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export async function GET() {
    try {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        const { data: projects, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json(
            { error: 'Failed to fetch projects' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
        const body = await request.json();

        const { data: project, error } = await supabase
            .from('projects')
            .insert([
                {
                    name: body.name,
                    description: body.description,
                    client_id: body.clientId,
                    start_date: body.startDate,
                    end_date: body.endDate,
                    status: body.status
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(project);
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json(
            { error: 'Failed to create project' },
            { status: 500 }
        );
    }
} 