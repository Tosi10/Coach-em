/**
 * Cliente API – chamadas REST para o backend
 *
 * Quando criar o DB e a API, preencha EXPO_PUBLIC_API_URL no .env.
 * Use getAuthToken() para enviar o token (ex: Firebase ID token) no header.
 */

import { ENV, isApiConfigured } from '@/src/config/env';

const BASE_URL = ENV.API_BASE_URL.replace(/\/$/, '');

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestOptions {
  method?: RequestMethod;
  body?: object;
  headers?: Record<string, string>;
  /** Token de autenticação (ex: Firebase idToken). Se não passar, getAuthToken() pode ser usado. */
  token?: string | null;
}

/**
 * Retorna o token de autenticação atual (ex: idToken do Firebase).
 * Quando conectar o backend, implementar aqui: auth.currentUser?.getIdToken().
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const { auth } = await import('@/src/services/firebase.config');
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

/**
 * Faz uma requisição à API. Só envia se EXPO_PUBLIC_API_URL estiver configurado.
 */
export async function request<T = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  if (!isApiConfigured) {
    throw new Error('API não configurada. Defina EXPO_PUBLIC_API_URL no .env');
  }

  const { method = 'GET', body, headers = {}, token } = options;
  const url = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const authToken = token ?? (await getAuthToken());
  if (authToken) {
    requestHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body != null && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(url, config);

  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const json = JSON.parse(text);
      message = json.message ?? json.error ?? text;
    } catch {}
    throw new Error(message || `HTTP ${res.status}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

/** GET */
export function get<T = unknown>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
  return request<T>(path, { ...options, method: 'GET' });
}

/** POST */
export function post<T = unknown>(path: string, body?: object, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
  return request<T>(path, { ...options, method: 'POST', body });
}

/** PUT */
export function put<T = unknown>(path: string, body?: object, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
  return request<T>(path, { ...options, method: 'PUT', body });
}

/** PATCH */
export function patch<T = unknown>(path: string, body?: object, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
  return request<T>(path, { ...options, method: 'PATCH', body });
}

/** DELETE */
export function del<T = unknown>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
  return request<T>(path, { ...options, method: 'DELETE' });
}
