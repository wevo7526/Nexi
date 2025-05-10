import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
    try {
        const { data: clients, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json(
            { error: 'Failed to fetch clients' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const { data: client, error } = await supabase
            .from('clients')
            .insert([
                {
                    name: body.name,
                    description: body.description,
                    industry: body.industry,
                    website: body.website,
                    contact_email: body.contactEmail,
                    contact_phone: body.contactPhone,
                    created_by: body.userId
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(client);
    } catch (error) {
        console.error('Error creating client:', error);
        return NextResponse.json(
            { error: 'Failed to create client' },
            { status: 500 }
        );
    }
} 