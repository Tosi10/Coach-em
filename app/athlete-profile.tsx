/**
 * TELA DE PERFIL DO ATLETA
 * 
 * Esta tela mostra o perfil completo do atleta com:
 * - Informações do atleta (foto, nome, status)
 * - Tabs: Treinos, Gráficos, Fotos
 * - Histórico de treinos
 * - Gráfico de evolução
 * - Botão para atribuir treino
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LineChart } from 'react-native-gifted-charts';

// Dados mockados de atletas
const mockAthletes = [
  { id: '1', name: 'João Silva', sport: 'Futebol', status: 'Ativo' },
  { id: '2', name: 'Maria Oliveira', sport: 'Vôlei', status: 'Ativo' },
  { id: '3', name: 'Pedro Santos', sport: 'Basquete', status: 'Ativo' },
  { id: '4', name: 'Ana Souza', sport: 'Atletismo', status: 'Ativo' },
  { id: '5', name: 'Carlos Ferreira', sport: 'Futebol', status: 'Ativo' },
  { id: '6', name: 'Laura Rodrigues', sport: 'Vôlei', status: 'Ativo' },
  { id: '7', name: 'Rafael Oliveira', sport: 'Basquete', status: 'Ativo' },
  { id: '8', name: 'Camila Silva', sport: 'Atletismo', status: 'Ativo' },
];

// Dados mockados para gráfico de evolução (volume de carga em kg)
const mockEvolutionData = [
  { month: 'Nov 2025', value: 15 },
  { month: 'Nov 2025', value: 18 },
  { month: 'Jan 2026', value: 25 },
  { month: 'Jan 2026', value: 32 },
  { month: 'Jan 2026', value: 38 },
];

export default function AthleteProfileScreen() {
  const router = useRouter();
  const { athleteId } = useLocalSearchParams();
  
  // Garantir que athleteId seja sempre string
  const athleteIdString = Array.isArray(athleteId) ? athleteId[0] : athleteId;
  
  const [athlete, setAthlete] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'treinos' | 'graficos' | 'fotos'>('graficos');
  const [athleteWorkouts, setAthleteWorkouts] = useState<any[]>([]);
  const [hasTrainedToday, setHasTrainedToday] = useState(false);
  
  // Estados para gráfico de evolução de peso
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [availableExercises, setAvailableExercises] = useState<any[]>([]);
  const [workoutsToShow, setWorkoutsToShow] = useState(5); // Mostrar apenas 5 treinos inicialmente
  const [workoutSubTab, setWorkoutSubTab] = useState<'historico' | 'proximos'>('proximos'); // Sub-tab dentro de Treinos

  useEffect(() => {
    // Buscar dados do atleta
    const foundAthlete = mockAthletes.find(a => a.id === athleteIdString);
    if (foundAthlete) {
      setAthlete(foundAthlete);
    }

    // Verificar se treinou hoje
    loadAthleteWorkouts();
    // Carregar histórico de peso
    loadWeightHistory();
  }, [athleteIdString]);

  const loadAthleteWorkouts = async () => {
    try {
      const assignedWorkoutsJson = await AsyncStorage.getItem('assigned_workouts');
      let allWorkouts = [];
      
      if (assignedWorkoutsJson) {
        allWorkouts = JSON.parse(assignedWorkoutsJson);
      }

      // Filtrar treinos deste atleta
      const workouts = allWorkouts.filter((w: any) => w.athleteId === athleteIdString);
      
      // Carregar status de cada treino
      const workoutsWithStatus = await Promise.all(
        workouts.map(async (workout: any) => {
          const savedStatus = await AsyncStorage.getItem(`workout_${workout.id}_status`);
          return {
            ...workout,
            status: savedStatus || workout.status || 'Pendente',
          };
        })
      );

      setAthleteWorkouts(workoutsWithStatus);

      // Verificar se treinou hoje
      const today = new Date().toISOString().split('T')[0];
      const trainedToday = workoutsWithStatus.some((w: any) => {
        const completedDate = w.completedDate ? new Date(w.completedDate).toISOString().split('T')[0] : w.date;
        return w.status === 'Concluído' && completedDate === today;
      });
      setHasTrainedToday(trainedToday);
    } catch (error) {
      console.error('Erro ao carregar treinos do atleta:', error);
    }
  };

  // Carregar histórico de peso do atleta
  const loadWeightHistory = async () => {
    try {
      const weightHistoryJson = await AsyncStorage.getItem('exercise_weight_history');
      if (!weightHistoryJson) {
        setWeightHistory([]);
        setAvailableExercises([]);
        return;
      }

      const allHistory = JSON.parse(weightHistoryJson);
      
      // Filtrar apenas registros deste atleta
      // Nota: Por enquanto, vamos mostrar todos os registros, já que não temos sistema de autenticação
      // Quando implementar autenticação, filtrar por athleteId
      const athleteHistory = allHistory; // TODO: Filtrar por athleteId quando tiver autenticação
      
      // Agrupar por exercício para criar lista de exercícios disponíveis
      const exercisesMap = new Map<string, string>();
      athleteHistory.forEach((record: any) => {
        if (record.exerciseId && record.exerciseName) {
          exercisesMap.set(record.exerciseId, record.exerciseName);
        }
      });
      
      const exercises = Array.from(exercisesMap.entries()).map(([id, name]) => ({
        id,
        name,
      }));
      
      setAvailableExercises(exercises);
      
      // Se há exercícios e nenhum selecionado, selecionar o primeiro
      if (exercises.length > 0 && !selectedExercise) {
        setSelectedExercise(exercises[0].id);
      }
      
      // Filtrar histórico pelo exercício selecionado
      if (selectedExercise) {
        const filtered = athleteHistory
          .filter((r: any) => r.exerciseId === selectedExercise)
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setWeightHistory(filtered);
      } else {
        setWeightHistory([]);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de peso:', error);
    }
  };

  // Recarregar histórico quando exercício selecionado mudar
  useEffect(() => {
    if (athleteIdString) {
      loadWeightHistory();
    }
  }, [selectedExercise, athleteIdString]);


  // Função para deletar treino(s)
  const handleDeleteWorkout = async (workoutIds: string[], isGroup: boolean = false) => {
    const workoutCount = workoutIds.length;
    const message = isGroup 
      ? `Deseja deletar este grupo de ${workoutCount} treino${workoutCount !== 1 ? 's' : ''}?`
      : `Deseja deletar este treino?`;

    Alert.alert(
      'Confirmar exclusão',
      message,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              const assignedWorkoutsJson = await AsyncStorage.getItem('assigned_workouts');
              let allWorkouts = [];
              
              if (assignedWorkoutsJson) {
                allWorkouts = JSON.parse(assignedWorkoutsJson);
              }

              // Remover os treinos deletados
              const updatedWorkouts = allWorkouts.filter((w: any) => !workoutIds.includes(w.id));
              
              // Também remover status salvos individualmente
              for (const id of workoutIds) {
                await AsyncStorage.removeItem(`workout_${id}_status`);
              }

              await AsyncStorage.setItem('assigned_workouts', JSON.stringify(updatedWorkouts));
              
              // Recarregar a lista
              await loadAthleteWorkouts();
              
              Alert.alert('✅ Sucesso', `Treino${workoutCount !== 1 ? 's' : ''} deletado${workoutCount !== 1 ? 's' : ''} com sucesso!`);
            } catch (error) {
              console.error('Erro ao deletar treino:', error);
              Alert.alert('Erro', 'Não foi possível deletar o treino. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  if (!athlete) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-950">
        <Text className="text-white text-xl">Atleta não encontrado</Text>
        <TouchableOpacity
          className="bg-primary-500 rounded-lg py-3 px-6 mt-4"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-dark-950">
      <View className="px-6 pt-20 pb-20">
        {/* Header com botão voltar */}
        <TouchableOpacity
          className="mb-6 flex-row items-center"
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <View className="bg-dark-800 border border-dark-700 rounded-full w-10 h-10 items-center justify-center mr-3">
            <FontAwesome name="arrow-left" size={18} color="#fb923c" />
          </View>
          <Text className="text-primary-400 font-semibold text-lg">
            Voltar
          </Text>
        </TouchableOpacity>

        {/* Seção de perfil do atleta */}
        <View className="flex-row items-center mb-6">
          {/* Avatar placeholder */}
          <View className="w-20 h-20 rounded-full bg-primary-500/20 border-2 border-primary-500/30 items-center justify-center mr-4">
            <Text className="text-primary-400 font-bold text-2xl">
              {athlete.name.charAt(0)}
            </Text>
          </View>

          <View className="flex-1">
            {/* Nome do atleta ao lado da foto */}
            <Text className="text-3xl font-bold text-white mb-2">
              {athlete.name}
            </Text>
            
            {/* Status "Treinou Hoje" */}
            {hasTrainedToday ? (
              <View className="bg-green-500/20 border border-green-500/30 px-4 py-2 rounded-lg self-start">
                <Text className="text-green-400 font-semibold text-sm">
                  Treinou Hoje
                </Text>
              </View>
            ) : (
              <View className="bg-neutral-500/20 border border-neutral-500/30 px-4 py-2 rounded-lg self-start">
                <Text className="text-neutral-400 font-semibold text-sm">
                  Não treinou hoje
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Tabs - Ordem: Gráficos, Treinos, Fotos */}
        <View className="flex-row mb-6 border-b border-dark-700">
          <TouchableOpacity
            className={`flex-1 py-3 border-b-2 ${
              activeTab === 'graficos'
                ? 'border-primary-500'
                : 'border-transparent'
            }`}
            onPress={() => setActiveTab('graficos')}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === 'graficos' ? 'text-white' : 'text-neutral-400'
              }`}
            >
              Gráficos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 py-3 border-b-2 ${
              activeTab === 'treinos'
                ? 'border-primary-500'
                : 'border-transparent'
            }`}
            onPress={() => setActiveTab('treinos')}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === 'treinos' ? 'text-white' : 'text-neutral-400'
              }`}
            >
              Treinos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 py-3 border-b-2 ${
              activeTab === 'fotos'
                ? 'border-primary-500'
                : 'border-transparent'
            }`}
            onPress={() => setActiveTab('fotos')}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === 'fotos' ? 'text-white' : 'text-neutral-400'
              }`}
            >
              Fotos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo das Tabs */}
        {activeTab === 'graficos' && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-white mb-4">
              Evolução de Peso/Carga
            </Text>
            
            {/* Seletor de Exercício */}
            {availableExercises.length > 0 ? (
              <>
                <View className="mb-4">
                  <Text className="text-neutral-400 text-sm mb-2">Selecione o exercício:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    <View className="flex-row gap-2">
                      {availableExercises.map((exercise) => (
                        <TouchableOpacity
                          key={exercise.id}
                          onPress={() => setSelectedExercise(exercise.id)}
                          className={`px-4 py-2 rounded-lg border ${
                            selectedExercise === exercise.id
                              ? 'bg-primary-500/20 border-primary-500'
                              : 'bg-dark-800 border-dark-700'
                          }`}
                        >
                          <Text className={`font-semibold ${
                            selectedExercise === exercise.id
                              ? 'text-primary-400'
                              : 'text-neutral-400'
                          }`}>
                            {exercise.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                
                {/* Gráfico de Evolução */}
                {weightHistory.length > 0 ? (
                  <View className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-6">
                    <Text className="text-white font-semibold mb-2 text-center">
                      {availableExercises.find(e => e.id === selectedExercise)?.name || 'Exercício'}
                    </Text>
                    
                    <LineChart
                      data={weightHistory.map((record, index) => ({
                        value: record.weight,
                        label: new Date(record.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                      }))}
                      width={280}
                      height={200}
                      color="#fb923c"
                      thickness={3}
                      curved
                      areaChart
                      startFillColor="#fb923c"
                      endFillColor="#fb923c"
                      startOpacity={0.3}
                      endOpacity={0.05}
                      spacing={weightHistory.length > 1 ? Math.max(60, 280 / (weightHistory.length - 1)) : 60}
                      initialSpacing={0}
                      noOfSections={4}
                      maxValue={Math.max(...weightHistory.map(r => r.weight)) + 10}
                      yAxisColor="#404040"
                      xAxisColor="#404040"
                      yAxisTextStyle={{ color: '#a3a3a3', fontSize: 10 }}
                      xAxisLabelTextStyle={{ color: '#a3a3a3', fontSize: 9 }}
                      hideDataPoints={false}
                      dataPointsColor="#fb923c"
                      dataPointsRadius={6}
                      dataPointsWidth={6}
                      dataPointsHeight={6}
                      textShiftY={-2}
                      textShiftX={-5}
                      textFontSize={10}
                      hideRules={false}
                      rulesColor="#262626"
                      rulesType="solid"
                      yAxisTextNumberOfLines={1}
                      showVerticalLines={false}
                      xAxisLabelsVerticalShift={10}
                      xAxisLabelTexts={weightHistory.map((record) => 
                        new Date(record.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                      )}
                      pointerConfig={{
                        pointer1Color: '#fb923c',
                        pointerStripUptoDataPoint: true,
                        pointerStripColor: '#fb923c',
                        pointerStripWidth: 2,
                        activatePointersOnLongPress: true,
                        hidePointer1: false,
                        pointer1Length: 10,
                        autoAdjustPointerLabelPosition: true,
                        pointerLabelComponent: (items: any) => {
                          return (
                            <View
                              style={{
                                height: 40,
                                width: 60,
                                backgroundColor: '#fb923c',
                                borderRadius: 8,
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                            >
                              <Text style={{ color: '#000', fontSize: 12, fontWeight: 'bold' }}>
                                {items[0].value}kg
                              </Text>
                            </View>
                          );
                        },
                      }}
                    />
                    
                    {/* Estatísticas */}
                    {weightHistory.length > 1 && (
                      <View className="mt-4 pt-4 border-t border-dark-700">
                        <View className="flex-row justify-between">
                          <View>
                            <Text className="text-neutral-400 text-xs">Primeiro registro</Text>
                            <Text className="text-white font-semibold">
                              {weightHistory[0]?.weight} kg
                            </Text>
                          </View>
                          <View>
                            <Text className="text-neutral-400 text-xs">Último registro</Text>
                            <Text className="text-white font-semibold">
                              {weightHistory[weightHistory.length - 1]?.weight} kg
                            </Text>
                          </View>
                          <View>
                            <Text className="text-neutral-400 text-xs">Evolução</Text>
                            <Text className={`font-semibold ${
                              weightHistory[weightHistory.length - 1]?.weight > weightHistory[0]?.weight
                                ? 'text-green-400'
                                : weightHistory[weightHistory.length - 1]?.weight < weightHistory[0]?.weight
                                ? 'text-red-400'
                                : 'text-neutral-400'
                            }`}>
                              {weightHistory[weightHistory.length - 1]?.weight > weightHistory[0]?.weight ? '+' : ''}
                              {(weightHistory[weightHistory.length - 1]?.weight - weightHistory[0]?.weight).toFixed(1)} kg
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  <View className="bg-dark-900 border border-dark-700 rounded-xl p-8 items-center">
                    <Text className="text-neutral-400 text-center">
                      Nenhum registro de peso encontrado para este exercício.
                    </Text>
                    <Text className="text-neutral-500 text-sm text-center mt-2">
                      Registre o peso usado durante os treinos para ver a evolução aqui.
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View className="bg-dark-900 border border-dark-700 rounded-xl p-8 items-center">
                <Text className="text-neutral-400 text-center mb-2">
                  Nenhum exercício com registro de peso ainda.
                </Text>
                <Text className="text-neutral-500 text-sm text-center">
                  Complete treinos e registre o peso usado para ver a evolução aqui.
                </Text>
              </View>
            )}

            {/* Meta */}
            <View className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white font-semibold mb-1">
                    Meta: 100kg no Agachamento
                  </Text>
                  <Text className="text-neutral-400 text-sm">
                    Progresso: 40.32%
                  </Text>
                </View>
                <View className="w-10 h-10 rounded-full bg-primary-500/20 border border-primary-500/30 items-center justify-center ml-3">
                  <Text className="text-primary-400 font-bold text-sm">
                    T
                  </Text>
                </View>
              </View>
            </View>

            {/* Último Feedback */}
            <View className="bg-dark-900 border border-dark-700 rounded-xl p-4">
              <Text className="text-white font-semibold mb-3">
                Último Feedback
              </Text>
              <Text className="text-neutral-400 text-sm leading-5">
                {athlete.name} disse: 'Senti um pouco de dor no joelho no Leg Press' - 23/01/2026
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'treinos' && (
          <View className="mb-6">
            {/* Sub-tabs dentro de Treinos */}
            <View className="flex-row mb-4 border-b border-dark-700">
              <TouchableOpacity
                className={`flex-1 py-2 border-b-2 ${
                  workoutSubTab === 'proximos'
                    ? 'border-primary-500'
                    : 'border-transparent'
                }`}
                onPress={() => {
                  setWorkoutSubTab('proximos');
                  setWorkoutsToShow(5); // Resetar paginação ao trocar de aba
                }}
              >
                <Text
                  className={`text-center font-semibold ${
                    workoutSubTab === 'proximos' ? 'text-white' : 'text-neutral-400'
                  }`}
                >
                  Próximos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 border-b-2 ${
                  workoutSubTab === 'historico'
                    ? 'border-primary-500'
                    : 'border-transparent'
                }`}
                onPress={() => {
                  setWorkoutSubTab('historico');
                  setWorkoutsToShow(5); // Resetar paginação ao trocar de aba
                }}
              >
                <Text
                  className={`text-center font-semibold ${
                    workoutSubTab === 'historico' ? 'text-white' : 'text-neutral-400'
                  }`}
                >
                  Histórico
                </Text>
              </TouchableOpacity>
            </View>

            {athleteWorkouts.length === 0 ? (
              <View className="bg-dark-900 border border-dark-700 rounded-xl p-6">
                <Text className="text-neutral-400 text-center">
                  Nenhum treino atribuído ainda
                </Text>
              </View>
            ) : (
              <>
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  // Separar treinos concluídos dos pendentes
                  const completedWorkouts = athleteWorkouts.filter((w: any) => w.status === 'Concluído');
                  const pendingWorkouts = athleteWorkouts.filter((w: any) => w.status !== 'Concluído');
                  
                  if (workoutSubTab === 'historico') {
                    // HISTÓRICO - Treinos concluídos
                    const sortedCompleted = [...completedWorkouts].sort((a: any, b: any) => {
                      const dateA = a.completedDate ? new Date(a.completedDate).getTime() : new Date(a.date).getTime();
                      const dateB = b.completedDate ? new Date(b.completedDate).getTime() : new Date(b.date).getTime();
                      return dateB - dateA; // Mais recentes primeiro
                    });
                    
                    const workoutsToDisplay = sortedCompleted.slice(0, workoutsToShow);
                    const hasMore = sortedCompleted.length > workoutsToShow;
                    
                    return (
                      <>
                        {workoutsToDisplay.length === 0 ? (
                          <View className="bg-dark-900 border border-dark-700 rounded-xl p-6">
                            <Text className="text-neutral-400 text-center">
                              Nenhum treino concluído ainda
                            </Text>
                          </View>
                        ) : (
                          workoutsToDisplay.map((workout: any) => (
                            <View
                              key={workout.id}
                              className="bg-dark-900 border border-green-500/30 rounded-xl p-4 mb-3"
                            >
                              <View className="flex-row justify-between items-start">
                                <TouchableOpacity
                                  className="flex-1"
                                  onPress={() => {
                                    router.push({
                                      pathname: '/workout-details',
                                      params: { workoutId: workout.id },
                                    });
                                  }}
                                >
                                  <View className="flex-1">
                                    <Text className="text-white font-semibold text-lg mb-1">
                                      {workout.name}
                                    </Text>
                                    <Text className="text-neutral-400 text-sm mb-1">
                                      {workout.date} • {workout.dayOfWeek}
                                    </Text>
                                    {workout.completedDate && (
                                      <Text className="text-neutral-500 text-xs">
                                        Concluído em: {new Date(workout.completedDate).toLocaleDateString('pt-BR')}
                                      </Text>
                                    )}
                                  </View>
                                </TouchableOpacity>
                                
                                <View className="items-end">
                                  <View className="bg-green-500/20 border border-green-500/30 px-3 py-1 rounded-full mb-2">
                                    <Text className="text-green-400 text-xs font-semibold">
                                      {workout.status}
                                    </Text>
                                  </View>
                                  
                                  {/* Emoji de feedback */}
                                  {workout.feedbackEmoji && (
                                    <Text className="text-2xl mb-2">
                                      {workout.feedbackEmoji}
                                    </Text>
                                  )}
                                  
                                  {/* Botão de deletar - menor, abaixo do badge */}
                                  <TouchableOpacity
                                    className="flex-row items-center bg-red-500/20 border border-red-500/30 rounded-lg py-1.5 px-2.5"
                                    onPress={() => {
                                      handleDeleteWorkout([workout.id], false);
                                    }}
                                  >
                                    <FontAwesome name="trash" size={12} color="#ef4444" />
                                    <Text className="text-red-400 text-xs font-semibold ml-1">
                                      Deletar
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          ))
                        )}
                        
                        {hasMore && (
                          <TouchableOpacity
                            className="bg-dark-800 border border-dark-700 rounded-xl py-3 px-6 mt-2"
                            onPress={() => setWorkoutsToShow(workoutsToShow + 5)}
                          >
                            <Text className="text-primary-400 font-semibold text-center">
                              Carregar mais ({sortedCompleted.length - workoutsToShow} restantes)
                            </Text>
                          </TouchableOpacity>
                        )}
                      </>
                    );
                  } else {
                    // PRÓXIMOS - Treinos pendentes (agrupados ou individuais)
                    const sortedPending = [...pendingWorkouts].sort((a: any, b: any) => {
                      const dateA = new Date(a.date).getTime();
                      const dateB = new Date(b.date).getTime();
                      return dateA - dateB; // Mais próximos primeiro
                    });
                    
                    // Agrupar treinos recorrentes iguais
                    const groupedWorkouts: { [key: string]: any[] } = {};
                    const individualWorkouts: any[] = [];
                    
                    sortedPending.forEach((workout: any) => {
                      // Se o treino tem recurrenceGroupId, agrupar por esse ID
                      // Isso garante que apenas treinos da mesma atribuição sejam agrupados
                      if (workout.recurrenceGroupId) {
                        const groupKey = workout.recurrenceGroupId;
                        if (!groupedWorkouts[groupKey]) {
                          groupedWorkouts[groupKey] = [];
                        }
                        groupedWorkouts[groupKey].push(workout);
                      } else {
                        // Treinos sem recurrenceGroupId são individuais
                        individualWorkouts.push(workout);
                      }
                    });
                    
                    // Remover duplicatas dos grupos (treinos que já foram agrupados)
                    const groupedKeys = Object.keys(groupedWorkouts);
                    const allGroupedIds = new Set();
                    groupedKeys.forEach(key => {
                      groupedWorkouts[key].forEach((w: any) => allGroupedIds.add(w.id));
                    });
                    
                    const finalIndividualWorkouts = individualWorkouts.filter((w: any) => !allGroupedIds.has(w.id));
                    
                    // Combinar grupos e individuais, ordenar por data
                    const allWorkoutsToShow: any[] = [];
                    
                    // Adicionar grupos
                    Object.values(groupedWorkouts).forEach((group: any[]) => {
                      if (group.length > 0) {
                        // Ordenar grupo por data
                        const sortedGroup = [...group].sort((a: any, b: any) => {
                          return new Date(a.date).getTime() - new Date(b.date).getTime();
                        });
                        allWorkoutsToShow.push({ isGroup: true, workouts: sortedGroup, name: sortedGroup[0].name, dayOfWeek: sortedGroup[0].dayOfWeek });
                      }
                    });
                    
                    // Adicionar individuais
                    finalIndividualWorkouts.forEach((w: any) => {
                      allWorkoutsToShow.push({ isGroup: false, workout: w });
                    });
                    
                    // Ordenar tudo por data (primeira data do grupo ou data do individual)
                    allWorkoutsToShow.sort((a: any, b: any) => {
                      const dateA = a.isGroup ? new Date(a.workouts[0].date).getTime() : new Date(a.workout.date).getTime();
                      const dateB = b.isGroup ? new Date(b.workouts[0].date).getTime() : new Date(b.workout.date).getTime();
                      return dateA - dateB;
                    });
                    
                    const workoutsToDisplay = allWorkoutsToShow.slice(0, workoutsToShow);
                    const hasMore = allWorkoutsToShow.length > workoutsToShow;
                    
                    return (
                      <>
                        {workoutsToDisplay.length === 0 ? (
                          <View className="bg-dark-900 border border-dark-700 rounded-xl p-6">
                            <Text className="text-neutral-400 text-center">
                              Nenhum treino pendente
                            </Text>
                          </View>
                        ) : (
                          workoutsToDisplay.map((item: any, index: number) => {
                            if (item.isGroup) {
                              // Renderizar grupo de treinos recorrentes
                              // Ordenar por data para garantir ordem correta
                              const sortedGroupWorkouts = [...item.workouts].sort((a: any, b: any) => {
                                return new Date(a.date).getTime() - new Date(b.date).getTime();
                              });
                              const firstDate = new Date(sortedGroupWorkouts[0].date);
                              const lastDate = new Date(sortedGroupWorkouts[sortedGroupWorkouts.length - 1].date);
                              const totalCount = sortedGroupWorkouts.length;
                              const dayOfWeek = sortedGroupWorkouts[0].dayOfWeek;
                              
                              return (
                                <View
                                  key={`group-${item.workouts[0]?.recurrenceGroupId || item.name}-${index}`}
                                  className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-3"
                                >
                                  <View className="flex-row justify-between items-start">
                                    <TouchableOpacity
                                      className="flex-1"
                                      onPress={() => {
                                        // Ao clicar, mostrar detalhes do primeiro treino ou expandir o grupo
                                        router.push({
                                          pathname: '/workout-details',
                                          params: { workoutId: sortedGroupWorkouts[0].id },
                                        });
                                      }}
                                    >
                                      <View className="flex-1">
                                        <Text className="text-white font-semibold text-lg mb-1">
                                          {item.name}
                                        </Text>
                                        <Text className="text-primary-400 text-sm mb-1">
                                          {dayOfWeek} • {totalCount} treino{totalCount !== 1 ? 's' : ''}
                                        </Text>
                                        <Text className="text-neutral-400 text-xs">
                                          {firstDate.toLocaleDateString('pt-BR')} até {lastDate.toLocaleDateString('pt-BR')}
                                        </Text>
                                      </View>
                                    </TouchableOpacity>
                                    
                                    <View className="items-end">
                                      <View className="bg-primary-500/20 border border-primary-500/30 px-3 py-1 rounded-full mb-2">
                                        <Text className="text-primary-400 text-xs font-semibold">
                                          Pendente
                                        </Text>
                                      </View>
                                      
                                      {/* Botão de deletar - menor, abaixo do badge */}
                                      <TouchableOpacity
                                        className="flex-row items-center bg-red-500/20 border border-red-500/30 rounded-lg py-1.5 px-2.5"
                                        onPress={() => {
                                          const workoutIds = sortedGroupWorkouts.map((w: any) => w.id);
                                          handleDeleteWorkout(workoutIds, true);
                                        }}
                                      >
                                        <FontAwesome name="trash" size={12} color="#ef4444" />
                                        <Text className="text-red-400 text-xs font-semibold ml-1">
                                          Deletar
                                        </Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                </View>
                              );
                            } else {
                              // Renderizar treino individual
                              return (
                                <View
                                  key={item.workout.id}
                                  className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-3"
                                >
                                  <View className="flex-row justify-between items-start">
                                    <TouchableOpacity
                                      className="flex-1"
                                      onPress={() => {
                                        router.push({
                                          pathname: '/workout-details',
                                          params: { workoutId: item.workout.id },
                                        });
                                      }}
                                    >
                                      <View className="flex-1">
                                        <Text className="text-white font-semibold text-lg mb-1">
                                          {item.workout.name}
                                        </Text>
                                        <Text className="text-neutral-400 text-sm mb-1">
                                          {item.workout.date} • {item.workout.dayOfWeek}
                                        </Text>
                                      </View>
                                    </TouchableOpacity>
                                    
                                    <View className="items-end">
                                      <View className="bg-primary-500/20 border border-primary-500/30 px-3 py-1 rounded-full mb-2">
                                        <Text className="text-primary-400 text-xs font-semibold">
                                          {item.workout.status}
                                        </Text>
                                      </View>
                                      
                                      {/* Botão de deletar - menor, abaixo do badge */}
                                      <TouchableOpacity
                                        className="flex-row items-center bg-red-500/20 border border-red-500/30 rounded-lg py-1.5 px-2.5"
                                        onPress={() => {
                                          handleDeleteWorkout([item.workout.id], false);
                                        }}
                                      >
                                        <FontAwesome name="trash" size={12} color="#ef4444" />
                                        <Text className="text-red-400 text-xs font-semibold ml-1">
                                          Deletar
                                        </Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                </View>
                              );
                            }
                          })
                        )}
                        
                        {hasMore && (
                          <TouchableOpacity
                            className="bg-dark-800 border border-dark-700 rounded-xl py-3 px-6 mt-2"
                            onPress={() => setWorkoutsToShow(workoutsToShow + 5)}
                          >
                            <Text className="text-primary-400 font-semibold text-center">
                              Carregar mais ({allWorkoutsToShow.length - workoutsToShow} restantes)
                            </Text>
                          </TouchableOpacity>
                        )}
                      </>
                    );
                  }
                })()}
              </>
            )}
          </View>
        )}


        {activeTab === 'fotos' && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-white mb-4">
              Fotos
            </Text>
            <View className="bg-dark-900 border border-dark-700 rounded-xl p-6">
              <Text className="text-neutral-400 text-center">
                Nenhuma foto disponível
              </Text>
            </View>
          </View>
        )}

        {/* Botão Atribuir Treino */}
        <TouchableOpacity
          className="bg-primary-500 rounded-xl py-4 px-6 mt-6"
          style={{
            shadowColor: '#fb923c',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
          onPress={() => {
            router.push({
              pathname: '/assign-workout',
              params: { athleteId: athleteIdString },
            });
          }}
        >
          <Text className="text-black font-bold text-center text-lg">
            ➕ Atribuir Treino
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
