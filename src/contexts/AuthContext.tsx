// DashInsight - Auth Context
import { createContext } from 'react';

interface AuthState {
  token: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'client';
    status?: string;
    last_login_at?: string;
  } | null;
  client: {
    id: string;
    user_id: string;
    business_name: string;
    business_type: string;
    owner_name: string;
    phone?: string;
    address?: string;
    status: string;
    active_until?: string;
    created_at: string;
  } | null;
  clientActive: boolean;
  clientExpiredMessage: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);
