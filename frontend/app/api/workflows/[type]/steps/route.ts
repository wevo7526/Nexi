import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
    request: Request,
    { params }: { params: { type: string } }
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

        const { data: steps, error } = await supabase
            .from('workflow_steps')
            .select('*')
            .eq('project_id', projectId)
            .eq('workflow_type', params.type)
            .order('step_number', { ascending: true });

        if (error) throw error;

        return NextResponse.json(steps);
    } catch (error) {
        console.error('Error fetching workflow steps:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workflow steps' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { projectId, stepNumber, title, description, workflowType } = body;

        if (!projectId || !stepNumber || !title || !workflowType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { data: step, error } = await supabase
            .from('workflow_steps')
            .insert([
                {
                    project_id: projectId,
                    workflow_type: workflowType,
                    step_number: stepNumber,
                    title,
                    description,
                    status: 'pending',
                    ai_assistance: true
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(step);
    } catch (error) {
        console.error('Error creating workflow step:', error);
        return NextResponse.json(
            { error: 'Failed to create workflow step' },
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
        const { stepId, updates } = body;

        if (!stepId || !updates) {
            return NextResponse.json(
                { error: 'Step ID and updates are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('workflow_steps')
            .update(updates)
            .eq('id', stepId)
            .eq('workflow_type', params.type)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error updating workflow step:', error);
        return NextResponse.json(
            { error: 'Failed to update workflow step' },
            { status: 500 }
        );
    }
} 