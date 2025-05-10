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
        // First, get the projects with basic information
        const { data: projects, error } = await supabase
            .from('projects')
            .select(`
                *,
                client:clients(name),
                project_documents(id),
                project_tasks(id, status)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Then, get team members for each project
        const projectsWithTeam = await Promise.all(
            projects.map(async (project) => {
                const { data: teamMembers } = await supabase
                    .from('project_team_members')
                    .select('user_id')
                    .eq('project_id', project.id);

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

                return {
                    ...project,
                    team: teamMemberDetails.filter(Boolean)
                };
            })
        );

        // Transform the data to match our frontend interface
        const transformedProjects = projectsWithTeam.map(project => ({
            id: project.id,
            name: project.name,
            description: project.description,
            client: project.client.name,
            team: project.team,
            startDate: project.start_date,
            endDate: project.end_date,
            progress: project.progress,
            status: project.status,
            documents: project.project_documents.length,
            tasks: {
                total: project.project_tasks.length,
                completed: project.project_tasks.filter((task: ProjectTask) => task.status === 'completed').length
            }
        }));

        return NextResponse.json(transformedProjects);
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
                    status: body.status,
                    created_by: body.userId
                }
            ])
            .select(`
                *,
                client:clients(name)
            `)
            .single();

        if (error) throw error;

        // Transform the data to match our frontend interface
        const transformedProject = {
            id: project.id,
            name: project.name,
            description: project.description,
            client: project.client.name,
            team: [],
            startDate: project.start_date,
            endDate: project.end_date,
            progress: project.progress,
            status: project.status,
            documents: 0,
            tasks: {
                total: 0,
                completed: 0
            }
        };

        return NextResponse.json(transformedProject);
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json(
            { error: 'Failed to create project' },
            { status: 500 }
        );
    }
} 