# Treina+ — gestão de performance esportiva

App **React Native (Expo)** para treinadores gerenciarem atletas, treinos e acompanhamento. Stack: **Expo Router**, **TypeScript**, **NativeWind**, **Firebase** (Auth, Firestore, Storage), **EAS Build** para Android e iOS.

---

## Última atualização (o que foi feito)

Resumo do estado recente do código (inclui commit em `main` com coach card, sync e UI):

| Tema | Detalhe |
|------|---------|
| **Home do atleta** | Card do treinador com **foto**, **nome exibido** e **mensagem** definidos no Perfil do treinador. Leitura em **`coachemAthletes`** (e fallback nos treinos atribuídos). **Não** gravamos isso em `users/{atleta}`: as [regras Firestore](docs/firestore.rules.coachem.production.rules) só permitem o próprio usuário atualizar o próprio `users/{uid}`. |
| **Perfil do treinador** | Campos *nome para atletas*, *mensagem para atletas*, upload de foto; salvamento com **`syncCoachPublicProfileToAthletes`** espelhando em atletas e treinos. Confirmação com **CustomAlert** (não `Alert` nativo). |
| **Abas** | Espaçamento superior (safe area + 20px) alinhado entre Home / Treinos / Perfil; header nativo oculto na aba Treinos; ícone **Atletas** ~10% menor na tab bar. |
| **Loja / jurídico** | Textos em `DOCUMENTACAO_LOJAS.md`, `DESCRICAO_LONGA.md`, `POLITICA_PRIVACIDADE.md`, `TERMOS_DE_USO.md`; páginas estáticas em `hosting/legal/` e `public/` para deploy no **Firebase Hosting** (guia em `hosting/legal/GUIA_DEPLOY_FIREBASE_HOSTING.md`). |
| **Conta** | Fluxo de atleta **bloqueado** pelo treinador, onboarding/tips, suporte Vision10 no perfil do treinador, etc. (ver histórico de commits). |

---

## Próximos passos (continuação)

Sugestão de ordem para **lançamento** e evolução:

1. **Build em loja** — Concluir `eas build` (iOS/Android) com variáveis `EXPO_PUBLIC_FIREBASE_*` no Expo; **`eas submit`** ou submit automático para TestFlight / Play Console.
2. **Testes na loja** — Instalar build de produção, login treinador + atleta, card do treinador na Home, bloqueio, treinos, perfil e links jurídicos.
3. **Firebase Hosting** — Se ainda não deployou: `firebase deploy --only hosting` para URLs públicas de privacidade/termos baterem com o app.
4. **Opcional pós-MVP** — Polir texto longo no card do treinador (ellipsis / “ver mais”), migrar `expo-av` quando subir SDK, revisar peso dos PNGs, regras de negócio se treinador excluir conta.

---

## O que o app faz (visão geral)

| Área | Descrição |
|------|-----------|
| **Autenticação** | Login e registro de **treinador**; atletas recebem conta pelo fluxo **Adicionar atleta** (email + senha provisória via Cloud Function). |
| **Senha** | **Esqueci minha senha** → Cloud Function `sendPasswordResetEmailTreina` envia email HTML (Gmail/nodemailer) com link gerado pelo Admin SDK. **Alterar senha** e **Excluir conta** no Perfil. Ver `docs/EMAIL_PASSWORD_RESET.md`. |
| **Sessão** | Firebase Auth com persistência em **AsyncStorage** (`src/services/firebase.config.ts`). |
| **UI** | Tema claro/escuro, abas com ícones PNG (Home, Treinos/Atletas, Perfil), assets críticos pré-carregados no boot (`app/_layout.tsx`). |
| **Treinos** | Atribuição, detalhes, biblioteca de exercícios, calendário do treinador, etc. |

---

## Estrutura principal

```
Treina+ (pasta do repositório: Coach-em)/
├── app/
│   ├── (auth)/          # login, registro (só treinador)
│   ├── (tabs)/          # Home, Treinos/Atletas, Perfil
│   ├── athlete-profile.tsx
│   └── _layout.tsx      # splash, fontes, preload de imagens
├── components/
├── src/
│   ├── contexts/        # Auth, Theme
│   ├── services/        # auth, firebase, athletes, workouts…
│   └── types/
├── functions/           # Cloud Functions (ex.: criar atleta com login)
├── assets/images/
└── app.json             # ex.: android.softwareKeyboardLayoutMode: resize
```

