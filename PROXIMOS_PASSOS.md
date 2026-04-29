# 🚀 Próximos Passos - Coach'em

## 📝 Log de trabalho — 2026-04-03

Resumo do que foi feito nesta sessão (código + UX):

- **Assets `*2.png`:** cópia e uso dos ícones faltantes (`IconeWorkoutComplete2`, `iconetreinosmaisdificeis2`, `IconeTrabalhoPrincipal2`, `IconeAquecimento2`, `IconeFinalizacao2`) e referências alinhadas em `_layout`, `index`, `workout-details`.
- **Dashboard (treinador):** remoção dos círculos nos cards do Panorama Semanal; ajuste de tamanho dos ícones (Biblioteca / Meus Treinos / cards); tab bar — gaps ícone↔texto e tamanhos por aba (Home +5%, Atletas −5%).
- **Agenda (`coach-calendar`):** feedback emoji reposicionado entre dados e seta; tamanho e centralização no espaço entre texto e chevron.
- **Perfil:** foto de perfil com upload (Storage + Firestore + espelho em `coachemAthletes`); fallback atleta igual treinador (ícone user); treinador vê foto nas listas e perfil do atleta.
- **Firebase Storage:** regra documentada para pasta `profilePhotos/{userId}/...` (substituir/colar no console).

---

## 🔔 Próxima prioridade sugerida: notificações (push + locais)

**Decisão de produto:** não haverá chat; haverá **avisos/alertas** para atletas e treinadores.

| Quem | Quando | O quê (alvo) |
|------|--------|----------------|
| **Atleta** | 30 min antes do horário do treino | Lembrete do treino |
| **Atleta** | No horário do treino | Lembrete “na hora” |
| **Treinador** | No horário do treino | Lembrete/alerta do treino |
| **Treinador** | Quando o atleta **concluir** o treino | Aviso (ex.: “X concluiu o treino Y”) |

**Nota técnica:** Lembretes agendados no aparelho (**notificações locais**) já são viáveis com `expo-notifications` (o projeto tem base em `notifications.service.ts`). O aviso ao treinador **no momento em que o atleta conclui** exige **mensagem remota** (FCM + backend ou Cloud Function disparando push), porque o app do treinador pode estar fechado — não dá para resolver só com agendamento local no celular do atleta.

Experiência em outro app (ex.: Eletronovo) com Expo + FCM ajuda; ainda assim é preciso: credenciais EAS, chaves FCM/APNs, e fluxo servidor para o evento “treino concluído”.

---

## 📊 Estado Atual do Projeto

### ✅ O que já está funcionando:

1. **Dashboard do Treinador**
   - Cards de estatísticas (Ativos Hoje, Treinos Concluídos, Pendentes)
   - Botões principais (Biblioteca de Exercícios, Meus Treinos)
   - Lista de atividades recentes (últimas 3)
   - Lista de atletas que precisam de atenção

2. **Dashboard do Atleta**
   - Cards de progresso (Esta Semana, Concluídos, Sequência)
   - Treino de hoje em destaque
   - Próximos treinos da semana
   - Histórico de treinos concluídos

3. **Biblioteca de Exercícios**
   - Criar, editar, deletar exercícios
   - Filtrar por grupo muscular
   - Buscar exercícios

4. **Biblioteca de Treinos**
   - Criar templates de treino (3 blocos: Aquecimento, Trabalho, Finalização)
   - Editar e deletar treinos
   - Visualizar detalhes completos

5. **Atribuição de Treinos**
   - Atribuir treino único ou recorrente
   - Calendário para seleção de datas
   - Quantidade de treinos (não mais meses)
   - Seleção automática do dia da semana

6. **Perfil do Atleta**
   - Visualização completa do perfil
   - Gráfico de evolução (peso/carga)
   - Histórico de treinos (com paginação)
   - Próximos treinos (agrupados por recorrência)
   - Deletar treinos atribuídos

7. **Sistema de Feedback**
   - Atleta pode avaliar dificuldade do treino (5 níveis)
   - Emoji aparece nas listas de concluídos
   - Treinador vê como o atleta se sentiu

