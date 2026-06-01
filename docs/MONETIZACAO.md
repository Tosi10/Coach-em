# Plano de monetização — Coach'em

Documento vivo para orientar produto, implementação e conformidade. Última revisão conceitual alinhada ao app publicado na App Store e limites atuais do plano gratuito. **Última atualização de checklist:** 2026-05-02 (A/B/C storefront + RC + `.env`/EAS + código base de limites e SDK RevenueCat marcados como feitos; paywall + webhook + build dev iPhone pendentes). **Diário de execução/debug:** 2026-05-04 (inclui **H** — causa raiz Git + commit `4fe7b2d` + build; ver “Diário — 2026-05-04”).

---

## Diário — 2026-05-04 (debug IAP / RevenueCat / App Store Connect)

Resumo **operacional** do que foi tentado hoje para destravar compra Pro mensal e metadados Apple — para não repetir loops nem “achismos”. **Leitura obrigatória se os builds “não mudam nada”:** secção **H** (push vs `origin/main` + commit `4fe7b2d`).

### A) Sintomas no app (TestFlight / iPhone)

- Botão **“Assinar Pro — mensal”** parecia **não responder** em builds antigos: no código havia `disabled` quando não existia `monthlyPackage` (pacote null) — UX ruim (parecia “morto”).
- Em builds seguintes, aparecia mensagem pedindo **`EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`** / “RevenueCat não configurado”, **apesar** da variável existir no dashboard Expo e aparecer carregada no log do `eas build` (ambiente `production`).

### B) O que foi validado como “certo” (não era o culpado)

- **Expo (EAS)**: `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` existe no projeto, marcada para `development` + `preview` + `production`, visibilidade **Plain text**.
- **Smoke test sem build**: `eas env:exec production ...` confirmou que o valor **existe** no ambiente `production` (Windows precisou de `cmd /c echo %VAR%`; `printenv` não existe no Windows).
- **RevenueCat ↔ Apple (catálogo)**: após configurar credenciais corretas no dashboard, o produto saiu de estados tipo **Could not check** e evoluiu para **Ready to Submit** quando a App Store Connect ficou consistente.

### C) App Store Connect / metadados (bloqueios reais encontrados)

- **“Could not check” / preço `$rc_monthly` na RC**: típico de **credenciais Apple incompletas na RC** (ex.: App Store Connect API key `AuthKey_*.p8` + Key ID + Issuer ID; e/ou In‑App Purchase key conforme UI da RC). Foi corrigido no fluxo manual (sem detalhar segredos aqui).
- **“Missing metadata” / “Faltam metadados”** no produto `coachem_pro_monthly`: não era “falta de preço” (chegou a ficar com **175 países** precificados). Faltava **metadado do grupo de assinaturas** — secção **Idioma** do grupo `Coach'em Pro` estava vazia; ao criar localização do grupo, o produto passou para **Pronto para envio**.
- **Texto azul da Apple (“primeira assinatura com nova versão…”)**: a UI da **versão do app** pode não mostrar imediatamente “Compras dentro de apps e assinaturas” até o fluxo estar coerente; no fim apareceu e foi possível **selecionar** `Pro Mensal` na versão (ex.: `1.2`) — sem obrigar “mandar revisão” naquele instante se não quiserem.

### D) Hipótese técnica principal no app (bundle release) — corrigida no código

Havia leitura da chave iOS assim: `process.env.EXPO_PUBLIC_...?.trim()`.

**Risco:** optional chaining direto em `process.env.EXPO_PUBLIC_*` pode impedir o Metro de **inlinar** variáveis `EXPO_PUBLIC_` no bundle de **release/TestFlight**, resultando em `undefined` no device — exatamente o sintoma “EAS tem a env, mas o app acha que não tem”.

**Correção aplicada:** trocar para leitura “segura” sem `?.` em `process.env.EXPO_PUBLIC_*` (guardar em variável local e só então `trim()`), em `src/services/revenueCat.service.ts`.

### E) Melhorias de diagnóstico (para não voltar ao “mesmo aviso”)

- `ensureRevenueCatConfigured` passou a guardar `lastConfigurationError` e expor `getRevenueCatConfigurationError()`.
- `app/subscription.tsx`: quando `configured === false`, mostrar **`RC: <detalhe>`** também em produção/TestFlight (não esconder só em `__DEV__`), e o alerta de compra deixa de ser genérico quando o erro não é “missing key”.

