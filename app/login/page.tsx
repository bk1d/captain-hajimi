'use client';

import { useActionState, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getRegistrationEnabled, login } from '@/app/auth/actions';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const [state, formAction, isPending] = useActionState(login, null);
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <Image src="/logo1.png" alt={t('title')} width={100} height={100} priority />
          </div>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
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
            {state?.error && (
              <div className="text-sm text-red-500 font-medium">
                {state.error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-6">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? t('loading') : t('submit')}
            </Button>
            {registrationEnabled !== false && (
              <div className="text-center text-sm">
                <Link href="/register" className="text-blue-500 hover:underline">
                  {t('noAccount')}
                </Link>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
