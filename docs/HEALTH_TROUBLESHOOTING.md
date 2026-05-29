# Troubleshooting — Saúde (HealthKit / Health Connect)

Guia rápido para problemas comuns na Fase 1 do Coach'em.

---

## “Requer app de desenvolvimento” / Expo Go

**Causa:** HealthKit e Health Connect não existem no Expo Go.

**Solução:** Instalar build EAS (`development` ou `production`):

```bash
eas build --profile development --platform ios
```

---

## Card vazio para o treinador (“sem histórico de saúde”)

| Verificar | Ação |
|-----------|------|
| Atleta ligou saúde no Perfil? | Perfil → Ligar dispositivo |
| Treino foi **iniciado** e **concluído**? | Ambos os botões no detalhe do treino |
| Relógio sincronizou com **Saúde** / Health Connect **antes** de concluir? | Abrir app Saúde e confirmar FC do período |
| Build tem código de saúde? | Não usar versão antiga da loja |
| Regras Firestore deployadas? | `firebase deploy --only firestore:rules` |
| Documento `health/{uid}` no Firebase? | Consola → treino atribuído → subcoleção `health` |

---

## Permissão negada no iOS

Apple não mostra o popup outra vez se o utilizador negou antes.

1. iPhone → app **Saúde** → partilha → **Coach'em** → ativar leituras.
2. Ou Definições → Privacidade → Saúde → Coach'em.

---

## Health Connect não instalado (Android)

O app mostra opção para abrir a Play Store. Instalar **Health Connect** da Google e repetir **Ligar dispositivo**.

---

## FC / calorias diferentes do app Saúde

- Coach'em lê a **janela exata** `startedAt` → `completedAt`, não o dia inteiro.
- Comparamos **agregados** (média, soma), não amostra a amostra.
- Atraso de sync do relógio: esperar 1–2 min após o treino e sincronizar Saúde.

---

## Erro de permissão Firestore ao gravar `health/`

- Confirmar deploy de `firestore.rules` com bloco da subcoleção `health`.
- Atleta deve ser o `athleteId` do treino e `athleteUid` no path = uid da conta.

---

## Build iOS falha (pods / Firebase)

Ver `app.json` → plugin `expo-build-properties` com `extraPods` para `GoogleUtilities` e `FirebaseCoreInternal` (`modular_headers: true`). Já aplicado na branch `feat/security-app-check`.

---

## Contacto interno

Bugs: [`bugs-health.md`](./bugs-health.md) · Plano: [`HEALTH_PHASE_1.md`](./HEALTH_PHASE_1.md)
