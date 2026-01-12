'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getRegistrationEnabled, signup } from '@/app/auth/actions';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const [state, formAction, isPending] = useActionState(signup, null);
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const enabled = await getRegistrationEnabled();
      if (!cancelled) setRegistrationEnabled(enabled);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const errorText = useMemo(() => {
    const stateObj = state && typeof state === 'object' ? (state as Record<string, unknown>) : null;
    const errorCode = stateObj && typeof stateObj.errorCode === 'string' ? stateObj.errorCode : undefined;
    if (errorCode === 'REGISTRATION_DISABLED') return t('disabled');
    if (errorCode === 'PASSWORD_MISMATCH') return t('passwordMismatch');
    const error = stateObj && typeof stateObj.error === 'string' ? stateObj.error : undefined;
    return error;
  }, [state, t]);

  if (state?.success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <Image src="/logo1.png" alt={t('title')} width={40} height={40} priority />
            </div>
            <CardTitle className="text-green-600">{t('success')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              {t('checkEmail')}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pt-6">
            <Link href="/login" className="text-blue-500 hover:underline">
              {t('hasAccount')}
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (registrationEnabled === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <Image src="/logo1.png" alt={t('title')} width={40} height={40} priority />
            </div>
            <CardTitle>{t('title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{t('disabled')}</p>
          </CardContent>
          <CardFooter className="flex justify-center pt-6">
            <Link href="/login" className="text-blue-500 hover:underline">
              {t('hasAccount')}
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <Image src="/logo1.png" alt={t('title')} width={40} height={40} priority />
          </div>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" name="email" type="email" required placeholder={t('emailPlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>
            {errorText && (
              <div className="text-sm text-red-500 font-medium">
                {errorText}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-6">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? t('loading') : t('submit')}
            </Button>
            <div className="text-center text-sm">
              <Link href="/login" className="text-blue-500 hover:underline">
                {t('hasAccount')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
