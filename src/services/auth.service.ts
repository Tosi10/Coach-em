/**
 * Authentication Service
 *
 * Centraliza todas as operações de autenticação do Firebase Auth.
 */

import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, functions } from './firebase.config';
import { User, UserType, Coach, Athlete } from '@/src/types';
import { FirebaseError } from 'firebase/app';

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
  userType: UserType;
  bio?: string;
  specialization?: string;
  dateOfBirth?: Date | string;
  sport?: string;
}

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
    'auth/weak-password': 'A senha é muito fraca.',
    'auth/requires-recent-login': 'Por segurança, saia e entre de novo antes de continuar.',
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
    photoURL: userData.photoURL ?? firebaseUser.photoURL ?? undefined,
    createdAt: userData.createdAt?.toDate?.() || new Date(),
    updatedAt: userData.updatedAt?.toDate?.() || new Date(),
  } as User;
}

async function ensureProfileForExistingAuthUser(firebaseUser: FirebaseUser): Promise<User> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const now = serverTimestamp() as any;

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

export async function signUp(data: SignUpData): Promise<User> {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const firebaseUser: FirebaseUser = userCredential.user;

    await updateProfile(firebaseUser, {
      displayName: data.displayName,
    });

    const userData: Omit<User, 'id'> = {
      email: data.email,
      displayName: data.displayName,
      userType: data.userType,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    if (data.userType === UserType.COACH) {
      (userData as Omit<Coach, 'id'>).bio = data.bio;
      (userData as Omit<Coach, 'id'>).specialization = data.specialization;
      (userData as Omit<Coach, 'id'>).athletes = [];
    } else if (data.userType === UserType.ATHLETE) {
      (userData as Omit<Athlete, 'id'>).dateOfBirth = data.dateOfBirth;
      (userData as Omit<Athlete, 'id'>).sport = data.sport;
    }

    const userRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userRef, userData);

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

export async function signIn(data: SignInData): Promise<User> {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const firebaseUser: FirebaseUser = userCredential.user;

    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (!userDoc.exists()) {
      return await ensureProfileForExistingAuthUser(firebaseUser);
    }

    return toAppUser(firebaseUser, userDoc.data());
  } catch (error: unknown) {
    throw formatAuthError(error, 'Erro ao fazer login');
  }
}

export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: unknown) {
    throw formatAuthError(error, 'Erro ao fazer logout');
  }
}

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

/**
 * Redefinição de senha: Cloud Function envia email HTML (Gmail) com link do Admin SDK.
 */
export async function sendPasswordResetEmailTo(email: string): Promise<void> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    throw new Error('Informe o email.');
  }
  try {
    const sendReset = httpsCallable<{ email: string }, { ok: boolean }>(
      functions,
      'sendPasswordResetEmailTreina'
    );
    await sendReset({ email: trimmed });
  } catch (error: unknown) {
    if (error instanceof FirebaseError && error.code.startsWith('functions/')) {
      throw new Error(error.message || 'Erro ao enviar email de recuperação.');
    }
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('failed-precondition') || msg.includes('não configurado')) {
      throw new Error(
        'Envio de email ainda não está configurado no servidor. Publique a Cloud Function e configure os secrets GMAIL_USER e GMAIL_PASS (veja docs/EMAIL_PASSWORD_RESET.md).'
      );
    }
    throw formatAuthError(error, 'Erro ao enviar email de recuperação');
  }
}

export async function changePasswordAfterReauth(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 6) {
    throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
  }
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('Sessão inválida. Faça login novamente.');
  }
  try {
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPassword);
  } catch (error: unknown) {
    throw formatAuthError(error, 'Erro ao alterar senha');
  }
}

export async function deleteMyAccount(currentPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('Sessão inválida. Faça login novamente.');
  }
  try {
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    const uid = user.uid;
    await deleteDoc(doc(db, 'users', uid));
    const athleteRef = doc(db, 'coachemAthletes', uid);
    const athleteSnap = await getDoc(athleteRef);
    if (athleteSnap.exists()) {
      await deleteDoc(athleteRef);
    }
    await deleteUser(user);
  } catch (error: unknown) {
    throw formatAuthError(error, 'Erro ao excluir conta');
  }
}
