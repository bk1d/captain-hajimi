'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { LogOut, User as UserIcon, Settings as SettingsIcon, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { signout } from '@/app/auth/actions';
import Link from 'next/link';
import Image from 'next/image';

interface NavProps {
  user: User | null;
  role: string | null;
}

export function Nav({ user, role }: NavProps) {
  const t = useTranslations('Main');
  const tAuth = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();

  const handleLocaleChange = (nextLocale: string) => {
    document.cookie = `NEXT_LOCALE=${encodeURIComponent(nextLocale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto py-4 px-4 max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="shrink-0">
            <Image src="/logo1.png" alt={t('title')} width={45} height={45} priority />
          </Link>
          <div className="flex flex-col leading-tight">
            <Link href="/" className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity">
              {t('title')}
            </Link>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {t('subtitle')}
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <div className="w-[140px]">
            <Select value={locale} onValueChange={handleLocaleChange}>
              <SelectTrigger aria-label={t('language.label')} className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh-CN">{t('language.zhCN')}</SelectItem>
                <SelectItem value="en">{t('language.en')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <UserIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {role === 'admin' && (
                  <DropdownMenuItem onClick={() => router.push('/admin/users')}>
                    <Shield className="mr-2 h-4 w-4" />
                    {tAuth('admin.title')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  {tAuth('profile.title')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {tAuth('signout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
