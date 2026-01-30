import { CustomAlert } from '@/components/CustomAlert';
import { EmptyState } from '@/components/EmptyState';
import { useToastContext } from '@/components/ToastProvider';
import { useTheme } from '@/src/contexts/ThemeContext';
import {
    requestNotificationPermissions,
    scheduleWorkoutRemindersForAthlete,
    setupNotificationChannel,
} from '@/src/services/notifications.service';
import { UserType } from '@/src/types';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const mockAthletes = [
  { id: '1', name: 'João Silva', sport: 'Futebol', status: 'Ativo'},
  { id: '2', name: 'Maria Oliveira', sport: 'Vôlei', status: 'Ativo'},
  { id: '3', name: 'Pedro Santos', sport: 'Basquete', status: 'Ativo'},
  { id: '4', name: 'Ana Souza', sport: 'Atletismo', status: 'Ativo'},
  { id: '5', name: 'Carlos Ferreira', sport: 'Futebol', status: 'Ativo'},
  { id: '6', name: 'Laura Rodrigues', sport: 'Vôlei', status: 'Ativo'},
  { id: '7', name: 'Rafael Oliveira', sport: 'Basquete', status: 'Ativo'},
  { id: '8', name: 'Camila Silva', sport: 'Atletismo', status: 'Ativo'},
];

