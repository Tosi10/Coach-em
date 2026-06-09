# Como publicar as Firestore Rules (CooPs + Coach'em)

## Fonte única (2026-06-09)

**Editar sempre:** `C:\NativeReact\firestore.rules`  
**Documentação:** `C:\NativeReact\FIRESTORE_RULES.md`

Ambos os repos (`Coach-em` e `coworking-app`) usam `firebase.json` → `"rules": "../firestore.rules"`.

## Publicar

```bash
cd C:\NativeReact\coworking-app
firebase deploy --only firestore:rules --project futeba-96395
```

Ou colar o conteúdo de `NativeReact/firestore.rules` na Firebase Console → Firestore → Rules → **Publish**.

Não uses `Coach-em/firestore.rules` no Git (está no `.gitignore`).  
`docs/FIRESTORE_RULES_PUBLISH_2026-05-29.rules` é arquivo histórico.

## O que foi acrescentado vs o rules que enviaste

| Bloco | Alteração |
|-------|-----------|
| **Helpers** | `coachEmMe`, `isCoachEmAthlete`, `athleteIsSolo`, `isAthleteEmPro`, `canAthleteSelfDirect`, `coachEmAthleteLinkingFieldsUnchanged`, helpers de create solo |
| **`users`** | Create: atleta só `athleteMode: solo` sem `coachId`; coach pode `inviteCode`. Update: app **não** altera vínculo (`coachId`, `athleteMode`, graça) — só Functions |
| **`coachInvites`** | **Novo** — read coach ou atleta (email + pending); write bloqueado (Functions) |
| **`coachemExercises`** | Create/update/delete atleta solo (ou Pro) com `createdBy == uid` |
| **`coachemWorkoutTemplates`** | Idem com `coachId == uid` |
| **`coachemAssignedWorkouts`** | Create/delete treino self (`coachId` e `athleteId` = uid do atleta) |
| **`coachLinkedToAthlete`** | Leitura de treinos/peso para atleta **Desvinculado** (histórico); `coachOwnsAthlete` continua só para **criar** treino |
| **CooPs** | **Inalterado** (copiado do teu ficheiro) |

**Índice extra (se o Console pedir ao abrir perfil do atleta):** `coachemAssignedWorkouts` — `athleteId` ↑, `coachId` ↑ |

## Índices (criar se o Console pedir)

| Coleção | Campos |
|---------|--------|
| `users` | `inviteCode` ↑, `userType` ↑ |
| `coachInvites` | `athleteEmail` ↑, `status` ↑ |

## Depois de publicar — testes rápidos

1. Atleta **solo** — criar exercício / template / treino atribuído a si.  
2. Atleta — ler convites pendentes no Perfil (`coachInvites`).  
3. Coach — convite email (Function); atleta aceita.  
4. Atleta coached — **desvincular** (Function); pendentes do ex-coach visíveis ~30 dias.  
5. CooPs — login admin/cliente, reserva, chat (smoke test).

## Segurança

- Cadastro **coached** com código → só `registerAthleteSelf` (Admin SDK).  
- Ligar / desligar coach → `linkAthleteToCoachByCode`, `acceptCoachInvite`, `unlinkAthleteFromCoach`.  
- O cliente **não** pode gravar `coachInvites` nem mudar `coachId` no `users`.
