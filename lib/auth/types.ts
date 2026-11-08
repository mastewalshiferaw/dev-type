export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  telegram?: string;
  createdAt: string;
  isGuest?: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isConfigured: boolean;
}
