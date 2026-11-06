import { getSupabase } from '@/lib/supabase';
import { TESTIMONIALS as STATIC_TESTIMONIALS } from '@/data/landing/testimonials';

export type TestimonialStatus = 'pending' | 'approved' | 'rejected';

export interface Testimonial {
  id: string;
  userId?: string;
  name: string;
  role: string;
  quote: string;
  wpmRecord?: number;
  status: TestimonialStatus;
  isVerified?: boolean;
  createdAt?: string;
}

export interface TestimonialSubmission {
  quote: string;
  role: string;
  wpmRecord?: number;
}

interface TestimonialRow {
  id: string;
  user_id: string;
  username: string;
  role: string;
  quote: string;
  wpm_record: number | null;
  status: TestimonialStatus;
  created_at: string;
}

export async function getApprovedTestimonials(): Promise<Testimonial[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return STATIC_TESTIMONIALS.map((t, idx) => ({
      id: `static-${idx}`,
      name: t.name,
      role: t.role,
      quote: t.quote,
      status: 'approved' as const,
      isVerified: true,
    }));
  }

  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('id, user_id, username, role, quote, wpm_record, status, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(9);

    if (error || !data || data.length === 0) {
      // Fallback to static maintainer/creator testimonials
      return STATIC_TESTIMONIALS.map((t, idx) => ({
        id: `static-${idx}`,
        name: t.name,
        role: t.role,
        quote: t.quote,
        status: 'approved' as const,
        isVerified: true,
      }));
    }

    const dbTestimonials: Testimonial[] = (data as TestimonialRow[]).map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.username,
      role: row.role,
      quote: row.quote,
      wpmRecord: row.wpm_record ?? undefined,
      status: row.status,
      isVerified: true,
      createdAt: row.created_at,
    }));

    // Merge static maintainer testimonials with approved community testimonials
    const staticItems: Testimonial[] = STATIC_TESTIMONIALS.map((t, idx) => ({
      id: `static-${idx}`,
      name: t.name,
      role: t.role,
      quote: t.quote,
      status: 'approved' as const,
      isVerified: true,
    }));

    return [...dbTestimonials, ...staticItems];
  } catch (err) {
    console.error('Failed to fetch testimonials:', err);
    return STATIC_TESTIMONIALS.map((t, idx) => ({
      id: `static-${idx}`,
      name: t.name,
      role: t.role,
      quote: t.quote,
      status: 'approved' as const,
      isVerified: true,
    }));
  }
}

export async function getUserTestimonial(userId: string): Promise<Testimonial | null> {
  const supabase = getSupabase();
  if (!supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('id, user_id, username, role, quote, wpm_record, status, created_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;

    const row = data as TestimonialRow;
    return {
      id: row.id,
      userId: row.user_id,
      name: row.username,
      role: row.role,
      quote: row.quote,
      wpmRecord: row.wpm_record ?? undefined,
      status: row.status,
      isVerified: true,
      createdAt: row.created_at,
    };
  } catch (err) {
    console.error('Failed to fetch user testimonial:', err);
    return null;
  }
}

export async function submitUserTestimonial(
  userId: string,
  username: string,
  submission: TestimonialSubmission
): Promise<{ error?: string; testimonial?: Testimonial }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Database is not configured' };

  const cleanQuote = submission.quote.trim();
  const cleanRole = submission.role.trim().slice(0, 50) || 'Developer';
  const cleanWpm =
    submission.wpmRecord !== undefined ? Math.max(0, Math.min(400, Math.round(submission.wpmRecord))) : null;

  if (cleanQuote.length < 15) {
    return { error: 'Testimonial must be at least 15 characters long.' };
  }
  if (cleanQuote.length > 280) {
    return { error: 'Testimonial cannot exceed 280 characters.' };
  }

  try {
    const { data, error } = await supabase
      .from('testimonials')
      .upsert(
        {
          user_id: userId,
          username,
          role: cleanRole,
          quote: cleanQuote,
          wpm_record: cleanWpm,
          status: 'pending',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select('id, user_id, username, role, quote, wpm_record, status, created_at')
      .single();

    if (error) {
      console.error('Submit testimonial error:', error.message);
      return { error: error.message };
    }

    const row = data as TestimonialRow;
    return {
      testimonial: {
        id: row.id,
        userId: row.user_id,
        name: row.username,
        role: row.role,
        quote: row.quote,
        wpmRecord: row.wpm_record ?? undefined,
        status: row.status,
        isVerified: true,
        createdAt: row.created_at,
      },
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to submit testimonial' };
  }
}

export async function deleteUserTestimonial(userId: string): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Database is not configured' };

  try {
    const { error } = await supabase.from('testimonials').delete().eq('user_id', userId);
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete testimonial' };
  }
}

export interface AdminTestimonialsResponse {
  testimonials: Testimonial[];
  counts: {
    all: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  hasServiceRoleKey?: boolean;
  warning?: string;
  error?: string;
}

export async function fetchAdminTestimonials(status: string = 'all'): Promise<AdminTestimonialsResponse> {
  const supabase = getSupabase();
  if (!supabase)
    return {
      testimonials: [],
      counts: { all: 0, pending: 0, approved: 0, rejected: 0 },
      error: 'Supabase is not configured',
    };

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return {
        testimonials: [],
        counts: { all: 0, pending: 0, approved: 0, rejected: 0 },
        error: 'Not authenticated',
      };
    }

    const res = await fetch(`/api/admin/testimonials?status=${encodeURIComponent(status)}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        testimonials: [],
        counts: { all: 0, pending: 0, approved: 0, rejected: 0 },
        error: data.error || 'Failed to fetch',
      };
    }

    return data;
  } catch (err) {
    return {
      testimonials: [],
      counts: { all: 0, pending: 0, approved: 0, rejected: 0 },
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

export async function updateAdminTestimonialStatus(
  id: string,
  status: TestimonialStatus
): Promise<{ success?: boolean; testimonial?: Testimonial; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase is not configured' };

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { error: 'Not authenticated' };
    }

    const res = await fetch('/api/admin/testimonials', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ id, status }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || 'Failed to update testimonial status' };
    }

    return { success: true, testimonial: data.testimonial };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update testimonial' };
  }
}

export async function deleteAdminTestimonial(id: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase is not configured' };

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { error: 'Not authenticated' };
    }

    const res = await fetch(`/api/admin/testimonials?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || 'Failed to delete testimonial' };
    }

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete testimonial' };
  }
}
