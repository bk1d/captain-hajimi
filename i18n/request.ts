import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

const SUPPORTED_LOCALES = ['zh-CN', 'en'] as const;
type SupportedLocale = typeof SUPPORTED_LOCALES[number];

function isSupportedLocale(value: string): value is SupportedLocale {
    return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
    const locale = cookieLocale && isSupportedLocale(cookieLocale) ? cookieLocale : 'zh-CN';

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    };
});
