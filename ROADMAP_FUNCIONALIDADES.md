# 🗺️ Roadmap de Funcionalidades - Coach'em

## 📋 Índice

1. [Opção 1: Melhorar Visualização de Treinos](#opção-1-melhorar-visualização-de-treinos) ✅ **CONCLUÍDO**
2. [Opção 2: Sistema de Estatísticas e Relatórios](#opção-2-sistema-de-estatísticas-e-relatórios) 🔄 **EM ANDAMENTO**
3. [Opção 3: Sistema de Notificações e Lembretes](#opção-3-sistema-de-notificações-e-lembretes)
4. [Opção 4: Sistema de Comunicação](#opção-4-sistema-de-comunicação)
5. [Opção 5: Melhorias de UX/UI](#opção-5-melhorias-de-uxui) 🔄 **PARCIALMENTE CONCLUÍDO**

---

## ✅ Opção 1: Melhorar Visualização de Treinos

### Status: **CONCLUÍDO** ✅

### O que foi implementado:

#### ✅ Passo 1.1: Progresso Visual no Treino
- [x] Checkboxes para marcar exercícios como concluídos
- [x] Barra de progresso visual
- [x] Disco circular com percentual
- [x] Salvamento automático do progresso
- [x] Cálculo de porcentagem em tempo real

**Arquivos modificados:**
- `app/workout-details.tsx`

**Conceitos aprendidos:**
- `Set` em JavaScript
- `useState` com estruturas complexas
- `AsyncStorage` para persistência
- Cálculo de porcentagem

---

#### ✅ Passo 1.2: Navegação entre Exercícios
- [x] Cards de exercícios clicáveis
- [x] Modal de exercício focado
- [x] Botões "Anterior" e "Próximo"
- [x] Indicador "Exercício X de Y"
- [x] Navegação entre blocos (Aquecimento → Trabalho → Desaquecimento)

**Arquivos modificados:**
- `app/workout-details.tsx`

**Conceitos aprendidos:**
- `Modal` do React Native
- Navegação programática entre arrays
- Cálculo de índices totais
- Estados condicionais

---

#### ✅ Passo 1.3: Timer de Descanso e Duração
- [x] Timer regressivo para descanso entre séries
- [x] Timer progressivo para duração de alongamento
- [x] Barra de progresso visual para alongamento
- [x] Alertas quando timer termina
- [x] Botões para pular/parar timer

**Arquivos modificados:**
- `app/workout-details.tsx`

**Conceitos aprendidos:**
- `setInterval` e `clearInterval`
- `useEffect` com cleanup
- Formatação de tempo (segundos → MM:SS)
- Timers progressivos vs regressivos

---

## 🔄 Opção 2: Sistema de Estatísticas e Relatórios

### Status: **PRÓXIMO** 🎯

### Por que fazer isso?
- Treinador precisa ver o progresso dos atletas de forma visual
- Atleta quer acompanhar sua própria evolução
- Dados visuais são mais fáceis de entender que números
- Ajuda a identificar padrões e melhorias

---

### 📊 Fase 2.1: Dashboard de Estatísticas para o Treinador

#### Etapa 2.1.1: Gráfico de Treinos Concluídos por Semana

**O que vamos fazer:**
- Criar uma nova tela/seção no dashboard do treinador
- Mostrar gráfico de linha ou barras com treinos concluídos por semana
- Agrupar dados dos últimos 4-8 semanas
- Mostrar tendência (aumentando/diminuindo)

**Onde vamos trabalhar:**
- `app/(tabs)/index.tsx` (dashboard do treinador)
- Criar componente `StatisticsChart.tsx` (opcional)

**Código que você vai escrever:**
```typescript
// Função para agrupar treinos por semana
const getWeeklyStats = () => {
  // Agrupar treinos concluídos por semana
  // Retornar array com { week: 'Semana 1', count: 5 }
};

// Usar react-native-gifted-charts para criar gráfico
<LineChart data={weeklyData} />
```

**Conceitos que você vai aprender:**
- Agrupamento de dados por período (semana)
- Formatação de datas
- Criação de gráficos com `react-native-gifted-charts`
- Processamento de arrays com `reduce` e `map`

**Estimativa:** 2-3 horas

---

#### Etapa 2.1.2: Taxa de Aderência dos Atletas

**O que vamos fazer:**
- Calcular % de treinos concluídos vs atribuídos para cada atleta
- Mostrar lista de atletas com suas taxas de aderência
- Destacar atletas com baixa aderência (< 70%)
- Mostrar gráfico de barras comparando atletas

**Onde vamos trabalhar:**
- `app/(tabs)/index.tsx` ou criar `app/athlete-statistics.tsx`
- Criar função para calcular aderência

**Código que você vai escrever:**
```typescript
// Calcular taxa de aderência
const calculateAdherenceRate = (athleteId: string) => {
  const assigned = getAssignedWorkouts(athleteId);
  const completed = assigned.filter(w => w.status === 'Concluído');
  return (completed.length / assigned.length) * 100;
};

// Mostrar em gráfico de barras
<BarChart data={athletesWithRates} />
```

**Conceitos que você vai aprender:**
- Cálculo de porcentagens
- Filtragem e agregação de dados
- Gráficos de barras comparativos
- Identificação de padrões (baixa aderência)

**Estimativa:** 2-3 horas

---

#### Etapa 2.1.3: Treinos Mais Difíceis (Baseado no Feedback)

**O que vamos fazer:**
- Analisar feedback dos atletas (emoji de dificuldade)
- Calcular média de dificuldade por treino
- Mostrar lista dos treinos mais difíceis
- Mostrar gráfico com distribuição de dificuldade

**Onde vamos trabalhar:**
- `app/(tabs)/index.tsx` ou criar seção de estatísticas
- Processar dados de `assigned_workouts` com `feedback`

**Código que você vai escrever:**
```typescript
// Calcular dificuldade média por treino
const getWorkoutDifficulty = (workoutName: string) => {
  const workouts = getCompletedWorkoutsByName(workoutName);
  const totalFeedback = workouts.reduce((sum, w) => sum + (w.feedback || 0), 0);
  return totalFeedback / workouts.length;
};

// Mostrar gráfico de pizza ou barras
<PieChart data={difficultyDistribution} />
```

**Conceitos que você vai aprender:**
- Cálculo de médias
- Agrupamento por nome de treino
- Gráficos de pizza/distribuição
- Análise de feedback

**Estimativa:** 2 horas

---

#### Etapa 2.1.4: Atletas Mais Ativos

**O que vamos fazer:**
- Contar treinos concluídos por atleta no último mês
- Mostrar ranking dos atletas mais ativos
- Mostrar gráfico comparativo
- Destacar atletas que treinaram mais

**Onde vamos trabalhar:**
- `app/(tabs)/index.tsx` ou seção de estatísticas

**Código que você vai escrever:**
```typescript
// Contar treinos por atleta
const getMostActiveAthletes = () => {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  // Agrupar por atleta e contar
  // Retornar top 5-10 atletas
};
```

**Conceitos que você vai aprender:**
- Filtragem por data
- Ranking e ordenação
- Agregação de dados por atleta

**Estimativa:** 1-2 horas

---

### 📈 Fase 2.2: Estatísticas Pessoais para o Atleta

#### ✅ Etapa 2.2.1: Evolução de Peso/Carga por Exercício

**Status: CONCLUÍDO** ✅

**O que foi implementado:**
- ✅ Permitir que atleta registre peso/carga usado em cada exercício
- ✅ Mostrar gráfico de evolução ao longo do tempo
- ✅ Comparar com treinos anteriores do mesmo exercício
- ✅ Mostrar tendência (aumentando/diminuindo)
- ✅ Seletor de exercícios para visualizar evolução
- ✅ Estatísticas: primeiro registro, último registro, evolução
- ✅ Gráfico disponível tanto para treinador (no perfil do atleta) quanto para atleta (no próprio dashboard)

**Onde foi trabalhado:**
- ✅ `app/workout-details.tsx` (campo para registrar peso no modal de exercício)
- ✅ `app/athlete-profile.tsx` (gráfico na aba "Gráficos" para treinador)
- ✅ `app/(tabs)/index.tsx` (gráfico no dashboard do atleta)
- ✅ Função `saveExerciseWeight` para salvar peso no AsyncStorage
- ✅ Função `loadWeightHistory` para carregar histórico

**Código implementado:**
```typescript
// Salvar peso usado no exercício
const saveExerciseWeight = async (exerciseId: string, weight: number, workoutId: string) => {
  // Salva no AsyncStorage com estrutura temporal
  // Estrutura: { id, exerciseId, exerciseName, weight, date, workoutId, athleteId }
};

// Carregar histórico e mostrar gráfico
const loadWeightHistory = async () => {
  // Busca histórico do AsyncStorage
  // Agrupa por exercício
  // Filtra pelo exercício selecionado
  // Ordena por data
};
```

**Conceitos aprendidos:**
- ✅ Captura de input numérico com `TextInput` e `keyboardType="numeric"`
- ✅ Salvamento de histórico temporal no AsyncStorage
- ✅ Gráficos de linha com `react-native-gifted-charts`
- ✅ Comparação temporal (primeiro vs último registro)
- ✅ Agrupamento de dados por exercício usando `Map`

**Tempo gasto:** ~3 horas

---

#### ✅ Etapa 2.2.2: Gráfico de Frequência de Treinos

**Status: CONCLUÍDO** ✅

**O que foi implementado:**
- ✅ Mostrar gráfico de barras com treinos por semana
- ✅ Calcular média de treinos por semana
- ✅ Mostrar sequência atual (dias consecutivos)
- ✅ Comparar semana atual com anterior (diferença e percentual)
- ✅ Gráfico com altura otimizada (140px)
- ✅ Barras retangulares com gradiente
- ✅ Labels no topo das barras

**Onde foi trabalhado:**
- ✅ `app/(tabs)/index.tsx` (dashboard do atleta)
- ✅ Seção "Frequência de Treinos" adicionada

**Código implementado:**
```typescript
// Agrupar treinos por semana
const getWeeklyFrequency = () => {
  // Agrupa treinos concluídos por semana usando Map
  // Calcula início da semana (domingo)
  // Retorna últimas 8 semanas ordenadas por data
};

// Calcular média
const getAveragePerWeek = () => {
  const weeklyData = getWeeklyFrequency();
  const total = weeklyData.reduce((sum, week) => sum + week.count, 0);
  return (total / weeklyData.length).toFixed(1);
};

// Comparar semana atual com anterior
const getWeekComparison = () => {
  // Retorna: { current, previous, difference, percentage }
};
```

**Conceitos aprendidos:**
- ✅ Agrupamento temporal usando `Map` e cálculo de semanas
- ✅ Cálculo de médias com `reduce`
- ✅ Visualização de frequência com `BarChart` do `react-native-gifted-charts`
- ✅ Identificação de padrões (comparação semana atual vs anterior)
- ✅ Formatação de labels de semana

**Tempo gasto:** ~2 horas

---

#### Etapa 2.2.3: Média de Dificuldade dos Treinos

**O que vamos fazer:**
- Calcular média do feedback (1-5) ao longo do tempo
- Mostrar gráfico de linha com evolução da dificuldade
- Identificar se está ficando mais fácil (melhorando) ou mais difícil
- Mostrar tendência

**Onde vamos trabalhar:**
- `app/(tabs)/index.tsx` (dashboard do atleta)

**Código que você vai escrever:**
```typescript
// Calcular média de dificuldade por semana
const getDifficultyTrend = () => {
  // Agrupar feedbacks por semana
  // Calcular média de cada semana
  // Retornar para gráfico
};
```

**Conceitos que você vai aprender:**
- Cálculo de médias móveis
- Análise de tendências
- Gráficos de linha com múltiplos pontos

**Estimativa:** 2 horas

---

#### Etapa 2.2.4: Recordes Pessoais

**O que vamos fazer:**
- Calcular maior sequência de dias consecutivos
- Mostrar semana com mais treinos
- Mostrar mês com mais treinos
- Destacar conquistas

**Onde vamos trabalhar:**
- `app/(tabs)/index.tsx` (dashboard do atleta)
- Criar seção "Conquistas" ou "Recordes"

**Código que você vai escrever:**
```typescript
// Calcular sequência máxima
const getMaxStreak = () => {
  // Analisar datas de treinos concluídos
  // Encontrar maior sequência de dias consecutivos
};

// Encontrar semana com mais treinos
const getBestWeek = () => {
  // Agrupar por semana e encontrar a com mais treinos
};
```

**Conceitos que você vai aprender:**
- Análise de sequências
- Identificação de máximos
- Gamificação (conquistas)

**Estimativa:** 2 horas

---

## 🔔 Opção 3: Sistema de Notificações e Lembretes

### Status: **PENDENTE** ⏳

### Por que fazer isso?
- Atletas esquecem de treinar
- Treinador quer ser notificado quando atleta completa treino
- Melhorar engajamento e aderência
- Lembretes ajudam a criar rotina

---

### 📱 Fase 3.1: Notificações Locais

#### Etapa 3.1.1: Configurar Biblioteca de Notificações

**O que vamos fazer:**
- Instalar `expo-notifications`
- Solicitar permissões do dispositivo
- Configurar canal de notificações (Android)
- Testar envio de notificação básica

**Onde vamos trabalhar:**
- `app/_layout.tsx` (configuração inicial)
- Criar `src/services/notifications.ts`

**Código que você vai escrever:**
```typescript
import * as Notifications from 'expo-notifications';

// Solicitar permissões
const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

// Configurar handler de notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

**Conceitos que você vai aprender:**
- Permissões do dispositivo
- Configuração de notificações
- Handlers de notificações
- `expo-notifications` API

**Estimativa:** 1-2 horas

---

#### Etapa 3.1.2: Lembrete de Treino do Dia

**O que vamos fazer:**
- Agendar notificação quando treino é atribuído
- Notificar no dia do treino (ex: às 8h da manhã)
- Mostrar nome do treino e horário
- Permitir configurar horário preferido

**Onde vamos trabalhar:**
- `app/assign-workout.tsx` (agendar ao atribuir)
- Criar função para agendar notificações

**Código que você vai escrever:**
```typescript
// Agendar notificação para o dia do treino
const scheduleWorkoutReminder = async (workoutDate: string, workoutName: string) => {
  const date = new Date(workoutDate);
  date.setHours(8, 0, 0, 0); // 8h da manhã
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Treino de Hoje! 💪',
      body: `Você tem o treino "${workoutName}" hoje`,
      sound: true,
    },
    trigger: date,
  });
};
```

**Conceitos que você vai aprender:**
- Agendamento de notificações
- Cálculo de datas futuras
- Configuração de conteúdo de notificação

**Estimativa:** 2 horas

---

#### Etapa 3.1.3: Notificação quando Treino está Próximo

**O que vamos fazer:**
- Notificar 1 hora antes do treino
- Notificar 30 minutos antes (opcional)
- Mostrar tempo restante
- Permitir configurar lembretes

**Onde vamos trabalhar:**
- `app/assign-workout.tsx`
- Criar função para múltiplas notificações

**Código que você vai escrever:**
```typescript
// Agendar múltiplas notificações
const scheduleWorkoutReminders = async (workoutDate: string, workoutName: string) => {
  const workoutTime = new Date(workoutDate);
  workoutTime.setHours(18, 0, 0, 0); // Exemplo: 18h
  
  // 1 hora antes
  const oneHourBefore = new Date(workoutTime);
  oneHourBefore.setHours(oneHourBefore.getHours() - 1);
  
  // Agendar ambas as notificações
};
```

**Conceitos que você vai aprender:**
- Múltiplos agendamentos
- Cálculo de tempos relativos
- Gerenciamento de notificações

**Estimativa:** 2 horas

---

#### Etapa 3.1.4: Parabéns ao Completar Treino

**O que vamos fazer:**
- Enviar notificação imediatamente ao completar treino
- Mostrar mensagem motivacional
- Mostrar progresso (ex: "3 de 5 treinos esta semana")
- Celebrar conquistas

**Onde vamos trabalhar:**
- `app/workout-details.tsx` (ao marcar como concluído)

**Código que você vai escrever:**
```typescript
// Enviar notificação de parabéns
const sendCompletionNotification = async (workoutName: string) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Treino Concluído! 🎉',
      body: `Parabéns! Você completou "${workoutName}"`,
      sound: true,
    },
    trigger: null, // Imediato
  });
};
```

**Conceitos que você vai aprender:**
- Notificações imediatas
- Mensagens motivacionais
- Gamificação

**Estimativa:** 1 hora

---

### 👨‍🏫 Fase 3.2: Notificações para o Treinador

#### Etapa 3.2.1: Notificação quando Atleta Completa Treino

**O que vamos fazer:**
- Treinador recebe notificação quando atleta completa treino
- Mostrar nome do atleta e treino
- Mostrar feedback (emoji de dificuldade)
- Permitir ver detalhes

**Onde vamos trabalhar:**
- `app/workout-details.tsx` (ao completar)
- Criar função para notificar treinador

**Código que você vai escrever:**
```typescript
// Notificar treinador
const notifyCoach = async (athleteName: string, workoutName: string, feedback: number) => {
  // Verificar se usuário atual é treinador
  // Enviar notificação
};
```

**Conceitos que você vai aprender:**
- Notificações condicionais
- Identificação de tipo de usuário
- Notificações para usuários específicos

**Estimativa:** 2 horas

---

#### Etapa 3.2.2: Alerta quando Atleta não Treina há X Dias

**O que vamos fazer:**
- Verificar diariamente quais atletas não treinaram há 3+ dias
- Enviar notificação para treinador
- Mostrar lista de atletas que precisam de atenção
- Permitir configurar dias de alerta

**Onde vamos trabalhar:**
- Criar `src/services/athlete-monitoring.ts`
- `app/(tabs)/index.tsx` (verificar ao abrir)

**Código que você vai escrever:**
```typescript
// Verificar atletas inativos
const checkInactiveAthletes = async () => {
  const athletes = getAllAthletes();
  const inactive = athletes.filter(athlete => {
    const lastWorkout = getLastWorkoutDate(athlete.id);
    const daysSince = getDaysDifference(lastWorkout, new Date());
    return daysSince >= 3;
  });
  
  // Enviar notificações
};
```

**Conceitos que você vai aprender:**
- Verificações periódicas
- Cálculo de diferença de datas
- Background tasks (futuro)

**Estimativa:** 2-3 horas

---

#### Etapa 3.2.3: Resumo Diário de Atividades

**O que vamos fazer:**
- Enviar notificação diária (ex: às 20h) com resumo
- Mostrar quantos atletas treinaram hoje
- Mostrar treinos concluídos
- Mostrar atletas que precisam de atenção

**Onde vamos trabalhar:**
- Criar função de resumo diário
- Agendar notificação recorrente

**Código que você vai escrever:**
```typescript
// Criar resumo diário
const createDailySummary = () => {
  const today = new Date();
  const workoutsToday = getWorkoutsCompletedToday();
  const activeAthletes = getActiveAthletesToday();
  
  return {
    title: 'Resumo do Dia',
    body: `${workoutsToday.length} treinos concluídos por ${activeAthletes.length} atletas`,
  };
};

