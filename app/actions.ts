'use server';

import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';

export type Subscription = {
    id: string;
    name: string;
    url: string;
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
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Subscription[];
}

export async function addSubscription(name: string, url: string) {
    const { data, error } = await supabase
        .from('subscriptions')
        .insert([{ name, url, enabled: true }])
        .select();

    if (error) throw new Error(error.message);
    return data[0];
}

export async function deleteSubscription(id: string) {
    const { error } = await supabase.from('subscriptions').delete().match({ id });

    if (error) throw new Error(error.message);
}

// Backend URLs
export async function getBackendUrls() {
    const { data, error } = await supabase
        .from('backend_urls')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as BackendUrl[];
}

export async function addBackendUrl(name: string, url: string) {
    const { data, error } = await supabase
        .from('backend_urls')
        .insert([{ name, url, enabled: true }])
        .select();

    if (error) throw new Error(error.message);
    return data[0];
}

export async function deleteBackendUrl(id: string) {
    const { error } = await supabase.from('backend_urls').delete().match({ id });

    if (error) throw new Error(error.message);
}

// Remote Configs
export async function getRemoteConfigs() {
    const { data, error } = await supabase
        .from('remote_configs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as RemoteConfig[];
}

export async function addRemoteConfig(name: string, url: string) {
    const { data, error } = await supabase
        .from('remote_configs')
        .insert([{ name, url, enabled: true }])
        .select();

    if (error) throw new Error(error.message);
    return data[0];
}

export async function deleteRemoteConfig(id: string) {
    const { error } = await supabase.from('remote_configs').delete().match({ id });

    if (error) throw new Error(error.message);
}

// Generated Configs
export async function getGeneratedConfigs() {
    const { data, error } = await supabase
        .from('generated_configs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as GeneratedConfig[];
}

export async function deleteGeneratedConfig(id: string, filename: string) {
    // 1. Delete from Storage
    const { error: storageError } = await supabase.storage.from('configs').remove([filename]);

    if (storageError) console.error('Storage delete error:', storageError);

    // 2. Delete from DB
    const { error } = await supabase.from('generated_configs').delete().match({ id });

    if (error) throw new Error(error.message);
}

export async function generateAndSaveConfig(params: GenerateConfigParams) {
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
        const res = await fetch(finalUrl, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Subconverter failed: ${res.status} ${text}`);
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
                },
            ])
            .select()
            .single();

        if (dbError) throw new Error(`DB Save failed: ${dbError.message}`);

        return record;
    } catch (e) {
        console.error(e);
        throw new Error(e instanceof Error ? e.message : String(e));
    }
}
