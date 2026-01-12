'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updatePassword(prevState: unknown, formData: FormData) {
    const supabase = await createClient();

    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
        return { errorCode: 'PASSWORD_MISMATCH' };
    }

    const { error } = await supabase.auth.updateUser({
        password,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/profile');
    return { success: true };
}
