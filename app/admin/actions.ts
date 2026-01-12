'use server';

import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createUser(prevState: unknown, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/admin/users');
    return { success: true };
}

export async function deleteUser(userId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user?.id === userId) {
        return { error: 'You cannot delete your own account.' };
    }

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/admin/users');
    return { success: true };
}

export async function updateUserPassword(userId: string, password: string) {
    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/admin/users');
    return { success: true };
}

export async function toggleRegistration(enabled: boolean) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { error: 'Forbidden' };
    }

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
        .from('system_settings')
        .upsert({ key: 'registration_enabled', value: String(enabled) }, { onConflict: 'key' });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/admin/users');
    return { success: true };
}
