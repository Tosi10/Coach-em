# Plano de Implementação — Pro+ Health (HealthKit + Health Connect)

Documento técnico-vivo de planejamento da **integração de saúde** do Coach'em.

> **Estado:** planejamento. **Nada de código ainda.** Cada fase deve ser revisada e aprovada antes de iniciar.

> **Última atualização:** 2026-05-09

---

## 1. Visão geral

Adicionar ao Coach'em um **plano premium “Pro+ Health”** que conecta o app a dispositivos vestíveis dos atletas (Apple Watch, Garmin, Mi, Samsung, Pixel Watch, Polar, etc.), via **HealthKit (iOS)** e **Health Connect (Android)**.

A coleta é feita por **janela de tempo** (do `startedAt` ao `completedAt` do treino), evitando a complexidade de tempo real, sem perder qualidade dos dados (HealthKit/Health Connect entregam séries de pontos).

Objetivos:

- Dar ao **treinador** dados quantitativos de cada treino (FC média/máx/zonas, calorias ativas, sessions, distância, passos).
- Permitir ao **atleta** ver no app o resumo do treino realizado, automaticamente.
- Reforçar o **valor do plano premium** com um diferencial real.
- Manter o app **simples e estável**: nada quebra para usuários sem relógio ou que não autorizem o uso.

---

## 2. Princípios de produto e privacidade

1. **Consentimento explícito do atleta**.
   - O treinador assina o **Pro+ Health**.
   - O **atleta** decide se autoriza coleta de dados de saúde.
   - Sem autorização → app funciona como hoje, sem health.
   - Com autorização → coleta acontece **somente** durante a janela de cada treino concluído.
2. **Atleta pode revogar a qualquer momento**, no perfil do app **e/ou** nas definições do sistema (HealthKit / Health Connect).
3. **Sem coleta em tempo real**, **sem background**, **sem GPS contínuo**. Tudo é feito **uma vez por treino**, no momento da conclusão.
4. **Dados de saúde nunca saem do escopo do treinador-atleta**:
   - não são compartilhados com terceiros,
   - não vão para analytics agregados,
   - não são vendidos.
5. **Compatível com LGPD/GDPR** — base legal: consentimento + execução de contrato (relação coach-atleta).

---

## 3. Arquitetura geral (resumo)

```
+-------------------+        HealthKit         +----------+
|   App (iOS/RN)    |  <-------------------->  |  Saúde   |
|                   |        (read only)       +----------+
|  +------------+   |                                ^
|  | Workout UI |   |        Health Connect          |
|  +------------+   |  <-------------------->  +----------+
|        |          |        (read only)       |  HC SDK  |
|        v          |                          +----------+
|   Firestore       |                               (relógios sincronizam aqui)
+-------------------+
        |
        v
   Treinador (UI)
   - relatório do treino
   - histórico do atleta
```

- **Sem servidor próprio de saúde.** Dados ficam no telefone até a leitura final, e só então o **resumo** vai para Firestore.
- **Sem séries brutas no Firestore por padrão** (só agregados); séries detalhadas, se necessário, ficam num documento separado e podem ser limitadas/excluídas pelo atleta.

---

## 4. Métricas adotadas

### 4.1. Tier 1 (essenciais — v1)
- **Frequência cardíaca** (série + média + máx + mín + tempo em zonas)
- **Calorias ativas** no período
- **Workout sessions** (sessões marcadas pelo relógio: musculação, corrida, ciclismo, HIIT, etc.)
- **Duração efetiva** (minutos com FC ativa)

### 4.2. Tier 2 (relevantes — v1.x)
- **Distância** (caminhada, corrida, ciclismo)
- **Passos**
- **Cadência** (corrida)
- **Pace** (corrida)
- **VO2max** (apenas leitura — quando fornecido pelo relógio)

### 4.3. Tier 3 (avançado — v2+)
- **HRV** (variabilidade da FC)
- **Sono na noite anterior**
- **Frequência respiratória**
- **Peso (acompanhamento longitudinal)**

### 4.4. Zonas de FC
- Calculadas no client a partir de **FCmáx estimada** (idade, fórmula `220 − idade`) ou **FCmáx informada manualmente** no perfil do atleta.
- 5 zonas padrão (Z1–Z5).
- Apresentação: tempo em cada zona (segundos) + percentual da sessão.

---

