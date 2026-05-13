# Fase 1 — Health Read MVP (Plano Detalhado)

Plano de execução **diário** da Fase 1 do projeto **Pro+ Health** do Coach'em.

> **Documento principal:** [`HEALTH_INTEGRATION_PLAN.md`](./HEALTH_INTEGRATION_PLAN.md)
> **Início previsto:** segunda-feira após aprovação deste plano
> **Ritmo:** **~2 horas/dia**, dias úteis
> **Duração estimada:** **6 semanas (30 sessões úteis)** — incluído buffer
> **Branch:** `feat/health-integration` (criada no Dia 1)

---

## Princípios desta fase

1. **Pequenos passos diários:** cada dia entrega algo testável.
2. **Nenhuma regra de negócio antiga é alterada.** O fluxo atual continua funcionando.
3. **Tudo opt-in:** sem consentimento do atleta → sem coleta, sem mudança de UI relevante.
4. **Sem dependência de nova assinatura nesta fase.** Vai ligado ao Pro atual; Pro+ Health entra na Fase 2.
5. **Validar a cada dia:** pequenos `git commit` por dia + teste manual no aparelho.

---

## Métricas de progresso (KPIs internos)

- Quantos dias previstos vs. concluídos.
- Quantos commits por sprint.
- Aprovação manual em cada milestone (S1, S2, S3, S4, S5).
- Lints/TS sem regressão.

---

## Stack técnica confirmada

