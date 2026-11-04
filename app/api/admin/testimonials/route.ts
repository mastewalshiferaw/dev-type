import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isUserAdmin } from '@/lib/auth/admin';
import type { TestimonialStatus } from '@/lib/testimonials';

function getAdminClient(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) return null;

  // Prefer service role key if configured (bypasses RLS safely on server)
  if (serviceRoleKey) {
    return createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  // Fallback to authenticated user client with Bearer token
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

  if (anonKey) {
    return createClient(url, anonKey, { auth: { persistSession: false } });
  }

  return null;
}

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    return { error: 'Database is not configured', status: 500 };
  }

  if (!token) {
    return { error: 'Missing authorization header', status: 401 };
  }

  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);

  if (error || !user) {
    return { error: 'Invalid or expired session', status: 401 };
  }

  const authUser = {
    id: user.id,
    email: user.email ?? '',
    username: (user.user_metadata?.username as string) || `user_${user.id.slice(0, 4)}`,
    createdAt: user.created_at,
    isGuest: false,
  };

  if (!isUserAdmin(authUser)) {
    return { error: 'Forbidden: Admin access required', status: 403 };
  }

  return { user: authUser, token };
}

export async function GET(request: Request) {
  const verification = await verifyAdmin(request);
  if ('error' in verification) {
    return NextResponse.json({ error: verification.error }, { status: verification.status });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status') || 'all';

  const client = getAdminClient(verification.token);
  if (!client) {
    return NextResponse.json({ error: 'Failed to initialize database client' }, { status: 500 });
  }

  try {
    let query = client
      .from('testimonials')
      .select('id, user_id, username, role, quote, wpm_record, status, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Also get quick status counts for admin tabs
    const { data: countData } = await client.from('testimonials').select('status');

    const counts = {
      all: countData?.length || 0,
      pending: countData?.filter((r) => r.status === 'pending').length || 0,
      approved: countData?.filter((r) => r.status === 'approved').length || 0,
      rejected: countData?.filter((r) => r.status === 'rejected').length || 0,
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

    return NextResponse.json({ testimonials, counts });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const verification = await verifyAdmin(request);
  if ('error' in verification) {
    return NextResponse.json({ error: verification.error }, { status: verification.status });
  }

  try {
    const body = await request.json();
    const { id, status } = body as { id?: string; status?: TestimonialStatus };

    if (!id || !status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Valid id and status are required' }, { status: 400 });
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
  const verification = await verifyAdmin(request);
  if ('error' in verification) {
    return NextResponse.json({ error: verification.error }, { status: verification.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing testimonial id' }, { status: 400 });
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
