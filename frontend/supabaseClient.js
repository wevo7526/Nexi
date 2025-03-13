// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://geqrjwwdsvmbtjhownyo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlcXJqd3dkc3ZtYnRqaG93bnlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4MTQ5NjgsImV4cCI6MjA1NzM5MDk2OH0.LP38uUOUyv6oagdUhnZtQYWjRqnY32wCIcsdwm28sDI'; // Found in the Supabase dashboard
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
    }
});
