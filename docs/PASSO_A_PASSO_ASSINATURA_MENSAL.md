# Passo a passo — assinatura Pro **mensal** (Apple + RevenueCat + app)

Siga **na ordem**. Não avance para o passo seguinte até validar o anterior. O **Product ID** fixo do projeto é:

`coachem_pro_monthly`

(Deve ser **idêntico** na App Store Connect e na RevenueCat.)

---

## Parte A — App Store Connect (você faz no browser)

### A1. Entrar

1. Abra https://appstoreconnect.apple.com  
2. Faça login com a conta **Apple Developer** do app Coach'em.

### A2. Abrir a app

1. **Apps** → selecione **Coach'em** (bundle `com.vision10.coachem`).

### A3. Criar grupo de assinaturas

1. No menu da app, procure **Subscriptions** (Assinaturas) ou **In-App Purchases** conforme a interface atual.  
2. Crie um **Subscription Group** (grupo). Nome sugerido: `Coach'em Pro`.  
3. Confirme/grave o grupo.

### A4. Criar a assinatura mensal

1. Dentro do grupo, **Create Subscription** / **Adicionar assinatura**.  
2. **Product ID** (identificador): cole exatamente: **`coachem_pro_monthly`**  
   - Não use espaços; minúsculas como acima evitam erro de digitação no código.  
3. **Duração:** 1 month.  
4. **Nome de referência** (só para você): ex. `Pro mensal`.  
5. **Nome para exibição** (utilizador): ex. `Coach'em Pro`.  
6. **Descrição** (utilizador): texto claro do que inclui (atletas/treinos/exercícios conforme o site).

### A5. Preço

1. Na secção de preço, defina **Brasil** (ex.: R$ 59,90) e **EUA** (ex.: tier US$ 12,99) ou use **equalização** a partir de uma loja base.  
2. Guarde todas as alterações.

### A6. Submeter para revisão (quando a Apple pedir)

- In-App Purchases novos costumam precisar de **primeira submissão** junto com uma versão da app ou fluxo de revisão. Siga o que o Connect indicar.  
- Para **testes Sandbox**, não precisa estar “aprovado para venda” em todos os casos — use testers (A7).

### A7. Conta Sandbox (obrigatório para testar compra)

1. App Store Connect → **Users and Access** (Utilizadores e acesso).  
2. **Sandbox** → **Testers** → adicione um email **que não seja** o seu Apple ID principal (ex.: email de teste).  
3. No iPhone físico: **Settings → App Store → Sandbox Account** e inicie sessão com esse tester (iOS 18+ o caminho pode ser **Developer → Sandbox** — use a documentação Apple se mudar).

**Importante:** compras de subscrição em **simulador** são limitadas; use **dispositivo físico** com build de desenvolvimento ou TestFlight.

### A8. Validação da Parte A

- [x] Produto `coachem_pro_monthly` existe e está **Ready to Submit** / configurado.  
- [x] Preços definidos.  
- [x] Tester Sandbox criado.

---

## Parte B — RevenueCat (você faz no browser)

### B1. Conta e projeto

1. https://app.revenuecat.com — crie conta ou entre.  
2. **Create project** → nome ex.: `Coach'em`.

### B2. Ligar a app iOS

1. **Project settings** → **Apps** → **Add app** → **iOS**.  
2. **Bundle ID:** `com.vision10.coachem` (igual ao `app.json`).  
3. Cole o **App-Specific Shared Secret** ou as credenciais que o assistente pedir (App Store Connect → app → **App Information** / keys — siga o link da RevenueCat).  
4. Guarde.

### B3. Entitlement

1. **Entitlements** → **New** → identificador: **`pro`** (tem de coincidir com `REVENUECAT_ENTITLEMENT_PRO` no código).

### B4. Produto (importar da Apple)

1. **Products** → **Add** → escolha **Import from App Store Connect** ou adicione manualmente o ID **`coachem_pro_monthly`**.  
2. Associe o produto à entitlement **`pro`**.

### B5. Offering

1. **Offerings** → o offering **default** (ou crie `default`).  
2. Adicione um **Package** (ex.: **Monthly**) ligado ao produto **`coachem_pro_monthly`**.  
3. Guarde.

### B6. API key pública (iOS)

1. **Project settings** → **API keys** → copie a chave **Apple App Store** pública (começa por `appl_`).  
2. **Não** use a chave secreta no app.

### B7. Validação da Parte B

- [x] App iOS com bundle correto.  
- [x] Entitlement `pro`.  
- [x] Produto `coachem_pro_monthly` → `pro`.  
- [x] Offering `default` com package mensal (`$rc_monthly` / Monthly).  
- [x] Chave pública `appl_...` copiada (apenas no `.env` / EAS — nunca a secreta no app).

---

## Parte C — Variáveis no computador (você) — **feito**

1. Na raiz do projeto, no ficheiro **`.env`** (não commitado):  
   `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_xxxxxxxx`  