---

## 🎯 Próximos Passos Sugeridos

### Opção 1: Melhorar a Visualização de Treinos (Recomendado) ⭐

**Por que fazer isso?**
- Melhorar a experiência do atleta ao visualizar seus treinos
- Adicionar mais informações úteis
- Criar uma interface mais profissional

**O que vamos fazer:**

#### 1.1. Melhorar a Tela de Detalhes do Treino (`workout-details.tsx`)
- Adicionar progresso visual (checkboxes para marcar exercícios concluídos)
- Mostrar tempo estimado do treino
- Adicionar botão "Próximo Exercício"
- Salvar progresso durante o treino (qual exercício está fazendo)

**Conceitos que você vai aprender:**
- `useState` para controlar progresso
- `AsyncStorage` para salvar estado temporário
- Componentes condicionais (mostrar/ocultar baseado em estado)
- Navegação entre exercícios

#### 1.2. Adicionar Timer/Chronômetro
- Timer para descanso entre séries
- Alerta sonoro quando descanso termina
- Mostrar tempo restante visualmente

**Conceitos que você vai aprender:**
- `setInterval` e `clearInterval`
- `useEffect` com cleanup
- Gerenciamento de tempo em JavaScript
- Notificações/Alertas do React Native

---

### Opção 2: Sistema de Estatísticas e Relatórios

**Por que fazer isso?**
- Treinador precisa ver o progresso dos atletas
- Atleta quer acompanhar sua evolução
- Dados visuais são mais fáceis de entender

**O que vamos fazer:**

#### 2.1. Dashboard de Estatísticas para o Treinador
- Gráfico de treinos concluídos por semana
- Taxa de aderência dos atletas
- Treinos mais difíceis (baseado no feedback)
- Atletas mais ativos

**Conceitos que você vai aprender:**
- Processamento de dados (arrays, filter, map, reduce)
- Criação de gráficos com `react-native-gifted-charts`
- Cálculos estatísticos básicos
- Agregação de dados

#### 2.2. Estatísticas Pessoais para o Atleta
- Evolução de peso/carga por exercício
- Gráfico de frequência de treinos
- Média de dificuldade dos treinos
- Recordes pessoais

---

### Opção 3: Sistema de Notificações e Lembretes

**Por que fazer isso?**
- Atletas esquecem de treinar
- Treinador quer ser notificado quando atleta completa treino
- Melhorar engajamento

**O que vamos fazer:**

#### 3.1. Notificações Locais
- Lembrete de treino do dia (ex: "Você tem treino hoje às 18h")
- Notificação quando treino está próximo
- Parabéns ao completar treino

**Conceitos que você vai aprender:**
- `expo-notifications` (biblioteca de notificações)
- Agendamento de notificações
- Permissões do dispositivo
- Background tasks

#### 3.2. Notificações para o Treinador
- Quando atleta completa treino
- Quando atleta não treina há X dias
- Resumo diário de atividades

---

### Opção 4: Sistema de Comunicação

**Por que fazer isso?**
- Treinador precisa dar feedback aos atletas
- Atleta pode fazer perguntas sobre exercícios
- Melhorar comunicação

**O que vamos fazer:**

#### 4.1. Chat/Mensagens
- Chat entre treinador e atleta
- Mensagens sobre treinos específicos
- Histórico de conversas

**Conceitos que você vai aprender:**
- Listas chat (FlatList com scroll invertido)
- Input de texto com teclado
- Timestamps e formatação de data
- Estado compartilhado entre telas

#### 4.2. Comentários nos Treinos
- Treinador pode deixar observações
- Atleta pode fazer perguntas
- Histórico de comentários

---

### Opção 5: Melhorias de UX/UI

**Por que fazer isso?**
- Tornar o app mais intuitivo
- Adicionar animações suaves
- Melhorar feedback visual

**O que vamos fazer:**

#### 5.1. Animações
- Transições suaves entre telas
- Animações ao completar treino
- Loading states mais bonitos
- Pull-to-refresh

