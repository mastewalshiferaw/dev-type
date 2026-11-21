import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server';
import type { TestimonialStatus } from '@/lib/testimonials';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_STATUSES: TestimonialStatus[] = ['pending', 'approved', 'rejected'];

function getAdminClient(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env['SUPABASE_SERVICE_ROLE_KEY '];
  const serviceRoleKey = rawKey?.trim();
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url) return null;

  if (serviceRoleKey && !serviceRoleKey.startsWith('sb_publishable_')) {
    return createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  if (anonKey && token) {
    return createClient(url, anonKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }

  return null;
}

export async function GET(request: Request) {
  const verification = await requireAdmin(request);
  if ('error' in verification) {
    return NextResponse.json({ error: verification.error }, { status: verification.status });
  }

  const { searchParams } = new URL(request.url);
  const rawFilter = searchParams.get('status') || 'all';
  const statusFilter = ['all', ...VALID_STATUSES].includes(rawFilter) ? rawFilter : 'all';

  const client = getAdminClient(verification.token);
  if (!client) {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  try {
    let query = client
      .from('testimonials')
      .select('id, user_id, username, role, quote, wpm_record, status, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const [allRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
      client.from('testimonials').select('id', { count: 'exact', head: true }),
      client.from('testimonials').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      client.from('testimonials').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      client.from('testimonials').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
    ]);

    const counts = {
      all: allRes.count ?? data?.length ?? 0,
      pending: pendingRes.count ?? 0,
      approved: approvedRes.count ?? 0,
      rejected: rejectedRes.count ?? 0,
    };

    const testimonials = (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.username,
      role: row.role,
      quote: row.quote,
      wpmRecord: row.wpm_record ?? undefined,
      status: row.status as TestimonialStatus,
      isVerified: true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({
      testimonials,
      counts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const verification = await requireAdmin(request);
  if ('error' in verification) {
    return NextResponse.json({ error: verification.error }, { status: verification.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { id, status } = body as { id?: string; status?: TestimonialStatus };

    // Validate ID as strict UUID
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid testimonial ID format' }, { status: 400 });
    }

    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Valid status is required (pending, approved, rejected)' }, { status: 400 });
    }

    const client = getAdminClient(verification.token);
    if (!client) {
      return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
    }

    const { data, error } = await client
      .from('testimonials')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, user_id, username, role, quote, wpm_record, status, created_at, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      testimonial: {
        id: data.id,
        userId: data.user_id,
        name: data.username,
        role: data.role,
        quote: data.quote,
        wpmRecord: data.wpm_record ?? undefined,
        status: data.status,
        isVerified: true,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update testimonial';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const verification = await requireAdmin(request);
  if ('error' in verification) {
    return NextResponse.json({ error: verification.error }, { status: verification.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid testimonial ID format' }, { status: 400 });
    }

    const client = getAdminClient(verification.token);
    if (!client) {
      return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
    }

    const { error } = await client.from('testimonials').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete testimonial';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