2. Reinicie o Metro (`npx expo start`) para carregar a variável.  
3. No **EAS** (expo.dev → projeto → **Environment variables**): mesma variável nos perfis **development**, **preview** e **production** (para builds na nuvem terem IAP).

---

## Parte D — O que já está no código (feito pelo repositório)

- Pacotes: `react-native-purchases`, `expo-dev-client`.  
- `src/constants/subscriptions.ts` — IDs (produto mensal + entitlement `pro`).  
- `src/constants/freePlan.ts` — limites Grátis e **Pro (25 / 50 / 100)**.  
- `src/services/planLimits.service.ts` — lê `subscriptionTier` / expiração no Firestore e aplica limites.  
- `functions/src/index.ts` — limite de **atletas** no servidor (Pro vs grátis); deploy **`futeba-96395`**.  
- `src/services/revenueCat.service.ts` — `configure` + `logIn(uid)` após Firebase Auth.  
- `src/contexts/AuthContext.tsx` — sincroniza o utilizador com a RevenueCat.

**Sem chave no `.env`:** o app funciona como antes; só aparece aviso em consola em desenvolvimento.

**Ainda não:** tela de plano/paywall, `purchasePackage`, restaurar compras, **webhook** para gravar tier no Firestore.

---

## Parte E — Build para testar IAP (você) — **pendente até instalar no iPhone**

**Expo Go não testa IAP completo.** É preciso **development build** (ou TestFlight):

```bash
eas build --profile development --platform ios
```

Instale o `.ipa` no iPhone, depois:

```bash
npx expo start --dev-client
```

Abra o app pelo **Dev Client** e faça login com o utilizador Firebase.

**Custo:** o plano **gratuito da Expo** inclui créditos limitados de build na nuvem; builds iOS na EAS **consomem créditos** (não é “pagar por abrir o app”, e sim por **compilar** na cloud). Alternativa em Mac: `npx expo run:ios` gera build **local** (sem custo EAS, mas precisa de Xcode).

Subscrições em **simulador iOS** são fracas; para **comprar de verdade em Sandbox** use **iPhone físico** + build de dev ou TestFlight.

---

## Parte F — Conexão RevenueCat **vs** tela de plano (ordem)

| O quê | Para quê | Obrigatório antes do paywall? |
|--------|-----------|-------------------------------|
| **Só abrir o app** (dev build + login Firebase) | Ver na consola `configure` + `logIn(uid)` da RevenueCat em **DEBUG**; confirmar que não há erro de API key | **Não** é obrigatório parar o roadmap aqui — é um *sanity check* de 5 minutos quando o `.ipa` estiver instalado. |
| **Tela de plano (MVP)** | `getOfferings` + botão comprar (`purchasePackage`) + **Restaurar** | **Sim**, para **testar o fluxo de compra** de ponta a ponta na loja Sandbox. |
| **Webhook → Firestore** | `subscriptionTier` / `subscriptionExpiresAt` atualizados **no servidor** (fonte da verdade) | Pode vir **logo após** o MVP da tela ou em paralelo; até lá, dá para testar **entitlement no cliente** e simular Pro no Firestore à mão para limites. |

**Resumo:** não precisamos “só testar conexão” durante semanas — o **próximo passo útil no código** é o **MVP da tela de plano**. Quando o `.ipa` estiver no telemóvel, abrir o app e ver os logs já valida a ligação básica; **compra** mesmo só com botão na UI.

### Próximo passo técnico (repositório)

1. ~~**UI:** tela **Assinatura / plano** + paywall ao bater limite + `purchasePackage` + **Restaurar compras**.~~ **Feito.**  
2. **Webhook** no código **feito** — falta **deploy**, **secret** e **URL na RevenueCat** (ver **Parte G** abaixo).

**A + B + C + tela de planos** estão feitos — segue **Parte G** para o Firestore atualizar sozinho após compras.

---

## Parte G — Webhook RevenueCat → Firebase (passo a passo real)

### G0. Para que serve isto tudo?

- Quando alguém **compra ou renova** o Pro, a **Apple/Google** falam com a **RevenueCat**.  
- A RevenueCat **chama o teu servidor** (a Cloud Function `revenueCatWebhook`) com um **POST** em JSON.  
- A função **escreve no Firestore** em `users/{uid}`: `subscriptionTier: pro`, `subscriptionExpiresAt`, etc.  
- Assim o **Coach’em** (limites, Cloud Function de atletas) confia no **servidor**, não só no telemóvel.

### G1. A “chave” de 32+ caracteres — o que é **e não é**

| Não é | É |
|--------|---|
| A chave pública `appl_...` do SDK (isso já está no `.env`) | Um **segredo escolhido por ti** (como uma palavra-passe longa) que **só tu** e a **RevenueCat** conhecem |
| Uma chave da Apple | Usada **só** para o teu endpoint não ser aberto por qualquer pessoa na internet |