// Agendar notificação diária
const scheduleDailySummary = () => {
  // Agendar para 20h todos os dias
};
```

**Conceitos que você vai aprender:**
- Notificações recorrentes
- Agregação de dados diários
- Resumos automáticos

**Estimativa:** 2 horas

---

## 💬 Opção 4: Sistema de Comunicação

### Status: **PENDENTE** ⏳

### Por que fazer isso?
- Treinador precisa dar feedback aos atletas
- Atleta pode fazer perguntas sobre exercícios
- Melhorar comunicação e relacionamento
- Resolver dúvidas rapidamente

---

### 📨 Fase 4.1: Chat/Mensagens

#### Etapa 4.1.1: Estrutura de Dados para Mensagens

**O que vamos fazer:**
- Criar interface para mensagens
- Salvar mensagens no AsyncStorage
- Estrutura: { id, senderId, receiverId, message, timestamp, workoutId? }

**Onde vamos trabalhar:**
- `src/types/index.ts` (adicionar interface Message)
- Criar `src/services/messages.ts`

**Código que você vai escrever:**
```typescript
interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  workoutId?: string; // Opcional: mensagem sobre treino específico
  read: boolean;
}
```

**Conceitos que você vai aprender:**
- Estrutura de dados para chat
- Relacionamentos entre usuários
- Timestamps e ordenação

**Estimativa:** 1 hora

---

#### Etapa 4.1.2: Tela de Chat

**O que vamos fazer:**
- Criar `app/chat.tsx`
- Lista de conversas (treinador ↔ atleta)
- Abrir conversa ao clicar
- Mostrar histórico de mensagens

**Onde vamos trabalhar:**
- Criar `app/chat.tsx`
- Criar `app/chat-conversation.tsx`

**Código que você vai escrever:**
```typescript
// Lista de conversas
const getConversations = () => {
  // Agrupar mensagens por par (treinador-atleta)
  // Retornar última mensagem de cada conversa
};

