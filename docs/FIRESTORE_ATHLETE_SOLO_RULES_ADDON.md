# Firestore rules — aditivo atleta solo + convites (legado)

**Preferir o ficheiro completo:** [`FIRESTORE_RULES_PUBLISH_2026-05-29.rules`](./FIRESTORE_RULES_PUBLISH_2026-05-29.rules)  
**Como publicar:** [`FIRESTORE_RULES_COMO_PUBLICAR.md`](./FIRESTORE_RULES_COMO_PUBLICAR.md)

---

Colar **dentro** do ficheiro publicado em `coworking-app/firestore.rules` (não commitar `Coach-em/firestore.rules`).

## `coachInvites`

```javascript
match /coachInvites/{inviteId} {
  allow read: if request.auth != null
    && (
      resource.data.coachId == request.auth.uid
      || (
        resource.data.athleteEmail == request.auth.token.email
        && resource.data.status == 'pending'
      )
    );
  allow create, update, delete: if false; // apenas Cloud Functions (Admin SDK)
}
```

Índice composto (se a query do cliente falhar): `coachInvites` — `athleteEmail` + `status`.

## Atleta solo — treinos atribuídos a si

Onde já existir regra para `coachemAssignedWorkouts`, acrescentar (ou equivalente):

```javascript
// Atleta solo: coachId no doc = próprio uid (self-coach)
allow create: if request.auth != null
  && request.resource.data.athleteId == request.auth.uid
  && request.resource.data.coachId == request.auth.uid;
```

## Atleta solo — exercícios próprios (se a biblioteca gravar em `coachemExercises`)

```javascript
allow create: if request.auth != null
  && request.resource.data.coachId == request.auth.uid;
```

Ajustar aos nomes de campo reais do projeto antes de publicar.

## Deploy functions P2 (após P1)

```bash
cd functions && npm run build
cd ..
firebase deploy --only functions:sendCoachInviteToAthlete,functions:acceptCoachInvite,functions:linkAthleteToCoachByCode
```
