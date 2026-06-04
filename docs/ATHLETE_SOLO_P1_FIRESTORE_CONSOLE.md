# Atleta solo — P1: Firebase Console (aditivo)

**Não altera blocos CooPs.** Publicar a partir de `coworking-app/firestore.rules` completo + estes acrescentos Coach'em.

## 1. Índice Firestore (obrigatório para código do treinador)

Coleção: `users`  
Campos: `inviteCode` (Ascending), `userType` (Ascending)  
Query scope: Collection

Sem isto, `validateCoachInviteCode` / `registerAthleteSelf` falham na query.

## 2. Deploy Cloud Functions

**P1 (registo + código):**

```bash
cd functions
npm run build
firebase deploy --only functions:validateCoachInviteCode,functions:registerAthleteSelf
```

**P2 (convites email + ligar por código):**

```bash
cd functions && npm run build
firebase deploy --only functions:sendCoachInviteToAthlete,functions:acceptCoachInvite,functions:linkAthleteToCoachByCode
```

**P4 (desvincular coach):**

```bash
cd functions && npm run build
firebase deploy --only functions:unlinkAthleteFromCoach,functions:detachAthleteFromCoachByCoach
```

Atualizar rules: `coachOwnsAthlete` só com `status == Ativo` — ver `FIRESTORE_RULES_PUBLISH_2026-05-29.rules` (republicar no Console).

Ver também regras aditivas: `docs/FIRESTORE_ATHLETE_SOLO_RULES_ADDON.md`.

## 3. Rules (opcional P1)

O `users` create atual já permite `userType: ATHLETE`. Campos novos `athleteMode`, `coachId`, `inviteCode` são gravados pelo cliente (solo) ou Function (coached) — não precisam de validação extra na P1 se confiares na Function.

**P5:** validar `athleteMode`/`coachId` no create e permitir atleta Pro criar treinos com `coachId == auth.uid`.

## 4. Migração atletas existentes

Atletas antigos sem `athleteMode`: o app infere `coached` se `coachId` existir, senão `solo` (`resolveAthleteMode`).

Coaches antigos sem `inviteCode`: o Perfil gera ao abrir a aba.
