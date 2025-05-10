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

        const { data: workflowData, error } = await supabase
            .from('workflow_data')
            .select('*')
            .eq('project_id', projectId)
            .eq('workflow_type', params.type)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(workflowData);
    } catch (error) {
        console.error('Error fetching workflow data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workflow data' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { projectId, workflowType, content, type } = body;

        if (!projectId || !workflowType || !content || !type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { data: workflowData, error } = await supabase
            .from('workflow_data')
            .insert([
                {
                    project_id: projectId,
                    workflow_type: workflowType,
                    content,
                    type
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(workflowData);
    } catch (error) {
        console.error('Error creating workflow data:', error);
        return NextResponse.json(
            { error: 'Failed to create workflow data' },
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
        const { dataId, updates } = body;

        if (!dataId || !updates) {
            return NextResponse.json(
                { error: 'Data ID and updates are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('workflow_data')
            .update(updates)
            .eq('id', dataId)
            .eq('workflow_type', params.type)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error updating workflow data:', error);
        return NextResponse.json(
            { error: 'Failed to update workflow data' },
            { status: 500 }
        );
    }
} 