## 5. Modelo de dados Firestore (proposta)

> Mantemos prefixo **`coachem`** seguindo o padrão atual.

### 5.1. Documento de saúde por treino

Coleção: `coachemAssignedWorkouts/{workoutId}/health/{userId}`

```ts
{
  collectedAt: Timestamp,
  startedAt: Timestamp,
  completedAt: Timestamp,
  source: 'healthkit' | 'healthconnect',
  device: string | null,        // ex. 'Apple Watch Series 9'
  heartRate: {
    avg: number | null,
    max: number | null,
    min: number | null,
    samplesCount: number,
    zones: {                    // segundos em cada zona
      z1: number,
      z2: number,
      z3: number,
      z4: number,
      z5: number,
    } | null,
  } | null,
  caloriesActive: number | null,
  distanceMeters: number | null,
  steps: number | null,
  workoutSessions: Array<{
    type: string,               // 'running' | 'strength' | ...
    durationSec: number,
    caloriesActive: number | null,
    distanceMeters: number | null,
    avgHeartRate: number | null,
    maxHeartRate: number | null,
  }>,
  vo2max: number | null,        // se fornecido pelo dispositivo
  notes: string | null,         // ex. erros parciais
}
```

### 5.2. Configuração do atleta

> **Ajuste 2026-05-13:** o projeto usa coleção `users` (não `coachemUsers`).
> Os campos abaixo vão em `users/{uid}` (real no projeto).

Em `users/{uid}`:

```ts
healthIntegration: {
  enabled: boolean,             // atleta autorizou
  platform: 'healthkit' | 'healthconnect' | null,
  permissionsGrantedAt: string | null,   // ISO date string
  permissionsRevokedAt: string | null,
  fcMaxOverride: number | null, // se atleta informar FCmáx manualmente
  ageOverride: number | null,
}
```

### 5.3. Configuração do treinador

Em `users/{uid}` (treinador):

```ts
proPlusHealth: {
  active: boolean,
  since: Timestamp | null,
  via: 'apple' | 'google',
}
```

> Plan gating é feito por **RevenueCat** (entitlement); o flag `proPlusHealth.active` aqui é só leitura/cache para UI rápida.

### 5.4. Regras de segurança (Firestore) — princípio

- Atleta **só pode escrever** no próprio `users/{uid}.healthIntegration`.
- Atleta pode escrever no documento `health/{userId}` do **seu** treino (`coachemAssignedWorkouts/{workoutId}` em que o `athleteId == auth.uid`).
- Treinador pode **ler** os documentos de health dos atletas que pertencem a ele (mesma regra atual de visibilidade).
- Nada de leitura cruzada entre treinadores diferentes.

---

## 6. UX dos fluxos

### 6.1. Atleta — primeira ativação
1. Em **Perfil** aparece nova seção **“Conectar dispositivo de saúde”** (somente se o treinador tem Pro+ Health).
2. Atleta toca → tela explica:
   - o que será coletado,
   - quando (apenas durante o treino),
   - quem vê (somente seu treinador),
   - como revogar.
3. Atleta confirma → app pede permissões nativas (HealthKit ou Health Connect).
4. Atleta retorna ao app com status **Conectado**.

### 6.2. Atleta — fluxo de treino
1. Atleta abre treino do dia.
2. Toca **Iniciar treino** → app grava `startedAt` localmente e em Firestore.
3. Atleta executa o treino (com ou sem relógio).
4. Toca **Concluir treino** → app grava `completedAt`.
5. Em background curto (com loading discreto):
   - app consulta HealthKit / Health Connect entre `startedAt` e `completedAt`,
   - calcula agregados,
   - salva em `health/{userId}`.
6. Tela de resumo aparece para o atleta.

### 6.3. Atleta — sem permissão / sem relógio
- O fluxo continua **idêntico ao atual**.
- Sem dados health, mostra apenas **duração do treino**.
- Treinador continua vendo o que vê hoje.

### 6.4. Treinador — relatório enriquecido
- Em **Detalhes do treino** do atleta:
  - card **“Dados do dispositivo”** com FC média/máx/min, zonas, calorias, distância, passos, sessions.
  - link **“Ver detalhes”** mostra zonas em barra horizontal e lista de sessions detectadas.
- Em **Perfil do atleta**, novo gráfico opcional:
  - FC média por treino (últimos N treinos).
  - Tempo em zonas por semana.
  - Calorias ativas por semana.