// Histórico de mensagens
const getMessages = (athleteId: string) => {
  // Buscar todas as mensagens entre treinador e atleta
  // Ordenar por timestamp
};
```

**Conceitos que você vai aprender:**
- FlatList com scroll invertido
- Agrupamento de dados
- Ordenação por data

**Estimativa:** 3-4 horas

---

#### Etapa 4.1.3: Input de Mensagem e Envio

**O que vamos fazer:**
- Campo de texto para digitar mensagem
- Botão de enviar
- Salvar mensagem no AsyncStorage
- Atualizar lista automaticamente

**Onde vamos trabalhar:**
- `app/chat-conversation.tsx`

**Código que você vai escrever:**
```typescript
// Enviar mensagem
const sendMessage = async (message: string, receiverId: string) => {
  const newMessage: Message = {
    id: generateId(),
    senderId: currentUserId,
    receiverId,
    message,
    timestamp: new Date().toISOString(),
    read: false,
  };
  
  await saveMessage(newMessage);
  // Atualizar estado local
};
```

**Conceitos que você vai aprender:**
- Input de texto com teclado
- Gerenciamento de estado de mensagens
- Timestamps

**Estimativa:** 2 horas

---

#### Etapa 4.1.4: Indicadores de Leitura e Status

**O que vamos fazer:**
- Mostrar "enviado" / "lido" nas mensagens
- Marcar mensagens como lidas ao abrir conversa
- Mostrar timestamp formatado (ex: "há 5 minutos")
- Indicador de novas mensagens não lidas

**Onde vamos trabalhar:**
- `app/chat-conversation.tsx`
- `app/chat.tsx` (badge de não lidas)

**Código que você vai escrever:**
```typescript
// Marcar como lida
const markAsRead = async (messageId: string) => {
  // Atualizar mensagem no AsyncStorage
};

