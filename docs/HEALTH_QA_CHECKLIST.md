# QA — Integração de saúde (HealthKit / Health Connect)

Checklist para validar a **Fase 1** no dispositivo real. Marque `[x]` à medida que concluir.

> Registe bugs em [`bugs-health.md`](./bugs-health.md).

---

## Pré-requisitos

- [ ] Build **nativo** instalado (não Expo Go): `eas build --profile development --platform ios` (e Android se aplicável).
- [ ] `firebase deploy --only firestore:rules` executado.
- [ ] Conta **atleta** de teste + conta **treinador** vinculada.
- [ ] iOS: Apple Watch emparelhado e app **Saúde** com dados recentes.
- [ ] Android: app **Health Connect** instalada e atualizada.

---

## A — Consentimento (atleta)

| # | Passo | iOS | Android |
|---|--------|-----|---------|
| A1 | Perfil → **Ligar dispositivo de saúde** | [ ] | [ ] |
| A2 | Popup do sistema (Saúde / Health Connect) aceite | [ ] | [ ] |
| A3 | Estado “Ligado” no app | [ ] | [ ] |
| A4 | **Desligar** no app + confirmar Firestore `healthIntegration.enabled = false` | [ ] | [ ] |

---

## B — Fluxo de treino

| # | Passo | iOS | Android |
|---|--------|-----|---------|
| B1 | Abrir treino **pendente** como atleta | [ ] | [ ] |
| B2 | Botão **Iniciar treino** visível; treinador **não** vê estes botões | [ ] | [ ] |
| B3 | Banner “treino em andamento” | [ ] | [ ] |
| B4 | **Marcar como concluído** + feedback | [ ] | [ ] |
| B5 | Firestore: `startedAt` e `completedAt` no treino | [ ] | [ ] |
| B6 | Subcoleção `health/{athleteUid}` criada com dados | [ ] | [ ] |

---

## C — Treinador

| # | Passo | OK |
|---|--------|-----|
| C1 | Detalhe do treino concluído → card **Métricas do relógio** | [ ] |
| C2 | Valores coerentes com app Saúde (ordem de grandeza) | [ ] |
| C3 | Perfil do atleta → Gráficos → gráfico **FC média** | [ ] |
| C4 | Treino sem saúde → mensagem vazia (sem crash) | [ ] |

---

## D — Regressão rápida

| # | Passo | OK |
|---|--------|-----|
| D1 | Login treinador / atleta | [ ] |
| D2 | Atribuir treino | [ ] |
| D3 | Concluir treino **sem** ter ligado saúde (app normal) | [ ] |
| D4 | App Check / Firebase (login, Firestore) | [ ] |

---

## Resultado da sessão

- **Data:** ___________
- **Build:** profile ___________ · version ___________
- **Dispositivo:** ___________
- **Aprovado para teste interno?** Sim / Não
- **Notas:** ___________