### 6.5. Treinador — convite e gating
- Se treinador **não** tem Pro+ Health: bloco aparece bloqueado, com CTA **“Ver planos”**.
- Se treinador tem Pro+ Health mas o atleta **não** autorizou: aparece **“Aguardando autorização do atleta”**.

---

## 7. Permissões e configurações

### 7.1. iOS (HealthKit)
- `app.json`:
  - `ios.infoPlist`:
    - `NSHealthShareUsageDescription` (texto explicativo claro em PT/EN)
    - `NSHealthUpdateUsageDescription` (mesmo se só leitura, deixar declarado é seguro para futuro)
  - `ios.entitlements`:
    - `com.apple.developer.healthkit`
    - `com.apple.developer.healthkit.access` (com tipos)
- **Importante:** Apple exige **descrições muito claras** do uso, ou rejeita.
- **Não usaremos** acesso a dados clínicos (sem `clinical-health-records`).

### 7.2. Android (Health Connect)
- Permissões dinâmicas (in-app):
  - `android.permission.health.READ_HEART_RATE`
  - `android.permission.health.READ_ACTIVE_CALORIES_BURNED`
  - `android.permission.health.READ_DISTANCE`
  - `android.permission.health.READ_STEPS`
  - `android.permission.health.READ_EXERCISE` (sessions)
  - `android.permission.health.READ_VO2_MAX` (opcional)
- App declara em `AndroidManifest.xml` os tipos solicitados.
- `targetSdkVersion >= 34` (já estamos compatíveis).
- Se Android < 14, app deve linkar para o **Health Connect** na Play (já cobrimos esse caso).

---

## 8. Bibliotecas

### 8.1. iOS — HealthKit
Candidatas:
- `react-native-health` (madura, larga adoção).
- `expo-health-kit` (mais simples, menor cobertura).

**Decisão preliminar:** `react-native-health` (mais cobertura).
**Requer:** Expo **Dev Client** (não roda em Expo Go).

### 8.2. Android — Health Connect
Candidata:
- `react-native-health-connect`

**Requer:** Expo **Dev Client**.

### 8.3. Build
- Atualizar **EAS** para gerar **dev clients** atualizados.
- Não há mudança de pricing pelo lado de bibliotecas (todas open-source).

---

## 9. Plano de monetização (Pro+ Health)

### 9.1. SKUs (sugestão)
- iOS:
  - `coachem_pro_plus_health_monthly`
  - `coachem_pro_plus_health_annual`
- Android (Play Billing):
  - `coachem_pro_plus_health_monthly`
  - `coachem_pro_plus_health_annual`

### 9.2. Entitlement (RevenueCat)
- Criar **entitlement** `pro_plus_health` em RevenueCat.
- Ofertas:
  - existente: **Pro** (sem health)
  - nova: **Pro+ Health** (inclui Pro + saúde)
- Usuário Pro pode “upgrade” para Pro+ Health (RevenueCat trata pro-rate).

### 9.3. UI
- Tela de **Subscription** ganha 3 cards:
  - Free
  - Pro
  - **Pro+ Health** (destacado “Recomendado”)
- Cada card explica diferenças de forma direta.

### 9.4. Política comercial
- Pro+ Health é benefício **do treinador**, mas **dependente do atleta autorizar**.
- Comunicação clara em copy e FAQ para evitar reclamações.

---

## 10. Política de privacidade e Segurança dos dados

### 10.1. Política de privacidade
- Adicionar seção **“Dados de Saúde e Bem-estar”**.
- Detalhar: tipos coletados, finalidade, retenção, compartilhamento (somente coach do atleta), direito de revogação.
- Atualizar versões PT/EN no hosting.

### 10.2. Play – Segurança dos dados
- Atualizar declaração para incluir:
  - **Informações de fitness** (já existe)
  - **Informações de saúde** (FC, calorias, etc.)
- Marcar:
  - Recolhidos **Sim**
  - Partilhados **Não**
  - Efêmero **Não**
  - Necessário **Os utilizadores podem escolher**
  - Motivos: **Funcionalidade da app** (e **Personalização** se ajustarmos plano de treino com base nisso).

### 10.3. App Store – App Privacy
- Adicionar tipo **Health & Fitness** com finalidade **App functionality**.
- Atualizar Privacy Policy URL referenciada.

