import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return new NextResponse('Missing ID', { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('content')
    .eq('id', id)
    .single();

  if (error || !data) {
    return new NextResponse('Not Found', { status: 404 });
  }

  if (!data.content) {
    return new NextResponse('No Content', { status: 404 });
  }

  // Return as plain text
  return new NextResponse(data.content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
