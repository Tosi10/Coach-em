# Fase 1 — Health Read MVP (Plano Detalhado)

Plano de execução **diário** da Fase 1 do projeto **Pro+ Health** do Coach'em.

> **Documento principal:** [`HEALTH_INTEGRATION_PLAN.md`](./HEALTH_INTEGRATION_PLAN.md)
> **Início previsto:** segunda-feira após aprovação deste plano
> **Ritmo:** **~2 horas/dia**, dias úteis
> **Duração estimada:** **6 semanas (30 sessões úteis)** — incluído buffer
> **Branch de trabalho atual:** `feat/security-app-check` (saúde + App Check integrados; merge dos Dias 7–8 em 2026-05-29)

---

## Onde estamos agora (2026-05-29)

| | |
|---|---|
| **Progresso** | **19 de 30 dias** de código concluídos · **1 pendente:** Dia 4 (build iOS) |
| **Sprint atual** | **S4** concluído (código) · **amanhã:** build + teste Apple Watch · depois Sprint 5 (legal/QA) |
| **O atleta já pode** | Fluxo completo + **treinador vê métricas** no detalhe do treino e gráfico FC no perfil do atleta |
| **Ainda não** | Teste real no iPhone/relógio · política de privacidade / declarações loja (Sprint 5) |
| **Paralelo (outro fio)** | Firebase App Check na mesma branch — enforcement ainda OFF na consola |

**Resumo em uma frase:** MVP Pro+ Health em código está **quase completo**; amanhã só precisas de **build iOS + teste relógio**; depois Sprint 5 (legal/QA).

### Status das milestones

| Milestone | Estado | Notas |
|-----------|--------|--------|
| **S1 — Setup** | 🟡 **Quase** (4/5) | Falta só **Dia 4** (build Dev Client iOS + Android) — **fazer antes do teste com Apple Watch** |
| **S2 — Dados & consentimento** | 🟢 **Concluída** (código) | Deploy das `firestore.rules` na consola ainda recomendado |
| **S3 — Captura de treino** | 🟢 **Concluída** (código) | Validar amanhã em build iOS + relógio |
| **S4 — UI treinador** | 🟢 **Concluída** (código) | Card no treino + gráfico FC no perfil |
| **S5 — Privacidade & QA** | ⬜ Não iniciada | |
| **S6 — Buffer & release** | ⬜ Não iniciada | |

---

## Princípios desta fase

1. **Pequenos passos diários:** cada dia entrega algo testável.
2. **Nenhuma regra de negócio antiga é alterada.** O fluxo atual continua funcionando.
3. **Tudo opt-in:** sem consentimento do atleta → sem coleta, sem mudança de UI relevante.
4. **Sem dependência de nova assinatura nesta fase.** Vai ligado ao Pro atual; Pro+ Health entra na Fase 2.
5. **Validar a cada dia:** pequenos `git commit` por dia + teste manual no aparelho.

---

## Métricas de progresso (KPIs internos)

- **Dias concluídos:** 19 / 30 (Dias 1–3, 5–20) · **Pendente no S1:** Dia 4 (build)
- **Milestones:** S2 + S3 + S4 código ✅ · S1 🟡 (falta build) · S5–S6 ⬜
- **Lints/TS:** `npx tsc --noEmit` OK após Dias 9–10

---

## Stack técnica confirmada

