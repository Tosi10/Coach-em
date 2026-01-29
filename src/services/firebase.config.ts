/**
 * Firebase Configuration
 * 
 * Este arquivo centraliza a configuração do Firebase.
 * 
 * IMPORTANTE: Você precisará criar um projeto no Firebase Console
 * e adicionar as credenciais aqui. Por segurança, considere usar
 * variáveis de ambiente (expo-constants) em produção.
 */

import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

/**
 * Configuração do Firebase
 * 
 * Substitua estes valores pelas credenciais do seu projeto Firebase.
 * Você encontra essas informações no Firebase Console > Project Settings > General.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "your-app-id",
};

/**
 * Inicializa o Firebase App
 * 
 * getApps() verifica se já existe uma instância inicializada.
 * Isso previne múltiplas inicializações (comum em hot-reload do Expo).
 */
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

/**
 * Serviços do Firebase
 * 
 * Exportamos instâncias singleton dos serviços principais:
 * - Auth: Autenticação de usuários com persistência AsyncStorage
 * - Firestore: Banco de dados NoSQL
 * - Storage: Armazenamento de arquivos (vídeos, imagens)
 */
// Inicializar Auth com persistência AsyncStorage para React Native
let auth: Auth;
try {
  // Tentar obter instância existente ou criar nova com persistência
  auth = getAuth(app);
  // Se já existe, não precisa fazer nada
} catch {
  // Se não existe, inicializar com persistência AsyncStorage
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
}

export { auth };
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

export default app;


