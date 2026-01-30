/**
 * Calendário do treinador – agenda de treinos atribuídos por data.
 * Só acessível pelo treinador (botão na Home).
 */

import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

const mockAthletes: { id: string; name: string }[] = [
  { id: '1', name: 'João Silva' },
  { id: '2', name: 'Maria Oliveira' },
  { id: '3', name: 'Pedro Santos' },
  { id: '4', name: 'Ana Souza' },
  { id: '5', name: 'Carlos Ferreira' },
  { id: '6', name: 'Laura Rodrigues' },
  { id: '7', name: 'Rafael Oliveira' },
  { id: '8', name: 'Camila Silva' },
];

export default function CoachCalendarScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const [assignedWorkouts, setAssignedWorkouts] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const loadWorkouts = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem('assigned_workouts');
      const list = json ? JSON.parse(json) : [];
      const enriched = await Promise.all(
        list.map(async (w: any) => {
          const savedStatus = await AsyncStorage.getItem(`workout_${w.id}_status`);
          const status = savedStatus || w.status || 'Pendente';
          const feedbackEmojiJson = await AsyncStorage.getItem(`workout_${w.id}_feedbackEmoji`);
          const feedbackEmoji = feedbackEmojiJson || w.feedbackEmoji || null;
          return { ...w, status, feedbackEmoji };
        })
      );
      setAssignedWorkouts(enriched);
    } catch (e) {
      console.warn('Erro ao carregar treinos:', e);
      setAssignedWorkouts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts])
  );

  const getAthleteName = (athleteId: string) =>
    mockAthletes.find((a) => a.id === athleteId)?.name || `Atleta ${athleteId}`;

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
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: theme.colors.primary + '30' }}>
                  <FontAwesome name="trophy" size={18} color={theme.colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold" style={themeStyles.text}>
                    {w.name}
                  </Text>
                  <Text className="text-sm" style={themeStyles.textSecondary}>
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
                    {isCompleted && w.feedbackEmoji && (
                      <Text style={{ fontSize: 16 }}>{w.feedbackEmoji}</Text>
                    )}
                  </View>
                </View>
                <FontAwesome name="chevron-right" size={14} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
