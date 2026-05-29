# Coach'em — gestão de performance esportiva

App **React Native (Expo)** para treinadores gerenciarem atletas, treinos e acompanhamento. Stack: **Expo Router**, **TypeScript**, **NativeWind**, **Firebase** (Auth, Firestore, Storage), **EAS Build** para Android e iOS.

---

## Última atualização (estado atual)

Resumo consolidado do estado atual em `main`:

### Atualização detalhada — 2026-05-04 (i18n + UX + monetização)

Esta rodada focou em deixar o app pronto para release internacional (PT/EN), mantendo regras de negócio e banco intactos.

| Tema | O que foi feito |
|------|------------------|
| **Tradução UI (PT/EN)** | Migração extensa de strings hardcoded para `react-i18next` (`t(...)`) em telas críticas de treinador e atleta. Inclui criação/edição de treino e exercício, perfil do atleta, calendário, home, detalhes de treino/template e fluxos auxiliares. |
| **Arquivos de locale** | Expansão consistente de `src/i18n/locales/pt-BR.ts` e `src/i18n/locales/en.ts` com novos namespaces/chaves: `addAthlete`, `createWorkout`, `createExercise`, `editWorkout`, `editExercise`, `editAssignedWorkout`, `athleteProfile`, `workoutDetails` e complementos em `common`, `workoutsLibrary`, etc. |
| **Correção de blocos não traduzidos** | Correção no componente compartilhado `src/components/WorkoutDetails.tsx`: nomes de bloco e labels (aquecimento/principal/finalização, séries, reps, duração, descanso, vazio) passaram a respeitar idioma atual. |
| **Perfil (UX refinada)** | Reorganização do `app/(tabs)/profile.tsx`: idioma e aparência integrados no mesmo card; seletor de idioma em formato segmentado compacto; toggle de tema reduzido e com largura compacta real. |
| **Theme toggle** | Ajustes no `components/ThemeToggle.tsx`: dimensões menores (trilho/bolinha/ícone), melhor proporção visual e `alignSelf: 'flex-start'` para evitar largura total. |
| **Tutorial de novo atleta** | Adicionado `FirstTimeTip` em `app/add-athlete.tsx` explicando claramente que a senha criada pelo treinador é **provisória** e deve ser repassada ao atleta para o primeiro login. |
| **Modais de limite de plano (padrão visual único)** | Padronização dos alertas de limite do plano para `CustomAlert` (substituindo alert nativo branco) em: `create-workout`, `add-athlete`, `create-exercise`, `edit-exercise` e `workouts-library`. Inclui botões **Fechar** / **Ver planos** e navegação para `/subscription`. |
| **Fluxos preservados** | Alterações mantidas como **UI-only / UX-only**: sem mudanças de contrato de banco, sem alteração de regras de negócio de domínio, sem impactar payloads críticos de Firestore/Functions. |
| **Validação técnica contínua** | Após os lotes relevantes de alteração: `npx tsc --noEmit` e leitura de lints, ambos sem erros introduzidos nesta rodada. |

### Smoke test recomendado antes de build de loja

1. Treinador: criar/editar treino e exercício com idioma `EN` ativo.
2. Confirmar labels de bloco em todas as telas de detalhe/listagem (`Warm-up`, `Main`, `Cooldown`).
3. Criar atleta com senha provisória e validar mensagem/tutorial.
4. Simular limite do plano grátis e verificar modal padrão (`CustomAlert`) com CTA para planos.
5. Atleta: abrir treino, concluir, enviar feedback e validar textos no idioma selecionado.
6. Reiniciar app/Metro e confirmar persistência de idioma/tema.

---

| Tema | Detalhe |
|------|---------|
| **Home do atleta** | Card do treinador com **foto**, **nome exibido** e **mensagem** definidos no Perfil do treinador. Leitura em **`coachemAthletes`** (e fallback nos treinos atribuídos). **Não** gravamos isso em `users/{atleta}`: as [regras Firestore](docs/firestore.rules.coachem.production.rules) só permitem o próprio usuário atualizar o próprio `users/{uid}`. |
| **Perfil do treinador** | Campos *nome para atletas*, *mensagem para atletas*, upload de foto; salvamento com **`syncCoachPublicProfileToAthletes`** espelhando em atletas e treinos. Confirmação com **CustomAlert** (não `Alert` nativo). |
| **Abas** | Espaçamento superior (safe area + 20px) alinhado entre Home / Treinos / Perfil; header nativo oculto na aba Treinos; ícone **Atletas** ~10% menor na tab bar. |
| **Branding** | Rebranding aplicado para **Coach'em** (nome do app, logo, splash, intro vídeo, textos principais e notificações). |
| **Loja / jurídico** | Textos em `DOCUMENTACAO_LOJAS.md`, `DESCRICAO_LONGA.md`, `POLITICA_PRIVACIDADE.md`, `TERMOS_DE_USO.md`; páginas estáticas em `hosting/legal/` e `public/`. Links legais do app apontam para `/terms/coachem` e `/privacy/coachem`. |
| **Deploy Hosting** | Deploy de hosting concluído em `https://futeba-96395.web.app` com páginas legais publicadas. |
| **Conta** | Fluxo de atleta **bloqueado** pelo treinador, onboarding/tips, suporte Vision10 no perfil do treinador, etc. (ver histórico de commits). |

