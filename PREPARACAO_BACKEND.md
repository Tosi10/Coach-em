# Preparação para o Backend – Treina+

**Projeto Firebase ativo:** **futeba-96395** (db futeba). O app e as Cloud Functions devem usar este projeto.

Este documento descreve o que deixamos pronto para quando você criar a conta empresarial e o banco de dados. Assim que tiver o projeto e o DB, basta configurar as variáveis e conectar.

---

## 1. O que já está preparado no app

| Item | Onde está | Uso |
|------|------------|-----|
| **Variáveis de ambiente** | `.env.example` | Copie para `.env` e preencha com as credenciais do Firebase (e opcionalmente a URL da API). |
| **Config central** | `src/config/env.ts` | Lê `EXPO_PUBLIC_*` e exporta `ENV`, `isFirebaseConfigured`, `isApiConfigured`. |
| **Firebase** | `src/services/firebase.config.ts` + `auth.service.ts` | Auth (login/signup) e Firestore já preparados; só falta preencher o `.env`. |
| **Cliente API REST** | `src/services/api.client.ts` | `get()`, `post()`, `put()`, `patch()`, `del()`, `getAuthToken()` (Firebase idToken). Use quando tiver um backend próprio. |
| **Auth global** | `src/contexts/AuthContext.tsx` + gate em `app/index.tsx` | Entrada do app: não logado → login; logado → (tabs). Sincroniza `userType` e `currentAthleteId` no AsyncStorage. |

---

## 2. Checklist quando criar a conta e o DB

### 2.1 Firebase (Auth + Firestore)

1. Criar projeto no [Firebase Console](https://console.firebase.google.com/) (conta Google).
2. Ativar **Authentication** (Email/Password).
3. Criar **Firestore Database** (modo produção ou teste).
4. Em **Project Settings** > **General** > **Your apps**, pegar as credenciais do app (Web ou Android/iOS conforme o que usar).
5. Copiar `.env.example` para `.env` e preencher:
   - `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
   - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `EXPO_PUBLIC_FIREBASE_APP_ID`
6. Reiniciar o Metro (`npx expo start --clear`) para carregar o novo `.env`.

### 2.2 Regras do Firestore (exemplo mínimo)

- Coleção `users`: ler/escrever apenas se `request.auth != null` e (por exemplo) o documento for do próprio usuário.
- Ajustar depois para treinador poder criar/ler atletas conforme suas regras de negócio.

### 2.3 API REST (opcional)

Se no futuro você tiver um backend próprio (Node, Supabase, etc.):

1. Definir a URL base (ex: `https://sua-api.com/v1`).
2. Adicionar no `.env`: `EXPO_PUBLIC_API_URL=https://sua-api.com/v1`.
3. Nas telas que hoje usam AsyncStorage para treinos/atletas, passar a chamar `api.client.ts` (ex: `get('/workouts')`, `post('/workouts', body)`).
4. O cliente já envia o token (Firebase idToken) via `getAuthToken()` no header `Authorization: Bearer ...`.

---

## 3. O que conectar quando o DB estiver pronto

| Dado atual (local) | Onde é usado | Quando tiver backend |
|--------------------|--------------|------------------------|
| Auth (login/signup) | Firebase Auth já integrado | Só configurar `.env` com o projeto Firebase. |
| Perfil do usuário (userType, etc.) | Firestore `users` em `auth.service.ts` | Já usa Firestore; conferir regras e estrutura. |
| Treinos (templates) | AsyncStorage + telas do treinador | Trocar leitura/escrita por chamadas à API ou Firestore. |
| Treinos atribuídos | AsyncStorage `assigned_workouts` | Idem: API ou Firestore. |
| Exercícios | AsyncStorage + telas | Idem. |
| Lista de atletas do treinador | Mock/AsyncStorage | Substituir por lista vinda do backend (ex: `users` onde `coachId === currentUser.id`). |

---

## 4. Resumo

- **Agora:** App abre no login; auth e gate estão prontos; Firebase e API estão preparados via config e cliente.
- **Quando criar o projeto:** Preencher `.env` com as credenciais do Firebase e reiniciar o Metro.
- **Quando tiver o DB/API:** Trocar gradualmente cada uso de AsyncStorage por Firestore ou chamadas em `api.client.ts`, mantendo os mesmos tipos e fluxos de tela.

Se quiser, no próximo passo podemos definir juntos a estrutura das coleções do Firestore (ex: `users`, `workouts`, `assigned_workouts`) e as regras de segurança.