### F) Builds / custo (contexto)

- Vários builds iOS `production` foram disparados ao longo do dia (incremento remoto de `ios.buildNumber` via EAS).
- **Créditos EAS**: o próprio CLI reportou uso alto (~91% do incluso no mês) num build — builds custam; daqui pra frente: **1 mudança lógica por tentativa** + checklist antes de rebuild.

### G) Próximo passo único (definição de sucesso) — checklist técnico

- **Código no remoto antes do EAS:** fluxo típico da Expo = clone do **GitHub**; **obrigatório** `git push origin main` (ou a branch que o perfil usa) **antes** do `eas build`, senão o `.ipa` compila commits antigos do `origin/main`.
- **Build `production` iOS** com commit que inclua: inlining seguro da `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` (secção **D**), lock síncrono em `ensureRevenueCatConfigured`, **`finally` que limpa `configurePromise` em todos os returns** (secção **H**), e `app/subscription.tsx` com **`RC:`** + compra/restauro a voltarem a chamar `ensure` (secção **H**).
- No painel **EAS**, confirmar o **SHA do commit** do build (não é segredo — é rastreabilidade).
- **Sucesso** se no TestFlight:
  - RevenueCat **configura** (some o estado “sem chave”), e/ou
  - aparece **`RC:`** com erro **concreto** (`missing_api_key`, mensagem nativa, etc.) — aí o próximo passo é EAS/env, RC/App Store, ou compatibilidade SDK/native, **já com evidência na UI**.

### H) Causa raiz de “TestFlight igual” + o que foi fechado no Git/código (2026-05-04, fim do dia)

**Problema operacional (principal):** o `main` **local** tinha vários commits (incl. `949110a` — RevenueCat lock + inlining), mas o **`origin/main` no GitHub ficou em `b8e1732`** durante vários `eas build`. A cloud EAS compila o **remoto** → os builds TestFlight **não incluíam** paywall/diagnóstico/RevenueCat novos, mesmo com commit e mensagem corretos no PC. Sintoma: mesmo ecrã, **sem linha `RC:`** (UI antiga ou bundle antigo).

**Correção Git (feita no repo):**

- `git push origin main` bem-sucedido: `b8e1732..4fe7b2d` em `https://github.com/Tosi10/Coach-em.git`.
- **HEAD remoto** passou a ser **`4fe7b2d`** — *“fix(ios): RevenueCat - finally liberta lock em todos os paths; compra/restauro re-await ensure”*.

**Correções de código em `4fe7b2d` (resumo):**

- **`src/services/revenueCat.service.ts`:** o `finally { configurePromise = null }` estava **só** à volta do `try` do `Purchases.configure`; returns cedo (`missing_api_key`, plataforma desconhecida, `configured` já true) **saltavam** esse `finally` → `configurePromise` podia ficar preso numa promise já resolvida e **impedir novas tentativas** de `configure`. **Correção:** `try/catch/finally` à volta de **todo** o corpo async do configure, com **`configurePromise = null` sempre no `finally`**.
- **Mesmo ficheiro:** `lastConfigurationError` em paths que antes devolviam `false` sem detalhe (ex.: `web`, plataforma não iOS/Android), e no handler de **rejeição** da promise interna.
- **`app/subscription.tsx`:** em **compra** e **restauro**, **`await ensureRevenueCatConfigured()`** antes de confiar só no estado do último `reload` — evita alerta “detalhes vazios” por estado React desatualizado.

**Histórico de commits relevantes no `main` (ordem):** `5597525` (inlining + diagnóstico), `949110a` (lock síncrono inicial), **`4fe7b2d`** (finally global + re-await na UI).

**Build disparado após o push (comando registado):**

```bash
eas build -p ios --profile production --auto-submit
```

**Lição explícita:** “commit local” ≠ “código no build da EAS”. Para o fluxo standard: **`commit` → `push` → confirmar SHA no GitHub e no painel EAS → `eas build`**.

### I) Atualização — 2026-05-05 (oferta em falta, fallback e diagnóstico explícito)

**Estado observado no TestFlight (build 1.0.35):**

