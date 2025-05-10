import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    progress: number;
    project_team_members: ProjectTeamMember[];
    tasks: ProjectTask[];
    documents: ProjectDocument[];
}

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) throw error;

        // Transform the data to match our frontend interface
        const transformedProject = {
            id: project.id,
            name: project.name,
            description: project.description,
            client: project.client_id,
            team: project.project_team_members.map((member: ProjectTeamMember) => member.user.full_name),
            startDate: project.start_date,
            endDate: project.end_date,
            progress: project.progress,
            status: project.status,
            documents: project.documents.length,
            tasks: {
                total: project.tasks.length,
                completed: project.tasks.filter((task: ProjectTask) => task.status === 'completed').length
            }
        };

        return NextResponse.json(transformedProject);
    } catch (error) {
        console.error('Error fetching project:', error);
        return NextResponse.json(
            { error: 'Failed to fetch project' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const { data: project, error } = await supabase
            .from('projects')
            .update({
                name: body.name,
                description: body.description,
                client_id: body.clientId,
                start_date: body.startDate,
                end_date: body.endDate,
                status: body.status
            })
            .eq('id', params.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(project);
    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json(
            { error: 'Failed to update project' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', params.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting project:', error);
        return NextResponse.json(
            { error: 'Failed to delete project' },
            { status: 500 }
        );
    }
} 