**Para que serve:** em cada pedido da RevenueCat, o cabeçalho HTTP **`Authorization`** traz esse valor. A Cloud Function compara com o que guardaste no **Google Secret Manager** (`REVENUECAT_WEBHOOK_AUTHORIZATION`). Se for diferente → **401** e ninguém consegue fingir compras no teu Firestore.

**“32 dígitos”:** foi só uma sugestão de **tamanho mínimo** (ex.: 32 bytes em hex = 64 caracteres). Podes usar **40–64 caracteres** aleatórios. Não precisa ser “exatamente 32”.

### G2. Como **criar** esse segredo (Windows / qualquer um)

**Opção A — PowerShell (recomendado no teu PC):**

```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
```

Copia o texto que aparecer (sem espaços) e guarda **num gestor de palavras-passe** ou ficheiro temporário — vais colá-lo **duas vezes** (Firebase + RevenueCat).

**Opção B — dois GUIDs juntos:**

```powershell
([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
```

**Opção C — site / gestor:** gera “password 40+ characters” num gestor (Bitwarden, 1Password, etc.) — desde que seja **imprevisível** e **único**.

**Nunca** uses uma frase óbvia tipo `coach123`; **nunca** comites este valor no Git.

### G3. O que fazer no **Firebase** (computador)

1. Na pasta do projeto (onde está `firebase.json`):

   ```bash
   firebase functions:secrets:set REVENUECAT_WEBHOOK_AUTHORIZATION
   ```

2. Quando pedir o valor, **cola exactamente** o segredo que geraste em G2 e confirma.

3. Compila e faz deploy **da função e das rules** (as rules impedem que o app altere o plano pelo cliente):

   ```bash
   cd functions
   npm run build
   cd ..
   firebase deploy --only functions:revenueCatWebhook,firestore:rules
   ```

4. No **Firebase Console** → **Functions** (ou **Google Cloud Console** → **Cloud Run** entradas da mesma função), copia a **URL HTTPS** da função `revenueCatWebhook` (termina algo como `...cloudfunctions.net` ou domínio Cloud Run). **É essa URL** que vais colar na RevenueCat.

Se o deploy perguntar para **ligar o secret** à função, aceita (o SDK já referencia `REVENUECAT_WEBHOOK_AUTHORIZATION` no código).

### G4. O que fazer **precisamente na RevenueCat** (browser)

1. Entra em [app.revenuecat.com](https://app.revenuecat.com) → **o projecto Coach’em**.  
2. Abre **Project settings** (engrenagem) e procura **Webhooks** ou **Integrations → Webhooks** (o nome pode variar ligeiramente na UI).  
3. **Add webhook** / **Nova URL**.  
4. **URL:** cola a URL HTTPS da Cloud Function (`revenueCatWebhook`) que copiaste em G3.  
5. **Authorization** / **Webhook authorization** / **Header de autorização**: cola **o mesmo segredo** que puseste no Firebase Secret (`REVENUECAT_WEBHOOK_AUTHORIZATION`).  
   - Se a RevenueCat mostrar dois campos (tipo nome + valor), usa o formato que pedirem. A nossa função aceita:
     - `Bearer SEU_SEGREDO_AQUI` **ou**
     - só `SEU_SEGREDO_AQUI` (sem a palavra Bearer).  
   - **Importante:** o valor tem de ser **idêntico** ao guardado no Secret Manager (character por character).

6. Grava o webhook.

7. No painel da RevenueCat, usa **Send test event** / **TEST** se existir → deve devolver **200** nos logs da função e **não** 401.

8. Depois de uma **compra Sandbox** com utilizador com `Purchases.logIn(uid)` = **UID Firebase do treinador**, verifica no **Firestore** → `users/{aqueleUid}` se `subscriptionTier` e `subscriptionExpiresAt` atualizam (pode levar segundos após o evento).

### G5. Lembrete importante

- Só faz sentido atualizar **`users`** de conta **Treinador** (`userType === COACH`). Outros IDs são ignorados (resposta OK para não repetir retries inúteis).  
- A chave **`appl_`** continua só para o **app**. O segredo do webhook é **outra coisa**, só para servidor.

---

## Checklist rápido

| Passo | Feito? |
|-------|--------|
| A — App Store Connect: produto `coachem_pro_monthly` | [x] |
| A — Sandbox tester | [x] |
| B — RevenueCat: app, entitlement `pro`, offering | [x] |
| C — `.env` + EAS com `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` | [x] |
| D — Código: SDK `configure` + `logIn`, constantes, limites Pro, Function atletas | [x] |
| E — Development build no iPhone + teste Sandbox de **compra** | [ ] *(build + loja)* |
| F — Tela de plano / paywall no app | [x] |
| G — Webhook: secret Firebase + deploy `revenueCatWebhook` + URL + Authorization na RC | [ ] |