---

## Próximos passos (continuação)

Sugestão de ordem para **lançamento** e evolução:

1. **Build em loja** — Rodar `eas build` (iOS/Android) com variáveis `EXPO_PUBLIC_FIREBASE_*` no Expo.
2. **Teste em build real** — Validar fluxo completo no aparelho físico usando `CHECKLIST_TESTES_MANUAIS.md`.
3. **Submit** — Fazer `eas submit` (ou auto-submit) para TestFlight / Play Console.
4. **Alinhamento de marca (externo)** — Atualizar o site da Vision10 para remover referências antigas da marca anterior e manter consistência com Coach'em.
5. **Pós-lançamento** — Ajustes finos de UX, otimizações de assets e expansão contínua da cobertura de tradução em telas secundárias.

---

## O que o app faz (visão geral)

| Área | Descrição |
|------|-----------|
| **Autenticação** | Login e registro de **treinador**; atletas recebem conta pelo fluxo **Adicionar atleta** (email + senha provisória via Cloud Function). |
| **Senha** | **Esqueci minha senha** → Cloud Function `sendPasswordResetEmailTreina` envia email HTML (Gmail/nodemailer) com link gerado pelo Admin SDK. **Alterar senha** e **Excluir conta** no Perfil. Ver `docs/EMAIL_PASSWORD_RESET.md`. |
| **Sessão** | Firebase Auth com persistência em **AsyncStorage** (`src/services/firebase.config.ts`). |
| **UI** | Tema claro/escuro, abas com ícones PNG (Home, Treinos/Atletas, Perfil), assets críticos pré-carregados no boot (`app/_layout.tsx`). |
| **Treinos** | Atribuição, detalhes, biblioteca de exercícios, calendário do treinador, etc. |
| **Pro+ Health (Fase 1)** | Atleta liga Apple Saúde / Health Connect; **Iniciar** / **Concluir** treino define a janela; métricas agregadas no Firestore; treinador vê card no treino e gráfico FC no perfil do atleta. Ver [`docs/HEALTH_PHASE_1.md`](docs/HEALTH_PHASE_1.md). |

---

## Pro+ Health (wearables) — estado atual

Implementação na branch **`feat/security-app-check`** (merge pendente para `main`).

| O quê | Onde |
|-------|------|
| Plano diário | [`docs/HEALTH_PHASE_1.md`](docs/HEALTH_PHASE_1.md) |
| Arquitetura | [`docs/HEALTH_INTEGRATION_PLAN.md`](docs/HEALTH_INTEGRATION_PLAN.md) |
| QA no dispositivo | [`docs/HEALTH_QA_CHECKLIST.md`](docs/HEALTH_QA_CHECKLIST.md) |
| Play / App Store | [`docs/HEALTH_STORE_DECLARATIONS.md`](docs/HEALTH_STORE_DECLARATIONS.md) |
| Problemas comuns | [`docs/HEALTH_TROUBLESHOOTING.md`](docs/HEALTH_TROUBLESHOOTING.md) |

**Importante:** não funciona no **Expo Go** — usar `eas build --profile development`.

**Privacidade (HTML):** `public/privacy/coachem*` — deploy com `firebase deploy --only hosting`.

---

## Estrutura principal

```
Coach'em (pasta do repositório: Coach-em)/
├── app/
│   ├── (auth)/          # login, registro (só treinador)
│   ├── (tabs)/          # Home, Treinos/Atletas, Perfil
│   ├── athlete-profile.tsx
│   └── _layout.tsx      # splash, fontes, preload de imagens
├── components/
├── src/
│   ├── contexts/        # Auth, Theme, Language (i18n)
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

1. **Recuperação de senha** — O app chama a callable **`sendPasswordResetEmailTreina`** (Functions **v2**, `us-central1`), que gera o link com `generatePasswordResetLink` e envia email HTML (Coach'em) via **Gmail** (nodemailer). Credenciais no **Secret Manager**: **`GMAIL_USER`** (email) e **`GMAIL_PASS`** (senha de app de 16 caracteres — não a senha normal do Gmail). **Não** usar `firebase functions:config:set` para isso. Passo a passo, troubleshooting e **modelo para outros projetos**: **`docs/EMAIL_PASSWORD_RESET.md`**.

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
