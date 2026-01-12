import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');

    if (!id || !key) {
        return new NextResponse('Missing ID or Key', { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Verify Token
    const { data: record, error: dbError } = await supabase
        .from('generated_configs')
        .select('*')
        .eq('id', id)
        .single();

    if (dbError || !record) {
        return new NextResponse('Config not found', { status: 404 });
    }

    if (record.token !== key) {
        return new NextResponse('Invalid Key', { status: 403 });
    }

    // 2. Download from Storage
    const { data: fileData, error: storageError } = await supabase.storage
        .from('configs')
        .download(record.filename);

    if (storageError || !fileData) {
        return new NextResponse('File not found in storage', { status: 404 });
    }

    // 3. Return Response
    const text = await fileData.text();

    const headers = new Headers();
    headers.set('Content-Type', 'text/plain; charset=utf-8');

    // Set filename for download if needed, or just let client handle it.
    // Some clients need proper Content-Disposition
    const downloadName = record.name
        ? `${record.name}.${record.target === 'clash' ? 'yaml' : 'txt'}`
        : record.filename;

    // Use UTF-8 filename encoding (RFC 5987)
    const encodedName = encodeURIComponent(downloadName);
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`);

    return new NextResponse(text, {
        status: 200,
        headers,
    });
}
