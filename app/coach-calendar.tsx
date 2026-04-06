/**
 * Calendário do treinador – agenda de treinos atribuídos por data.
 * Só acessível pelo treinador (botão na Home).
 */

import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getFeedbackIconSource } from '@/src/utils/feedbackIcons';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function CoachCalendarScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const [assignedWorkouts, setAssignedWorkouts] = useState<any[]>([]);
  const [athletesMap, setAthletesMap] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setAthletesMap({});
      return;
    }
    import('@/src/services/athletes.service').then(({ listAthletesByCoachId }) =>
      listAthletesByCoachId(user.id).then((list) => {
        const map: Record<string, string> = {};
        list.forEach((a) => { map[a.id] = a.name; });
        setAthletesMap(map);
      })
    );
  }, [user?.id]);

  const getAthleteName = useCallback(
    (athleteId: string) =>
      athletesMap[athleteId] ?? `Atleta ${athleteId.length > 8 ? athleteId.slice(-8) : athleteId}`,
    [athletesMap]
  );

  const loadWorkouts = useCallback(async () => {
    if (!user?.id) {
      setAssignedWorkouts([]);
      setLoading(false);
      return;
    }
    try {
      const { listAssignedWorkoutsByCoachId } = await import('@/src/services/assignedWorkouts.service');
      const list = await listAssignedWorkoutsByCoachId(user.id);
      setAssignedWorkouts(list);
    } catch (e) {
      console.warn('Erro ao carregar treinos:', e);
      setAssignedWorkouts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts])
  );

  const workoutsByDate: Record<string, any[]> = {};
  assignedWorkouts.forEach((w: any) => {
    const date = w.date || w.scheduledDate;
    if (!date) return;
    if (!workoutsByDate[date]) workoutsByDate[date] = [];
    workoutsByDate[date].push(w);
  });

  const markedDates: Record<string, { marked?: boolean; selected?: boolean; selectedColor?: string }> = {};
  Object.keys(workoutsByDate).forEach((date) => {
    markedDates[date] = {
      marked: true,
      selected: date === selectedDate,
      selectedColor: theme.colors.primary,
    };
  });
  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = { selected: true, selectedColor: theme.colors.primary };
  }

  const dayWorkouts = workoutsByDate[selectedDate] || [];
  dayWorkouts.sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''));

  return (
    <ScrollView className="flex-1" style={themeStyles.bg}>
      <View className="px-6 pt-20 pb-20">
        <TouchableOpacity
          className="mb-6 flex-row items-center"
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <View className="rounded-full w-10 h-10 items-center justify-center mr-3 border" style={themeStyles.cardSecondary}>
            <FontAwesome name="arrow-left" size={18} color={theme.colors.primary} />
          </View>
          <Text className="font-semibold text-lg" style={{ color: theme.colors.primary }}>
            Voltar
          </Text>
        </TouchableOpacity>

        <Text className="text-3xl font-bold mb-2" style={themeStyles.text}>
          Minha agenda
        </Text>
        <Text className="mb-6" style={themeStyles.textSecondary}>
          Treinos atribuídos por data
        </Text>

        <View className="rounded-xl border overflow-hidden mb-6" style={themeStyles.card}>
          <Calendar
            current={selectedDate}
            markedDates={markedDates}
            onDayPress={(day) => setSelectedDate(day.dateString)}
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
            }}
          />
        </View>

        <Text className="text-lg font-bold mb-3" style={themeStyles.text}>
          {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </Text>

        {loading ? (
          <Text style={themeStyles.textSecondary}>Carregando…</Text>
        ) : dayWorkouts.length === 0 ? (
          <View className="rounded-xl p-6 border" style={themeStyles.card}>
            <Text className="text-center" style={themeStyles.textSecondary}>
              Nenhum treino neste dia
            </Text>
          </View>
        ) : (
          dayWorkouts.map((w: any) => {
            const isCompleted = w.status === 'Concluído';
            const feedbackIconSrc = getFeedbackIconSource(w.feedback, w.feedbackEmoji);
            const feedbackIconSize = 90;
            return (
              <TouchableOpacity
                key={w.id}
                className="rounded-xl p-4 mb-3 border flex-row items-center"
                style={{
                  ...themeStyles.card,
                  borderColor: isCompleted ? (theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.3)') : theme.colors.primary + '40',
                }}
                onPress={() => router.push({ pathname: '/workout-details', params: { workoutId: w.id } })}
                activeOpacity={0.7}
              >
                <View
                  className="flex-row flex-shrink min-w-0"
                  style={{ alignItems: 'flex-start', marginRight: 8, maxWidth: '48%' }}
                >
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: theme.colors.primary + '30' }}>
                    <FontAwesome name="trophy" size={18} color={theme.colors.primary} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="font-semibold" style={themeStyles.text} numberOfLines={2}>
                      {w.name}
                    </Text>
                    <Text className="text-sm" style={themeStyles.textSecondary} numberOfLines={2}>
                      {getAthleteName(w.athleteId)}
                      {w.scheduledTime ? ` • ${w.scheduledTime}` : ''}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1.5">
                      <View
                        className="px-2 py-0.5 rounded-full self-start"
                        style={{
                          backgroundColor: isCompleted ? (theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)') : (theme.mode === 'dark' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.15)'),
                          borderWidth: 1,
                          borderColor: isCompleted ? '#10b98150' : '#f59e0b50',
                        }}
                      >
                        <Text className="text-xs font-semibold" style={{ color: isCompleted ? '#10b981' : '#f59e0b' }}>
                          {isCompleted ? 'Concluído' : 'Pendente'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                {isCompleted && feedbackIconSrc ? (
                  <View
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: feedbackIconSize,
                      paddingHorizontal: 4,
                    }}
                  >
                    <Image
                      source={feedbackIconSrc}
                      style={{ width: feedbackIconSize, height: feedbackIconSize }}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View style={{ flex: 1 }} />
                )}
                <FontAwesome name="chevron-right" size={14} color={theme.colors.textTertiary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