- RC inicializa (sumiu erro de configuração), mas a UI mostra “**Oferta não encontrada**”.
- Build `1.0.35` foi confirmado via EAS com commit **`8d85ad3`** (`gitCommitHash` no `eas build:list`), ou seja, já continha o fallback de compra por produto direto.

**Conclusão técnica desta etapa:**

- O problema deixou de ser “chave/env/SDK não inicializa”.
- O gargalo passou a ser **catálogo retornado em runtime** (offering vazio e/ou `getProducts` vazio no device), mesmo com RC/ASC visualmente corretos.

**Mudanças aplicadas no código (2026-05-05):**

- `src/services/revenueCat.service.ts`
  - Fallback de compra por produto direto (`getProducts([coachem_pro_monthly])` + `purchaseStoreProduct`) quando package do offering não vem.
  - Nova função `collectRevenueCatDiagnostics()` para gerar snapshot com:
    - `canMakePayments`
    - offering current (`identifier`)
    - número/lista de packages da offering
    - número/lista de produtos retornados por `getProducts`
    - erro técnico atual (`lastConfigurationError`)
- `app/subscription.tsx`
  - Quando `monthlyPackage` está vazio e RC configurado, a tela passa a exibir **`RC DIAG: ...`** com métricas objetivas.
  - Em falha de compra, atualiza novamente o diagnóstico para mostrar estado real pós-tentativa.

**Objetivo da instrumentação:**

- Parar interpretação ambígua de mensagem genérica.
- Distinguir claramente:
  - problema de offering current,
  - problema de retorno de produtos da Apple (`getProducts`),
  - ou bloqueio de pagamento (`canMakePayments=false`).

---

## 1. Objetivo

- Manter um **plano gratuito** com limites claros (atração e prova de valor).
- Oferecer **assinatura paga** que desbloqueia limites e, no futuro, diferenciais de produto.
- Cobrar de forma **profissional e compatível com as regras da Apple**, sem armazenar dados sensíveis de pagamento no Coach'em.

---

## 2. O que “terceirizar” significa aqui (LGPD e pagamento)

### 2.1 Dados de cartão e identificação fiscal para cobrança

- O **Coach'em não precisa — e não deve — coletar número de cartão, CVV ou dados bancários** para vender assinatura dentro do app iOS.
- **CPF/CNPJ para fins exclusivos de pagamento** também ficam, em regra, com o **ecossistema da Apple** (conta Apple ID, fatura, método cadastrado na App Store). O app recebe apenas o **resultado da compra** (assinatura ativa ou não), via APIs oficiais.
- Na prática, **quem processa o pagamento do usuário final na App Store é a Apple** (In-App Purchase). Vocês continuam sendo **controladores** dos dados **do produto** (conta, treinos, atletas etc.), mas **não operam** o meio de pagamento.

### 2.2 Responsabilidade e boas práticas

- Manter **Política de Privacidade** e **Termos de Uso** atualizados, citando:
  - finalidades dos dados que o app **de fato** trata;
  - uso de **Firebase, Apple, ferramentas de analytics/crash** (subprocessadores);
  - que **compras in-app** são geridas pela Apple.
- Documentar internamente um fluxo simples para **direitos do titular** (acesso, correção, exclusão) mesmo que parte do processo seja manual no início.

*Este trecho é orientação de produto e compliance em alto nível, não substitui parecer jurídico.*

---

## 3. Proposta de planos e preços

### 3.1 Plano Grátis (atual — baseline)

Limites alinhados ao código em `src/constants/freePlan.ts`:

| Recurso        | Limite |
|----------------|--------|
| Atletas        | 3      |
| Treinos-modelo | 5      |
| Exercícios     | 7      |

Objetivo: permitir que o treinador **valide o app** com poucos alunos, sem custo.

### 3.2 Plano Pro — **R$ 59,90 / mês** (recomendado como primeiro plano pago)

**Opinião:** R$ 59,90 é um **preço sólido** para coach solo ou pequeno volume no Brasil: comunica valor, cobre margem após comissão da Apple e deixa espaço para cupons ou promoções futuras sem “quebrar” a tabela.

Limites acordados para o **Pro** (Premium com tetos maiores ou ilimitado fica para fase 2):

| Recurso        | Pro (v1) — **definido** |
|----------------|-------------------------|
| Atletas        | **25**                  |
| Treinos-modelo | **50**                  |
| Exercícios     | **100**                 |

