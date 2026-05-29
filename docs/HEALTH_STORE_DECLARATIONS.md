# Declarações nas lojas — Dados de saúde (Coach'em)

Checklist para **Google Play Console** e **App Store Connect** após ativar integração HealthKit / Health Connect.

> **Quando fazer:** antes ou logo após o primeiro build com saúde em teste interno.  
> **Deploy da política:** publicar HTML atualizado em `public/privacy/coachem*` e fazer deploy Firebase Hosting.

---

## Política de privacidade (obrigatório)

- [ ] Deploy hosting com secção **1.4 Dados de saúde** (PT + EN):
  - PT: https://futeba-96395.web.app/privacy/coachem
  - EN: https://futeba-96395.web.app/privacy/coachem-en
- [ ] Confirmar data “Última atualização” visível na página.

Comando (na raiz do projeto, com Firebase CLI):

```bash
firebase deploy --only hosting
```

---

## Google Play — Segurança dos dados

Caminho: **Play Console → A sua app → Conteúdo da app → Segurança dos dados**

| Pergunta / tipo | Sugestão Coach'em |
|-----------------|-------------------|
| **Recolhe ou partilha dados de utilizador?** | Sim |
| **Dados de saúde e fitness** | Sim |
| Frequência cardíaca | Recolhido, opcional, partilhado com treinador vinculado |
| Calorias / distância / passos | Idem (se disponível no dispositivo) |
| **Finalidade** | Funcionalidade da app |
| **Obrigatório ou opcional** | **Opcional** (atleta liga em Perfil → Saúde) |
| **Encriptação em trânsito** | Sim (HTTPS / Firebase) |
| **Pedido de eliminação** | Sim (fluxo excluir conta / contacto suporte) |

**Health Connect (Android):** se a Play pedir formulário de declaração Health Connect, usar o pacote `com.vision10.coachem` e descrever leitura agregada na janela do treino.

---

## Apple — App Privacy (Nutrition labels)

Caminho: **App Store Connect → App → Privacidade da app**

| Categoria | Detalhe |
|-----------|---------|
| **Health & Fitness** | Sim |
| Frequência cardíaca | Ligado à funcionalidade do app, não para tracking |
| **Fitness** (calorias, exercício) | Idem |
| **Dados não recolhidos para tracking** | Marcar conforme questionário atual |
| **Vinculado ao utilizador** | Sim |
| **Usado para funcionalidade** | Sim |

**HealthKit capability:** já configurada via `react-native-health` no `app.json`.

---

## Texto curto para revisão da loja (opcional)

**PT:** O Coach'em permite que atletas, de forma opcional, liguem Apple Saúde ou Health Connect para partilhar com o treinador resumos agregados (frequência cardíaca, calorias, etc.) apenas durante treinos iniciados e concluídos no app.

**EN:** Coach'em lets athletes optionally connect Apple Health or Health Connect to share aggregated workout summaries (heart rate, calories, etc.) with their coach only for workouts started and completed in the app.

---

## Histórico

| Data | Notas |
|------|--------|
| 2026-05-29 | Documento criado; HTML de privacidade atualizado no repositório (deploy pendente pelo responsável). |
