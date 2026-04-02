# Email de redefinição de senha (Gmail + Firebase Functions v2)

Este documento vale para **este app (Treina+)** e serve de **modelo** para outros projetos que usem o mesmo padrão: **callable** + **Admin SDK** (`generatePasswordResetLink`) + **nodemailer** + **Gmail** com **Secret Manager** (não usar `functions.config()` em Functions v2).

---

## Checklist rápido (próximo projeto)

1. **Código:** uma Cloud Function **callable** (v2, ex.: `us-central1`) que:
   - lê `GMAIL_USER` e `GMAIL_PASS` via **`defineSecret`** (`firebase-functions/params`);
   - chama `admin.auth().generatePasswordResetLink(email)`;
   - envia HTML/texto com **nodemailer** (`service: 'gmail'`).
2. **Cliente:** `getFunctions(app, 'us-central1')` + `httpsCallable` com o **mesmo nome** da função e região.
3. **Google:** conta Gmail com **2FA** + **Senha de app** (16 caracteres) — não é a senha normal da conta.
4. **Firebase CLI:** `firebase functions:secrets:set GMAIL_USER` e `GMAIL_PASS` → responder **Y** quando pedir **redeploy** após mudar secret.
5. **Deploy:** `cd functions && npm run build && cd .. && firebase deploy --only functions:NOME_DA_FUNCAO`.
6. **`.firebaserc`:** projeto Firebase ativo (ou `firebase use <projectId>`).

Manter os **mesmos nomes de secrets** (`GMAIL_USER`, `GMAIL_PASS`) entre projetos reduz erro de digitação e documentação; só o **HTML** e o **nome da função** mudam por app.

---

## 1. Senha de app do Gmail

Na conta que for **remetente** (ex.: `seuapp@gmail.com`):

1. [Conta Google](https://myaccount.google.com/) → **Segurança** → **Verificação em duas etapas** (obrigatório).
2. **Senhas de app** — ou direto: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Crie um nome (ex.: `MeuApp Firebase`) e gere a senha de **16 letras**.
4. Copie **sem espaços** (o código pode normalizar, mas evite erro).

**Erro comum:** colocar o **email** no secret `GMAIL_PASS` — o correto é só a **senha de app**. `GMAIL_USER` = email completo; `GMAIL_PASS` = 16 caracteres.

---

## 2. Secrets (Functions v2)

No Firebase **não** há “Editar variáveis” na lista de Functions (v2). Use **Secret Manager**:

Na raiz do projeto (onde está `firebase.json`):

```bash
firebase functions:secrets:set GMAIL_USER
```

Cole o **email** do Gmail.

```bash
firebase functions:secrets:set GMAIL_PASS
```

Cole a **senha de app** (entrada oculta é normal).

Quando o CLI avisar que a função usa **versão antiga** do secret, responda **Y** para **redeploy** — senão o servidor continua com credencial velha.

**Não** commite secrets no repositório.

---

## 3. Deploy da função

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions:sendPasswordResetEmailTreina
```

(Ajuste o nome da função em outros projetos.)

---

## 4. App (cliente)

- `src/services/firebase.config.ts`: `getFunctions(app, 'us-central1')` (ou a região onde a função foi deployada).
- `auth.service.ts`: `httpsCallable(functions, 'sendPasswordResetEmailTreina')` — nome igual ao export da function.

---

## 5. Domínios autorizados (Firebase Auth)

Console → **Build** → **Authentication** → **Settings** → **Authorized domains**: inclua o host do `authDomain` do projeto para o link do reset abrir corretamente.

---

## 6. Spam

Nas primeiras vezes o email pode ir para **Spam**. Gmail como remetente próprio costuma melhorar a entrega em relação ao template padrão do Firebase.

---

## 7. Troubleshooting

| Sintoma | O que verificar |
|--------|------------------|
| `535` / `BadCredentials` / “Gmail recusou o login” | `GMAIL_USER` = email exato da conta; `GMAIL_PASS` = senha de app de **mesma** conta; gerar nova senha de app se necessário. |
| Secret “stale” | Rodar de novo `secrets:set` e **Y** no redeploy, ou `firebase deploy --only functions:...`. |
| Função em região errada | Cliente e função na **mesma região** (ex.: `us-central1`). |
| `functions.config()` indisponível | Esperado em v2 — usar **secrets** + `defineSecret`, não `firebase functions:config:set` para este fluxo. |

---

## 8. Nota histórica: `functions:config`

`firebase functions:config:set gmail.user ...` era **config legada** (v1). Em **Functions v2** o `functions.config()` não está disponível no runtime da mesma forma; o padrão atual é **secrets** (`GMAIL_USER` / `GMAIL_PASS`).

---

## 9. Expo Go e `expo-notifications`

Import estático de `expo-notifications` pode **quebrar** o app no Expo Go (SDK 53+). Neste projeto, `src/services/notifications.service.ts` usa **import dinâmico** e ignora notificações no Expo Go. Para push/local notifications completos, use **development build**.
