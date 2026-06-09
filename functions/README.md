# Cloud Functions – Coach'em

Projeto: **`futeba-96395`** (definido em `.firebaserc` na raiz do app). Região usada pela callable de reset: **`us-central1`**.

---

## `createAthleteByCoach` (descontinuado)

**Não usar.** Responde com erro orientando convite por email ou código no registo do atleta. Substituído por `sendCoachInviteToAthlete`, `acceptCoachInvite`, `linkAthleteToCoachByCode` e `registerAthleteSelf`.

---

## `sendPasswordResetEmailTreina`

Callable **v2** (região `us-central1`): gera link com `admin.auth().generatePasswordResetLink` e envia email HTML (marca Coach'em) via **nodemailer** + **Gmail**.

### Credenciais (Secrets)

Não usar `functions.config()` — usar **Secret Manager**:

| Secret       | Conteúdo |
|-------------|----------|
| `GMAIL_USER` | Email completo do Gmail remetente (ex.: `adm.ecg.19@gmail.com`) |
| `GMAIL_PASS` | Senha de app do Google (16 caracteres), **não** a senha da conta |

```bash
# Na raiz do repositório Coach-em (onde está firebase.json)
firebase functions:secrets:set GMAIL_USER
firebase functions:secrets:set GMAIL_PASS
```

Quando o CLI pedir **redeploy** por secret desatualizado, responda **Y**.

Guia completo e checklist para **replicar em outros projetos**: `../docs/EMAIL_PASSWORD_RESET.md`.

### Deploy

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

Ou só uma função:

```bash
firebase deploy --only functions:sendPasswordResetEmailTreina
```

### Firebase CLI

```bash
firebase login
firebase use futeba-96395   # se ainda não tiver projeto ativo
```

### Próximo projeto (lembrete)

Copiar o mesmo padrão de **secrets** (`GMAIL_USER` / `GMAIL_PASS`), **região** alinhada ao cliente (`getFunctions(app, 'us-central1')`), e o doc `docs/EMAIL_PASSWORD_RESET.md` como base.
