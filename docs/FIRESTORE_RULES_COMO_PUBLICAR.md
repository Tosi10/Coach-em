# Como publicar as Firestore Rules (CooPs + Coach'em)

## Onde colar

1. **Fonte recomendada:** copiar o conteúdo de  
   [`FIRESTORE_RULES_PUBLISH_2026-05-29.rules`](./FIRESTORE_RULES_PUBLISH_2026-05-29.rules)  
   para **`coworking-app/firestore.rules`** (repo que partilha o projeto `futeba-96395`).

2. **Ou** Firebase Console → Firestore → **Rules** → substituir **todo** o ficheiro → **Publish**.

Não uses `Coach-em/firestore.rules` no Git (está no `.gitignore`); o ficheiro em `docs/` é só referência.

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
