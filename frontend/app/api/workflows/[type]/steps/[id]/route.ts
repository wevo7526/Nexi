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
        const { data: step, error } = await supabase
            .from('workflow_steps')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) throw error;

        return NextResponse.json(step);
    } catch (error) {
        console.error('Error fetching workflow step:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workflow step' },
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
        const { status, aiAssistance } = body;

        if (!status) {
            return NextResponse.json(
                { error: 'Status is required' },
                { status: 400 }
            );
        }

        const { data: step, error } = await supabase
            .from('workflow_steps')
            .update({
                status,
                ai_assistance: aiAssistance
            })
            .eq('id', params.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(step);
    } catch (error) {
        console.error('Error updating workflow step:', error);
        return NextResponse.json(
            { error: 'Failed to update workflow step' },
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
            .from('workflow_steps')
            .delete()
            .eq('id', params.id);

        if (error) throw error;

        return NextResponse.json({ message: 'Workflow step deleted successfully' });
    } catch (error) {
        console.error('Error deleting workflow step:', error);
        return NextResponse.json(
            { error: 'Failed to delete workflow step' },
            { status: 500 }
        );
    }
} 