'use client';

import { useActionState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { updatePassword } from './actions';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function ProfilePage() {
  const t = useTranslations('auth.profile');
  const [state, formAction, isPending] = useActionState(updatePassword, null);

  const errorText = useMemo(() => {
    const stateObj = state && typeof state === 'object' ? (state as Record<string, unknown>) : null;
    const errorCode = stateObj && typeof stateObj.errorCode === 'string' ? stateObj.errorCode : undefined;
    if (errorCode === 'PASSWORD_MISMATCH') return t('passwordMismatch');
    const error = stateObj && typeof stateObj.error === 'string' ? stateObj.error : undefined;
    return error;
  }, [state, t]);

  useEffect(() => {
    if (state?.success) {
      toast.success(t('passwordUpdated'));
    } else if (errorText) {
      toast.error(errorText);
    }
  }, [state, t, errorText]);

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('changePassword')}</CardTitle>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('newPassword')}</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('saving') : t('save')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