*Revisar após métricas de uso e custo Firebase.*

**Preços Pro (referência):** **R$ 59,90 / mês** (Brasil) e **US$ 12,99 / mês** (EUA, tier App Store). Nas demais regiões, usar **equalização automática** da App Store a partir de uma vitrine base (Brasil ou EUA) e revisar outliers se necessário.

**Versão em inglês do app:** é **localização de interface**; o mesmo SKU de assinatura serve todos os países — não é obrigatório um preço “por idioma”, e sim por **loja/região** do usuário.

**Produto opcional na mesma família:** assinatura **anual** com desconto (ex.: ~10–12× o mensal, equivalente a 2 meses “grátis”), configurada como outro SKU na App Store.

### 3.3 Plano Premium (fase 2)

- **Posicionamento:** “sem teto prático” para atletas, exercícios e treinos-modelo — ou limites muito altos (ex.: 200+ atletas) para não comprometer infraestrutura.
- **Preço:** definir depois do Pro estabilizar (ex.: faixa **R$ 99–149/mês** ou anual agressivo), sempre validando com usuários e concorrentes.
- **Regra:** só introduzir quando houver demanda clara (estúdios, franquias); evita confundir o lançamento do primeiro pago.

### 3.4 Resumo da escada

1. **Grátis** — limites atuais.  
2. **Pro — R$ 59,90/mês** (≈ US$ 12,99 nos EUA) — **25 / 50 / 100** atletas, treinos-modelo, exercícios.  
3. **Premium** — ilimitado (ou quase), posterior.

---

## 4. Via de pagamento dos usuários (obrigatório no iOS)

### 4.1 App Store — In-App Purchase (IAP)

- Para **funcionalidades digitais** desbloqueadas **dentro do app** (mais atletas, mais treinos, etc.), a Apple exige **In-App Purchase** (assinatura **auto-renovável**).
- O usuário paga com o **método já cadastrado na Apple** (cartão, saldo, etc.). O Coach'em **não** recebe nem armazena esses dados.

### 4.2 O que **não** usar como substituto na App Store (para esse tipo de venda)

- **Link externo** para checkout próprio (Stripe na web) **só** em cenários muito específicos e alinhados às **App Store Review Guidelines** e programas vigentes da Apple. Para assinatura de features do app, o caminho padrão e seguro é **IAP**.

### 4.3 Android (futuro)

- **Google Play Billing** — mesma lógica: Google processa o pagamento; o app recebe o estado da assinatura.

### 4.4 Ferramenta recomendada: **RevenueCat** (ou equivalente)

- Encapsula **StoreKit / Play Billing**, **restauração de compras**, **estado da assinatura** e **webhooks** para o backend.
- No Firebase, uma **Cloud Function** (ou serviço equivalente) atualiza o documento do treinador com: `plan`, `expiresAt`, `productId`, `status`, evitando confiar só no cliente.

**Fluxo resumido:** App inicia compra → Apple confirma → RevenueCat (ou servidor) notifica → Firestore marca `plan: pro` → `planLimits` e Functions respeitam o novo limite.

---

## 5. Implementação técnica (checklist)

