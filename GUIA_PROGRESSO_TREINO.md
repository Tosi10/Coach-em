# 📚 Guia Passo a Passo - Progresso Visual no Treino

## 🎯 Objetivo
Adicionar checkboxes para marcar exercícios como concluídos e mostrar o progresso do treino em tempo real.

---

## 📍 Onde vamos trabalhar?
**Arquivo:** `app/workout-details.tsx`

Este é o arquivo que mostra os detalhes de um treino quando o atleta clica nele.

---

## 🧠 Conceitos que vamos aprender:

### 1. **Set em JavaScript**
Um `Set` é como uma lista, mas **não permite valores duplicados**.

**Exemplo:**
```typescript
const meuSet = new Set();
meuSet.add('exercicio1'); // Adiciona
meuSet.add('exercicio2'); // Adiciona
meuSet.add('exercicio1'); // Não adiciona de novo (já existe)
meuSet.has('exercicio1'); // Retorna true
meuSet.delete('exercicio1'); // Remove
```

**Por que usar Set?**
- Garante que cada exercício só seja marcado uma vez
- É rápido para verificar se algo existe (`has()`)
- Não precisa se preocupar com duplicatas

---

### 2. **useState com estruturas complexas**
Até agora você usou `useState` com valores simples (números, strings).
Agora vamos usar com estruturas mais complexas (Set, objetos).

**Exemplo:**
```typescript
// Simples (você já conhece)
const [contador, setContador] = useState(0);

// Complexo (novo!)
const [exerciciosFeitos, setExerciciosFeitos] = useState<Set<string>>(new Set());
```

**Por que tipar com `<Set<string>>`?**
- TypeScript precisa saber que tipo de dados está dentro do Set
- `<string>` significa "um Set que guarda strings"
- Isso ajuda a evitar erros

---

### 3. **Cálculo de porcentagem**
Vamos calcular quantos % do treino foi concluído.

**Fórmula:**
```
porcentagem = (quantidade concluída / quantidade total) × 100
```

**Exemplo:**
- Treino tem 10 exercícios
- 3 foram concluídos
- Porcentagem = (3 / 10) × 100 = 30%

---

## 📝 Passo 1: Adicionar Estados

**Onde:** No início da função `WorkoutDetailsScreen`, depois dos outros `useState`

**Código para adicionar:**
```typescript
// Estado para controlar quais exercícios foram concluídos
const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

// Estado para calcular porcentagem de conclusão
const [completionPercentage, setCompletionPercentage] = useState(0);
```

**Explicação linha por linha:**

1. **`const [completedExercises, setCompletedExercises]`**
   - `completedExercises`: Variável que guarda o Set com IDs dos exercícios concluídos
   - `setCompletedExercises`: Função para atualizar esse Set
   - É como uma "lista" de exercícios que já foram feitos

2. **`useState<Set<string>>(new Set())`**
   - `useState`: Hook do React para criar estado
   - `<Set<string>>`: Tipo TypeScript - "um Set que guarda strings"
   - `new Set()`: Valor inicial - um Set vazio (nenhum exercício concluído ainda)

3. **`const [completionPercentage, setCompletionPercentage]`**
   - Guarda a porcentagem de conclusão (0 a 100)
   - Começa em 0 (nenhum exercício concluído)

---

## 📝 Passo 2: Criar Função para Marcar/Desmarcar Exercício

**Onde:** Depois dos `useState`, antes do `useEffect`

**Código para adicionar:**
```typescript
// Função para marcar ou desmarcar um exercício como concluído
const toggleExercise = (exerciseId: string) => {
  // Criar um novo Set (não modificar o antigo diretamente)
  const newCompleted = new Set(completedExercises);
  
  // Se o exercício já está marcado, desmarcar
  // Se não está marcado, marcar
  if (newCompleted.has(exerciseId)) {
    newCompleted.delete(exerciseId);
  } else {
    newCompleted.add(exerciseId);
  }
  
  // Atualizar o estado
  setCompletedExercises(newCompleted);
  
  // Calcular nova porcentagem
  calculateCompletionPercentage(newCompleted);
};

// Função para calcular porcentagem de conclusão
const calculateCompletionPercentage = (completedSet: Set<string>) => {
  // Contar total de exercícios em todos os blocos
  let totalExercises = 0;
  if (workoutTemplate?.blocks) {
    workoutTemplate.blocks.forEach((block: any) => {
      totalExercises += block.exercises?.length || 0;
    });
  }
  
  // Se não há exercícios, porcentagem é 0
  if (totalExercises === 0) {
    setCompletionPercentage(0);
    return;
  }
  
  // Calcular porcentagem: (concluídos / total) × 100
  const percentage = (completedSet.size / totalExercises) * 100;
  setCompletionPercentage(Math.round(percentage)); // Arredondar para número inteiro
};
```

**Explicação linha por linha:**