// Formatar timestamp
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `há ${minutes}min`;
  // ... mais formatações
};
```

**Conceitos que você vai aprender:**
- Formatação de datas relativas
- Estados de mensagem (enviado/lido)
- Badges e indicadores visuais

**Estimativa:** 2 horas

---

### 💭 Fase 4.2: Comentários nos Treinos

#### Etapa 4.2.1: Adicionar Comentários a Treinos

**O que vamos fazer:**
- Treinador pode deixar observações em treinos atribuídos
- Atleta pode fazer perguntas sobre exercícios específicos
- Mostrar comentários na tela de detalhes do treino
- Histórico de comentários

**Onde vamos trabalhar:**
- `app/workout-details.tsx` (adicionar seção de comentários)
- Criar estrutura de dados para comentários

**Código que você vai escrever:**
```typescript
interface Comment {
  id: string;
  workoutId: string;
  authorId: string;
  authorName: string;
  comment: string;
  timestamp: string;
  exerciseId?: string; // Opcional: comentário sobre exercício específico
}

// Salvar comentário
const addComment = async (workoutId: string, comment: string) => {
  // Salvar no AsyncStorage
};
```

**Conceitos que você vai aprender:**
- Estrutura de comentários
- Relacionamento com treinos/exercícios
- Thread de comentários

**Estimativa:** 2-3 horas

---

#### Etapa 4.2.2: Interface de Comentários

**O que vamos fazer:**
- Mostrar lista de comentários abaixo do treino
- Campo para adicionar novo comentário
- Mostrar autor e data de cada comentário
- Permitir responder comentários (opcional)

**Onde vamos trabalhar:**
- `app/workout-details.tsx`

**Código que você vai escrever:**
```typescript
// Componente de comentário
const CommentItem = ({ comment }) => (
  <View>
    <Text>{comment.authorName}</Text>
    <Text>{comment.comment}</Text>
    <Text>{formatTimestamp(comment.timestamp)}</Text>
  </View>
);
```

**Conceitos que você vai aprender:**
- Lista de comentários
- Input de texto
- Formatação de datas

**Estimativa:** 2 horas

---

## 🎨 Opção 5: Melhorias de UX/UI

### Status: **PARCIALMENTE CONCLUÍDO** ✅ (5.1.1, 5.1.2, 5.1.3, 5.1.4, 5.2.1, 5.2.2)

### Por que fazer isso?
- Tornar o app mais intuitivo e agradável
- Adicionar animações suaves
- Melhorar feedback visual
- Criar sensação de qualidade profissional

---

### ✨ Fase 5.1: Animações

#### Etapa 5.1.1: Transições Suaves entre Telas ✅ **CONCLUÍDO**

**O que vamos fazer:**
- Adicionar animações de transição ao navegar
- Fade in/out ao abrir modais
- Slide animations
- Melhorar experiência de navegação

**Onde vamos trabalhar:**
- `app/_layout.tsx` (configuração de navegação)
- Modais existentes

**✅ Implementado:**
- Transições customizadas por tipo de tela (slide_from_right, slide_from_bottom, fade)
- Fundo escuro mantido durante transições
- Animações suaves configuradas no Stack Navigator

**Código que você vai escrever:**
```typescript
import { Animated } from 'react-native';

