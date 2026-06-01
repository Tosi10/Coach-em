# Testar saúde no iOS (HealthKit)

O fluxo iOS usa o **mesmo código** que o Android (`healthSync`, Firestore, ecrã de consentimento). A diferença é só o nativo: **Apple Health / HealthKit** em vez de Health Connect.

> **Não funciona no Expo Go.** É obrigatório um **Dev Client** ou build de loja com `react-native-health` compilado.

---

## 1. Apple Developer (uma vez)

1. [developer.apple.com](https://developer.apple.com) → **Identifiers** → App ID `com.vision10.coachem`.
2. Ativar capability **HealthKit** (o plugin `react-native-health` no `app.json` também adiciona o entitlement no prebuild).
3. Regenerar **provisioning profile** se o EAS pedir.

---

## 2. Build Dev Client iOS

```bash
eas build --profile development --platform ios
```

Instalar no **iPhone físico** (TestFlight interno ou link EAS). Simulador não tem Apple Watch / dados reais de FC.

**Antes do build:** confirma `app.json` → plugin `react-native-health` com textos `healthSharePermission` / `healthUpdatePermission` (já configurado).

---

## 3. Metro no iPhone (sem cabo USB como Android)

No PC:

```bash
npm run start:dev
```

No iPhone (mesma Wi‑Fi):

1. Abre o **Coach'em Dev Client**.
2. **Scan QR code** no terminal (não uses o campo de URL manual se estiver bugado).
3. O QR deve apontar para `http://<IP-do-PC>:8081` (ou 8082 se a porta mudou).

---

## 4. Teste funcional (igual Android)

| Passo | Atleta | Esperado |
|-------|--------|----------|
| 1 | Perfil → Saúde → **Ligar dispositivo** | Popup Apple Saúde (HealthKit) |
| 2 | Permitir leituras (FC, energia, passos, treinos) | “Ligado com sucesso”, `users/{uid}.healthIntegration.enabled = true` |
| 3 | Treino → **Iniciar** → **Concluir** | Sync grava `coachemAssignedWorkouts/{id}/health/{athleteId}` |
| 4 | Treinador | Treino concluído → “Métricas do relógio”; perfil → gráfico FC só com dados reais |

**Apple Watch (opcional):** relógio sincroniza com app **Saúde**; o Coach'em lê a janela do treino no HealthKit. Sem relógio, podes ter passos/FC do iPhone se existirem na hora do treino.

---

## 5. Firebase (o que deve aparecer)

- `users/{uid}.healthIntegration` → `platform: "healthkit"`, `enabled: true`
- `coachemAssignedWorkouts/{workoutId}/health/{athleteId}` → `source: "healthkit"`, `device: "Apple Health"`  
  Campos `null` = janela sem dados (normal sem Watch/dados).

---

## 6. Problemas comuns

| Sintoma | Causa provável |
|---------|----------------|
| “Requer app de desenvolvimento” / HealthKit indisponível | Expo Go ou build antigo **sem** HealthKit |
| Popup não aparece de novo | Definições → Saúde → Coach'em → ativar tipos |
| Treinador vazio com doc `health` e tudo null | Igual Android: sync OK, sem métricas na janela |
| Build EAS falha pods | Ver `expo-build-properties` → `extraPods` Firebase no `app.json` |

Ver também: [`HEALTH_TROUBLESHOOTING.md`](./HEALTH_TROUBLESHOOTING.md) · [`HEALTH_QA_CHECKLIST.md`](./HEALTH_QA_CHECKLIST.md)