### Função `toggleExercise`:

1. **`const toggleExercise = (exerciseId: string) => {`**
   - Cria uma função que recebe o ID do exercício
   - `exerciseId`: O ID único do exercício que foi clicado

2. **`const newCompleted = new Set(completedExercises);`**
   - Cria uma **cópia** do Set atual
   - **Por quê?** No React, não devemos modificar o estado diretamente
   - É como fazer uma cópia de um documento antes de editar

3. **`if (newCompleted.has(exerciseId)) {`**
   - Verifica se o exercício já está marcado como concluído
   - `.has()` retorna `true` se existe, `false` se não existe

4. **`newCompleted.delete(exerciseId);`**
   - Se já estava marcado, **desmarca** (remove do Set)
   - É como desmarcar uma checkbox

5. **`newCompleted.add(exerciseId);`**
   - Se não estava marcado, **marca** (adiciona ao Set)
   - É como marcar uma checkbox

6. **`setCompletedExercises(newCompleted);`**
   - Atualiza o estado com o novo Set
   - Isso faz o React re-renderizar a tela

7. **`calculateCompletionPercentage(newCompleted);`**
   - Chama a função para recalcular a porcentagem
   - Passa o novo Set como parâmetro

### Função `calculateCompletionPercentage`:

1. **`let totalExercises = 0;`**
   - Variável para contar quantos exercícios existem no total
   - Começa em 0

2. **`if (workoutTemplate?.blocks) {`**
   - Verifica se existe `workoutTemplate` e se tem `blocks`
   - O `?` é "optional chaining" - se não existir, não dá erro

3. **`workoutTemplate.blocks.forEach((block: any) => {`**
   - Percorre cada bloco do treino (Aquecimento, Trabalho, Finalização)
   - `forEach` é como um `for`, mas mais moderno

4. **`totalExercises += block.exercises?.length || 0;`**
   - Soma a quantidade de exercícios deste bloco
   - `+=` significa "soma ao valor atual"
   - `|| 0` significa "se não existir, use 0"

5. **`if (totalExercises === 0) {`**
   - Se não há exercícios, não faz sentido calcular porcentagem
   - Retorna 0 e para a função

6. **`const percentage = (completedSet.size / totalExercises) * 100;`**
   - Calcula a porcentagem
   - `completedSet.size`: Quantidade de exercícios concluídos
   - `/ totalExercises`: Divide pelo total
   - `* 100`: Multiplica por 100 para ter porcentagem (0-100)

7. **`setCompletionPercentage(Math.round(percentage));`**
   - `Math.round()`: Arredonda para número inteiro (30.7 vira 31)
   - Atualiza o estado com a porcentagem

---

## 📝 Passo 3: Carregar Progresso Salvo ao Abrir o Treino

**Onde:** Dentro do `useEffect` que carrega o treino

**Código para adicionar:**
```typescript
// Carregar progresso salvo (se existir)
const loadSavedProgress = async () => {
  try {
    const savedProgressJson = await AsyncStorage.getItem(`workout_progress_${workoutId}`);
    if (savedProgressJson) {
      const savedProgress = JSON.parse(savedProgressJson);
      // Converter array de volta para Set
      const savedSet = new Set(savedProgress.completedExercises || []);
      setCompletedExercises(savedSet);
      calculateCompletionPercentage(savedSet);
    }
  } catch (error) {
    console.error('Erro ao carregar progresso:', error);
  }
};

// Chamar essa função quando o treino for carregado
loadSavedProgress();
```

**Explicação:**

1. **`AsyncStorage.getItem(\`workout_progress_${workoutId}\`)`**
   - Busca o progresso salvo para este treino específico
   - Usa o `workoutId` para criar uma chave única
   - Exemplo: `workout_progress_123`

2. **`JSON.parse(savedProgressJson)`**
   - Converte o JSON (texto) de volta para objeto JavaScript
   - AsyncStorage só guarda texto, então precisamos converter

3. **`new Set(savedProgress.completedExercises || [])`**
   - Converte o array salvo de volta para Set
   - `|| []` significa "se não existir, use array vazio"

4. **`setCompletedExercises(savedSet)`**
   - Restaura o estado com os exercícios que já foram concluídos

---

## 📝 Passo 4: Salvar Progresso Automaticamente

**Onde:** Criar um `useEffect` que salva sempre que `completedExercises` mudar

**Código para adicionar:**
```typescript
// Salvar progresso automaticamente sempre que mudar
useEffect(() => {
  const saveProgress = async () => {
    try {
      // Converter Set para array (AsyncStorage não aceita Set diretamente)
      const progressToSave = {
        completedExercises: Array.from(completedExercises),
        lastUpdated: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(
        `workout_progress_${workoutId}`,
        JSON.stringify(progressToSave)
      );
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  };
  
  // Só salvar se o treino já foi carregado
  if (workoutTemplate && completedExercises.size > 0) {
    saveProgress();
  }
}, [completedExercises, workoutId, workoutTemplate]);
```

