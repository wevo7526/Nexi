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
    { params }: { params: { id: string } }
) {
    try {
        const { data: client, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) throw error;

        return NextResponse.json(client);
    } catch (error) {
        console.error('Error fetching client:', error);
        return NextResponse.json(
            { error: 'Failed to fetch client' },
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

        const { data: client, error } = await supabase
            .from('clients')
            .update({
                name: body.name,
                description: body.description,
                industry: body.industry,
                website: body.website,
                contact_email: body.contactEmail,
                contact_phone: body.contactPhone
            })
            .eq('id', params.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(client);
    } catch (error) {
        console.error('Error updating client:', error);
        return NextResponse.json(
            { error: 'Failed to update client' },
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
            .from('clients')
            .delete()
            .eq('id', params.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json(
            { error: 'Failed to delete client' },
            { status: 500 }
        );
    }
} 