/**
 * Authentication Service
 * 
 * Centraliza todas as operações de autenticação do Firebase Auth.
 * 
 * Por que criar um service separado?
 * - Separação de responsabilidades (SOLID)
 * - Facilita testes unitários
 * - Reutilização em múltiplos componentes
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase.config';
import { User, UserType, Coach, Athlete } from '@/src/types';
import { FirebaseError } from 'firebase/app';

/**
 * Interface para dados de registro
 * 
 * Separamos os dados de autenticação (email, password) dos dados
 * do perfil (displayName, userType). Isso segue o princípio de
 * responsabilidade única.
 */
export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
  userType: UserType;
  // Campos opcionais específicos por tipo
  bio?: string; // Para COACH
  specialization?: string; // Para COACH
  dateOfBirth?: Date | string; // Para ATHLETE
  sport?: string; // Para ATHLETE
}

/**
 * Interface para dados de login
 */
export interface SignInData {
  email: string;
  password: string;
}

function formatAuthError(error: unknown, fallbackPrefix: string): Error {
  if (!(error instanceof FirebaseError)) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Error(`${fallbackPrefix}: ${msg}`);
  }

  const map: Record<string, string> = {
    'auth/invalid-credential': 'Email ou senha inválidos.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-email': 'Email inválido.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
    'auth/network-request-failed': 'Falha de rede. Verifique sua conexão.',
    'permission-denied': 'Sem permissão para acessar os dados do perfil.',
  };

  const friendly = map[error.code] ?? error.message;
  return new Error(`${fallbackPrefix}: ${friendly}`);
}

function toAppUser(firebaseUser: FirebaseUser, userData: any): User {
  return {
    id: firebaseUser.uid,
    ...userData,
    createdAt: userData.createdAt?.toDate?.() || new Date(),
    updatedAt: userData.updatedAt?.toDate?.() || new Date(),
  } as User;
}

async function ensureProfileForExistingAuthUser(firebaseUser: FirebaseUser): Promise<User> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const now = serverTimestamp() as any;

  // Perfil mínimo para não bloquear login em APK quando Auth existe e o doc não foi criado.
  // userType padrão como ATHLETE para reduzir privilégios por padrão.
  const fallbackProfile: Omit<Athlete, 'id'> = {
    email: firebaseUser.email ?? '',
    displayName: firebaseUser.displayName ?? 'Usuário',
    userType: UserType.ATHLETE,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(userRef, fallbackProfile, { merge: true });
  const createdDoc = await getDoc(userRef);
  if (!createdDoc.exists()) {
    throw new Error('Não foi possível criar o perfil do usuário.');
  }
  return toAppUser(firebaseUser, createdDoc.data());
}

/**
 * Cria um novo usuário no Firebase Auth e no Firestore
 * 
 * Fluxo:
 * 1. Cria conta no Firebase Auth
 * 2. Atualiza o perfil com displayName
 * 3. Cria documento no Firestore com dados adicionais
 * 
 * Por que usar Promise<User>?
 * - TypeScript garante que retornamos um User tipado
 * - Facilita o uso em componentes com type safety
 */
export async function signUp(data: SignUpData): Promise<User> {
  try {
    // 1. Criar usuário no Firebase Auth
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const firebaseUser: FirebaseUser = userCredential.user;

    // 2. Atualizar perfil com displayName
    await updateProfile(firebaseUser, {
      displayName: data.displayName,
    });

    // 3. Preparar dados do perfil para Firestore
    const userData: Omit<User, 'id'> = {
      email: data.email,
      displayName: data.displayName,
      userType: data.userType,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    // 4. Adicionar campos específicos por tipo
    if (data.userType === UserType.COACH) {
      (userData as Omit<Coach, 'id'>).bio = data.bio;
      (userData as Omit<Coach, 'id'>).specialization = data.specialization;
      (userData as Omit<Coach, 'id'>).athletes = [];
    } else if (data.userType === UserType.ATHLETE) {
      (userData as Omit<Athlete, 'id'>).dateOfBirth = data.dateOfBirth;
      (userData as Omit<Athlete, 'id'>).sport = data.sport;
    }

    // 5. Criar documento no Firestore
    const userRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userRef, userData);

    // 6. Retornar usuário tipado
    return {
      id: firebaseUser.uid,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
  } catch (error: unknown) {
    throw formatAuthError(error, 'Erro ao criar conta');
  }
}

/**
 * Faz login de um usuário existente
 * 
 * Retorna o usuário do Firestore (não apenas do Auth) para ter
 * acesso a todos os dados do perfil.
 */
export async function signIn(data: SignInData): Promise<User> {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const firebaseUser: FirebaseUser = userCredential.user;

    // Buscar dados completos do Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      return await ensureProfileForExistingAuthUser(firebaseUser);
    }

    return toAppUser(firebaseUser, userDoc.data());
  } catch (error: unknown) {
    throw formatAuthError(error, 'Erro ao fazer login');
  }
}

/**
 * Faz logout do usuário atual
 */
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: unknown) {
    throw formatAuthError(error, 'Erro ao fazer logout');
  }
}

/**
 * Busca o usuário atual do Firestore
 * 
 * Útil para atualizar o estado do usuário após login
 * ou verificar dados atualizados.
 */
export async function getCurrentUser(): Promise<User | null> {
  const firebaseUser = auth.currentUser;
  
  if (!firebaseUser) {
    return null;
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      return null;
    }

    return toAppUser(firebaseUser, userDoc.data());
  } catch (error: unknown) {
    throw formatAuthError(error, 'Erro ao buscar usuário');
  }
}




