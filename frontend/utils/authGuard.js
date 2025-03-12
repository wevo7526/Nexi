// utils/authGuard.js
import { supabase } from '../supabaseClient';

export async function getUserSession() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
}
