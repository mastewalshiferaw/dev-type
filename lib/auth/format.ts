import type { User } from '@supabase/supabase-js';
import type { AuthUser } from './types';

export interface ProfileData {
  username?: string;
  avatarUrl?: string;
  telegram?: string;
}

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80';

export function formatSupabaseUser(user: User, profileData?: ProfileData): AuthUser {
  const username =
    profileData?.username ||
    (user.user_metadata?.username as string | undefined) ||
    `coder_${user.id.substring(0, 4)}`;
  const role = (user.app_metadata?.role as string | undefined) || 'user';
  const isAdmin = Boolean(
    user.app_metadata?.role === 'admin' || user.app_metadata?.is_admin === true
  );

  const rawAvatar =
    profileData?.avatarUrl || (user.user_metadata?.avatar_url as string | undefined);
  const avatarUrl = rawAvatar && rawAvatar.trim() ? rawAvatar.trim() : DEFAULT_AVATAR;

  return {
    id: user.id,
    email: user.email ?? '',
    username,
    avatarUrl,
    telegram: profileData?.telegram || (user.user_metadata?.telegram as string | undefined) || undefined,
    telegramVerified: Boolean(user.user_metadata?.telegram_verified),
    createdAt: user.created_at,
    isGuest: false,
    role,
    isAdmin,
    emailConfirmedAt: user.email_confirmed_at ?? null,
  };
}
