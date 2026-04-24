import { CustomAlert } from '@/components/CustomAlert';
import { EmptyState } from '@/components/EmptyState';
import { useToastContext } from '@/components/ToastProvider';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import {
    requestNotificationPermissions,
    syncAthleteWorkoutReminders,
    setupNotificationChannel,
} from '@/src/services/notifications.service';
import { UserType } from '@/src/types';
import { getFeedbackIconSource } from '@/src/utils/feedbackIcons';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabTwoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const [refreshing, setRefreshing] = useState(false);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [currentAthleteId, setCurrentAthleteId] = useState<string | null>(null);
  // Atletas derivados dos treinos (Firestore) – só para COACH
  const [athletes, setAthletes] = useState<Array<{ id: string; name: string; photoURL?: string; status?: string }>>([]);

  const getAthleteStatusMeta = (status?: string) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'bloqueado') {
      return { label: 'Bloqueado', color: '#ef4444' };
    }
    if (normalized === 'conta removida') {
      return { label: 'Conta removida', color: theme.colors.textTertiary };
    }
    return { label: 'Ativo', color: theme.colors.textSecondary };
  };
  
  // Estados para treinos do atleta
  const [athleteWorkouts, setAthleteWorkouts] = useState<any[]>([]);
  const [workoutSubTab, setWorkoutSubTab] = useState<'historico' | 'proximos'>('proximos');
  const [workoutsToShow, setWorkoutsToShow] = useState(5);
  const isSchedulingAthleteRemindersRef = useRef(false);

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

  const loadAthleteWorkouts = useCallback(async () => {
    try {
      if (!currentAthleteId) {
        setAthleteWorkouts([]);
        return;
      }
      const { listAssignedWorkoutsByAthleteId } = await import('@/src/services/assignedWorkouts.service');
      const workoutsWithStatus = await listAssignedWorkoutsByAthleteId(currentAthleteId);
      setAthleteWorkouts(workoutsWithStatus);

      // Garante lembretes locais do atleta (30 min antes + na hora) neste dispositivo.
      if (isSchedulingAthleteRemindersRef.current) return;
      isSchedulingAthleteRemindersRef.current = true;
      try {
        await setupNotificationChannel();
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) return;
        await syncAthleteWorkoutReminders(currentAthleteId, 'workouts');
      } catch (notifErr) {
        console.warn('Lembretes do atleta não agendados:', notifErr);
      } finally {
        isSchedulingAthleteRemindersRef.current = false;
      }
    } catch (error) {
      console.error('Erro ao carregar treinos do atleta:', error);
    }
  }, [currentAthleteId]);

  // Carregar treinos do atleta quando for atleta
  useEffect(() => {
    if (userType === UserType.ATHLETE && currentAthleteId) {
      loadAthleteWorkouts();
    }
  }, [userType, currentAthleteId, loadAthleteWorkouts]);

  const loadCoachAthletes = useCallback(async () => {
    if (!user?.id) {
      setAthletes([]);
      return;
    }
    try {
      const { listAthletesByCoachId } = await import('@/src/services/athletes.service');
      const list = await listAthletesByCoachId(user.id);
      setAthletes(
        list.map((a) => ({
          id: a.id,
          name: a.name,
          photoURL: a.photoURL,
          status: a.status,
        }))
      );
    } catch (e) {
      setAthletes([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (userType === UserType.COACH) loadCoachAthletes();
    else setAthletes([]);
  }, [userType, loadCoachAthletes]);

  useFocusEffect(
    useCallback(() => {
      if (userType === UserType.COACH) loadCoachAthletes();
      if (userType === UserType.ATHLETE && currentAthleteId) loadAthleteWorkouts();
    }, [userType, currentAthleteId, loadCoachAthletes, loadAthleteWorkouts])
  );

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
          const { deleteAssignedWorkouts } = await import('@/src/services/assignedWorkouts.service');
          await deleteAssignedWorkouts(workoutIds);
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
    // Historico deve mostrar apenas treinos realmente concluidos.
    // Treino atrasado (data/hora passada) nao significa treino feito.
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
        <View className="px-6 pb-20" style={{ paddingTop: insets.top + 20 }}>
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
              imageSource={require('../../assets/images/Coracao.png')}
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
                  const feedbackIconSrc = getFeedbackIconSource(workout.feedback, workout.feedbackEmoji);
                  
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
                              {new Date(workout.date).toLocaleDateString('pt-BR')} • {workout.dayOfWeek}
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
                              
                              {feedbackIconSrc && (
                                <Image
                                  source={feedbackIconSrc}
                                  style={{ width: 30, height: 30 }}
                                  resizeMode="contain"
                                />
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
      <View className="px-6 pb-20" style={{ paddingTop: insets.top + 20 }}>
        {/* Título */}
        <Text className="text-3xl font-bold mb-2" style={themeStyles.text}>
          Meus Atletas
        </Text>
        <Text className="mb-6" style={themeStyles.textSecondary}>
          Gerencie seus atletas e atribua treinos personalizados
        </Text>

        {/* Contador e botão Adicionar atleta */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold" style={themeStyles.text}>
            Total: {athletes.length} atleta{athletes.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            className="rounded-xl py-2.5 px-4 flex-row items-center"
            style={{ backgroundColor: theme.colors.primary }}
            onPress={() => router.push('/add-athlete')}
          >
            <FontAwesome name="plus" size={14} color="#fff" style={{ marginRight: 8 }} />
            <Text className="font-semibold text-sm" style={{ color: '#fff' }}>Adicionar atleta</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de atletas (Firestore coachemAthletes) */}
        {athletes.length === 0 ? (
          <EmptyState
            icon="users"
            message="Cadastre um atleta para depois atribuir treinos a ele."
            actionLabel="Cadastrar atleta"
            onAction={() => router.push('/add-athlete')}
          />
        ) : (
          athletes.map((athlete) => (
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
              <View className="flex-row items-center">
                <View
                  className="w-12 h-12 rounded-full mr-3 overflow-hidden items-center justify-center border"
                  style={{
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.backgroundTertiary,
                  }}
                >
                  {athlete.photoURL ? (
                    <Image
                      source={{ uri: athlete.photoURL }}
                      style={{ width: 48, height: 48 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="font-bold text-lg" style={{ color: theme.colors.primary }}>
                      {athlete.name.charAt(0)}
                    </Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold" style={themeStyles.text}>
                    {athlete.name}
                  </Text>
                  <Text
                    className="mt-1 font-medium"
                    style={{ color: getAthleteStatusMeta(athlete.status).color }}
                  >
                    {getAthleteStatusMeta(athlete.status).label}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}
