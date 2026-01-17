'use server';

import { createClient } from '@/utils/supabase/server';
import { nanoid } from 'nanoid';
import { headers } from 'next/headers';

export type Subscription = {
    id: string;
    name: string;
    url: string | null;
    content?: string;
    enabled: boolean;
    created_at: string;
};

export type GeneratedConfig = {
    id: string;
    token: string;
    filename: string;
    target: string;
    params: GenerateConfigParams;
    name?: string;
    created_at: string;
};

export type GenerateConfigAdvancedParams = {
    emoji?: boolean;
    udp?: boolean;
    tfo?: boolean;
    scv?: boolean;
    expand?: boolean;
};

export type GenerateConfigParams = {
    backendUrl: string;
    target: string;
    urls: string[];
    configUrl?: string;
    exclude?: string;
    include?: string;
    filename?: string;
    advanced?: GenerateConfigAdvancedParams;
    customParams?: Record<string, string>;
};

export type BackendUrl = {
    id: string;
    name: string;
    url: string;
    enabled: boolean;
    created_at: string;
};

export type RemoteConfig = {
    id: string;
    name: string;
    url: string;
    enabled: boolean;
    created_at: string;
};

// Subscriptions
export async function getSubscriptions() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Subscription[];
}

export async function addSubscription(name: string, url: string, content?: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const insertData: any = { name, enabled: true, user_id: user.id };
    if (url) insertData.url = url;
    if (content) insertData.content = content;

    const { data, error } = await supabase.from('subscriptions').insert([insertData]).select();

    if (error) throw new Error(error.message);

    const record = data[0];

    // If content is provided, generate and update URL
    if (content && record) {
        const headerList = await headers();
        const host = headerList.get('host');
        const protocol = headerList.get('x-forwarded-proto') || 'http';
        const generatedUrl = `${protocol}://${host}/api/raw/${record.id}`;

        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ url: generatedUrl })
            .eq('id', record.id);

        if (updateError) throw new Error(updateError.message);
        record.url = generatedUrl;
    }

    return record;
}

export async function deleteSubscription(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('subscriptions').delete().match({ id });

    if (error) throw new Error(error.message);
}

// Backend URLs
export async function getBackendUrls() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('backend_urls')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as BackendUrl[];
}

export async function addBackendUrl(name: string, url: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
        .from('backend_urls')
        .insert([{ name, url, enabled: true, user_id: user.id }])
        .select();

    if (error) throw new Error(error.message);
    return data[0];
}

export async function deleteBackendUrl(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('backend_urls').delete().match({ id });

    if (error) throw new Error(error.message);
}

// Remote Configs
export async function getRemoteConfigs() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('remote_configs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as RemoteConfig[];
}

export async function addRemoteConfig(name: string, url: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
        .from('remote_configs')
        .insert([{ name, url, enabled: true, user_id: user.id }])
        .select();

    if (error) throw new Error(error.message);
    return data[0];
}

export async function deleteRemoteConfig(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('remote_configs').delete().match({ id });

    if (error) throw new Error(error.message);
}

// Generated Configs
export async function getGeneratedConfigs() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('generated_configs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as GeneratedConfig[];
}

export async function deleteGeneratedConfig(id: string, filename: string) {
    const supabase = await createClient();
    // 1. Delete from Storage
    const { error: storageError } = await supabase.storage.from('configs').remove([filename]);

    if (storageError) console.error('Storage delete error:', storageError);

    // 2. Delete from DB
    const { error } = await supabase.from('generated_configs').delete().match({ id });

    if (error) throw new Error(error.message);
}