- **iOS:** [`react-native-health`](https://github.com/agencyenterprise/react-native-health)
- **Android:** [`react-native-health-connect`](https://github.com/matinzd/react-native-health-connect)
- **Build:** EAS **Dev Client** (Expo Go não suporta health)
- **Firebase:** Firestore (subcoleção `health` em `coachemAssignedWorkouts`)
- **Idioma:** i18n PT/EN (já existente)

---

## Visão geral em sprints

| Sprint | Foco | Dias | Status |
|--------|------|------|--------|
| **S1 — Setup** | Libs, permissões, build dev client | Dia 1 → Dia 5 | 🟡 **4/5** — falta Dia 4 |
| **S2 — Dados & consentimento** | Firestore, regras, tela + permissões | Dia 6 → Dia 10 | 🟢 **Concluído** |
| **S3 — Captura de treino** | Iniciar / Concluir + coleta agregados | Dia 11 → Dia 15 | 🟢 **Concluído** |
| **S4 — UI treinador & polimento** | Cards de saúde + histórico + edge cases | Dia 16 → Dia 20 | 🟢 **Concluído** (código) |
| **S5 — Privacidade & QA** | Política, declarações, QA real device | Dia 21 → Dia 25 | ⬜ |
| **S6 — Buffer & release** | Margem para imprevistos + release interno | Dia 26 → Dia 30 | ⬜ |

---

## Sprint 1 — Setup (Dia 1 → Dia 5)

### Dia 1 — Branch + libs (~2h) ✅ **Concluído em 2026-05-11**
- [x] Criar branch `feat/health-integration` a partir de `main`.
- [x] `npm install react-native-health` (iOS) — `1.19.0`.
- [x] `npm install react-native-health-connect` (Android) — `3.5.0`.
- [x] Conferir versões compatíveis com Expo SDK atual (SDK 54 / RN 0.81).
- [x] Commit inicial (sem alterações funcionais) — `chore(health): install react-native-health and react-native-health-connect [Day 1]`.

**Notas:**
- `npx expo install` foi usado em vez de `npm install` para garantir compatibilidade com Expo.
- O Expo adicionou automaticamente os dois pacotes como **config plugins** em `app.json` (linha `plugins`).
- 15 vulnerabilidades reportadas pelo `npm audit` (em deps transitivas das libs). Revisão fica para sprint posterior.

### Dia 2 — Configurar iOS no `app.json` (~2h) ✅ **Concluído em 2026-05-11**
- [x] Adicionar `NSHealthShareUsageDescription` (PT-BR).
- [x] Adicionar `NSHealthUpdateUsageDescription` (defensivo, PT-BR).
- [x] Adicionar entitlement `com.apple.developer.healthkit`.
- [x] Documentar textos de permissão (no próprio `app.json` via plugin).
- [x] Commit: `chore(health): configure ios healthkit permissions and entitlement [Day 2]`.

**Notas:**
- Tudo feito via **config plugin** do `react-native-health` (forma recomendada Expo):
  - `isClinicalDataEnabled: false` (não pedimos acesso a registos médicos/clínicos)
  - `healthSharePermission` → vira `NSHealthShareUsageDescription` no build iOS
  - `healthUpdatePermission` → vira `NSHealthUpdateUsageDescription`
  - Entitlement `com.apple.developer.healthkit` é adicionado automaticamente pelo plugin
- **Tradução EN** ficará para Sprint 5 quando revisarmos política de privacidade e copy oficial PT/EN das telas.
- Nenhum código TS/JS foi tocado. Nenhum build novo foi gerado. App em produção e em revisão Play não é afetado.

### Dia 3 — Configurar Android no `app.json` (~2h) ✅ **Concluído em 2026-05-11**
- [x] Adicionar permissões Health Connect:
  - `android.permission.health.READ_HEART_RATE`
  - `android.permission.health.READ_ACTIVE_CALORIES_BURNED`
  - `android.permission.health.READ_DISTANCE`
  - `android.permission.health.READ_STEPS`
  - `android.permission.health.READ_EXERCISE`
- [x] Confirmar `targetSdkVersion >= 34` (já está em 36 via Expo SDK 54).
- [x] Adicionar manifesto/queries via plugin `react-native-health-connect` (config plugin cuida automaticamente).
- [x] Commit: `chore(health): configure android health connect permissions [Day 3]`.

**Notas:**
- Permissões adicionadas em `android.permissions` (forma padrão do Expo).
- O plugin `react-native-health-connect` cuida dos intent filters e do `<queries>` necessário no manifest gerado.
- Apps **sem Health Connect instalado** (Android 13-): a partir do Dia 9 (pedido real de permissões), o serviço de saúde vai detectar e oferecer redirect à Play Store para instalar — mas isso é lógica em runtime, não config.
- Nenhum código TS/JS foi tocado. Nenhum build novo foi gerado. AAB em revisão na Play não é afetado (já foi enviado antes desta mudança).
- **Cuidado profissional:** próximo build Android só faz sentido **depois** da Play aprovar o AAB atual, para não criar conflito de revisão.

### Dia 4 — Build EAS Dev Client (iOS + Android) (~2h) 🟡 **Config OK · build pendente (você)**
- [x] `eas.json` com `developmentClient: true` no profile `development`.
- [ ] `eas build --profile development --platform ios` ← **antes do teste Apple Watch**
- [ ] `eas build --profile development --platform android` (opcional)
- [ ] Instalar e validar abertura do app em ambos.
- [ ] Confirmar que **nenhum** fluxo antigo quebrou.

### Dia 5 — Camada de serviço unificada (esqueleto) (~2h) ✅ **Concluído em 2026-05-13**
- [x] Criar `src/services/health.service.ts` com interface comum (`HealthService`).
- [x] Stubs para iOS (`HealthKitServiceStub`), Android (`HealthConnectServiceStub`) e fallback (`NoopHealthService`).
- [x] Tipos em `src/types/health.ts`:
  - `HealthPlatform`, `HRSample`, `HRZones`, `HRAggregates`
  - `WorkoutSessionType`, `WorkoutSession`
  - `HealthSnapshot`, `HealthPermissionResult`
- [x] Função singleton `getHealthService()` que escolhe stub por `Platform.OS`.
- [x] Helper `__resetHealthServiceForTests()` para testes.
- [x] `npx tsc --noEmit` sem erros.
- [x] Commit: `feat(health): service skeleton + types [Day 5]`.

**Notas:**
- Stubs **nunca lançam** exceção: `readWindow` devolve `HealthSnapshot` vazio com motivo em `notes`, e `requestPermissions` devolve `{ granted: false, reason }`.
- Nenhuma lib nativa é importada neste arquivo. O app continua rodando em Expo Go sem rebuild.
- A implementação real entra nos Dias 14 e 15, depois do Dev Client estar disponível.
- O contrato (`HealthService`) está pronto para que telas (Dia 8+) já consigam consumir, mesmo recebendo dados vazios.

**Milestone S1:** 🟡 **Parcial** — libs + `app.json` + serviço unificado ✅; **Dev Client (Dia 4) ainda não buildado**. Sem coleta de dados; app em produção inalterado até novo build.

---

## Sprint 2 — Dados e consentimento (Dia 6 → Dia 10) 🟢 **Concluído (código)**

### Dia 6 — Schema Firestore + tipos (~2h) ✅ **Concluído em 2026-05-13**
- [x] Criar tipos TS para `HealthSnapshot` no Firestore (`HealthSnapshotDoc`, `HealthIntegrationDoc`, `ProPlusHealthDoc`).
- [x] Criar helpers para escrever em `coachemAssignedWorkouts/{id}/health/{athleteUid}`:
  - `saveHealthSnapshot`, `getHealthSnapshot`, `listAthleteHealthSnapshots`.
- [x] Atualizar `users/{uid}.healthIntegration`:
  - `getHealthIntegration`, `markHealthIntegrationGranted`,
    `markHealthIntegrationRevoked`, `updateHealthIntegrationOverrides`.
- [x] Conversores `toFirestoreSnapshot` / `fromFirestoreSnapshot` (descarta `hrSeries` na persistência).
- [x] `npx tsc --noEmit` sem erros.
- [x] Commit: `feat(health): firestore types + writers [Day 6]`.

**Notas:**
- **Descoberta:** o projeto usa coleção `users` (não `coachemUsers` como sugerido no plano original).
  Ajustamos as funções para `users/{uid}`. O resto da estrutura segue o plano.
- Apenas **agregados** vão para o Firestore. `hrSeries` (série crua de FC) fica em memória — econômico e respeita privacidade.
- Snapshot é gravado com `setDoc({ merge: false })`: cada conclusão substitui o registo anterior do mesmo (treino, atleta).
- `listAthleteHealthSnapshots` faz N+1 reads — aceitável para o painel inicial; pode virar índice composto em Sprint 4 se ficar pesado.
- Regras de segurança Firestore para essas operações vêm no Dia 7 (próximo).

### Dia 7 — Regras de segurança Firestore (~2h) ✅ **Concluído em 2026-05-15**
- [x] Atualizar `firestore.rules` (fonte do deploy — `firebase.json`):
  - **Subcoleção** `coachemAssignedWorkouts/{docId}/health/{athleteUid}`:
    - **Leitura:** atleta (`uid == athleteUid`), `coachId` do treino, ou `coachOwnsAthlete(athleteId)` (igual ao doc pai).
    - **Escrita:** só o atleta, e só se `athleteUid` coincide com `athleteId` do treino (evita path `health/outroUid` num treino que não é dele).
    - **Delete:** negado (histórico; app usa `setDoc` para substituir).
  - Helpers `assignedWorkoutParentData` / `assignedWorkoutAthleteId` para validar contra o doc pai.
- [x] **`users.healthIntegration`:** já coberto pelas regras atuais de `users/{userId}` (o próprio utilizador pode `update` desde que não mexa em billing / `userType` / `email` / `createdAt`) — nenhuma alteração necessária.
- [ ] Validar no **Rules Playground** da consola após fazer **deploy** das regras (recomendado antes de testar com app real).
- [x] Commit: `chore(rules): health subcollection [Day 7]`.

**Deploy:** as alterações só entram em produção após `firebase deploy --only firestore:rules` (ou fluxo que usares). Até lá o app em produção mantém as regras antigas.

### Dia 8 — Design do consentimento do atleta (~2h) ✅ **Concluído em 2026-05-21**
- [x] Definir copy PT/EN final da tela de consentimento (`healthConsent` + `profile.health*` em i18n).
- [x] Tela `app/athlete-health-consent.tsx` (estado Firestore via `getHealthIntegration`).
- [x] Entrada no Perfil do atleta (`app/(tabs)/profile.tsx` → só `ATHLETE`).
- [x] Rota registada em `app/_layout.tsx`.
- [x] Commit: `feat(health): consent screen scaffold [Day 8]` (via merge `chore/preserve-health-carryover`).

**Notas:**
- Testável no **Expo Go** (sem build nativo).
- Treinador não vê a entrada de saúde no perfil (só atleta).
- App Check / hardening: ver `SEGURANCA_LANCAMENTO_CHECKLIST.md` — fase posterior (referência EletroNovo/v6core).

### Dia 9 — Implementar pedido de permissões (iOS + Android) (~2h) ✅ **Concluído em 2026-05-29**
- [x] `health/healthNativePermissions.{ios,android}.ts` com import dinâmico das libs nativas (seguro no Expo Go).
- [x] `health.service.ts` delega `requestPermissions` / `isAvailable` às implementações nativas.
- [x] Tela `athlete-health-consent.tsx`: botão **Ligar** chama permissões reais + `markHealthIntegrationGranted`.
- [x] Tratar: Expo Go, permissão recusada, Health Connect não instalado / atualização (Android → Play Store).
- [x] i18n PT/EN para erros e sucesso.
- [x] Commit: `feat(health): permissions flow [Day 9]`.

**Notas:**
- `readWindow` continua stub (Dias 14–15). Ligar ≠ coletar dados de treino ainda.
- Teste com relógio exige **Dev Client** ou build de loja com módulos nativos.

### Dia 10 — Revogação + status (~2h) ✅ **Concluído em 2026-05-29**
- [x] Botão **Desligar** → `revokePermissions` (Android: `revokeAllPermissions`) + `markHealthIntegrationRevoked`.
- [x] Mensagem iOS: instrução para revogar também na app Saúde.
- [x] Estados de loading na UI (`connecting` / `disconnecting`).
- [x] Commit: `feat(health): revoke + status UI [Day 10]` (mesmo commit que Dia 9).

**Milestone S2:** 🟢 **Concluída (código)** — atleta consegue **conectar e desconectar** (em build nativo / Dev Client). App ainda **não coleta** métricas de treino (`readWindow` = stub até Dias 14–15).

---

## Sprint 3 — Captura no fluxo do treino (Dia 11 → Dia 15) 🟢 **Concluído (código)**

### Dia 11 — `startedAt` / `completedAt` no treino (~2h) ✅ **2026-05-29**
- [x] Campos `startedAt` e `completedAt` em `AssignedWorkoutDoc` + `updateAssignedWorkout`.
- [x] `markAssignedWorkoutStarted()` idempotente.
- [x] Treinos antigos sem campos continuam válidos (`completedDate` mantido).
- [x] Commit: incluído em `feat(health): workout window sync and health read [Days 11-15]`.

### Dia 12 — Botão "Iniciar treino" (atleta) (~2h) ✅ **2026-05-29**
- [x] Botão **Iniciar treino** em `app/workout-details.tsx`.
- [x] Banner “treino em andamento” com hora de início.
- [x] **Concluir** só ativo após iniciar.
- [x] i18n PT/EN.

### Dia 13 — Botão "Concluir treino" + trigger de coleta (~2h) ✅ **2026-05-29**
- [x] Conclusão grava `completedAt` + `startedAt` (fallback = momento da conclusão se não iniciou).
- [x] `syncHealthAfterWorkoutComplete()` → `readWindow` + `saveHealthSnapshot`.
- [x] Falha de saúde não bloqueia conclusão do treino.

### Dia 14 — Frequência cardíaca: série + agregados (~2h) ✅ **2026-05-29**
- [x] iOS: `getHeartRateSamples` + agregados e zonas Z1–Z5 (`healthAggregates.ts`).
- [x] Android: leitura `HeartRate` via Health Connect.
- [x] `healthReadWindow.impl.{ios,android}.ts`.

### Dia 15 — Calorias / distância / passos / sessions (~2h) ✅ **2026-05-29**
- [x] Calorias, distância, passos, sessões de exercício na janela.
- [x] Persistência em `coachemAssignedWorkouts/{id}/health/{athleteUid}`.
- [x] Notas em `snapshot.notes` quando um tipo falha (sem crash).

**Milestone S3:** 🟢 **Concluída (código)** — atleta inicia/conclui e dados podem ir para Firestore. **Treinador ainda não vê na UI (Sprint 4).** Teste real: **build iOS (Dia 4) + Apple Watch.**

**Checklist teste amanhã (iOS):**
1. Build Dev Client ou TestFlight com esta branch.
2. Atleta: Perfil → ligar Apple Saúde.
3. Abrir treino → **Iniciar treino** → fazer sessão no relógio → **Marcar como concluído**.
4. Firebase: doc `coachemAssignedWorkouts/{id}/health/{uid}` com FC/calorias (se o relógio sincronizou com Saúde).

---

## Sprint 4 — UI treinador e polimento (Dia 16 → Dia 20) 🟢 **Concluído (código)**

### Dia 16 — Card de saúde no detalhe do treino (~2h) ✅ **2026-05-29**
- [x] `WorkoutHealthSummaryCard` em treinos **concluídos** (treinador + atleta).
- [x] FC média/máx/mín, calorias, distância, passos, janela horária.
- [x] Estados vazio/erro/loading.

### Dia 17 — Visualização de zonas FC (~2h) ✅ **2026-05-29**
- [x] Barras Z1–Z5 no mesmo card (cores fixas legíveis).

### Dia 18 — Histórico no perfil do atleta (~2h) ✅ **2026-05-29**
- [x] `AthleteHealthTrendCard` — gráfico de barras FC média (últimos 6 treinos com dados).
- [x] Aba **Gráficos** do `athlete-profile.tsx`.
- [ ] Calorias semanais — ficou para iteração futura (opcional).

### Dia 19 — Edge cases e robustez (~2h) ✅ **2026-05-29**
- [x] Sem dados → mensagem amigável (não crash).
- [x] Botões Iniciar/Concluir só para **atleta** (treinador não vê).
- [x] Sync saúde não bloqueia conclusão do treino.

### Dia 20 — i18n PT/EN (~2h) ✅ **2026-05-29**
- [x] Chaves `workoutDetails.health*` e `athleteProfile.healthTrend*`.
- [x] `npx tsc --noEmit` OK.

**Milestone S4:** 🟢 **Concluída (código)** — treinador e atleta veem métricas na UI quando existem no Firestore.

---

## Sprint 5 — Privacidade e QA (Dia 21 → Dia 25) 🟡 **Docs prontos · QA/build por você**

### Dia 21 — Política de privacidade (~2h) ✅ **2026-05-29 (repo)**
- [x] Secção **1.4 Dados de saúde** em `public/privacy/coachem/index.html` e `coachem-en`.
- [ ] **Deploy hosting** (`firebase deploy --only hosting`) ← **ação sua**
- [ ] Confirmar URLs públicas atualizadas.

### Dia 22 — Declarações nas lojas (~2h) ✅ **2026-05-29 (guia)**
- [x] Checklist completo: [`HEALTH_STORE_DECLARATIONS.md`](./HEALTH_STORE_DECLARATIONS.md).
- [ ] Preencher **Segurança dos dados** (Play) — **ação sua**
- [ ] Preencher **App Privacy** (Apple) — **ação sua**

### Dia 23 — QA iOS em dispositivo real (~2h) ⬜ **Amanhã**
- [x] Checklist: [`HEALTH_QA_CHECKLIST.md`](./HEALTH_QA_CHECKLIST.md).
- [x] Registo de bugs: [`bugs-health.md`](./bugs-health.md).
- [ ] Executar cenário com Apple Watch.

### Dia 24 — QA Android (~2h)
- [ ] Opcional após iOS estável.

### Dia 25 — Correções pós-QA (~2h)
- [ ] Conforme bugs encontrados.

**Milestone S5:** 🟡 Aguarda deploy privacidade + QA real + lojas.

---

## Sprint 6 — Buffer e release interno (Dia 26 → Dia 30)

### Dia 26 — Buffer técnico (~2h)
- [ ] Dia livre para qualquer atraso ou polish.

### Dia 27 — Documentação final (~2h) ✅ **2026-05-29 (parcial)**
- [x] `README.md` — secção Pro+ Health.
- [x] `HEALTH_INTEGRATION_PLAN.md` — estado atualizado.
- [x] [`HEALTH_TROUBLESHOOTING.md`](./HEALTH_TROUBLESHOOTING.md).

### Dia 28 — Build de produção iOS + Android (~2h)
- [ ] `eas build --profile production --platform ios`.
- [ ] `eas build --profile production --platform android`.
- [ ] Validar instalação manual.

### Dia 29 — Lançamento interno (~2h)
- [ ] Subir para TestFlight (interno).
- [ ] Subir para Play Test Interno.
- [ ] Convidar 2–3 atletas/treinadores reais para testar.

### Dia 30 — Coleta de feedback inicial (~2h)
- [ ] Coletar feedback dos testadores.
- [ ] Triagem para Fase 1.1 (correções) ou Fase 2 (Pro+ Health).
- [ ] Encerrar Sprint Fase 1.

**Milestone S6:** Fase 1 entregue para teste interno real.

---

## Critérios de aceite da Fase 1

- [x] Atleta consegue conectar/desconectar saúde com 1 clique *(validar em build iOS amanhã)*.
- [x] Conclusão de treino salva resumo de saúde em Firestore *(código; validar com Apple Watch)*.
- [x] Treinador vê card de saúde no detalhe do treino *(validar com build iOS)*.
- [x] Treinador vê histórico básico de FC no perfil do atleta *(gráfico; calorias semanais ficam para depois)*.
- [ ] App **não regrediu** em nenhum fluxo existente.
- [ ] Política de privacidade atualizada e publicada.
- [ ] Declarações Play e App Store atualizadas.
- [ ] Build de produção iOS e Android estável.
- [ ] Pelo menos 3 testadores externos validaram fluxo real.

---

## Riscos específicos da Fase 1

| Risco | Mitigação |
|------|-----------|
| Usuário Android sem Health Connect instalado | Detectar e oferecer redirecionamento à Play Store. |
| HealthKit recusado pela Apple por copy fraco | Texto profissional, claro, em PT e EN, antes do build. |
| Atleta com relógio “fraco” sem HR | Card mostra apenas o que existe (sem inventar dados). |
| RevenueCat receber novos eventos sem entitlement nova (Fase 2) | Nada quebra: gating continua via `pro` atual. |
| Atrasos por outros projetos do Tosi | Buffer de 5 dias na Sprint 6. |

---

## Observações finais

- Cada **sessão de 2h** começa com:
  1. `git pull`
  2. abrir checklist do dia
  3. terminar com `git commit` + push
- Se um dia escapar, **não pula etapas:** desloca tudo +1 dia.
- A cada Sprint concluída, marcamos a milestone neste documento.

---

## Histórico de revisões

| Data | Resumo |
|------|--------|
| 2026-05-09 | Criação do plano detalhado da Fase 1 |
| 2026-05-29 | Dias 9–10: permissões nativas + revoke; marcos S2 concluídos |
| 2026-05-29 | Dias 11–15: janela treino + leitura HealthKit/Connect + sync Firestore; marco S3 código ✅ |
| 2026-05-29 | Dias 16–20: UI treinador; privacidade HTML + guias lojas/QA/troubleshooting |
