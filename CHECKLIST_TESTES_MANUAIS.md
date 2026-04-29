## Checklist de Testes Manuais – Coach'em

Use este roteiro quando estiver com o aparelho físico. Marque cada item que testar.

---

### 1. Fluxos gerais

- **Login como treinador**
  - Abrir o app.
  - Informar e-mail e senha de treinador válidos.
  - Confirmar que entra na Home do treinador (dashboard).

- **Login como atleta**
  - Sair da conta do treinador.
  - Fazer login com conta de atleta.
  - Confirmar que entra na Home do atleta (cards de progresso e “Treino de Hoje” quando existir).

- **Logout**
  - Em ambos os perfis (coach e atleta), ir em `Perfil` → `Sair`.
  - Verificar que volta para a tela de login.

---

### 2. Home do treinador

- **Carregamento**
  - Verificar se os cards de “Panorama Semanal” carregam sem erro.
  - Ver se os números (Ativos hoje, Concluídos, Pendentes) fazem sentido com a base de treinos que você criou.

- **Treinos/Atletas**
  - Abrir seção de “Atletas” / “Meus treinos” pela aba central.
  - Voltar para Home e garantir que o app não quebrou.

- **Treinos concluídos por semana**
  - Conferir se o gráfico aparece.
  - Verificar se não há quebras quando não há dados suficientes (sem treinos).

---

### 3. Home do atleta

- **Saudação e progresso**
  - Confirmar que aparece “Olá, ...” com o nome/cadastro correto.
  - Ver se os cards “Esta Semana”, “Concluídos” e “Sequência” mostram valores coerentes.

- **Treino de Hoje**
  - Quando houver treino atribuído para hoje:
    - Confirmar que o bloco “🎯 Treino de Hoje” aparece.
    - Tocar no cartão e abrir a tela de detalhes do treino.
  - Quando **não** houver treino hoje:
    - Confirmar que a Home do atleta não mostra erro feio (pode não aparecer o bloco).

---

### 4. Tela “Meus Treinos” / Biblioteca (treinador)

- **Acesso**
  - Pela Home, tocar em “Biblioteca de Exercícios” / “Meus Treinos” (conforme configurado).
  - Ver o tutorial rápido da primeira vez (FirstTimeTip).

- **Lista de treinos**
  - Ver se os treinos aparecem, com nome e descrição.
  - Usar a busca e conferir se filtra corretamente.

- **Ações**
  - Criar um novo treino (se fluxo estiver ativo) ou duplicar um treino existente.
  - Abrir detalhes de um treino/template e voltar.

---

### 5. Atribuir treino (coach)

- **Acesso**
  - Entrar na tela de `Atribuir Treino` (por um atleta ou por lista genérica).
  - Ver o tooltip de primeira vez explicando a tela.

- **Selecionar atleta**
  - Abrir a tela com athleteId vindo de outra tela (por exemplo, perfil do atleta).
  - Abrir sem athleteId e selecionar um atleta da lista, se disponível.

- **Selecionar treino e data**
  - Escolher um treino da biblioteca.
  - Definir uma data simples (não recorrente) e horário.
  - Confirmar criação do treino (sem erro).

- **Recorrência**
  - Ativar recorrência semanal.
  - Definir quantidade de treinos (ex.: 4 semanas) e confirmar.

---

### 6. Detalhe do treino (atleta)

- **Carregamento**
  - Abrir a partir do “Treino de Hoje” na Home.
  - Ver o tutorial rápido “Como usar o treino”.
  - Conferir cabeçalho (nome do treino, treinador, data, horário).

- **Execução**
  - Percorrer blocos de aquecimento, trabalho e desaquecimento.
  - Tocar nos exercícios e marcar como concluído.
  - Ver se a porcentagem de conclusão atualiza.

- **Feedback e conclusão**
  - No final, marcar o treino como concluído.
  - Escolher um emoji de feedback e, se quiser, escrever um comentário.
  - Confirmar que volta para a Home ou para lista de treinos sem erro.

---

### 7. Perfil

- **Tema**
  - Alternar entre claro/escuro (se habilitado) e navegar pelo app para ver se as cores permanecem consistentes.

- **Dados do usuário**
  - Conferir se as informações básicas do usuário aparecem corretas (e-mail, tipo de usuário se exibido).

- **Logout**
  - Já testado na seção 1, mas repetir após uma sessão longa para garantir que funciona sempre.

---

### 8. Comportamento offline / rede ruim (se possível testar)

- Colocar o celular em **modo avião** depois de abrir o app e tentar navegar:
  - Ver se as telas mostram mensagem amigável em vez de travar.
  - Voltar a conexão e ver se os dados recarregam (pode exigir fechar e abrir o app, dependendo do fluxo atual).

---

### 9. Performance e UX geral

- Avaliar se:
  - Alguma tela é **muito lenta** para abrir ou carregar.
  - Há textos em inglês perdidos.
  - Ícones ou botões parecem confusos (sem rótulo claro).

Use esse checklist como base e sinta-se à vontade para adicionar itens específicos que fizerem sentido para sua realidade (ex.: tipos de treino que você mais cria). Quando encontrar um problema, anote em algum lugar com: **tela**, **passo a passo** e, se possível, **print**.

