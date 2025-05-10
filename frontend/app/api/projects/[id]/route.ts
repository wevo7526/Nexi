import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
    status: string;
}

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // First, get the project with basic information
        const { data: project, error } = await supabase
            .from('projects')
            .select(`
                *,
                client:clients(name),
                project_documents(id),
                project_tasks(id, status),
                workflow_steps(
                    id,
                    workflow_type,
                    step_number,
                    title,
                    description,
                    status,
                    ai_assistance
                )
            `)
            .eq('id', params.id)
            .single();

        if (error) throw error;

        // Get team members for the project
        const { data: teamMembers } = await supabase
            .from('project_team_members')
            .select('user_id')
            .eq('project_id', params.id);

        // Get user details for each team member
        const teamMemberDetails = await Promise.all(
            (teamMembers || []).map(async (member) => {
                const { data: user } = await supabase
                    .from('users')
                    .select('full_name')
                    .eq('id', member.user_id)
                    .single();
                return user?.full_name || '';
            })
        );

        // Transform the data to match our frontend interface
        const transformedProject = {
            id: project.id,
            name: project.name,
            description: project.description,
            client: project.client.name,
            team: teamMemberDetails.filter(Boolean),
            startDate: project.start_date,
            endDate: project.end_date,
            progress: project.progress,
            status: project.status,
            documents: project.project_documents.length,
            tasks: {
                total: project.project_tasks.length,
                completed: project.project_tasks.filter((task: ProjectTask) => task.status === 'completed').length
            },
            workflows: project.workflow_steps.reduce((acc: any, step: any) => {
                if (!acc[step.workflow_type]) {
                    acc[step.workflow_type] = [];
                }
                acc[step.workflow_type].push({
                    id: step.id,
                    stepNumber: step.step_number,
                    title: step.title,
                    description: step.description,
                    status: step.status,
                    aiAssistance: step.ai_assistance
                });
                return acc;
            }, {})
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
                status: body.status,
                progress: body.progress
            })
            .eq('id', params.id)
            .select(`
                *,
                client:clients(name)
            `)
            .single();

        if (error) throw error;

        // Get team members for the project
        const { data: teamMembers } = await supabase
            .from('project_team_members')
            .select('user_id')
            .eq('project_id', params.id);

        // Get user details for each team member
        const teamMemberDetails = await Promise.all(
            (teamMembers || []).map(async (member) => {
                const { data: user } = await supabase
                    .from('users')
                    .select('full_name')
                    .eq('id', member.user_id)
                    .single();
                return user?.full_name || '';
            })
        );

        // Transform the data to match our frontend interface
        const transformedProject = {
            id: project.id,
            name: project.name,
            description: project.description,
            client: project.client.name,
            team: teamMemberDetails.filter(Boolean),
            startDate: project.start_date,
            endDate: project.end_date,
            progress: project.progress,
            status: project.status,
            documents: project.project_documents?.length || 0,
            tasks: {
                total: project.project_tasks?.length || 0,
                completed: project.project_tasks?.filter((task: ProjectTask) => task.status === 'completed').length || 0
            }
        };

        return NextResponse.json(transformedProject);
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