export default function TabTwoScreen() {
  const router = useRouter();
  const { showToast } = useToastContext();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const [refreshing, setRefreshing] = useState(false);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [currentAthleteId, setCurrentAthleteId] = useState<string | null>(null);
  
  // Estados para treinos do atleta
  const [athleteWorkouts, setAthleteWorkouts] = useState<any[]>([]);
  const [workoutSubTab, setWorkoutSubTab] = useState<'historico' | 'proximos'>('proximos');
  const [workoutsToShow, setWorkoutsToShow] = useState(5);

  // Estados para CustomAlert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | null>(null);

  // Função helper para mostrar alert customizado
  const showAlert = (
      title: string,
      message: string,
      type: 'success' | 'error' | 'info' | 'warning' = 'info',
      onConfirm?: () => void
  ) => {
      setAlertTitle(title);
      setAlertMessage(message);
      setAlertType(type);
      setAlertOnConfirm(() => onConfirm);
      setAlertVisible(true);
  };

  // Carregar tipo de usuário e ID do atleta
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserType = await AsyncStorage.getItem('userType');
        const storedAthleteId = await AsyncStorage.getItem('currentAthleteId');
        
        if (storedUserType) {
          setUserType(storedUserType as UserType);
        }
        
        if (storedAthleteId) {
          setCurrentAthleteId(storedAthleteId);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    };
    
    loadUserData();
  }, []);

  // Carregar treinos do atleta quando for atleta
  useEffect(() => {
    if (userType === UserType.ATHLETE && currentAthleteId) {
      loadAthleteWorkouts();
    }
  }, [userType, currentAthleteId]);

  const loadAthleteWorkouts = async () => {
    try {
      const assignedWorkoutsJson = await AsyncStorage.getItem('assigned_workouts');
      let allWorkouts = [];
      
      if (assignedWorkoutsJson) {
        allWorkouts = JSON.parse(assignedWorkoutsJson);
      }

      // Filtrar treinos deste atleta
      const workouts = allWorkouts.filter((w: any) => w.athleteId === currentAthleteId);
      
      // Carregar status de cada treino
      const workoutsWithStatus = await Promise.all(
        workouts.map(async (workout: any) => {
          const savedStatus = await AsyncStorage.getItem(`workout_${workout.id}_status`);
          const status = savedStatus || workout.status || 'Pendente';
          
          // Buscar completedDate se existir
          const completedDateJson = await AsyncStorage.getItem(`workout_${workout.id}_completedDate`);
          const completedDate = completedDateJson ? completedDateJson : null;
          
          // Buscar feedbackEmoji: priorizar chave AsyncStorage, depois o próprio objeto do treino (assigned_workouts)
          const feedbackEmojiJson = await AsyncStorage.getItem(`workout_${workout.id}_feedbackEmoji`);
          const feedbackEmoji = feedbackEmojiJson || workout.feedbackEmoji || null;
          const feedbackText = workout.feedbackText || null;
          
          return {
            ...workout,
            status,
            completedDate,
            feedbackEmoji,
            feedbackText,
          };
        })
      );

      setAthleteWorkouts(workoutsWithStatus);

      // Agendar lembretes do ATLETA (30 min antes + na hora) para treinos pendentes e futuros
      try {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) return;

        await setupNotificationChannel();

        const now = Date.now();
        for (const w of workoutsWithStatus) {
          if (w.status === 'Concluído' || !w.scheduledTime || !w.date) continue;

          const [y, mo, d] = w.date.split('-').map(Number);
          const [h, min] = w.scheduledTime.split(':').map(Number);
          const workoutAt = new Date(y, mo - 1, d, h, min, 0, 0);
          if (workoutAt.getTime() <= now) continue;

          const alreadyScheduled = await AsyncStorage.getItem(`workout_${w.id}_athlete_reminders_scheduled`);
          if (alreadyScheduled === 'true') continue;

          await scheduleWorkoutRemindersForAthlete(w.id, w.date, w.scheduledTime, w.name, 'workouts');
          await AsyncStorage.setItem(`workout_${w.id}_athlete_reminders_scheduled`, 'true');
        }
      } catch (notifErr) {
        console.warn('Lembretes do atleta não agendados:', notifErr);
      }
    } catch (error) {
      console.error('Erro ao carregar treinos do atleta:', error);
    }
  };

  const handleDeleteWorkout = async (workoutIds: string[], isGroup: boolean) => {
    const workoutCount = workoutIds.length;
    const message = isGroup
      ? `Tem certeza que deseja deletar este grupo de ${workoutCount} treino${workoutCount !== 1 ? 's' : ''}?`
      : `Tem certeza que deseja deletar este treino?`;

    showAlert(
      'Deletar treino',
      message,
      'warning',
      async () => {
        try {
          const assignedWorkoutsJson = await AsyncStorage.getItem('assigned_workouts');
          let allWorkouts = [];
          
          if (assignedWorkoutsJson) {
            allWorkouts = JSON.parse(assignedWorkoutsJson);
          }

          const updatedWorkouts = allWorkouts.filter((w: any) => !workoutIds.includes(w.id));
          
          // Também remover status salvos individualmente
          for (const id of workoutIds) {
            await AsyncStorage.removeItem(`workout_${id}_status`);
            await AsyncStorage.removeItem(`workout_${id}_completedDate`);
            await AsyncStorage.removeItem(`workout_${id}_feedbackEmoji`);
          }

          await AsyncStorage.setItem('assigned_workouts', JSON.stringify(updatedWorkouts));
          
          // Recarregar a lista
          await loadAthleteWorkouts();
          
          showAlert('✅ Sucesso', `Treino${workoutCount !== 1 ? 's' : ''} deletado${workoutCount !== 1 ? 's' : ''} com sucesso!`, 'success');
        } catch (error) {
          console.error('Erro ao deletar treino:', error);
          showAlert('Erro', 'Não foi possível deletar o treino. Tente novamente.', 'error');
        }
      }
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (userType === UserType.ATHLETE) {
        await loadAthleteWorkouts();
        showToast('Treinos atualizados!', 'success');
      } else {
        // Simular carregamento de dados para treinador
        await new Promise(resolve => setTimeout(resolve, 1000));
        showToast('Lista de atletas atualizada!', 'success');
      }
    } catch (error) {
      showToast('Erro ao atualizar', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [showToast, userType]);

  // Se for ATLETA, mostrar treinos
  if (userType === UserType.ATHLETE) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Separar treinos concluídos dos pendentes
    const completedWorkouts = athleteWorkouts.filter((w: any) => w.status === 'Concluído');
    const pendingWorkouts = athleteWorkouts.filter((w: any) => w.status !== 'Concluído');
    
    // Determinar quais treinos mostrar baseado na sub-tab
    let workoutsToDisplay: any[] = [];
    let hasMore = false;
    
    if (workoutSubTab === 'historico') {
      // HISTÓRICO - Treinos concluídos
      const sortedCompleted = [...completedWorkouts].sort((a: any, b: any) => {
        const dateA = a.completedDate ? new Date(a.completedDate).getTime() : new Date(a.date).getTime();
        const dateB = b.completedDate ? new Date(b.completedDate).getTime() : new Date(b.date).getTime();
        return dateB - dateA; // Mais recentes primeiro
      });
      
      workoutsToDisplay = sortedCompleted.slice(0, workoutsToShow);
      hasMore = sortedCompleted.length > workoutsToShow;
    } else {
      // PRÓXIMOS - Treinos pendentes
      const sortedPending = [...pendingWorkouts].sort((a: any, b: any) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB; // Mais próximos primeiro
      });
      
      // Agrupar treinos recorrentes iguais
      const groupedWorkouts: { [key: string]: any[] } = {};
      const individualWorkouts: any[] = [];
      
      sortedPending.forEach((workout: any) => {
        if (workout.recurrenceGroupId) {
          const groupKey = workout.recurrenceGroupId;
          if (!groupedWorkouts[groupKey]) {
            groupedWorkouts[groupKey] = [];
          }
          groupedWorkouts[groupKey].push(workout);
        } else {
          individualWorkouts.push(workout);
        }
      });
      
      // Remover duplicatas dos grupos
      const groupedKeys = Object.keys(groupedWorkouts);
      const allGroupedIds = new Set();
      groupedKeys.forEach(key => {
        groupedWorkouts[key].forEach((w: any) => allGroupedIds.add(w.id));
      });
      
      const finalIndividualWorkouts = individualWorkouts.filter((w: any) => !allGroupedIds.has(w.id));
      
      // Combinar grupos e individuais
      const allWorkoutsToShow: any[] = [];
      
      Object.values(groupedWorkouts).forEach((group: any[]) => {
        if (group.length > 0) {
          const sortedGroup = [...group].sort((a: any, b: any) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          });
          allWorkoutsToShow.push({ isGroup: true, workouts: sortedGroup, name: sortedGroup[0].name, dayOfWeek: sortedGroup[0].dayOfWeek });
        }
      });
      
      finalIndividualWorkouts.forEach((w: any) => {
        allWorkoutsToShow.push({ isGroup: false, workout: w });
      });
      
      allWorkoutsToShow.sort((a: any, b: any) => {
        const dateA = a.isGroup ? new Date(a.workouts[0].date).getTime() : new Date(a.workout.date).getTime();
        const dateB = b.isGroup ? new Date(b.workouts[0].date).getTime() : new Date(b.workout.date).getTime();
        return dateA - dateB;
      });
      
      workoutsToDisplay = allWorkoutsToShow.slice(0, workoutsToShow);
      hasMore = allWorkoutsToShow.length > workoutsToShow;
    }

    return (
      <ScrollView 
        className="flex-1"
        style={themeStyles.bg}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View className="px-6 pt-12 pb-20">
          {/* Título */}
          <Text className="text-3xl font-bold mb-2" style={themeStyles.text}>
            Meus Treinos
          </Text>
          <Text className="mb-6" style={themeStyles.textSecondary}>
            Visualize seus treinos agendados e histórico de treinos realizados
          </Text>

          {/* Sub-tabs: Próximos e Histórico */}
          <View className="flex-row mb-4" style={{ borderBottomColor: theme.colors.border, borderBottomWidth: 1 }}>
            <TouchableOpacity
              className="flex-1 py-2 border-b-2"
              style={{
                borderBottomColor: workoutSubTab === 'proximos' ? theme.colors.primary : 'transparent',
              }}
              onPress={() => {
                setWorkoutSubTab('proximos');
                setWorkoutsToShow(5);
              }}
            >
              <Text
                className="text-center font-semibold"
                style={{
                  color: workoutSubTab === 'proximos' ? theme.colors.text : theme.colors.textTertiary
                }}
              >
                Próximos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-2 border-b-2"
              style={{
                borderBottomColor: workoutSubTab === 'historico' ? theme.colors.primary : 'transparent',
              }}
              onPress={() => {
                setWorkoutSubTab('historico');
                setWorkoutsToShow(5);
              }}
            >
              <Text
                className="text-center font-semibold"
                style={{
                  color: workoutSubTab === 'historico' ? theme.colors.text : theme.colors.textTertiary
                }}
              >
                Histórico
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lista de treinos */}
          {workoutsToDisplay.length === 0 ? (
            <EmptyState
              icon="dumbbell"
              message={workoutSubTab === 'historico' 
                ? "Você ainda não concluiu nenhum treino."
                : "Você não tem treinos agendados."}
              actionLabel={workoutSubTab === 'historico' ? undefined : undefined}
              onAction={undefined}
            />
          ) : (
            <>
              {workoutsToDisplay.map((item: any, index: number) => {
                if (item.isGroup) {
                  // Grupo de treinos recorrentes
                  const group = item.workouts;
                  const firstWorkout = group[0];
                  const workoutIds = group.map((w: any) => w.id);
                  
                  return (
                    <View
                      key={`group-${firstWorkout.recurrenceGroupId}`}
                      className="border rounded-xl p-4 mb-3"
                      style={{
                        ...themeStyles.card,
                        borderColor: theme.colors.primary + '50',
                      }}
                    >
                      <View className="flex-row justify-between items-start">
                        <TouchableOpacity
                          className="flex-1"
                          onPress={() => {
                            router.push({
                              pathname: '/workout-details',
                              params: { workoutId: firstWorkout.id },
                            });
                          }}
                        >
                          <View className="flex-row items-center mb-2">
                            <FontAwesome name="repeat" size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
                            <Text className="font-semibold text-lg" style={themeStyles.text}>
                              {firstWorkout.name}
                            </Text>
                          </View>
                          <Text className="text-sm mb-1" style={themeStyles.textSecondary}>
                            {group.length} treino{group.length !== 1 ? 's' : ''} agendado{group.length !== 1 ? 's' : ''}
                          </Text>
                          <Text className="text-xs" style={themeStyles.textTertiary}>
                            Próximo: {new Date(group[0].date).toLocaleDateString('pt-BR', { 
                              weekday: 'long', 
                              day: '2-digit', 
                              month: 'long' 
                            })}
                            {group[0].scheduledTime ? ` às ${group[0].scheduledTime}` : ''}
                          </Text>
                        </TouchableOpacity>
                        
                      </View>
                    </View>
                  );
                } else {
                  // Treino individual
                  const workout = item.workout || item;
                  
                  return (
                    <View
                      key={workout.id}
                      className="border rounded-xl p-4 mb-3"
                      style={{
                        ...themeStyles.card,
                        borderColor: workout.status === 'Concluído'
                          ? (theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)')
                          : theme.colors.border,
                      }}
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
                            <Text className="font-semibold text-lg mb-1" style={themeStyles.text}>
                              {workout.name}
                            </Text>
                            <Text className="text-sm mb-1" style={themeStyles.textSecondary}>
                              {workout.date} • {workout.dayOfWeek}
                              {workout.scheduledTime ? ` • ${workout.scheduledTime}` : ''}
                            </Text>
                            {workout.completedDate && (
                              <Text className="text-xs" style={themeStyles.textTertiary}>
                                Concluído em: {new Date(workout.completedDate).toLocaleDateString('pt-BR')}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                        
                        <View className="items-end">
                          {workout.status === 'Concluído' && (
                            <>
                              <View className="border px-3 py-1 rounded-full mb-2"
                                style={{
                                  backgroundColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                                  borderColor: '#10b981' + '50',
                                }}
                              >
                                <Text className="text-xs font-semibold" style={{ color: '#10b981' }}>
                                  {workout.status}
                                </Text>
                              </View>
                              
                              {workout.feedbackEmoji && (
                                <Text className="text-2xl">
                                  {workout.feedbackEmoji}
                                </Text>
                              )}
                            </>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                }
              })}
              
              {hasMore && (
                <TouchableOpacity
                  className="border rounded-xl py-3 px-6 mt-2"
                  style={themeStyles.cardSecondary}
                  onPress={() => setWorkoutsToShow(workoutsToShow + 5)}
                >
                  <Text className="font-semibold text-center" style={{ color: theme.colors.primary }}>
                    Carregar mais ({workoutSubTab === 'historico' 
                      ? completedWorkouts.length - workoutsToShow 
                      : pendingWorkouts.length - workoutsToShow} restantes)
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Custom Alert */}
        <CustomAlert
            visible={alertVisible}
            title={alertTitle}
            message={alertMessage}
            type={alertType}
            confirmText="OK"
            cancelText="Cancelar"
            showCancel={alertType === 'warning'}
            onConfirm={() => {
                setAlertVisible(false);
                alertOnConfirm?.();
            }}
            onCancel={() => {
                setAlertVisible(false);
            }}
        />
      </ScrollView>
    );
  }

  // Se for TREINADOR, mostrar lista de atletas (comportamento original)
  return (
    <ScrollView 
      className="flex-1"
      style={themeStyles.bg}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <View className="px-6 pt-12 pb-20">
        {/* Título */}
        <Text className="text-3xl font-bold mb-2" style={themeStyles.text}>
          Meus Atletas
        </Text>
        <Text className="mb-6" style={themeStyles.textSecondary}>
          Gerencie seus atletas e atribua treinos personalizados
        </Text>

        {/* Contador */}
        <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
          Total: {mockAthletes.length} atleta{mockAthletes.length !== 1 ? 's' : ''}
        </Text>

        {/* Lista de atletas */}
        {mockAthletes.length === 0 ? (
          <EmptyState
            icon="users"
            message="Você ainda não tem atletas cadastrados."
            actionLabel="Adicionar Atleta"
            onAction={() => {
              // TODO: Implementar navegação para adicionar atleta
              showToast('Funcionalidade em desenvolvimento', 'info');
            }}
          />
        ) : (
          mockAthletes.map((athlete) => (
          <TouchableOpacity
            key={athlete.id}
            className="rounded-xl p-4 mb-3 border"
            style={{
              ...themeStyles.card,
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 4,
            }}
            onPress={() => {
              router.push({
                pathname: '/athlete-profile',
                params: { athleteId: athlete.id },
              });
            }}
          >
            <Text className="text-lg font-semibold" style={themeStyles.text}>
              {athlete.name}
            </Text>
            <Text className="mt-1" style={themeStyles.textSecondary}>
              {athlete.status}
            </Text>
          </TouchableOpacity>
        ))
        )}
      </View>
    </ScrollView>
  );
}
