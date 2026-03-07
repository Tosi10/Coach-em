# 🔥 Conexão do Coach'em ao Firebase (Projeto Futeba) – Passo a Passo

Este guia explica como **adicionar o app Coach'em** ao **mesmo projeto Firebase** que já usa o Futeba e o Coworking-app (projeto **futeba** no console). Assim, os três apps compartilham o mesmo **Firestore**, **Authentication** e **Storage**, cada um com seu próprio registro de app.

**Coleções diferenciadas:** para não misturar com os outros projetos, o Coach'em usa o prefixo **`coachem`** em todas as coleções. Ver `docs/COACHEM_FIRESTORE_COLECOES.md`.

---

## ✅ Parte 1 – Agora: só criar o app Web no Firebase

Faça só isso por enquanto; em seguida voltamos para o próximo passo.

1. Abra [Firebase Console](https://console.firebase.google.com/) e selecione o projeto **futeba**.
2. Clique no **ícone de engrenagem** → **Configurações do projeto**.
3. Em **"Seus apps"**, clique em **Adicionar app** e escolha **Web** (ícone `</>`).
4. Apelido do app: **Coach'em** (ou **CoachemApp**).
5. Clique em **Registrar app**.
6. Na tela seguinte, o Firebase mostra o `firebaseConfig`. **Deixe essa tela aberta** (ou copie os valores para um bloco de notas). Você vai precisar de:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId` ← este será **diferente** do Coworking; é o do app Coach'em que você acabou de criar.

Quando terminar, avise e seguimos para a Parte 2 (colocar esses valores no `.env` do Coach'em e testar).

---

## 📋 O que você já tem

- **Projeto no Firebase:** nome **futeba** (no Google Cloud / Firebase Console; o ID do projeto costuma ser algo como **futeba-96395** — o mesmo que o Coworking-app em `C:\NativeReact\coworking-app` usa).
- **Apps já registrados:** pelo menos 2 (ex.: um para Futeba e um para Coworking-app / CooPs).
- **Coach'em:** quer usar o **mesmo** Firestore e Auth, apenas registrando o Coach'em como mais um app no mesmo projeto.

---

## Parte 1 – Adicionar o app Coach'em no Firebase Console

### Passo 1.1 – Abrir o projeto correto

1. Acesse: [Firebase Console](https://console.firebase.google.com/).
2. Faça login na conta Google que criou o projeto.
3. Selecione o projeto **futeba** (o mesmo do Coworking e do outro app).

### Passo 1.2 – Registrar um novo app (Coach'em)

1. No menu lateral, clique no **ícone de engrenagem** ao lado de "Visão geral do projeto" e escolha **Configurações do projeto** (Project Settings).
2. Role até a seção **"Seus apps"** (Your apps).
3. Clique em **"Adicionar app"** (ou no ícone **</>** para Web, ou no ícone Android/iOS, conforme o tipo que você quiser).

**Qual tipo escolher?**

- **Expo / React Native:** para desenvolvimento e testes, o mais simples é **Adicionar app Web** (ícone `</>`). O mesmo projeto (e o mesmo Firestore) funciona para Web, Android e iOS.
- Se no futuro você publicar o Coach'em como app nativo (build EAS/APK), você pode **também** adicionar um app Android (e depois iOS) no mesmo projeto; por enquanto, **só o app Web já resolve** para conectar o código ao Firebase.

4. Ao adicionar:
   - **Web:** informe um apelido, por exemplo: **Coach'em** ou **CoachemApp**.
   - **Android:** use o package name que está no `app.json`: `com.coachem.app`.
5. Clique em **"Registrar app"** (ou equivalente).
6. Na tela seguinte, o Firebase mostra um trecho de código com um objeto `firebaseConfig`. **Não é necessário colar esse código no projeto**; o que importa são os **valores** dentro dele. Anote ou deixe a tela aberta para o próximo passo.

### Passo 1.3 – Copiar as credenciais para o Coach'em

No mesmo projeto (**futeba**), na tela do app que você acabou de registrar (Coach'em):

Você verá algo assim (os valores serão os do seu projeto):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "futeba-xxxxx.firebaseapp.com",
  projectId: "futeba-xxxxx",
  storageBucket: "futeba-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

No Firebase, às vezes o **messagingSenderId** aparece com outro nome (ex.: em "Configuração geral"). Se não aparecer no snippet, pegue em **Project Settings > General** na mesma página.

**Importante:**  
- O **projectId** será o mesmo dos outros apps (futeba).  
- O **appId** será **diferente** para o Coach'em (cada app registrado tem um `appId` próprio).  
- Use sempre as credenciais do **app que você acabou de registrar** (Coach'em).

---

## Parte 2 – Configurar o projeto Coach'em no seu PC

### Passo 2.1 – Arquivo `.env` na raiz do Coach'em

1. Abra a pasta do projeto no disco: `c:\NativeReact\Coach-em`.
2. Copie o arquivo `.env.example` para um novo arquivo chamado **`.env`** (na mesma pasta onde está o `app.json`).
3. Abra o `.env` e preencha com os valores do Firebase (do app Coach'em que você registrou):

```env
# Coach'em – projeto futeba (mesmo DB do Coworking e outro app)
EXPO_PUBLIC_FIREBASE_API_KEY=valor_do_apiKey
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=valor_do_authDomain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=valor_do_projectId
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=valor_do_storageBucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=valor_do_messagingSenderId
EXPO_PUBLIC_FIREBASE_APP_ID=valor_do_appId
```

- **Não use** aspas nos valores.
- **Não deixe** espaços antes/depois do `=`.
- **Não commite** o `.env` no Git (ele já deve estar no `.gitignore`).

### Passo 2.2 – Reiniciar o Metro para carregar o `.env`

As variáveis `EXPO_PUBLIC_*` são lidas em tempo de build. Depois de criar ou alterar o `.env`:

1. Pare o Metro (Ctrl+C no terminal onde está rodando `npx expo start`).
2. Rode de novo, de preferência com cache limpo:

```bash
npx expo start --clear
```

Assim o app passa a usar as credenciais do projeto **futeba** para o app Coach'em.

---

## Parte 3 – Conferir Auth e Firestore no projeto futeba

Como o Coach'em usa o **mesmo** projeto que o Coworking e o outro app, Auth e Firestore já podem estar ativos. Só precisamos garantir.

### Passo 3.1 – Authentication

1. No Firebase Console, projeto **futeba**, vá em **Authentication**.
2. Se ainda não estiver ativo, clique em **"Começar"**.
3. Na aba **"Sign-in method"**, verifique se **E-mail/senha** está **Ativado** (o auth.service do Coach'em usa isso).

### Passo 3.2 – Firestore Database

1. No menu lateral, abra **Firestore Database**.
2. Se o banco já existir (por causa do Coworking ou do outro app), **não crie outro**. O Coach'em usará o mesmo.
3. Se for a primeira vez no projeto, clique em **"Criar banco de dados"**, escolha **modo produção** (ou teste, para desenvolvimento) e uma localização (ex.: `southamerica-east1`).

O Coach'em vai usar coleções nesse mesmo banco. Para não misturar com os outros apps, podemos usar um prefixo ou namespaces por app (isso definimos na implementação das coleções).

---

## Parte 4 – Testar a conexão no Coach'em

### Passo 4.1 – Login/Registro

1. Rode o app: `npx expo start --clear` e abra no dispositivo ou emulador.
2. Na tela de **Login**, use um e-mail/senha que você **já tenha criado** nesse projeto (por exemplo, no Coworking ou no outro app), ou use **Registrar** para criar um usuário novo.
3. Se o login ou o registro funcionar e você entrar nas telas principais, a conexão com o **Firebase Auth** e com o **Firestore** (para o documento do usuário em `users`) está ok.

### Passo 4.2 – Conferir no Console

- Em **Authentication > Users**, deve aparecer o usuário que você usou (ou acabou de criar).
- Em **Firestore > Data**, deve existir a coleção **users** e um documento com o `uid` desse usuário (o `auth.service` do Coach'em cria/atualiza esse documento no registro/login).

---

## Resumo rápido

| Onde | O que fazer |
|------|-------------|
| **Firebase Console** | Projeto **futeba** → Configurações do projeto → Adicionar app (Web) → Registrar "Coach'em" → Copiar `firebaseConfig`. |
| **Coach'em (PC)** | Copiar `.env.example` → `.env` → Colar os 6 valores do Firebase → Salvar. |
| **Terminal** | `npx expo start --clear` e testar login/registro. |
| **Auth/Firestore** | Auth: E-mail/senha ativo. Firestore: usar o mesmo DB do projeto (não criar outro). |

---

## Próximos passos (implementação no código)

### ✅ Já feito
- App Web Coach'em registrado no projeto futeba.
- `.env` configurado; login e registro funcionando.
- Regras do Firestore com `users` e `coachem*` publicadas.

### Por que ainda aparecem treinos e atletas do “usuário antigo”?
- **Treinos, atletas e exercícios** ainda vêm de **dados mockados** (arrays no código) e do **AsyncStorage** (dados salvos no aparelho). Eles **não** dependem do usuário logado, então qualquer conta vê os mesmos dados.
- Para cada usuário ver **só os seus** dados, precisamos **migrar** essas informações para o Firestore nas coleções **`coachem*`**, sempre vinculando ao usuário logado (por exemplo `coachId` ou `userId`).

### Ordem sugerida da migração (por partes)

| Ordem | O quê | AsyncStorage / mock hoje | Coleção Firestore |
|-------|--------|---------------------------|--------------------|
| 1 | Templates de treino | `workout_templates` + mock | `coachemWorkoutTemplates` (com `coachId`) |
| 2 | Treinos atribuídos | `assigned_workouts` | `coachemAssignedWorkouts` (com `coachId`, `athleteId`) |
| 3 | Exercícios | `saved_exercises` + mock | `coachemExercises` (com `createdBy`) |
| 4 | Atletas | Lista mockada fixa | `coachemUsers` com `userType: ATHLETE` e vínculo ao treinador, ou lista em documento do coach |
| 5 | Histórico de peso | `exercise_weight_history` | `coachemExerciseWeightHistory` |

Cada etapa pode ser feita uma de cada vez: criar um serviço (ou funções) que leem/escrevem no Firestore, trocar as telas para usar esse serviço em vez de AsyncStorage/mock e testar.

---

### ✅ Etapa 1 (Templates de treino) – IMPLEMENTADO

- **Serviço:** `src/services/workoutTemplates.service.ts` — funções `listWorkoutTemplatesByCoachId`, `getWorkoutTemplateById`, `createWorkoutTemplate`, `updateWorkoutTemplate`, `deleteWorkoutTemplate`. Coleção Firestore: **`coachemWorkoutTemplates`**, com campo **`coachId`** em todo documento.
- **Telas que passaram a usar Firestore:**
  - **Criar treino** (`create-workout.tsx`): salva em Firestore com `coachId` do usuário logado.
  - **Biblioteca de treinos** (`workouts-library.tsx`): lista só os templates do treinador logado (sem mock).
  - **Editar treino** (`edit-workout.tsx`): carrega e atualiza no Firestore.
  - **Detalhes do template** (`workout-template-details.tsx`): carrega e deleta no Firestore.
  - **Atribuir treino** (`assign-workout.tsx`): lista templates do treinador no Firestore.
  - **Detalhes do treino (atleta)** (`workout-details.tsx`): busca o template pelo ID no Firestore (com fallback em mock/AsyncStorage para treinos antigos).
- **Comportamento:** Com um usuário novo logado, a biblioteca de treinos começa vazia; ao criar um treino, ele aparece só para esse usuário.

---

## Sobre o projeto Coworking-app (C:\NativeReact\coworking-app)

O **coworking-app** está em **`C:\NativeReact\coworking-app`** e já está conectado ao mesmo projeto Firebase (**futeba**). Para o Coach'em seguir o mesmo padrão:

- No Firebase, cada app (Futeba, Coworking, Coach'em) tem seu próprio registro em **"Seus apps"**, com **appId** diferente.
- **projectId**, **apiKey**, **authDomain**, **storageBucket** e **messagingSenderId** são os mesmos (projeto único).
- No Coworking-app, o `.env.example` usa as mesmas 6 variáveis `EXPO_PUBLIC_FIREBASE_*`. O **appId** do Coworking é o do app "CooPs" registrado no projeto. Para o Coach'em, use o **appId** do app que você registrar como "Coach'em" no passo 1.2.

**Firestore – prefixo por app:**  
O Coworking usa o prefixo **`coops`** em todas as coleções (`coopsUsers`, `coopsRooms`, `coopsBookings`, etc.) para não misturar com Futeba. No Coach'em, o ideal é usar um prefixo próprio, por exemplo **`coachem`** (ex.: `coachemUsers`, `coachemExercises`, `coachemWorkoutTemplates`, `coachemAssignedWorkouts`). Assim os três apps coexistem no mesmo Firestore sem conflito.
