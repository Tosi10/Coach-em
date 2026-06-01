# Playbook — Wearables + Expo Dev Client (Coach'em / Cora-ai)

Atalho interno **Vision6 / Cora-ai** para repetir integração **Health Connect (Android)** + **HealthKit (iOS)** sem redescobrir erros. Base validada no Coach'em (jun/2026).

---

## 1. Stack obrigatória

| Plataforma | Pacote nativo | Plugin Expo |
|------------|---------------|-------------|
| **Android** | `react-native-health-connect` | `expo-health-connect` (**obrigatório** — delegate de permissões) |
| **iOS** | `react-native-health` | `react-native-health` (com `healthSharePermission` / `healthUpdatePermission`) |

- **Não funciona no Expo Go** — só **EAS Dev Client** ou build de loja.
- JS comum: `health.service.ts`, `healthSync.service.ts`, Firestore `coachemAssignedWorkouts/{workoutId}/health/{athleteId}`.

---

## 2. `app.json` (copiar/adaptar)

```json
"plugins": [
  "expo-dev-client",
  [
    "react-native-health",
    {
      "isClinicalDataEnabled": false,
      "healthSharePermission": "<texto NSHealthShareUsageDescription>",
      "healthUpdatePermission": "<texto NSHealthUpdateUsageDescription>"
    }
  ],
  "expo-health-connect",
  [
    "expo-build-properties",
    {
      "android": {
        "minSdkVersion": 26,
        "compileSdkVersion": 36
      }
    }
  ]
],
"android": {
  "permissions": [
    "android.permission.health.READ_HEART_RATE",
    "android.permission.health.READ_ACTIVE_CALORIES_BURNED",
    "android.permission.health.READ_DISTANCE",
    "android.permission.health.READ_STEPS",
    "android.permission.health.READ_EXERCISE"
  ]
}
```

**Não** fixar `compileSdk` / `targetSdk` em 34 — libs atuais pedem **36**.

**iOS:** capability **HealthKit** no App ID Apple (conta já com apps na loja).

---

## 3. `eas.json`

```json
"build": {
  "development": {
    "developmentClient": true,
    "distribution": "internal",
    "android": { "buildType": "apk" }
  }
},
"submit": {
  "production": {},
  "development": {}
}
```

- `--auto-submit` com profile `development` exige `submit.development` (senão falha no fim; o build na nuvem pode continuar).
- iOS internal + ad hoc: EAS pergunta **quais iPhones** — escolher o aparelho de teste (`Y` no certificado existente).

---

## 4. Scripts no projeto (`package.json`)

```json
"start:dev": "expo start --dev-client --scheme <SEU_SCHEME>",
"android:connect": "powershell -ExecutionPolicy Bypass -File ./scripts/connect-android-usb.ps1"
```

`scripts/connect-android-usb.ps1`: `adb reverse` + deep link. Usar **`$env:EXPO_METRO_PORT=8082`** se Metro não estiver na 8081.

**ADB no Windows:** usar  
`$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe`  
(não confiar no `adb` de `System32` — lista vazia).

---

## 5. Ligar telemóvel ao Metro

### Android (USB — preferido)

1. `npm run start:dev`
2. Depuração USB + autorizar no telemóneo
3. `npm run android:connect` (ou `adb reverse tcp:PORT tcp:PORT` + deep link)

**Nunca** `http://localhost:8081` no telemóneo — usar `127.0.0.1` **com** `adb reverse`, ou IP do PC na Wi‑Fi.

### iOS (Wi‑Fi)

1. `npm run start:dev` no PC
2. Mesma Wi‑Fi
3. **Câmara do iPhone** → QR no terminal do Metro, **ou** manual: host = `192.168.x.x`, porta = Metro (ex. 8082)
4. **Não** usar `localhost` no iPhone

---

## 6. Teste de saúde (checklist)

1. Atleta → Perfil → **Ligar dispositivo**
2. Android: popup Health Connect | iOS: popup **Apple Saúde**
3. Treino → **Iniciar** → **Concluir**
4. Firebase: `coachemAssignedWorkouts/{id}/health/{athleteId}`
   - `source`: `healthconnect` | `healthkit`
   - `null` em métricas **sem relógio/dados na janela** = OK (sync funcionou)

Firestore consentimento: `users/{uid}.healthIntegration.enabled = true`

---

## 7. Erros que já pagámos (não repetir)

| Sintoma | Causa | Fix |
|---------|--------|-----|
| `requestPermission has not been initialized` (Android) | Falta `expo-health-connect` no build | Plugin + **novo** build Android |
| `healthkit_module_not_linked` com `AppleHealthKit: true` | `import('react-native-health')` no iOS Dev Client | `require('react-native-health')` — ver `healthKitBridge.ios.ts` |
| EAS `compileSdk 34` | media3 + Health Connect pedem 35–36 | `compileSdkVersion: 36` só no plugin |
| `Missing submit profile: development` | `--auto-submit` sem entrada em `eas.json` | `"development": {}` em `submit` |
| Metro porta 8082 | 8081 ocupada | `EXPO_METRO_PORT=8082` no script connect |
| Card treinador vazio com doc `health` | Sem FC/passos na janela do treino | Normal sem wearable; perfil só gráfico FC |

---

## 8. Código iOS (HealthKit bridge)

Ficheiros de referência no Coach'em:

- `src/services/health/healthKitBridge.ios.ts` — `require` + fallback `NativeModules.AppleHealthKit`
- `src/services/health/healthNativePermissions.ios.ts` — `initHealthKit` + permissões leitura/escrita Workout
- **Não** bloquear com `import()` dinâmico para detetar módulo

---

## 9. Onde ir no iPhone se negar permissões

**Definições → Saúde → Acesso aos dados e dispositivos → [App]**

Ou app **Saúde → Perfil → Apps**.

---

## 10. Docs relacionados neste repo

- [HEALTH_IOS_TEST.md](./HEALTH_IOS_TEST.md)
- [HEALTH_TROUBLESHOOTING.md](./HEALTH_TROUBLESHOOTING.md)
- [HEALTH_PHASE_1.md](./HEALTH_PHASE_1.md)
- [HEALTH_STORE_DECLARATIONS.md](./HEALTH_STORE_DECLARATIONS.md)

---

## 11. Novo projeto (Cora-ai)

1. Copiar secções 2–4 para o novo `app.json` / `eas.json` / `package.json`.
2. Copiar pasta `src/services/health/` (ou extrair pacote interno depois).
3. Primeiro build **development** Android + iOS; validar ligar + 1 treino + doc Firestore.
4. Só depois builds de loja / Pro+.

**Regra de ouro:** mudança **nativa** = build pago; mudança **só JS** = Metro + reload (`r`).
