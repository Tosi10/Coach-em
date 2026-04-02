# Coleções Firestore – Treina+ (prefixo `coachem`)

Para não misturar com **Futeba** e **CooPs** (coworking), todas as coleções do Treina+ usam o prefixo **`coachem`**.

---

## Nomes das coleções

| Coleção Firestore      | Uso no app (equivale ao AsyncStorage atual)     |
|------------------------|--------------------------------------------------|
| `coachemUsers`        | Perfil do usuário (Firebase Auth UID). userType, displayName, coachId/athletes, etc. |
| `coachemExercises`     | Biblioteca de exercícios (hoje: `saved_exercises`). |
| `coachemWorkoutTemplates` | Templates de treino (hoje: `workout_templates`). |
| `coachemAssignedWorkouts`  | Treinos atribuídos a atletas (hoje: `assigned_workouts`). |
| `coachemExerciseWeightHistory` | Histórico de peso/carga por exercício (hoje: `exercise_weight_history`). |

Progresso de treino (`workout_progress_*`) e feedback por treino podem ser subcoleções de `coachemAssignedWorkouts` ou campos no documento; definimos na hora de implementar.

---

## Resumo

- **Auth:** mesmo Firebase Auth do projeto (futeba). O app Treina+ só lê/escreve nas coleções **`coachem*`**.
- **Documento do usuário:** em `coachemUsers`, com ID = Firebase Auth UID (igual ao Coworking em `coopsUsers`).

Quando formos conectar o app ao Firestore, usamos sempre esses nomes de coleção.
