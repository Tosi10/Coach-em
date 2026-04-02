/**
 * useAuth Hook
 *
 * Usa o AuthContext para estado global de autenticação.
 * Login/Register e a tela gate usam o mesmo estado.
 */

import { useAuthContext } from '@/src/contexts/AuthContext';
import { SignInData, SignUpData } from '@/src/services/auth.service';
import { User } from '@/src/types';

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (data: SignInData) => Promise<User>;
  signUp: (data: SignUpData) => Promise<User>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (currentPassword: string) => Promise<void>;
  signInDev?: () => void;
}

export function useAuth(): UseAuthReturn {
  const ctx = useAuthContext();
  return {
    user: ctx.user,
    loading: ctx.loading,
    error: ctx.error,
    signIn: ctx.signIn,
    signUp: ctx.signUp,
    signOut: ctx.signOut,
    changePassword: ctx.changePassword,
    deleteAccount: ctx.deleteAccount,
    signInDev: ctx.signInDev,
  };
}
