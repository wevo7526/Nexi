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
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        const { data: project, error } = await supabase
            .from('projects')
            .select(`
                *,
                project_team_members!inner (
                    user:user_id (
                        full_name
                    )
                ),
                tasks (
                    id,
                    status
                ),
                documents (
                    id
                )
            `)
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
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
        const body = await request.json();

        // Update project
        const { data: project, error: projectError } = await supabase
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
            .select()
            .single();

        if (projectError) throw projectError;

        // Update team members if provided
        if (body.teamMembers) {
            // First, delete existing team members
            const { error: deleteError } = await supabase
                .from('project_team_members')
                .delete()
                .eq('project_id', params.id);

            if (deleteError) throw deleteError;

            // Then, insert new team members
            if (body.teamMembers.length > 0) {
                const { error: teamError } = await supabase
                    .from('project_team_members')
                    .insert(
                        body.teamMembers.map((memberId: string) => ({
                            project_id: params.id,
                            user_id: memberId,
                            role: 'member'
                        }))
                    );

                if (teamError) throw teamError;
            }
        }

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
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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