---

## Como rodar

```bash
npm install
npx expo start
```

- Cache limpo: `npx expo start -c`
- Build Android (EAS): `eas build -p android --profile preview` (ou `production` conforme `eas.json`)

### Variáveis de ambiente

**Local:** criar `.env` na raiz com as chaves `EXPO_PUBLIC_FIREBASE_*` (ver `src/services/firebase.config.ts`). O `.env` **não** vai para o Git.

**EAS Build (obrigatório para `eas build`):** as mesmas variáveis devem estar no **Expo Dashboard** do projeto → **Environment variables** (ou `eas env:create`), para os ambientes **preview** / **production**. **Não** coloque chaves Firebase dentro de `eas.json` no repositório — o GitHub alerta e o histórico público fica exposto.

Se uma chave já foi commitada: no [Google Cloud Console](https://console.cloud.google.com/) → APIs e serviços → Credenciais → restrinja a API key (ex.: só APIs do Firebase, ou apps Android com pacote + SHA-256) ou crie outra chave e atualize o Firebase + variáveis no Expo.

---

## Conta e segurança (implementado)

1. **Recuperação de senha** — O app chama a callable **`sendPasswordResetEmailTreina`** (Functions **v2**, `us-central1`), que gera o link com `generatePasswordResetLink` e envia email HTML (Treina+) via **Gmail** (nodemailer). Credenciais no **Secret Manager**: **`GMAIL_USER`** (email) e **`GMAIL_PASS`** (senha de app de 16 caracteres — não a senha normal do Gmail). **Não** usar `firebase functions:config:set` para isso. Passo a passo, troubleshooting e **modelo para outros projetos**: **`docs/EMAIL_PASSWORD_RESET.md`**.

2. **Trocar senha logado** — **Perfil → Segurança → Alterar senha**: reautentica com a senha atual e atualiza via `updatePassword`.

3. **Excluir conta** — **Perfil → Excluir conta**: após confirmação, pede a senha atual; remove documento `users/{uid}`, `coachemAthletes/{uid}` se existir, e a conta no Auth (`deleteUser`).  
   - **Firestore:** é preciso que as regras permitam ao usuário **deletar** o próprio documento em `users/{uid}` (e `coachemAthletes/{uid}` se aplicável). Se a exclusão do Firestore falhar, o app mostra erro e **não** remove só o Auth de forma inconsistente após o passo de reautenticação — ajuste as regras conforme seu projeto.

---

## Cadastro de atleta (treinador)

O treinador cadastra atleta em **Adicionar atleta** com nome, email e **senha provisória**. A Cloud Function `createAthleteByCoach` cria o usuário no Auth e os documentos necessários. Recomenda-se que o atleta **troque a senha** após o primeiro acesso (fluxo acima).

---

## Melhorias recomendadas (fora deste README)

- **Imagens:** reduzir peso dos PNGs grandes (ícones e cards) para performance em APK/AAB.
- **Treinador que exclui conta:** avaliar o que fazer com atletas e dados vinculados (regra de negócio / função agendada).

---

## Documentação extra no repositório

- **`docs/EMAIL_PASSWORD_RESET.md`** — Gmail + secrets + deploy da função de reset; **checklist** para replicar o mesmo padrão em projetos futuros (mesmo estilo de configuração).
- **`docs/firestore.rules.coachem.production.rules`** — regras de referência (Auth/`users`/`coachemAthletes`/treinos).
- **`DOCUMENTACAO_LOJAS.md`**, **`DESCRICAO_LONGA.md`**, **`POLITICA_PRIVACIDADE.md`**, **`TERMOS_DE_USO.md`** — textos para lojas e jurídico.
- **`hosting/legal/`** — HTML + guia de deploy Firebase Hosting para páginas públicas de privacidade/termos.
- `CONTEXTO_PROJETO.md`, `GUIA_COMPLETO.md`, `SETUP.md` (quando existirem) — contexto e Firebase.
- **`functions/README.md`** — deploy das Cloud Functions e referência aos secrets.

---

## Repositório

https://github.com/Tosi10/Coach-em.git

**Status:** em desenvolvimento ativo — MVP e evolução contínua.