**Explicação:**

1. **`useEffect(() => { ... }, [completedExercises, ...])`**
   - Executa sempre que `completedExercises` mudar
   - É como um "observador" que fica de olho

2. **`Array.from(completedExercises)`**
   - Converte Set para Array
   - AsyncStorage não aceita Set, então precisamos converter

3. **`JSON.stringify(progressToSave)`**
   - Converte objeto JavaScript para JSON (texto)
   - AsyncStorage só aceita texto

4. **`if (workoutTemplate && completedExercises.size > 0)`**
   - Só salva se o treino já foi carregado E há exercícios concluídos
   - Evita salvar dados vazios

---

## 📝 Passo 5: Adicionar Checkbox em Cada Exercício

**Onde:** Na parte que renderiza os exercícios (dentro do `.map`)

**Código para adicionar:**
```typescript
// Dentro do map de exercícios, adicionar um checkbox
<TouchableOpacity
  onPress={() => toggleExercise(exercise.exerciseId || `block_${blockIndex}_ex_${exerciseIndex}`)}
  className="absolute top-2 right-2"
>
  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
    completedExercises.has(exercise.exerciseId || `block_${blockIndex}_ex_${exerciseIndex}`)
      ? 'bg-green-500 border-green-500'
      : 'border-primary-400 bg-transparent'
  }`}>
    {completedExercises.has(exercise.exerciseId || `block_${blockIndex}_ex_${exerciseIndex}`) && (
      <FontAwesome name="check" size={12} color="#fff" />
    )}
  </View>
</TouchableOpacity>
```

**Explicação:**

1. **`TouchableOpacity`**
   - Botão clicável para marcar/desmarcar
   - `onPress`: Quando clicar, chama `toggleExercise`

2. **`className="absolute top-2 right-2"`**
   - Posiciona o checkbox no canto superior direito do card
   - `absolute`: Posição absoluta (sobrepõe outros elementos)

3. **`completedExercises.has(...)`**
   - Verifica se este exercício está marcado
   - Se sim, mostra verde com check
   - Se não, mostra apenas borda

4. **`exercise.exerciseId || \`block_${blockIndex}_ex_${exerciseIndex}\``**
   - Usa o ID do exercício se existir
   - Se não existir, cria um ID único baseado na posição
   - Garante que cada exercício tenha um ID único

---

## 📝 Passo 6: Adicionar Barra de Progresso no Topo

**Onde:** Logo após o header "Voltar", antes das informações do treino

**Código para adicionar:**
```typescript
{/* Barra de Progresso */}
{workoutTemplate && (
  <View className="mb-6">
    <View className="flex-row justify-between items-center mb-2">
      <Text className="text-white font-semibold">
        Progresso do Treino
      </Text>
      <Text className="text-primary-400 font-bold">
        {completionPercentage}%
      </Text>
    </View>
    
    {/* Barra visual de progresso */}
    <View className="h-3 bg-dark-800 rounded-full overflow-hidden">
      <View 
        className="h-full bg-primary-500 rounded-full transition-all"
        style={{ width: `${completionPercentage}%` }}
      />
    </View>
    
    <Text className="text-neutral-400 text-xs mt-1">
      {completedExercises.size} de {(() => {
        let total = 0;
        workoutTemplate.blocks?.forEach((block: any) => {
          total += block.exercises?.length || 0;
        });
        return total;
      })()} exercícios concluídos
    </Text>
  </View>
)}
```

**Explicação:**

1. **`{workoutTemplate && (...)`**
   - Só mostra se o treino já foi carregado
   - `&&` significa "se verdadeiro, mostre isso"

2. **Barra de progresso visual:**
   - Container externo (`bg-dark-800`): Fundo escuro da barra
   - Container interno (`bg-primary-500`): Barra laranja que cresce
   - `width: ${completionPercentage}%`: Largura baseada na porcentagem

3. **Contador de exercícios:**
   - Mostra "X de Y exercícios concluídos"
   - Calcula o total dinamicamente

---

## 🎯 Resumo do que vamos fazer:

1. ✅ Adicionar estados (`completedExercises`, `completionPercentage`)
2. ✅ Criar função `toggleExercise` (marcar/desmarcar)
3. ✅ Criar função `calculateCompletionPercentage` (calcular %)
4. ✅ Carregar progresso salvo ao abrir treino
5. ✅ Salvar progresso automaticamente
6. ✅ Adicionar checkbox em cada exercício
7. ✅ Adicionar barra de progresso visual

---

## 🚀 Próximo passo:

Depois que isso estiver funcionando, vamos adicionar:
- Botão "Próximo Exercício"
- Timer de descanso
- Navegação entre exercícios

---

**Pronto para começar? Vou implementar o código agora e você pode copiar e entender cada parte!**
