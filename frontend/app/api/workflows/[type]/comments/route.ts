import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { WorkflowType } from '@/types/workflow';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
    request: Request,
    { params }: { params: { type: WorkflowType } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json(
                { error: 'Project ID is required' },
                { status: 400 }
            );
        }

        const { data: comments, error } = await supabase
            .from('workflow_comments')
            .select(`
                *,
                user:users(full_name, email)
            `)
            .eq('project_id', projectId)
            .eq('workflow_type', params.type)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json(comments);
    } catch (error) {
        console.error('Error fetching workflow comments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workflow comments' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { projectId, workflowType, content, userId } = body;

        if (!projectId || !workflowType || !content || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { data: comment, error } = await supabase
            .from('workflow_comments')
            .insert([
                {
                    project_id: projectId,
                    workflow_type: workflowType,
                    content,
                    created_by: userId
                }
            ])
            .select(`
                *,
                user:users(full_name, email)
            `)
            .single();

        if (error) throw error;

        return NextResponse.json(comment);
    } catch (error) {
        console.error('Error creating workflow comment:', error);
        return NextResponse.json(
            { error: 'Failed to create workflow comment' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { type: WorkflowType } }
) {
    try {
        const body = await request.json();
        const { commentId, content } = body;

        if (!commentId || !content) {
            return NextResponse.json(
                { error: 'Comment ID and content are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('workflow_comments')
            .update({ content })
            .eq('id', commentId)
            .eq('workflow_type', params.type)
            .select(`
                *,
                user:user_id (
                    email,
                    raw_user_meta_data->full_name
                )
            `)
            .single();

        if (error) throw error;

        // Transform the data to match the WorkflowComment interface
        const comment = {
            ...data,
            user: {
                email: data.user.email,
                full_name: data.user.raw_user_meta_data?.full_name
            }
        };

        return NextResponse.json(comment);
    } catch (error) {
        console.error('Error updating workflow comment:', error);
        return NextResponse.json(
            { error: 'Failed to update workflow comment' },
            { status: 500 }
        );
    }
} 