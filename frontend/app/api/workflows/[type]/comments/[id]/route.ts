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
    { params }: { params: { type: WorkflowType; id: string } }
) {
    try {
        const { data: comment, error } = await supabase
            .from('workflow_comments')
            .select(`
                *,
                user:users(full_name, email)
            `)
            .eq('id', params.id)
            .single();

        if (error) throw error;

        return NextResponse.json(comment);
    } catch (error) {
        console.error('Error fetching workflow comment:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workflow comment' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { type: WorkflowType; id: string } }
) {
    try {
        const body = await request.json();
        const { content } = body;

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        const { data: comment, error } = await supabase
            .from('workflow_comments')
            .update({ content })
            .eq('id', params.id)
            .select(`
                *,
                user:users(full_name, email)
            `)
            .single();

        if (error) throw error;

        return NextResponse.json(comment);
    } catch (error) {
        console.error('Error updating workflow comment:', error);
        return NextResponse.json(
            { error: 'Failed to update workflow comment' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { type: WorkflowType; id: string } }
) {
    try {
        const { error } = await supabase
            .from('workflow_comments')
            .delete()
            .eq('id', params.id);

        if (error) throw error;

        return NextResponse.json({ message: 'Workflow comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting workflow comment:', error);
        return NextResponse.json(
            { error: 'Failed to delete workflow comment' },
            { status: 500 }
        );
    }
} 