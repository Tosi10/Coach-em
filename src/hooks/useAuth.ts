/**
 * useAuth Hook
 * 
 * Hook customizado para gerenciar autenticação no app.
 * 
 * Por que criar um hook?
 * - Encapsula lógica de autenticação
 * - Facilita reutilização em múltiplos componentes
 * - Centraliza estado e efeitos colaterais
 * - Segue padrão React Hooks (similar ao useState, useEffect)
 */

import { getCurrentUser, logout, signIn, SignInData, signUp, SignUpData } from '@/src/services/auth.service';
import { auth } from '@/src/services/firebase.config';
import { User } from '@/src/types';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

/**
 * Interface para o retorno do hook
 * 
 * TypeScript permite definir o formato exato do retorno.
 * Isso garante type safety em todos os componentes que usam o hook.
 */
interface UseAuthReturn {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signIn: (data: SignInData) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Hook de autenticação
 * 
 * Gerencia o estado de autenticação e fornece funções
 * para login, registro e logout.
 * 
 * @returns {UseAuthReturn} Objeto com estado e funções de autenticação
 */
export function useAuth(): UseAuthReturn {
  // Estados locais do hook
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Effect para observar mudanças no estado de autenticação
   * 
   * onAuthStateChanged é um listener do Firebase que dispara
   * sempre que o estado de autenticação muda (login, logout, etc).
   * 
   * O return dentro do useEffect é a função de cleanup,
   * que remove o listener quando o componente desmonta.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      setLoading(true);
      setError(null);

      if (firebaseUser) {
        try {
          // Buscar dados completos do usuário no Firestore
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (err: any) {
          setError(err.message);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    // Cleanup: remove o listener quando o componente desmonta
    return () => unsubscribe();
  }, []);

  /**
   * Função de login
   * 
   * Wrapper da função signIn do service, com tratamento de erro.
   */
  const handleSignIn = async (data: SignInData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const userData = await signIn(data);
      setUser(userData);
    } catch (err: any) {
      setError(err.message);
      throw err; // Re-throw para permitir tratamento no componente
    } finally {
      setLoading(false);
    }
  };

  /**
   * Função de registro
   */
  const handleSignUp = async (data: SignUpData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const userData = await signUp(data);
      setUser(userData);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Função de logout
   */
  const handleSignOut = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await logout();
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    firebaseUser,
    loading,
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
  };
}