// Animação de fade
const fadeAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }).start();
}, []);
```

**Conceitos que você vai aprender:**
- `Animated` API do React Native
- `useRef` para valores animados
- Transições suaves
- `useNativeDriver` para performance

**Estimativa:** 2-3 horas

---

#### Etapa 5.1.2: Animações ao Completar Treino ✅ **CONCLUÍDO**

**O que vamos fazer:**
- Animação de confete ao completar treino
- Animação de checkmark
- Efeito de "pulse" no botão
- Celebrar conquistas visualmente

**Onde vamos trabalhar:**
- `app/workout-details.tsx` (ao marcar como concluído)

**✅ Implementado:**
- Componente `CelebrationAnimation.tsx` criado
- 20 partículas de confete coloridas animadas
- Checkmark central animado com círculo verde
- Efeito pulse contínuo no botão "Marcar como Concluído"
- Integrado na função `handleConfirmCompletion`

**Código que você vai escrever:**
```typescript
// Animação de confete
const celebrateCompletion = () => {
  // Criar animação de partículas
  // Ou usar biblioteca de confete
};
```

**Conceitos que você vai aprender:**
- Animações de celebração
- Efeitos visuais
- Gamificação visual

**Estimativa:** 2-3 horas

---

#### Etapa 5.1.3: Loading States Mais Bonitos ✅ **CONCLUÍDO**

**O que vamos fazer:**
- Substituir "Carregando..." por skeleton loaders
- Mostrar placeholders enquanto carrega
- Animações de shimmer
- Melhorar percepção de velocidade

**Onde vamos trabalhar:**
- Todas as telas com loading
- Criar componente `SkeletonLoader.tsx`

**✅ Implementado:**
- Componente `SkeletonLoader.tsx` criado com animação shimmer
- Componente `SkeletonCard.tsx` para cards de skeleton
- Aplicado na tela `workout-details.tsx` durante carregamento
- Placeholders animados para header, progresso, blocos e botão

**Código que você vai escrever:**
```typescript
// Skeleton loader
const SkeletonCard = () => (
  <View className="bg-dark-800 rounded-xl p-4 animate-pulse">
    <View className="h-4 bg-dark-700 rounded w-3/4 mb-2" />
    <View className="h-4 bg-dark-700 rounded w-1/2" />
  </View>
);
```

**Conceitos que você vai aprender:**
- Skeleton loaders
- Placeholders animados
- Percepção de performance

**Estimativa:** 2 horas

---

#### Etapa 5.1.4: Pull-to-Refresh ✅ **CONCLUÍDO**

**O que vamos fazer:**
- Adicionar pull-to-refresh nas listas
- Atualizar dados ao puxar para baixo
- Mostrar indicador visual
- Melhorar UX de atualização

**Onde vamos trabalhar:**
- `app/(tabs)/index.tsx`
- `app/athlete-profile.tsx`
- Outras telas com listas

**✅ Implementado:**
- Pull-to-refresh adicionado na tela Home (`index.tsx`)
- Pull-to-refresh adicionado na tela de Atletas (`two.tsx`)
- Toast de confirmação após atualizar dados
- Indicador visual laranja (#fb923c) durante refresh

**Código que você vai escrever:**
```typescript
import { RefreshControl } from 'react-native';

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
    />
  }
