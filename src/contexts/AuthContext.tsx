/**
 * AuthContext – estado global de autenticação
 *
 * Envolve o app e expõe user, loading, signIn, signUp, signOut.
 * Usado pela tela gate (index) para redirecionar e pelas telas (auth) para login/registro.
 */

import {
  changePasswordAfterReauth,
  deleteMyAccount,
  getCurrentUser,
  logout,
  signIn as authSignIn,
  SignInData,
  signUp as authSignUp,
  SignUpData,
} from '@/src/services/auth.service';
import { uploadProfilePhoto as uploadProfilePhotoToStorage } from '@/src/services/profilePhoto.service';
import { User, UserType } from '@/src/types';
import { onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { auth } from '@/src/services/firebase.config';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  setError: (e: string | null) => void;
  signIn: (data: SignInData) => Promise<User>;
  signUp: (data: SignUpData) => Promise<User>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (currentPassword: string) => Promise<void>;
  /** Envia imagem da galeria para Storage e atualiza Firestore + Auth. */
  updateProfilePhoto: (localUri: string) => Promise<void>;
  /** Só em __DEV__: entra como treinador sem Firebase (para usar o app sem configurar o projeto). */
  signInDev?: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);
      if (firebaseUser) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (e: any) {
          setError(e?.message ?? 'Erro ao carregar perfil');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (data: SignInData): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      await authSignIn(data);
      const u = await getCurrentUser();
      if (!u) throw new Error('Perfil não encontrado');
      setUser(u);
      return u;
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao entrar');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (data: SignUpData): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      await authSignUp(data);
      const u = await getCurrentUser();
      if (!u) throw new Error('Perfil não encontrado');
      setUser(u);
      return u;
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao criar conta');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await logout();
      setUser(null);
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao sair');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setError(null);
    await changePasswordAfterReauth(currentPassword, newPassword);
  }, []);

  const updateProfilePhoto = useCallback(async (localUri: string) => {
    setError(null);
    await uploadProfilePhotoToStorage(localUri);
    const u = await getCurrentUser();
    if (u) setUser(u);
  }, []);

  const deleteAccount = useCallback(async (currentPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteMyAccount(currentPassword);
      setUser(null);
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao excluir conta');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInDev = useCallback(() => {
    setError(null);
    const mockUser: User = {
      id: 'dev-coach',
      email: 'dev@coachem.app',
      displayName: 'Treinador (Dev)',
      userType: UserType.COACH,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setUser(mockUser);
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    error,
    setError,
    signIn,
    signUp,
    signOut,
    changePassword,
    deleteAccount,
    updateProfilePhoto,
    ...(__DEV__ ? { signInDev } : {}),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext deve ser usado dentro de AuthProvider');
  }
  return ctx;
}