**Conceitos que você vai aprender:**
- `Animated` API do React Native
- `react-native-reanimated` (biblioteca avançada)
- Transições de tela
- Micro-interações

#### 5.2. Melhorias Visuais
- Skeleton loaders (placeholders enquanto carrega)
- Empty states mais informativos
- Melhor feedback de ações (toasts, alerts)
- Dark mode toggle (já temos dark, adicionar light)

---

## 🎓 Minha Recomendação: Opção 1

**Por quê?**
1. **Completa o fluxo principal** - O atleta precisa de uma experiência melhor ao fazer o treino
2. **Conceitos importantes** - Você vai aprender sobre estado, persistência e navegação
3. **Resultado visível** - Você vai ver o progresso em tempo real
4. **Base para outras features** - Depois fica mais fácil adicionar estatísticas e notificações

---

## 📝 Plano Detalhado - Opção 1

### Passo 1: Adicionar Progresso Visual no Treino

**O que vamos fazer:**
- Criar checkboxes para cada exercício
- Marcar exercícios como "feitos"
- Salvar progresso no AsyncStorage
- Mostrar porcentagem de conclusão

**Código que você vai escrever:**
```typescript
// Estado para controlar quais exercícios foram feitos
const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

// Função para marcar exercício como feito
const toggleExercise = (exerciseId: string) => {
  // Seu código aqui
};

// Salvar progresso
const saveProgress = async () => {
  // Seu código aqui
};
```

**Conceitos:**
- `Set` em JavaScript (estrutura de dados)
- `useState` com estruturas complexas
- `AsyncStorage` para persistência
- Cálculo de porcentagem

---

### Passo 2: Adicionar Navegação entre Exercícios

**O que vamos fazer:**
- Botão "Próximo Exercício"
- Botão "Exercício Anterior"
- Mostrar "Exercício X de Y"
- Scroll automático para o exercício atual

**Código que você vai escrever:**
```typescript
// Estado para exercício atual
const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

// Função para ir ao próximo
const goToNext = () => {
  // Seu código aqui
};

// Função para ir ao anterior
const goToPrevious = () => {
  // Seu código aqui
};
```

**Conceitos:**
- Índices de arrays
- Navegação condicional
- Scroll programático (`scrollTo`)
- Referências com `useRef`

---

### Passo 3: Adicionar Timer de Descanso

**O que vamos fazer:**
- Timer que conta regressivamente
- Mostrar tempo restante visualmente
- Alerta quando termina
- Botão para pular descanso

**Código que você vai escrever:**
```typescript
// Estado para o timer
const [restTime, setRestTime] = useState(0);
const [isResting, setIsResting] = useState(false);

// Função para iniciar descanso
const startRest = (seconds: number) => {
  // Seu código aqui
};

// useEffect para contar regressivamente
useEffect(() => {
  // Seu código aqui
}, [restTime, isResting]);
```

**Conceitos:**
- `setInterval` e `clearInterval`
- `useEffect` com dependências
- Cleanup de efeitos
- Formatação de tempo (segundos → MM:SS)

---

## 🎯 Por Onde Começar?

**Minha sugestão:** Vamos começar pelo **Passo 1 - Progresso Visual no Treino**.

**Por quê?**
- É o mais simples de entender
- Você já conhece os conceitos básicos (`useState`, `AsyncStorage`)
- Resultado imediato e visível
- Base para os próximos passos

---

## 💡 Perguntas para Você:

1. **Qual opção te interessa mais?** (1, 2, 3, 4 ou 5)
2. **Você prefere começar pelo mais simples ou pelo mais complexo?**
3. **Tem alguma funcionalidade específica que você quer adicionar?**

---

## 📚 Recursos para Estudar (se quiser pesquisar antes):

- **React Native Animated:** https://reactnative.dev/docs/animated
- **Expo Notifications:** https://docs.expo.dev/versions/latest/sdk/notifications/
- **React Native Reanimated:** https://docs.swmansion.com/react-native-reanimated/
- **FlatList (para chat):** https://reactnative.dev/docs/flatlist

---

**Pronto para começar? Me diga qual opção você prefere e vamos implementar juntos!** 🚀