>
```

**Conceitos que você vai aprender:**
- `RefreshControl`
- Atualização de dados
- UX patterns

**Estimativa:** 1 hora

---

### 🎯 Fase 5.2: Melhorias Visuais

#### Etapa 5.2.1: Empty States Mais Informativos ✅ **CONCLUÍDO**

**O que vamos fazer:**
- Quando não há treinos, mostrar mensagem útil
- Quando não há atletas, mostrar como adicionar
- Ícones e ilustrações
- Call-to-action claro

**Onde vamos trabalhar:**
- Todas as telas com listas vazias

**✅ Implementado:**
- Componente `EmptyState.tsx` criado e reutilizável
- Aplicado em: lista de treinos vazia, histórico de peso, gráfico de frequência, gráfico de dificuldade, lista de atletas
- Ícones FontAwesome integrados
- Suporte a call-to-action opcional

**Código que você vai escrever:**
```typescript
// Empty state component
const EmptyState = ({ message, actionLabel, onAction }) => (
  <View className="items-center justify-center py-12">
    <Text className="text-neutral-400 text-center mb-4">{message}</Text>
    {onAction && (
      <TouchableOpacity onPress={onAction}>
        <Text>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);
```

**Conceitos que você vai aprender:**
- Empty states
- UX de listas vazias
- Call-to-actions

**Estimativa:** 1-2 horas

---

#### Etapa 5.2.2: Melhor Feedback de Ações (Toasts) ✅ **CONCLUÍDO**

**O que vamos fazer:**
- Substituir `Alert.alert` por toasts mais bonitos
- Mostrar feedback visual ao salvar/editar/deletar
- Toasts não bloqueantes
- Animações suaves

**Onde vamos trabalhar:**
- Criar componente `Toast.tsx`
- Substituir alerts em todas as telas

**✅ Implementado:**
- Componente `Toast.tsx` criado com 4 tipos (success, error, info, warning)
- `ToastProvider.tsx` para gerenciamento global
- Integrado no `_layout.tsx`
- Usado no pull-to-refresh e outras ações
- Animações de entrada/saída suaves

**Código que você vai escrever:**
```typescript
// Toast component
const Toast = ({ message, type }) => (
  <Animated.View className="bg-dark-900 rounded-lg px-4 py-3">
    <Text className="text-white">{message}</Text>
  </Animated.View>
);
```

**Conceitos que você vai aprender:**
- Toasts e snackbars
- Feedback não bloqueante
- Animações de entrada/saída

**Estimativa:** 2 horas

---

#### Etapa 5.2.3: Dark Mode Toggle (Já temos dark, adicionar light)

**O que vamos fazer:**
- Adicionar modo claro (light mode)
- Toggle para alternar entre dark/light
- Salvar preferência do usuário
- Aplicar tema em todas as telas

**Onde vamos trabalhar:**
- Criar `src/contexts/ThemeContext.tsx`
- Atualizar todas as telas para usar tema dinâmico

**Código que você vai escrever:**
```typescript
// Theme context
const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  
  const theme = isDark ? darkTheme : lightTheme;
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

**Conceitos que você vai aprender:**
- Context API
- Theming dinâmico
- Preferências do usuário
- Aplicação de temas

**Estimativa:** 3-4 horas

---

## 📊 Resumo de Estimativas

### Opção 2: Estatísticas e Relatórios
- **Total:** ~15-20 horas
- **Fase 2.1 (Treinador):** ~8-10 horas
- **Fase 2.2 (Atleta):** ~7-10 horas

### Opção 3: Notificações
- **Total:** ~10-12 horas
- **Fase 3.1 (Locais):** ~6-7 horas
- **Fase 3.2 (Treinador):** ~4-5 horas

### Opção 4: Comunicação
- **Total:** ~10-12 horas
- **Fase 4.1 (Chat):** ~8-9 horas
- **Fase 4.2 (Comentários):** ~2-3 horas

### Opção 5: UX/UI
- **Total:** ~10-12 horas
- **Fase 5.1 (Animações):** ✅ **CONCLUÍDO** (~7-9 horas)
  - ✅ 5.1.1: Transições Suaves
  - ✅ 5.1.2: Animações ao Completar Treino
  - ✅ 5.1.3: Loading States Mais Bonitos
  - ✅ 5.1.4: Pull-to-Refresh
- **Fase 5.2 (Visuais):** 🔄 **PARCIALMENTE CONCLUÍDO** (~3-4 horas)
  - ✅ 5.2.1: Empty States Mais Informativos
  - ✅ 5.2.2: Melhor Feedback de Ações (Toasts)
  - ⏳ 5.2.3: Dark Mode Toggle (Pendente)

---

## 🎯 Próximos Passos Sugeridos

### Ordem Recomendada:

1. ✅ **Opção 2.2.1** - Evolução de Peso/Carga (Atleta) - **CONCLUÍDO**
2. ✅ **Opção 2.2.2** - Gráfico de Frequência de Treinos - **CONCLUÍDO**
3. ✅ **Opção 2.2.3** - Média de Dificuldade dos Treinos - **CONCLUÍDO** (já estava implementado)
4. ✅ **Opção 2.2.4** - Recordes Pessoais - **CONCLUÍDO** (já estava implementado)
5. ✅ **Opção 5.1.1** - Transições Suaves entre Telas - **CONCLUÍDO**
6. ✅ **Opção 5.1.2** - Animações ao Completar Treino - **CONCLUÍDO**
7. ✅ **Opção 5.1.3** - Loading States Mais Bonitos - **CONCLUÍDO**
8. ✅ **Opção 5.1.4** - Pull-to-Refresh - **CONCLUÍDO**
9. ✅ **Opção 5.2.1** - Empty States Mais Informativos - **CONCLUÍDO**
10. ✅ **Opção 5.2.2** - Melhor Feedback de Ações (Toasts) - **CONCLUÍDO**

### 🔄 Próximas Etapas Sugeridas:

1. ⏳ **Opção 5.2.3** - Dark Mode Toggle
   - Adicionar modo claro (light mode)
   - Toggle para alternar entre dark/light
   - Salvar preferência do usuário
   - Estimativa: 3-4 horas

2. ⏳ **Opção 2.1.1** - Gráfico de Treinos Concluídos por Semana (Treinador)
   - Estatísticas para o treinador
   - Visualização de progresso dos atletas
   - Estimativa: 2-3 horas

3. ⏳ **Opção 3.1.1** - Configurar Notificações
   - Base para todas as notificações
   - Melhora engajamento
   - Estimativa: 1-2 horas

4. ⏳ **Opção 4.1.1** - Sistema de Chat/Mensagens
   - Comunicação entre treinador e atleta
   - Histórico de mensagens
   - Estimativa: 8-9 horas

---

## 📍 Onde Paramos Hoje (Última Sessão)

### ✅ Concluído na Sessão Anterior:

1. **Etapa 2.2.1: Evolução de Peso/Carga por Exercício**
   - ✅ Campo de registro de peso no modal de exercício (`workout-details.tsx`)
   - ✅ Gráfico de evolução para treinador (`athlete-profile.tsx`)
   - ✅ Gráfico de evolução para atleta (`app/(tabs)/index.tsx`)
   - ✅ Seletor de exercícios para visualizar evolução
   - ✅ Estatísticas: primeiro registro, último registro, evolução
   - ✅ Salvamento no AsyncStorage com estrutura temporal

2. **Etapa 2.2.2: Gráfico de Frequência de Treinos**
   - ✅ Gráfico de barras com frequência semanal
   - ✅ Função `getWeeklyFrequency()` para agrupar por semana
   - ✅ Função `getAveragePerWeek()` para calcular média
   - ✅ Função `getWeekComparison()` para comparar semanas
   - ✅ Estatísticas: média semanal, comparação semana atual vs anterior
   - ✅ Otimização: altura reduzida (140px), barras retangulares, labels corretos

### ✅ Concluído Hoje (Sessão Atual):

3. **Etapa 2.2.3: Média de Dificuldade dos Treinos** ✅ **JÁ ESTAVA IMPLEMENTADO**
   - ✅ Gráfico de linha com evolução do feedback (1-5)
   - ✅ Análise de tendência (melhorando/piorando/estável)
   - ✅ Comparação primeira vs última semana
   - ✅ Empty state quando não há dados

4. **Etapa 2.2.4: Recordes Pessoais** ✅ **JÁ ESTAVA IMPLEMENTADO**
   - ✅ Maior sequência de dias consecutivos
   - ✅ Melhor semana (mais treinos)
   - ✅ Melhor mês (mais treinos)
   - ✅ Badge "Novo recorde!" quando bate recorde

5. **Etapa 5.1.1: Transições Suaves entre Telas** ✅ **CONCLUÍDO**
   - ✅ Animações customizadas por tipo de tela
   - ✅ Fundo escuro mantido durante transições
   - ✅ Configuração no Stack Navigator

6. **Etapa 5.1.2: Animações ao Completar Treino** ✅ **CONCLUÍDO**
   - ✅ Confete animado (20 partículas)
   - ✅ Checkmark central animado
   - ✅ Efeito pulse no botão

7. **Etapa 5.1.3: Loading States Mais Bonitos** ✅ **CONCLUÍDO**
   - ✅ SkeletonLoader aplicado em workout-details
   - ✅ Placeholders animados

8. **Etapa 5.1.4: Pull-to-Refresh** ✅ **CONCLUÍDO**
   - ✅ Implementado nas telas principais
   - ✅ Toast de confirmação

9. **Etapa 5.2.1: Empty States Mais Informativos** ✅ **CONCLUÍDO**
   - ✅ Componente reutilizável criado
   - ✅ Aplicado em todas as listas vazias

10. **Etapa 5.2.2: Melhor Feedback de Ações** ✅ **CONCLUÍDO**
    - ✅ Sistema de Toast implementado
    - ✅ ToastProvider global

11. **Melhorias Adicionais Implementadas:**
    - ✅ Componente `CustomAlert.tsx` criado para substituir Alert.alert feios
    - ✅ Modais customizados com design escuro, ícones coloridos e animações suaves
    - ✅ Reordenação da tela home do atleta: "Treino de Hoje" agora aparece após "Seu Progresso" e antes de "Frequência de Treinos"
    - ✅ Todos os Alert.alert substituídos por CustomAlert em workout-details.tsx
    - ✅ Design profissional mantido em todo o app

### 📦 Componentes Criados Nesta Sessão:

- `components/CelebrationAnimation.tsx` - Animações de celebração ao completar treino
- `components/CustomAlert.tsx` - Modais customizados para substituir Alert.alert
- `components/SkeletonLoader.tsx` - Loading states animados (já existia, agora aplicado)
- `components/EmptyState.tsx` - Estados vazios informativos (já existia, agora aplicado)
- `components/Toast.tsx` - Sistema de feedback visual (já existia, agora aplicado)
- `components/ToastProvider.tsx` - Provider global para toasts (já existia, agora aplicado)

### 🔄 Próximos Passos Sugeridos:

**Etapa 5.2.3: Dark Mode Toggle**
- Adicionar modo claro (light mode)
- Toggle para alternar entre dark/light
- Salvar preferência do usuário
- Estimativa: 3-4 horas

---

## 📝 Como Usar Este Documento

1. **Marque como concluído** quando terminar cada etapa
2. **Anote problemas** encontrados durante implementação
3. **Ajuste estimativas** baseado na experiência real
4. **Priorize** conforme necessidade do projeto

---

**Pronto para começar? Escolha uma etapa e vamos implementar juntos!** 🚀
