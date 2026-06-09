import { AthleteWorkoutActions } from '@/components/AthleteWorkoutActions';
import { CustomAlert } from '@/components/CustomAlert';
import { EmptyState } from '@/components/EmptyState';
import { useToastContext } from '@/components/ToastProvider';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { auth } from '@/src/services/firebase.config';
import { useTheme } from '@/src/contexts/ThemeContext';
import {
    requestNotificationPermissions,
    syncAthleteWorkoutReminders,
    setupNotificationChannel,
} from '@/src/services/notifications.service';
import { UserType } from '@/src/types';
import {
  assignedSortTimestamp,
  formatAssignedCalendarDateByLocale,
  getLocalTodayYmd,
  parseDateOnlyLocal,
} from '@/src/utils/dateOnly';
import { getFeedbackIconSource } from '@/src/utils/feedbackIcons';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Href, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabTwoScreen() {
  const { t, i18n } = useTranslation();
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

  const displayWorkoutStatus = (status: string) => {
    if (status === 'Concluído') return t('tabTwo.statusCompleted');
    if (status === 'Pendente') return t('tabTwo.statusPending');
    return status;
  };

  const getAthleteStatusMeta = (status?: string) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'bloqueado') {
      return { label: t('common.blocked'), color: '#ef4444' };
    }
    if (normalized === 'desvinculado' || normalized === 'inativo') {
      return { label: t('athleteCoachStatus.unlinked'), color: '#f59e0b' };
    }
    if (normalized === 'conta removida') {
      return { label: t('common.accountRemoved'), color: theme.colors.textTertiary };
    }
    return { label: t('common.active'), color: theme.colors.textSecondary };
  };
  
  // Estados para treinos do atleta
  const [athleteWorkouts, setAthleteWorkouts] = useState<any[]>([]);
  const [workoutSubTab, setWorkoutSubTab] = useState<'historico' | 'proximos' | 'calendario'>('calendario');
  const [workoutsToShow, setWorkoutsToShow] = useState(5);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(getLocalTodayYmd());
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

  // Logout: limpar estado local assim que a sessão Firebase termina (evita query sem auth).
  useEffect(() => {
    if (!user) {
      setUserType(null);
      setCurrentAthleteId(null);
      setAthleteWorkouts([]);
      setAthletes([]);
      return;
    }
    setUserType(user.userType);
    if (user.userType === UserType.ATHLETE) {
      setCurrentAthleteId(user.id);
    }
  }, [user]);

  const loadAthleteWorkouts = useCallback(async () => {
    try {
      if (!user?.id || user.userType !== UserType.ATHLETE || !auth.currentUser) {
        setAthleteWorkouts([]);
        return;
      }
      const athleteId = user.id;
      const { listAssignedWorkoutsByAthleteId } = await import('@/src/services/assignedWorkouts.service');
      const workoutsWithStatus = await listAssignedWorkoutsByAthleteId(athleteId, {
        viewer: user,
      });
      setAthleteWorkouts(workoutsWithStatus);

      // Garante lembretes locais do atleta (30 min antes + na hora) neste dispositivo.
      if (isSchedulingAthleteRemindersRef.current) return;
      isSchedulingAthleteRemindersRef.current = true;
      try {
        await setupNotificationChannel();
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) return;
        await syncAthleteWorkoutReminders(athleteId, 'workouts');
      } catch (notifErr) {
        console.warn('Lembretes do atleta não agendados:', notifErr);
      } finally {
        isSchedulingAthleteRemindersRef.current = false;
      }
    } catch (error) {
      if (!auth.currentUser) return;
      console.error('Erro ao carregar treinos do atleta:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user?.userType === UserType.ATHLETE && user.id) {
      loadAthleteWorkouts();
    }
  }, [user, loadAthleteWorkouts]);

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
      if (!user) return;
      if (user.userType === UserType.COACH) loadCoachAthletes();
      if (user.userType === UserType.ATHLETE) loadAthleteWorkouts();
    }, [user, loadCoachAthletes, loadAthleteWorkouts])
  );

  const handleDeleteWorkout = async (workoutIds: string[], isGroup: boolean) => {
    const workoutCount = workoutIds.length;
    const message = isGroup
      ? t('tabTwo.deleteGroupConfirm', { count: workoutCount })
      : t('tabTwo.deleteOneConfirm');

    showAlert(
      t('tabTwo.deleteWorkoutTitle'),
      message,
      'warning',
      async () => {
        try {
          const { deleteAssignedWorkouts } = await import('@/src/services/assignedWorkouts.service');
          await deleteAssignedWorkouts(workoutIds);
          await loadAthleteWorkouts();
          showAlert(
            t('tabTwo.successTitle'),
            workoutCount !== 1 ? t('tabTwo.deleteSuccessMany') : t('tabTwo.deleteSuccessOne'),
            'success'
          );
        } catch (error) {
          console.error('Erro ao deletar treino:', error);
          showAlert(t('common.error'), t('tabTwo.deleteError'), 'error');
        }
      }
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (user?.userType === UserType.ATHLETE) {
        await loadAthleteWorkouts();
        showToast(t('tabTwo.workoutsUpdated'), 'success');
      } else {
        await loadCoachAthletes();
        showToast(t('tabTwo.athletesListUpdated'), 'success');
      }
    } catch (error) {
      showToast(t('tabTwo.refreshError'), 'error');
    } finally {
      setRefreshing(false);
    }
  }, [showToast, userType, t, loadCoachAthletes]);

  // Se for ATLETA, mostrar treinos
  if (userType === UserType.ATHLETE) {
    const workoutsByDate = athleteWorkouts.reduce<Record<string, any[]>>((acc, workout: any) => {
      const key = workout.date;
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(workout);
      return acc;
    }, {});

    const selectedDateWorkouts = (workoutsByDate[selectedCalendarDate] || []).sort((a: any, b: any) => {
      const aTime = a.scheduledTime || '23:59';
      const bTime = b.scheduledTime || '23:59';
      return aTime.localeCompare(bTime);
    });

    const markedDates = Object.entries(workoutsByDate).reduce<Record<string, any>>((acc, [date, workouts]) => {
      const hasCompleted = workouts.some((w: any) => w.status === 'Concluído');
      const hasPending = workouts.some((w: any) => w.status !== 'Concluído');
      let dotColor = '#fb923c';
      if (hasPending) dotColor = '#fb923c';
      else if (hasCompleted) dotColor = '#10b981';
      acc[date] = {
        marked: true,
        dotColor,
      };
      return acc;
    }, {});

    markedDates[selectedCalendarDate] = {
      ...(markedDates[selectedCalendarDate] || {}),
      selected: true,
      selectedColor: theme.colors.primary,
    };

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
        const dateA = assignedSortTimestamp(a);
        const dateB = assignedSortTimestamp(b);
        return dateB - dateA; // Mais recentes primeiro
      });
      
      workoutsToDisplay = sortedCompleted.slice(0, workoutsToShow);
      hasMore = sortedCompleted.length > workoutsToShow;
    } else {
      // PRÓXIMOS - Treinos pendentes
      const sortedPending = [...pendingWorkouts].sort((a: any, b: any) => {
        const dateA = assignedSortTimestamp(a);
        const dateB = assignedSortTimestamp(b);
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
            return assignedSortTimestamp(a) - assignedSortTimestamp(b);
          });
          allWorkoutsToShow.push({ isGroup: true, workouts: sortedGroup, name: sortedGroup[0].name, dayOfWeek: sortedGroup[0].dayOfWeek });
        }
      });
      
      finalIndividualWorkouts.forEach((w: any) => {
        allWorkoutsToShow.push({ isGroup: false, workout: w });
      });
      
      allWorkoutsToShow.sort((a: any, b: any) => {
        const dateA = a.isGroup ? assignedSortTimestamp(a.workouts[0]) : assignedSortTimestamp(a.workout);
        const dateB = b.isGroup ? assignedSortTimestamp(b.workouts[0]) : assignedSortTimestamp(b.workout);
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
            {t('tabTwo.myWorkouts')}
          </Text>
          <Text className="mb-6" style={themeStyles.textSecondary}>
            {t('tabTwo.myWorkoutsSubtitle')}
          </Text>

          {currentAthleteId ? (
            <AthleteWorkoutActions athleteUid={currentAthleteId} />
          ) : null}

          {/* Sub-tabs: Próximos, Histórico e Calendário */}
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
                {t('tabTwo.upcoming')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-2 border-b-2"
              style={{
                borderBottomColor: workoutSubTab === 'calendario' ? theme.colors.primary : 'transparent',
              }}
              onPress={() => {
                setWorkoutSubTab('calendario');
              }}
            >
              <Text
                className="text-center font-semibold"
                style={{
                  color: workoutSubTab === 'calendario' ? theme.colors.text : theme.colors.textTertiary
                }}
              >
                {t('tabTwo.calendarTab')}
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
                {t('tabTwo.history')}
              </Text>
            </TouchableOpacity>
          </View>

          {workoutSubTab === 'calendario' ? (
            <>
              <View className="rounded-xl p-4 border mb-4" style={themeStyles.card}>
                <Calendar
                  current={selectedCalendarDate}
                  markedDates={markedDates}
                  onDayPress={(day) => setSelectedCalendarDate(day.dateString)}
                  theme={{
                    backgroundColor: theme.colors.background,
                    calendarBackground: theme.colors.background,
                    textSectionTitleColor: theme.colors.textTertiary,
                    selectedDayBackgroundColor: theme.colors.primary,
                    selectedDayTextColor: theme.mode === 'dark' ? '#000' : '#fff',
                    todayTextColor: theme.colors.primary,
                    dayTextColor: theme.colors.text,
                    textDisabledColor: theme.colors.textTertiary,
                    dotColor: theme.colors.primary,
                    selectedDotColor: theme.mode === 'dark' ? '#000' : '#fff',
                    arrowColor: theme.colors.primary,
                    monthTextColor: theme.colors.text,
                    indicatorColor: theme.colors.primary,
                    textDayFontWeight: '600',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '600',
                    textDayFontSize: 14,
                    textMonthFontSize: 16,
                    textDayHeaderFontSize: 12,
                  }}
                />
                <View className="flex-row mt-3 justify-between">
                  <Text className="text-xs" style={{ color: '#fb923c' }}>{t('tabTwo.legendPending')}</Text>
                  <Text className="text-xs" style={{ color: '#10b981' }}>{t('tabTwo.legendCompleted')}</Text>
                </View>
              </View>

              {selectedDateWorkouts.length === 0 ? (
                <EmptyState
                  icon="calendar"
                  message={t('tabTwo.noWorkoutsOnDate', {
                    date: formatAssignedCalendarDateByLocale(selectedCalendarDate, i18n.language),
                  })}
                />
              ) : (
                <>
                  <Text className="text-sm mb-3" style={themeStyles.textSecondary}>
                    {t('tabTwo.workoutsOnDate', {
                      count: selectedDateWorkouts.length,
                      date: formatAssignedCalendarDateByLocale(selectedCalendarDate, i18n.language),
                    })}
                  </Text>
                  {selectedDateWorkouts.map((workout: any) => {
                    const feedbackIconSrc = getFeedbackIconSource(workout.feedback, workout.feedbackEmoji);
                    const feedbackIconSize = 56;
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
                        <TouchableOpacity
                          className="flex-row justify-between items-start"
                          onPress={() => {
                            router.push({
                              pathname: '/workout-details',
                              params: { workoutId: workout.id },
                            });
                          }}
                        >
                          <View className="flex-1 pr-3">
                            <Text className="font-semibold text-lg mb-1" style={themeStyles.text}>
                              {workout.name}
                            </Text>
                            <Text className="text-sm mb-1" style={themeStyles.textSecondary}>
                              {workout.dayOfWeek}
                              {workout.scheduledTime ? ` • ${workout.scheduledTime}` : ''}
                            </Text>
                            {workout.completedDate ? (
                              <Text className="text-xs" style={themeStyles.textTertiary}>
                                {t('tabTwo.feedbackRecorded')}{' '}
                                {workout.feedback ? t('tabTwo.feedbackLevel', { level: workout.feedback }) : ''}
                              </Text>
                            ) : null}
                          </View>
                          <View className="items-center mr-1">
                            <View
                              className="border px-3 py-1 rounded-full mb-2"
                              style={{
                                backgroundColor: workout.status === 'Concluído'
                                  ? (theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)')
                                  : (theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.1)'),
                                borderColor: workout.status === 'Concluído' ? '#10b98155' : '#fb923c55',
                              }}
                            >
                              <Text
                                className="text-xs font-semibold"
                                style={{ color: workout.status === 'Concluído' ? '#10b981' : '#fb923c' }}
                              >
                                {displayWorkoutStatus(workout.status)}
                              </Text>
                            </View>
                            {workout.status === 'Concluído' && feedbackIconSrc ? (
                              <Image
                                source={feedbackIconSrc}
                                style={{ width: feedbackIconSize, height: feedbackIconSize }}
                                resizeMode="contain"
                              />
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </>
              )}
            </>
          ) : (
          <>
          {/* Lista de treinos */}
          {workoutsToDisplay.length === 0 ? (
            <EmptyState
              imageSource={require('../../assets/images/Coracao.png')}
              message={
                workoutSubTab === 'historico'
                  ? t('tabTwo.emptyHistory')
                  : t('tabTwo.emptyUpcoming')
              }
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
                            {t('tabTwo.groupScheduled', { count: group.length })}
                          </Text>
                          <Text className="text-xs" style={themeStyles.textTertiary}>
                            {t('tabTwo.nextLabel')}{' '}
                            {parseDateOnlyLocal(group[0].date).toLocaleDateString(
                              i18n.language === 'en' ? 'en-US' : 'pt-BR',
                              {
                                weekday: 'long',
                                day: '2-digit',
                                month: 'long',
                              }
                            )}
                            {group[0].scheduledTime
                              ? ` ${t('tabTwo.atTime')} ${group[0].scheduledTime}`
                              : ''}
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
                              {formatAssignedCalendarDateByLocale(workout.date, i18n.language)} • {workout.dayOfWeek}
                              {workout.scheduledTime ? ` • ${workout.scheduledTime}` : ''}
                            </Text>
                            {workout.completedDate && (
                              <Text className="text-xs" style={themeStyles.textTertiary}>
                                {t('tabTwo.completedOn')}{' '}
                                {new Date(workout.completedDate).toLocaleDateString(
                                  i18n.language === 'en' ? 'en-US' : 'pt-BR'
                                )}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                        
                        <View className="items-center mr-1">
                          {workout.status === 'Concluído' && (
                            <>
                              <View className="border px-3 py-1 rounded-full mb-2"
                                style={{
                                  backgroundColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                                  borderColor: '#10b981' + '50',
                                }}
                              >
                                <Text className="text-xs font-semibold" style={{ color: '#10b981' }}>
                                  {displayWorkoutStatus(workout.status)}
                                </Text>
                              </View>
                              
                              {feedbackIconSrc && (
                                <Image
                                  source={feedbackIconSrc}
                                  style={{ width: 56, height: 56 }}
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
                    {t('tabTwo.loadMore', {
                      remaining:
                        workoutSubTab === 'historico'
                          ? completedWorkouts.length - workoutsToShow
                          : pendingWorkouts.length - workoutsToShow,
                    })}
                  </Text>
                </TouchableOpacity>
              )}
            </>
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
            confirmText={t('common.ok')}
            cancelText={t('common.cancel')}
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
          {t('tabTwo.myAthletes')}
        </Text>
        <Text className="mb-6" style={themeStyles.textSecondary}>
          {t('tabTwo.myAthletesSubtitle')}
        </Text>

        {/* Contador e botão Convidar atleta */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold" style={themeStyles.text}>
            {t('tabTwo.totalAthletes', { count: athletes.length })}
          </Text>
          <TouchableOpacity
            className="rounded-xl py-2.5 px-4 flex-row items-center"
            style={{ backgroundColor: theme.colors.primary }}
            onPress={() => router.push('/invite-athlete' as Href)}
          >
            <FontAwesome name="plus" size={14} color="#fff" style={{ marginRight: 8 }} />
            <Text className="font-semibold text-sm" style={{ color: '#fff' }}>
              {t('tabTwo.inviteAthlete')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de atletas (Firestore coachemAthletes) */}
        {athletes.length === 0 ? (
          <EmptyState
            icon="users"
            message={t('tabTwo.emptyAthletes')}
            actionLabel={t('tabTwo.inviteAthlete')}
            onAction={() => router.push('/invite-athlete' as Href)}
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