### 10.4. Termos de Uso
- Cláusula sobre uso de dados de saúde com base em consentimento.

---

## 11. Plano por fases

> Cada fase é **independente**, com release próprio. Validamos cada uma com testes manuais antes de avançar.

### **Fase 1 — Health Read MVP (4–6 semanas, ritmo confortável)**
- Health Connect (Android) + HealthKit (iOS), modo leitura.
- Botão **Iniciar / Concluir** treino atualizado para gravar timestamps.
- Coleta apenas após conclusão.
- Métricas: FC (série + agregados), calorias ativas, sessions, distância, passos.
- UI:
  - tela de consentimento do atleta,
  - card de saúde no detalhe do treino,
  - card no dashboard do treinador.
- **Sem plano novo nesta fase** — apenas funcionalidade ligada ao **Pro atual**.

### **Fase 2 — Plano Pro+ Health (1–2 semanas)**
- Criar SKUs nas duas lojas.
- Configurar entitlement na RevenueCat.
- Atualizar UI da `app/subscription.tsx` com novo card.
- Mover gating da feature health para `pro_plus_health`.
- Atualizar política de privacidade e declarações nas lojas.

### **Fase 3a — Apple Watch app (médio prazo)**
- Novo target watchOS no Xcode (Swift/SwiftUI).
- Funcionalidades mínimas:
  - listar treino do dia,
  - tela do exercício,
  - timer,
  - próximo / pausar / concluir.
- Comunicação com app via Watch Connectivity.

### **Fase 3b — Wear OS app (médio prazo)**
- Novo target Android (Kotlin + Compose for Wear).
- Funcionalidades equivalentes ao 3a.
- Comunicação via Wearable Data Layer.

### **Fase 3c — Garmin Connect IQ (longo prazo)**
- Avaliação posterior (nicho fitness sério).
- Linguagem Monkey C / SDK Connect IQ.

### **Fase 4 — Métricas avançadas (após base estabilizada)**
- HRV, sono, frequência respiratória, peso longitudinal.
- Painéis de tendências semanais e mensais.
- Comparativos entre atletas (somente para o treinador).

---

## 12. Riscos e mitigações

| Risco | Mitigação |
|------|-----------|
| Apple/Google rejeitar por descrição vaga de uso de saúde | Escrever copy de permissão clara e revisada. |
| Atleta sem relógio acha que precisa pagar Pro+ | UX explicando que dados são opcionais. |
| Dados imprecisos (relógios baratos) | Mostrar fonte (ex. “via Mi Fitness”) e marcar incerteza. |
| Bateria/UX no Android com Health Connect indisponível | Cair de volta para “sem dados”, sem travar app. |
| Custos de revisão extra na Apple por mudança de privacy | Soltar Fase 1 com release maior, agrupando mudanças. |
| Confusão entre Pro e Pro+ Health | Comparativo visual claro na tela de assinatura. |

---

## 13. Checklist de pré-implementação (a aprovar antes de codar)

- [ ] Texto exato das permissões em iOS (PT/EN).
- [ ] Texto exato da tela de consentimento do atleta (PT/EN).
- [ ] Lista final de métricas Tier 1 confirmada.
- [ ] Esquema de zonas de FC confirmado (5 zonas, FCmáx por idade).
- [ ] Modelo de dados Firestore aprovado.
- [ ] Regras de segurança Firestore aprovadas.
- [ ] Bibliotecas escolhidas confirmadas (`react-native-health` + `react-native-health-connect`).
- [ ] SKUs Pro+ Health definidos e criados nas lojas.
- [ ] Entitlement `pro_plus_health` criado na RevenueCat.
- [ ] Política de privacidade atualizada (rascunho aprovado).
- [ ] Comunicação do atleta sobre privacidade revisada.
- [ ] Plano de testes manuais escrito.

---

## 14. Próximos passos (após este documento)

1. Tu revisas este plano e marcas:
   - tudo que **concordas**,
   - itens que queres **alterar**,
   - itens que queres **adiar**.
2. Criamos branch `feat/health-integration`.
3. Iniciamos **Fase 1** somente quando o checklist estiver verde.

---

> Este documento deve ser atualizado a cada decisão tomada.
> Histórico de revisões abaixo.

| Data | Autor | Resumo |
|------|-------|--------|
| 2026-05-09 | inicial | Criação do plano e estrutura de fases |