- [x] Criar produto **mensal** na **App Store Connect** (`coachem_pro_monthly`, grupo Coach'em Pro, preços Brasil/EUA ou equalização; Sandbox testers).
- [x] Integrar **RevenueCat** no projeto: dashboard (app iOS `.p8`/keys, entitlement `pro`, offering `default` + package mensal) + **`EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`** em `.env` e EAS.
- [x] **Webhook RevenueCat** → Cloud Function `revenueCatWebhook` (ver §9.6); **deploy + URL na RC** ainda por si.
- [x] **Modelo no Firestore (`users/{uid}`):** código já lê `subscriptionTier` + `subscriptionExpiresAt`; campos passam a existir quando você testar manualmente ou quando o **webhook** gravar (próxima fase).
- [x] **Cloud Functions — limite de atletas:** `createAthleteByCoach` usa tier (Pro 25 / grátis 3); **deploy concluído** em `futeba-96395` (2026).
- [ ] **Cloud Functions — restante:** validação no servidor para **criação** de exercícios e treinos-modelo (hoje só o app + atletas no servidor).
- [ ] **Firestore Rules:** condicionar writes aos limites do plano (onde aplicável).
- [ ] **App:** tela de paywall, “Restaurar compras”, link para termos/privacidade; **publicar build** com o código de limites por tier (se ainda não saiu na loja/TestFlight).
- [ ] Testes em **Sandbox** Apple antes de liberar cobrança real em produção.

### 5.1 Ordem recomendada de implementação (padrão de mercado)

1. ~~**App Store Connect:** grupo “Coach'em Pro”, produto **mensal** `coachem_pro_monthly`; preços + Sandbox.~~ **Feito** (mensal).
2. ~~**RevenueCat:** projeto, app iOS, entitlement `pro`, offering/package mensal, chave `appl_`.~~ **Feito.** ~~**Webhook** → Firebase~~ Função **`revenueCatWebhook`** no repositório — **pendente deploy + URL RC + secret**.
3. **Firestore:** modelo `subscriptionTier` + `subscriptionExpiresAt` — **fonte da verdade** com **webhook**; até lá, teste manual no Console + entitlement no cliente.
4. ~~**Código de limites:** `FREE_PLAN_LIMITS` + `PRO_PLAN_LIMITS`; `planLimits.service.ts` lê o tier do Firestore.~~ **Feito.**
5. **Cloud Functions:** ~~atletas (`createAthleteByCoach`)~~ **feito**; falta **exercício + treino-modelo** no servidor.
6. **Firestore Rules:** onde couber, negar `create` que ultrapasse o plano (em conjunto com as Functions).
7. **App — UI:** ~~SDK `configure` + `logIn`~~ **feito.** Falta **paywall** + `purchasePackage` + **Restaurar** + fluxo ao bater limite (ver **5.2**).
8. **Revisão App Store:** notas com conta demo; testar compra em Sandbox (+ screenshot do fluxo quando a UI existir); declarar RevenueCat na privacidade se aplicável.

### 5.2 Onde o treinador vê os planos no app (UX profissional)

Padrão que usuários e revisores esperam:

| Onde | Função |
|------|--------|
| **Ajustes / Conta do treinador** | Entrada fixa **“Assinatura e plano”** ou **“Upgrade para Pro”**: mostra plano atual (Grátis / Pro), uso (ex.: 12/100 exercícios), data de renovação se Pro, botões **Assinar**, **Restaurar compras**, link **Gerenciar assinatura** (abre configurações da App Store / Apple ID — texto padrão da Apple). |
| **Paywall (tela modal ou full screen)** | Aberta quando o usuário **atinge o limite** ao criar atleta, exercício ou treino; lista **Grátis vs Pro** (tabela de limites), preço, termos, CTA **Continuar com Pro**, secundário **Agora não**. |
| **Opcional — Dashboard** | Card discreto “Você está no plano Grátis” com CTA **Ver planos** (não obrigatório no dia 1; evita poluir). |

**Boas práticas:** não prometer o que o IAP não cobre; preço igual ao da loja; **Restaurar compras** visível na tela de assinatura; após compra, **atualizar** tier via listener Firestore ou refresh pós-`purchaseCompleted`.

Referências no repositório:

- Limites grátis: `src/constants/freePlan.ts`
- Cliente: `src/services/planLimits.service.ts`
- Servidor (atletas): `functions/src/index.ts` (`assertCoachAthleteLimit`)

---

## 6. Próximos passos de produto (alinhado ao roadmap)

- Endurecer **enforcement no servidor** para todos os recursos limitados.
- Opcional: diferenciais Pro/Premium (relatórios, notificações avançadas, comunicação) conforme `ROADMAP_FUNCIONALIDADES.md`.
- **Expansão B2C (atleta solo + vínculo coach):** documento mestre [`ROADMAP_ATLETA_SOLO_E_VINCULO_COACH.md`](./ROADMAP_ATLETA_SOLO_E_VINCULO_COACH.md) — visão, UX (Início vs Treinos), monetização (Coach Pro / Athlete Pro / coached grátis), anti-abuso, matriz Firestore, fases P0–P6. Princípio: **reutilizar** ecrãs existentes; organizar permissões e gates.

---

## 7. Segurança, profissionalismo e lojas (checklist de conformidade)

*Não substitui leitura das políticas oficiais; revisar sempre a documentação vigente da Apple e do Google.*

### 7.1 Apple (App Store)

- **Conteúdo digital no app:** desbloquear com **In-App Purchase** (StoreKit), conforme [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) (regras sobre compras dentro do app e assinaturas).
- **UX de compra:** seguir [Human Interface Guidelines — In-App Purchase](https://developer.apple.com/design/human-interface-guidelines/in-app-purchase): preço claro antes de confirmar, termos da oferta, fluxo honesto.
- **Assinaturas:** botão **Restaurar compras** acessível; tratamento correto de **período de teste**, **renovação** e **cancelamento** (gestão na conta Apple do usuário).
- **Privacidade:** [Privacy details on the App Store](https://developer.apple.com/app-store/app-privacy-details/) — declarar coleta real; revisar com cada SDK (Firebase, Sentry, RevenueCat, etc.).
- **Revisão:** em “Notas para o revisor”, conta demo + passos para testar login e fluxo de assinatura em **Sandbox**.

### 7.2 Google Play (quando publicar Android)

- Assinaturas via **Google Play Billing** e políticas atuais em [Play Console Help](https://support.google.com/googleplay/android-developer/) e [Subscriptions](https://developer.android.com/google/play/billing/subscriptions).
- Acompanhar **mudanças de política e taxas** publicadas pelo Google (há programas regionais de faturamento alternativo; avaliar com jurídico antes de sair do billing padrão).

### 7.3 Coach'em (dados que vocês controlam)

- **Não armazenar** dados de cartão; **não** tratar o recibo Apple/Google como segredo no cliente sem validação no backend quando possível.
- **Backend como fonte da verdade** do plano (Firestore + webhook), para não depender só do app “honesto”.
- **Firestore Rules** e **Cloud Functions** alinhados aos limites do plano (anti-fraude básico).
- **HTTPS**, segredos só em **Secrets** das Functions, revisão periódica de **regras** e índices expostos.

---

## 8. Glossário rápido

| Termo        | Significado |
|-------------|-------------|
| IAP         | In-App Purchase — compra dentro da App Store |
| SKU         | Identificador do produto na loja (ex.: `coachem_pro_monthly`) |
| Entitlement | Direito do usuário após pagamento (ex.: limites Pro) |
| Webhook     | Chamada do servidor da RevenueCat para atualizar o Firebase |

---

## 9. Plano completo de implementação (do início ao fim)

**Regra de ouro:** concluir e **validar cada fase** (Sandbox, logs, Firestore de teste) antes de avançar. Melhor demorar do que misturar cobrança real com backend incompleto.

### 9.1 Visão das fases

| Fase | Nome | Entrega | Status |
|------|------|---------|--------|
| **0** | Preparação | Contas, documentação, decisões de produto | Em andamento (privacidade/termos podem precisar menção RC) |
| **1** | App Store Connect — só **mensal** | Grupo + produto Pro mensal; Sandbox | **Feito** |
| **2** | RevenueCat — base | Projeto, Apple, Offering mensal, chave pública | **Feito** |
| **3** | App — SDK | `configure` + `logIn(uid)` | **Feito**; compra Sandbox + **UI** → **pendente** |
| **4** | Webhook + Firebase | Function HTTPS → Firestore | **Código feito** — falta deploy + secreto + URL RC |
| **5** | Limites no app | `PRO_PLAN_LIMITS` + `planLimits.service.ts` | **Feito** |
| **6** | Backend — enforcement | Atletas **feito**; exercício + treino-modelo | **Parcial** |
| **7** | Firestore Rules | Reforço por plano | Pendente |
| **8** | UX | Paywall + Assinatura + Restaurar | Pendente |
| **9** | Produção iOS | Build dev/TestFlight + revisão | Pendente |
| **10** | **Anual** com desconto | 2º SKU; mesma entitlement `pro` | Depois do mensal |
| **11** | *(Opcional)* **Semestral** | 3º SKU | Opcional |

### 9.2 Fase 0 — Preparação

- [ ] Política de privacidade e termos mencionando assinatura, Apple e subprocessadores (Firebase, RevenueCat, etc.).
- [x] Conta **Apple Developer** e acesso ao **App Store Connect** (uso em curso).
- [x] Conta **RevenueCat** (uso em curso).
- [x] Product ID estável **mensal:** `coachem_pro_monthly` (anual `coachem_pro_annual` — fase 10).

### 9.3 Fase 1 — App Store Connect (só mensal)

Guia detalhado (você, manual): **`docs/PASSO_A_PASSO_ASSINATURA_MENSAL.md`** — Parte A.

- [x] Criar **grupo de assinaturas** (ex.: “Coach'em Pro”).
- [x] Criar assinatura **auto-renovável mensal** com Product ID **`coachem_pro_monthly`** e preços (Brasil / EUA ou equalização).
- [x] Preencher **nome de exibição** e **descrição** para o usuário.
- [x] Configurar **usuários Sandbox** no App Store Connect para testes.
- [ ] **Validação:** compra Sandbox no dispositivo **após** UI de compra + dev build / TestFlight.

### 9.4 Fase 2 — RevenueCat

Guia detalhado: **`docs/PASSO_A_PASSO_ASSINATURA_MENSAL.md`** — Parte B.

- [x] Criar projeto; configurar **App** iOS (`com.vision10.coachem`) com credenciais (ex.: `.p8` / Key ID / Issuer).
- [x] **Entitlement** `pro`; produto **`coachem_pro_monthly`** → `pro`.
- [x] **Offering** `default` com **package mensal** → `coachem_pro_monthly`.
- [x] **API key pública** `appl_...` em `.env` e EAS (`EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`).
- [ ] **Validação completa:** dev build no **iPhone** + logs RC em debug no login; compra Sandbox após paywall MVP.

### 9.5 Fase 3 — App: SDK (base)

- [x] Dependências `react-native-purchases` + `expo-dev-client`; `revenueCat.service.ts` + `AuthContext` com `syncRevenueCatWithFirebaseUser`.
- [ ] (Opcional) Tela de **dev** ou flag: mostrar entitlement `pro` / offerings — ou ir direto ao **paywall MVP**.
- [x] Paywall MVP: tela **Assinatura** (`/subscription`) — `getOfferings` / package mensal, **`purchasePackage`** + **Restaurar compras**.
- [ ] **Validação:** development build no **iPhone físico** + Sandbox; comprar mensal e ver Firestore actualizado via webhook.

### 9.6 Fase 4 — Webhook → Cloud Function → Firestore

- [x] Cloud Function HTTPS **`revenueCatWebhook`** (`functions/src/revenueCatWebhook.ts`): valida cabeçalho **`Authorization`** contra o secret **`REVENUECAT_WEBHOOK_AUTHORIZATION`** (Firebase Secret Manager = mesmo valor configurado no webhook na RevenueCat).
- [x] Atualiza `users/{app_user_id}` quando `userType === 'COACH'`: `subscriptionTier`, `subscriptionExpiresAt`, metadados (`revenueCatSyncedAt`, etc.). Eventos tratados: compra/renovação/expiração/`TRANSFER`/`TEST`, com entitlement **`pro`** (`expiration_at_ms`).
- [x] **Firestore Rules:** utilizador não pode alterar campos de billing (`subscriptionTier`, `subscriptionExpiresAt`, …) no próprio documento `users/{uid}` — só Admin / webhook.
- [ ] **Operacional:** definir secret (`firebase functions:secrets:set REVENUECAT_WEBHOOK_AUTHORIZATION`), deploy (`firebase deploy --only functions:revenueCatWebhook,firestore:rules`), URL da função na RevenueCat → Webhooks, enviar evento **TEST** e confirmar campo no Firestore ou logs.

### 9.7 Fase 5 — Limites no cliente

- [x] Constantes `FREE_PLAN_LIMITS` e `PRO_PLAN_LIMITS` (25 / 50 / 100).
- [x] `planLimits.service.ts` lê tier do **Firestore** (`getCoachSubscriptionTier`).
- [ ] **Validação:** teste manual em `users/{uid}` conforme `docs/TESTE_MONETIZACAO_FASE_LIMITES.md` (e build do app publicado, se ainda não estiver).

### 9.8 Fase 6 — Cloud Functions (enforcement)

- [x] Limite de **atletas** em `createAthleteByCoach` (deploy `futeba-96395`).
- [ ] Espelhar limites nas operações que **criam** exercício e treino-modelo (se ainda não existir Callable; avaliar ou reforçar só via Rules).
- [ ] **Validação:** cliente mal-intencionado não ultrapassa limites só com chamadas diretas.

### 9.9 Fase 7 — Firestore Rules

- [ ] Regras que negam criação acima do teto quando `subscriptionTier === 'free'` (e equivalente para `pro` se um dia houver teto Pro).

### 9.10 Fase 8 — UX final

- [ ] Paywall ao bater limite; tela **Assinatura** em ajustes; **Restaurar compras**; links legais.
- [ ] **Validação:** fluxo completo com conta Sandbox + conta demo para revisão Apple.

### 9.11 Fase 9 — Produção (iOS)

- [ ] Remover flags de debug se houver.
- [ ] Build de produção; submeter; notas de revisão com passos + login demo.
- [ ] Após aprovação, monitorar RevenueCat + erros nas Functions.

### 9.12 Fase 10 — Plano **anual** com desconto

- [ ] No **mesmo grupo** de assinaturas, criar produto **anual** (ex.: preço equivalente a ~10 meses do mensal — “2 meses grátis”).
- [ ] RevenueCat: adicionar produto; **mesma entitlement `pro`**; Offering com **dois packages** (mensal e anual).
- [ ] Paywall: dois CTAs ou seletor “Mensal / Anual (economize X%)”.
- [ ] Webhook já trata o mesmo entitlement; conferir `expiresAt` em renovações anuais.
- [ ] **Validação:** Sandbox anual + downgrade/cancelamento de teste.

### 9.13 Fase 11 — *(Opcional)* **Semestral** (6 meses)

A App Store permite períodos como **6 meses** em assinaturas auto-renováveis (além de mensal e anual). **Opinião:** o padrão de mercado que mais converte é **mensal + anual**. Semestral aumenta SKUs e a complexidade do paywall; use se houver pedido claro do público ou teste A/B.

Se implementar:

- [ ] Novo produto `coachem_pro_six_month` no mesmo grupo; preço entre mensal×6 e anual (desconto explícito na UI).
- [ ] RevenueCat: terceiro package, **mesma entitlement `pro`**.
- [ ] Textos legais e de renovação claros (“a cada 6 meses”).

---

### 9.14 Relação com as seções 5.1 e 5.2

A **seção 5.1** é o **resumo** operacional; a **seção 9** é o **roteiro completo** com critérios de validação e extensão até **anual** e **semestral opcional**. Manter as duas: uma para leitura rápida, outra para execução passo a passo.

### 9.15 Implementação em andamento no repositório

- **Limites Pro no código:** `src/constants/freePlan.ts` (`PRO_PLAN_LIMITS`) e `src/services/planLimits.service.ts` (lê `users/{uid}.subscriptionTier`).
- **Criação de atleta (servidor):** `functions/src/index.ts` — mesmo critério de tier.
- **RevenueCat (SDK base):** `src/services/revenueCat.service.ts`, `src/constants/subscriptions.ts`, `AuthContext`.
- **Guia manual passo a passo:** `docs/PASSO_A_PASSO_ASSINATURA_MENSAL.md`.
- **Como testar limites sem loja:** `docs/TESTE_MONETIZACAO_FASE_LIMITES.md`.

---

## 10. Manutenção Firebase / Google Cloud *(anotar para não ter surpresa)*

Após o último `firebase deploy --only functions` apareceram avisos; **não bloquearam o deploy**, mas convém tratar em um dia de manutenção:

| Item | O quê fazer |
|------|-------------|
| **Runtime Node.js 20** | Aviso de depreciação (desligamento após **2026-10-31**). Planejar upgrade para **Node 22** (ou o runtime suportado indicado na [doc de runtimes](https://cloud.google.com/functions/docs/runtime-support)) no `functions/package.json` (`engines`) e testar build local antes. |
| **`firebase-functions` antigo** | O CLI sugeriu `npm install --save firebase-functions@latest` na pasta `functions`. Fazer com calma: pode haver **breaking changes**; ler changelog e rodar `npm run build`. |
| **Limpeza de imagens de build (GCR)** | Mensagem: *“Unhandled error cleaning up build images”* — pode gerar **custo pequeno** se acumular. Revisar / apagar imagens antigas em https://console.cloud.google.com/gcr/images/futeba-96395/us/gcf (ou via Artifact Registry do mesmo projeto), ou tentar novo deploy depois. |

---

*Documento para execução interna. Ajustar preços, limites e datas conforme validação com usuários e orientação jurídica.*
