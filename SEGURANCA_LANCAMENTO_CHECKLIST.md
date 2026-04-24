# Treina+ - Checklist de Seguranca e Lancamento

Este documento consolida a proxima etapa para hardening do app antes do lancamento publico.

Objetivo: aumentar seguranca, compliance e confiabilidade sem quebrar o fluxo principal.

## Principio Geral

- As mudancas abaixo sao de protecao/hardening.
- Elas **nao devem atrapalhar o fluxo core** (coach cria atleta, atribui treino, atleta executa).
- Onde houver impacto de UX, deve ser positivo (mensagens claras, consentimento explicito, menos erro tecnico).

---

## P0 - Bloqueantes de seguranca (fazer primeiro)

## 1) Endurecer Firestore Rules por campo

- Colecoes criticas:
  - `coachemAssignedWorkouts`
  - `coachemAthletes`
- Acao:
  - limitar quais campos o atleta pode alterar;
  - travar campos imutaveis (`coachId`, `athleteId`, `authUid`, etc.);
  - validar invariantes com comparacao `request.resource.data` vs `resource.data`.

## 2) Validar vinculo coach-atleta em criacao/alteracao de treinos

- Reforcar que um coach so pode criar/alterar treino para atleta vinculado a ele.
- Aplicar em:
  - Firestore rules
  - backend (Cloud Functions/scheduler push)

## 3) Proteger callables de email contra abuso

- Endpoints:
  - `sendPasswordResetEmailTreina`
  - `sendEmailVerificationTreina`
- Acao:
  - App Check obrigatorio;
  - rate limit (IP/email/UID + janela de tempo);
  - cooldown de reenvio.

## 4) Padronizar deploy de rules por arquivo versionado

- Garantir que regras de producao estejam no repositorio e no `firebase.json`.
- Evitar drift entre console e codigo.

---

## P1 - Recomendado antes de go-live

## 5) Observabilidade de producao

- Adicionar Sentry/Crashlytics (ou equivalente).
- Alertas para erros criticos de login, push, cadastro e functions.

## 6) Higiene de logs e mensagens

- Remover/evitar mensagens tecnicas para usuario final.
- Manter detalhes apenas em log seguro de backend.
- Sanitizar PII em logs.

## 7) Revisar permissoes de app

- Validar necessidade de `RECORD_AUDIO` no Android.
- Remover permissoes nao usadas (principio de minimizacao).

---

## P2 - Compliance e governanca

## 8) Checkbox obrigatorio no cadastro (esquecido)

- Implementar checkbox no registro:
  - "Li e aceito os Termos de Uso e Politica de Privacidade."
- Bloquear criacao de conta se nao marcar.
- Incluir links para paginas oficiais:
  - Termos
  - Privacidade

## 9) Atualizar documentos juridicos com fluxo real

- Confirmar que os textos refletem:
  - verificacao de email;
  - bloqueio de acesso sem verificacao;
  - retencao de dados apos exclusao (quando aplicavel).

## 10) Processo interno de LGPD

- Definir procedimento para:
  - solicitacao de acesso/correcao/exclusao;
  - prazo de resposta;
  - tratamento de incidente.

---

## Plano de execucao sugerido (rapido e seguro)

1. P0 completo (rules + vinculo + anti-abuso + deploy padronizado)
2. Checkbox de aceite no cadastro (item 8)
3. P1 (observabilidade + logs + permissoes)
4. Rodada de QA final (auth, push, cadastro, bloqueio, juridico)
5. Build final de release

---

## Risco de impacto no app

- Esperado: **baixo**, porque as mudancas focam validacao/seguranca.
- Possiveis ajustes de UX:
  - mensagens de erro mais claras;
  - necessidade de marcar checkbox no cadastro;
  - bloqueio de operacoes indevidas (comportamento desejado).

---

## Status atual

- Fluxo de verificacao de email: implementado.
- Push remoto base: implementado.
- Credenciais APNs no EAS: configuradas.
- Proxima etapa: executar itens P0 + checkbox de aceite.
