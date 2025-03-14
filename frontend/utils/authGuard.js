// utils/authGuard.js
import { supabase } from '../lib/supabaseClient';

export async function getUserSession() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
}
