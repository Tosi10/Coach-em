# App Store Connect — versão 1.3 (textos prontos)

Copiar/colar em **Português (Brasil)**. Ajuste emails/senhas das contas demo antes de enviar.

---

## Texto promocional (170 caracteres)

```
Atleta solo ou com treinador: organize treinos, acompanhe progresso e evolua com o Coach'em. Cadastro separado para coach e atleta.
```

---

## O que há de novo nesta versão

```
• Atleta independente: cadastre-se e treine por conta própria, sem precisar de treinador.
• Novo fluxo de registro: escolha entre conta de treinador ou de atleta.
• Atleta com treinador: vincule-se pelo código ou convite do coach.
• Home do atleta repensada, com visual mais limpo.
• Senhas mais seguras e melhorias de estabilidade.
• Novo ícone e capturas atualizadas.
```

---

## Descrição (substituir a atual)

```
Coach'em é para quem leva o treino a sério — com ou sem personal trainer.

TREINADORES
Organize atletas, monte treinos-modelo, atribua sessões no calendário e acompanhe evolução, aderência e desempenho em um só lugar.

ATLETAS
• Solo: crie sua conta, receba ou monte seus treinos e acompanhe seu progresso.
• Com treinador: use o código do coach para vincular a conta e receber treinos personalizados.

No dia a dia, o app ajuda a executar treinos no celular, registrar resultados e manter a rotina organizada — com interface moderna, tema escuro e foco no que importa: treinar bem e evoluir.

Planos Pro (opcional) ampliam limites de treinos, exercícios e recursos para treinadores e atletas independentes.
```

---

## Palavras-chave (máx. 100 caracteres)

Opção enxuta (cabe no limite):

```
treino,atleta,treinador,fitness,academia,musculação,esporte,performance,planner,solo
```

---

## Notas para revisão (App Review) — **inglês** (recomendado)

**IMPORTANTE:** troque `SENHA_FORTE_AQUI` por senhas reais que atendam à política (8+ chars, maiúscula, número, especial). **Não use `123456`.**

```
Demo accounts for App Review:

1) COACH
Email: adm.ecg.19@gmail.com
Password: SENHA_FORTE_COACH
After login: coach dashboard, athletes list, assign workouts, calendar.

2) SOLO ATHLETE (independent)
Email: demo.atleta.solo@SEUDOMINIO.com
Password: SENHA_FORTE_ATLETA
Sign up path: Login → Register → Athlete → Train on my own (solo).
After login: athlete home, workouts tab, profile.

Email verification: accounts are pre-verified / use the credentials above.

Subscriptions (optional to test): Coach Pro and Athlete Pro via in-app purchase (sandbox).

Health/wearables: not enabled in this build.

Thank you.
```

Crie a conta **atleta solo** no Firebase antes e confirme o email, ou use uma conta de teste já verificada.

---

## Informações de login (tela Revisão de apps)

| Campo | Valor |
|-------|--------|
| Início de sessão obrigatório | ✅ |
| Utilizador | `adm.ecg.19@gmail.com` (coach) — adicione nota com 2ª conta atleta |
| Palavra-passe | **senha forte** (não 123456) |

---

## Compilação (IPA)

No projeto (versão `1.3` no `app.json`):

```bash
git add app.json
git commit -m "chore: bump version to 1.3 for App Store submission"
git push

eas build -p ios --profile production --auto-submit
```

Ou sem auto-submit:

```bash
eas build -p ios --profile production
eas submit -p ios --profile production
```

Depois que o build aparecer no TestFlight (15–40 min), em **Versão 1.3** → **Adicionar compilação** → selecione o build.

---

## Antes de «Adicionar para revisão»

- [ ] Build 1.3 selecionado
- [ ] Screenshots 6.5" (e 6.7" se pedido)
- [ ] Textos salvos
- [ ] Contas demo com senha forte
- [ ] «O que há de novo» preenchido
- [ ] IAP/assinaturas conferidas na versão (se aplicável)
- [ ] Privacidade do app sem HealthKit (neste build)

---

## Lançamento

Recomendado: **Lançar esta versão manualmente** (você publica quando Apple aprovar).