export async function refreshGeneratedConfig(id: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const { data: existing, error: existingError } = await supabase
        .from('generated_configs')
        .select('*')
        .eq('id', id)
        .single();

    if (existingError || !existing) {
        throw new Error('Config not found');
    }

    const params = existing.params as GenerateConfigParams;
    const {
        backendUrl,
        target,
        urls,
        configUrl,
        exclude,
        include,
        advanced,
        customParams,
    } = params;

    if (!backendUrl || !target || !urls || urls.length === 0) {
        throw new Error('Invalid stored parameters');
    }

    const joinedUrls = urls.join('|');
    const searchParams = new URLSearchParams();
    searchParams.set('target', target);
    searchParams.set('url', joinedUrls);

    if (configUrl) searchParams.set('config', configUrl);
    if (exclude) searchParams.set('exclude', exclude);
    if (include) searchParams.set('include', include);

    if (advanced) {
        if (advanced.emoji) searchParams.set('emoji', 'true');
        if (advanced.udp) searchParams.set('udp', 'true');
        if (advanced.tfo) searchParams.set('tfo', 'true');
        if (advanced.scv) searchParams.set('scv', 'true');
        if (advanced.expand) searchParams.set('expand', 'true');
    }

    if (customParams) {
        Object.entries(customParams).forEach(([key, value]) => {
            if (key && value) {
                searchParams.set(key, value);
            }
        });
    }

    let cleanBackend = backendUrl.trim();

    const queryIndex = cleanBackend.indexOf('?');
    if (queryIndex !== -1) {
        cleanBackend = cleanBackend.slice(0, queryIndex);
    }

    if (cleanBackend.endsWith('/')) {
        cleanBackend = cleanBackend.slice(0, -1);
    }

    if (cleanBackend.endsWith('/sub')) {
        cleanBackend = cleanBackend.slice(0, -4);
    }

    const finalUrl = `${cleanBackend}/sub?${searchParams.toString()}`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        try {
            const res = await fetch(finalUrl, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Backend Error (${res.status}): ${text.slice(0, 100)}`);
            }
            const content = await res.text();

            const fileExt = target === 'clash' ? 'yaml' : 'txt';
            const newStorageFileName = `${nanoid()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('configs')
                .upload(newStorageFileName, content, {
                    contentType: 'text/plain; charset=utf-8',
                    upsert: false,
                });

            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

            const { error: removeError } = await supabase.storage
                .from('configs')
                .remove([existing.filename]);
            if (removeError) {
                console.error('Storage delete error (refresh):', removeError);
            }

            const { data: updated, error: updateError } = await supabase
                .from('generated_configs')
                .update({
                    filename: newStorageFileName,
                    params,
                    created_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw new Error(`DB Save failed: ${updateError.message}`);

            return updated;
        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError instanceof Error) {
                if (fetchError.name === 'AbortError') {
                    throw new Error(
                        'Backend Connection Timeout: The request took too long to respond. Please try a different backend.'
                    );
                }
                if (fetchError.message.includes('fetch failed')) {
                    throw new Error(
                        `Backend Connection Failed: Unable to reach ${cleanBackend}. Please check the URL or try a different backend.`
                    );
                }
            }
            throw fetchError;
        }
    } catch (e) {
        console.error('Refresh Config Error:', e);
        throw new Error(e instanceof Error ? e.message : String(e));
    }
}

export async function generateAndSaveConfig(params: GenerateConfigParams) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // 1. Construct Subconverter URL
    // Format: backend/sub?target=...&url=...
    const {
        backendUrl,
        target,
        urls,
        configUrl,
        exclude,
        include,
        filename: name,
        advanced,
        customParams,
    } = params;

    const joinedUrls = urls.join('|');
    const searchParams = new URLSearchParams();
    searchParams.set('target', target);
    searchParams.set('url', joinedUrls);

    if (configUrl) searchParams.set('config', configUrl);
    if (exclude) searchParams.set('exclude', exclude);
    if (include) searchParams.set('include', include);

    // Advanced params
    if (advanced) {
        if (advanced.emoji) searchParams.set('emoji', 'true');
        if (advanced.udp) searchParams.set('udp', 'true');
        if (advanced.tfo) searchParams.set('tfo', 'true');
        if (advanced.scv) searchParams.set('scv', 'true');
        if (advanced.expand) searchParams.set('expand', 'true');
    }

    // Custom params
    if (customParams) {
        Object.entries(customParams).forEach(([key, value]) => {
            if (key && value) {
                searchParams.set(key, value);
            }
        });
    }

    // Clean backend URL
    let cleanBackend = backendUrl.trim();

    // 1. Remove query parameters
    const queryIndex = cleanBackend.indexOf('?');
    if (queryIndex !== -1) {
        cleanBackend = cleanBackend.slice(0, queryIndex);
    }

    // 2. Remove trailing slash
    if (cleanBackend.endsWith('/')) {
        cleanBackend = cleanBackend.slice(0, -1);
    }

    // 3. Remove trailing /sub (to avoid duplication)
    if (cleanBackend.endsWith('/sub')) {
        cleanBackend = cleanBackend.slice(0, -4);
    }

    const finalUrl = `${cleanBackend}/sub?${searchParams.toString()}`;

    // 2. Fetch Content
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout

        try {
            const res = await fetch(finalUrl, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Backend Error (${res.status}): ${text.slice(0, 100)}`);
            }
            const content = await res.text();

            // 3. Upload to Storage
            // Generate a unique token and filename
            const token = nanoid(10); // Short token for URL
            const fileExt = target === 'clash' ? 'yaml' : 'txt';
            const storageFileName = `${nanoid()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('configs')
                .upload(storageFileName, content, {
                    contentType: 'text/plain; charset=utf-8',
                    upsert: false,
                });

            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

            // 4. Save Record
            const { data: record, error: dbError } = await supabase
                .from('generated_configs')
                .insert([
                    {
                        token,
                        filename: storageFileName,
                        target,
                        params,
                        name: name || undefined,
                        user_id: user.id,
                    },
                ])
                .select()
                .single();

            if (dbError) throw new Error(`DB Save failed: ${dbError.message}`);

            return record;
        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError instanceof Error) {
                if (fetchError.name === 'AbortError') {
                    throw new Error(
                        'Backend Connection Timeout: The request took too long to respond. Please try a different backend.'
                    );
                }
                if (fetchError.message.includes('fetch failed')) {
                    throw new Error(
                        `Backend Connection Failed: Unable to reach ${cleanBackend}. Please check the URL or try a different backend.`
                    );
                }
            }
            throw fetchError;
        }
    } catch (e) {
        console.error('Generate Config Error:', e);
        throw new Error(e instanceof Error ? e.message : String(e));
    }
}
