import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { UsersTable } from './users-table';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export default async function UsersPage() {
  const t = await getTranslations('auth.admin');
  const supabase = await createClient();

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  const supabaseAdmin = createAdminClient();
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();

  // Get registration status
  const { data: settings } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'registration_enabled')
    .single();

  const registrationEnabled = settings ? settings.value === 'true' : true;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </div>
      <UsersTable
        users={users || []}
        registrationEnabled={registrationEnabled}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