- **iOS:** [`react-native-health`](https://github.com/agencyenterprise/react-native-health)
- **Android:** [`react-native-health-connect`](https://github.com/matinzd/react-native-health-connect)
- **Build:** EAS **Dev Client** (Expo Go não suporta health)
- **Firebase:** Firestore (subcoleção `health` em `coachemAssignedWorkouts`)
- **Idioma:** i18n PT/EN (já existente)

---

## Visão geral em sprints

| Sprint | Foco | Dias |
|--------|------|------|
| **S1 — Setup** | Libs, permissões, build dev client | Dia 1 → Dia 5 |
| **S2 — Dados & consentimento** | Firestore, regras, tela de consentimento | Dia 6 → Dia 10 |
| **S3 — Captura de treino** | Iniciar / Concluir + coleta agregados | Dia 11 → Dia 15 |
| **S4 — UI treinador & polimento** | Cards de saúde + histórico + edge cases | Dia 16 → Dia 20 |
| **S5 — Privacidade & QA** | Política, declarações, QA real device | Dia 21 → Dia 25 |
| **S6 — Buffer & release** | Margem para imprevistos + release interno | Dia 26 → Dia 30 |

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

### Dia 4 — Build EAS Dev Client (iOS + Android) (~2h)
- [ ] Atualizar `eas.json` se necessário (`developmentClient: true`).
- [ ] `eas build --profile development --platform ios`.
- [ ] `eas build --profile development --platform android`.
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

**Milestone S1:** dev client buildado em ambas plataformas, libs instaladas, esqueleto de serviço pronto. **Sem mudança visível para usuário.**

---

## Sprint 2 — Dados e consentimento (Dia 6 → Dia 10)

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

### Dia 7 — Regras de segurança Firestore (~2h)
- [ ] Atualizar regras para permitir:
  - atleta escrever `health/{uid}` apenas no próprio treino,
  - treinador ler health dos atletas vinculados,
  - atleta atualizar próprio `users.healthIntegration`.
- [ ] Validar com Firestore Rules Playground.
- [ ] Commit: `chore(rules): health subcollection`.

### Dia 8 — Design do consentimento do atleta (~2h)
- [ ] Definir copy PT/EN final da tela de consentimento.
- [ ] Esboçar componente `AthleteHealthConsentScreen` (sem implementar lógica nativa).
- [ ] Adicionar entrada no Perfil do atleta.
- [ ] Commit: `feat(health): consent screen scaffold`.

### Dia 9 — Implementar pedido de permissões (iOS + Android) (~2h)
- [ ] Conectar `requestPermissions` real ao botão.
- [ ] Tratar:
  - permissão concedida,
  - permissão recusada,
  - Health Connect não instalado (Android).
- [ ] Atualizar `users.healthIntegration` no Firestore após concessão.
- [ ] Commit: `feat(health): permissions flow`.

### Dia 10 — Revogação + status (~2h)
- [ ] Botão **Desconectar dispositivo de saúde**.
- [ ] Atualizar `users.healthIntegration.permissionsRevokedAt`.
- [ ] Texto explicando que revogação no sistema operacional também conta.
- [ ] Commit: `feat(health): revoke + status UI`.

**Milestone S2:** atleta consegue **conectar e desconectar** dispositivo. App ainda **não coleta** dados.

---

## Sprint 3 — Captura no fluxo do treino (Dia 11 → Dia 15)

### Dia 11 — `startedAt` / `completedAt` no treino (~2h)
- [ ] Adicionar campos `startedAt` e `completedAt` em `coachemAssignedWorkouts`.
- [ ] Atualizar serviços de treino para escrever esses timestamps.
- [ ] Compatibilidade retroativa: treinos antigos seguem funcionando sem campos.
- [ ] Commit: `feat(workouts): start/complete timestamps`.

### Dia 12 — Botão "Iniciar treino" (atleta) (~2h)
- [ ] Adicionar botão **Iniciar treino** na tela do atleta.
- [ ] Persistir `startedAt`.
- [ ] Estado visual: treino em andamento.
- [ ] Commit: `feat(athlete): start workout button`.

### Dia 13 — Botão "Concluir treino" + trigger de coleta (~2h)
- [ ] Atualizar **Concluir treino** para gravar `completedAt`.
- [ ] Disparar `health.service.readWindow(startedAt, completedAt)`.
- [ ] Fallback gracioso quando saúde não autorizada.
- [ ] Commit: `feat(athlete): complete workout triggers health read`.

### Dia 14 — Frequência cardíaca: série + agregados (~2h)
- [ ] Implementar leitura HR no iOS (HealthKit).
- [ ] Implementar leitura HR no Android (Health Connect).
- [ ] Calcular: avg, max, min, samplesCount, zonas (Z1–Z5).
- [ ] Commit: `feat(health): heart rate aggregates`.

### Dia 15 — Calorias / distância / passos / sessions (~2h)
- [ ] Calorias ativas no período.
- [ ] Distância total no período.
- [ ] Passos no período.
- [ ] Workout sessions sobrepondo a janela.
- [ ] Persistir tudo em `health/{uid}`.
- [ ] Commit: `feat(health): aggregates + sessions persistence`.

**Milestone S3:** atleta **inicia e conclui treino**, e dados aparecem em Firestore. **Treinador ainda não vê na UI.**

---

## Sprint 4 — UI treinador e polimento (Dia 16 → Dia 20)

### Dia 16 — Card de saúde no detalhe do treino (treinador) (~2h)
- [ ] Em `app/workout-details.tsx`, exibir card resumo:
  - FC média / máx / min,
  - calorias,
  - distância (se >0).
- [ ] Estado vazio elegante.
- [ ] Commit: `feat(coach): workout health card`.

### Dia 17 — Visualização de zonas FC (~2h)
- [ ] Componente de barra horizontal mostrando tempo em Z1–Z5.
- [ ] Cores consistentes com tema dark/light.
- [ ] Commit: `feat(coach): heart rate zones visual`.

### Dia 18 — Histórico no perfil do atleta (treinador) (~2h)
- [ ] Gráfico simples: FC média por treino (últimos N).
- [ ] Calorias ativas semanais.
- [ ] Reuso do que já existe no app.
- [ ] Commit: `feat(coach): athlete health history`.

### Dia 19 — Edge cases e robustez (~2h)
- [ ] Atleta sem permissão → card oculto sem erro.
- [ ] Sem dados no período → mensagem amigável.
- [ ] Erro de leitura → log + estado neutro.
- [ ] Treino sem `startedAt`/`completedAt` → ignorar.
- [ ] Commit: `fix(health): edge cases`.

### Dia 20 — i18n PT/EN final (~2h)
- [ ] Todas as chaves novas em `pt-BR.ts` e `en.ts`.
- [ ] Revisar copy de saúde com tom adulto/profissional.
- [ ] `npx tsc --noEmit` limpo.
- [ ] Commit: `chore(i18n): health namespace complete`.

**Milestone S4:** experiência completa atleta + treinador. Tudo testável em build dev.

---

## Sprint 5 — Privacidade e QA (Dia 21 → Dia 25)

### Dia 21 — Política de privacidade (~2h)
- [ ] Adicionar seção **Dados de Saúde**.
- [ ] Atualizar PT e EN no hosting (`futeba-96395.web.app/privacy/coachem`).
- [ ] Confirmar deploy.
- [ ] Commit: `docs(privacy): health section`.

### Dia 22 — Declarações nas lojas (~2h)
- [ ] Atualizar **Segurança dos dados** (Play Console):
  - adicionar tipo Saúde,
  - finalidade Funcionalidade da app,
  - opcional/obrigatório alinhado.
- [ ] Atualizar **App Privacy** (App Store Connect):
  - tipo Health & Fitness,
  - finalidade App functionality.
- [ ] Sem upload de build ainda.

### Dia 23 — QA iOS em dispositivo real (~2h)
- [ ] Apple Watch sincronizado com iPhone de teste.
- [ ] Cenário: iniciar + executar treino + concluir.
- [ ] Validar todos os agregados batendo com o app Saúde.
- [ ] Bugs em `bugs-health.md` (interno).
- [ ] Commit: `chore(qa): ios health pass 1`.

### Dia 24 — QA Android em dispositivo real (~2h)
- [ ] Wear OS / Mi Band / Samsung sincronizando com Health Connect.
- [ ] Mesmo cenário do iOS.
- [ ] Bugs no mesmo arquivo.
- [ ] Commit: `chore(qa): android health pass 1`.

### Dia 25 — Correções pós-QA (~2h)
- [ ] Aplicar fixes prioritários encontrados.
- [ ] Reteste rápido em ambas plataformas.
- [ ] Commit: `fix(health): qa fixes batch 1`.

**Milestone S5:** legal e QA OK. Pronto para release interno.

---

## Sprint 6 — Buffer e release interno (Dia 26 → Dia 30)

### Dia 26 — Buffer técnico (~2h)
- [ ] Dia livre para qualquer atraso ou polish.

### Dia 27 — Documentação final (~2h)
- [ ] Atualizar `README.md` (seção Health).
- [ ] Atualizar `docs/HEALTH_INTEGRATION_PLAN.md` (status da Fase 1).
- [ ] Adicionar troubleshooting Health Connect comum.

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

- [ ] Atleta consegue conectar/desconectar saúde com 1 clique.
- [ ] Conclusão de treino salva resumo de saúde em Firestore.
- [ ] Treinador vê card de saúde no detalhe do treino.
- [ ] Treinador vê histórico básico de FC e calorias.
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
