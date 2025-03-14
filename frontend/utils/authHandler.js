import { supabase } from '../lib/supabaseClient'

export default class AuthHandler {
    async signUp(email, password) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth-redirect?redirectTo=/profile/create`,
                    data: {
                        isNewUser: true
                    }
                }
            })
            
            if (error) throw error
            return { data, error: null }
        } catch (error) {
            return { data: null, error: error.message }
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })
            
            if (error) throw error
            return { data, error: null }
        } catch (error) {
            return { data: null, error: error.message }
        }
    }

    async signOut() {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            return { error: null }
        } catch (error) {
            return { error: error.message }
        }
    }
} 