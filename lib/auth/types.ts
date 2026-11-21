export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  telegram?: string;
  telegramVerified?: boolean;
  createdAt: string;
  isGuest?: boolean;
  role?: string;
  isAdmin?: boolean;
  emailConfirmedAt?: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isConfigured: boolean;
}
