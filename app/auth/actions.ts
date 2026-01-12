'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function login(prevState: unknown, formData: FormData) {
    const supabase = await createClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/', 'layout');
    redirect('/');
}

export async function getRegistrationEnabled() {
    const supabase = await createClient();

    const { data: settings } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'registration_enabled')
        .single();

    return settings ? settings.value === 'true' : true;
}

export async function signup(prevState: unknown, formData: FormData) {
    const supabase = await createClient();

    // Check if registration is enabled
    const { data: settings } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'registration_enabled')
        .single();

    // If settings are missing (e.g. table empty), default to true?
    // SQL inserts default true.
    const registrationEnabled = settings ? settings.value === 'true' : true;

    if (!registrationEnabled) {
        return { errorCode: 'REGISTRATION_DISABLED' as const };
    }

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
        return { errorCode: 'PASSWORD_MISMATCH' as const };
    }

    const { error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function signout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    redirect('/login');
}
