/**
 * Configuração central – variáveis de ambiente
 *
 * Usado pelo Firebase e pelo cliente API. Quando criar a conta empresarial
 * e o DB, preencha o .env (copie de .env.example).
 *
 * Expo: variáveis EXPO_PUBLIC_* estão disponíveis em process.env em build time.
 */

export const ENV = {
  // Firebase (obrigatório para Auth)
  FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',

  // API REST (opcional – usar quando tiver backend próprio além do Firebase)
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL ?? '',
} as const;

/** True se as credenciais mínimas do Firebase estão preenchidas (Auth + Firestore). */
export const isFirebaseConfigured =
  !!ENV.FIREBASE_PROJECT_ID &&
  !!ENV.FIREBASE_API_KEY &&
  ENV.FIREBASE_PROJECT_ID !== 'your-project-id';

/** True se houver URL base para API REST. */
export const isApiConfigured = !!ENV.API_BASE_URL && ENV.API_BASE_URL.length > 0;
