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

import { CustomAlert } from '@/components/CustomAlert';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getFeedbackIconSource, getFeedbackLabel } from '@/src/utils/feedbackIcons';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { LineChart } from 'react-native-gifted-charts';


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
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  
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

  // Estados para CustomAlert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | null>(null);
  const [reportPreset, setReportPreset] = useState<'30' | '90' | 'custom'>('30');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportDateModalVisible, setReportDateModalVisible] = useState(false);
  const [reportPickingDate, setReportPickingDate] = useState<'start' | 'end'>('start');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

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

  const formatBrDate = (value?: string) => {
    if (!value) return '--';
    return new Date(value).toLocaleDateString('pt-BR');
  };

  const applyPresetPeriod = useCallback((preset: '30' | '90') => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - (preset === '30' ? 29 : 89));
    setReportPreset(preset);
    setReportStartDate(start.toISOString().slice(0, 10));
    setReportEndDate(end.toISOString().slice(0, 10));
  }, []);

  const loadAthleteFromFirestore = useCallback(async () => {
    if (!athleteIdString) return;
    try {
      const { getAthleteById } = await import('@/src/services/athletes.service');
      const a = await getAthleteById(athleteIdString);
      setAthlete({
        id: athleteIdString,
        name: a?.name ?? `Atleta ${athleteIdString.length > 8 ? athleteIdString.slice(-8) : athleteIdString}`,
        sport: a?.sport ?? '-',
        status: a?.status ?? 'Ativo',
        photoURL: a?.photoURL,
      });
    } catch {
      setAthlete({
        id: athleteIdString,
        name: `Atleta ${athleteIdString.length > 8 ? athleteIdString.slice(-8) : athleteIdString}`,
        sport: '-',
        status: 'Ativo',
      });
    }
  }, [athleteIdString]);

  const loadAthleteWorkouts = useCallback(async () => {
    try {
      if (!athleteIdString) {
        setAthleteWorkouts([]);
        return;
      }
      const { listAssignedWorkoutsByAthleteId } = await import('@/src/services/assignedWorkouts.service');
      const workoutsWithStatus = await listAssignedWorkoutsByAthleteId(athleteIdString);
      setAthleteWorkouts(workoutsWithStatus);

      const today = new Date().toISOString().split('T')[0];
      const trainedToday = workoutsWithStatus.some((w: any) => {
        const completedDate = w.completedDate ? new Date(w.completedDate).toISOString().split('T')[0] : w.date;
        return w.status === 'Concluído' && completedDate === today;
      });
      setHasTrainedToday(trainedToday);
    } catch (error) {
      console.error('Erro ao carregar treinos do atleta:', error);
    }
  }, [athleteIdString]);

  useEffect(() => {
    if (!athleteIdString) return;
    loadAthleteFromFirestore();
    loadAthleteWorkouts();
    loadWeightHistory();
  }, [athleteIdString, loadAthleteWorkouts, loadAthleteFromFirestore]);

  useEffect(() => {
    applyPresetPeriod('30');
  }, [applyPresetPeriod]);

  // Recarregar treinos e dados do atleta (ex.: foto de perfil) ao voltar a esta tela
  useFocusEffect(
    useCallback(() => {
      loadAthleteFromFirestore();
      loadAthleteWorkouts();
    }, [loadAthleteFromFirestore, loadAthleteWorkouts])
  );

  // Carregar histórico de peso do atleta
  const loadWeightHistory = async () => {
    try {
      if (!athleteIdString) {
        setWeightHistory([]);
        setAvailableExercises([]);
        setSelectedExercise(null);
        return;
      }

      const { listExerciseWeightHistoryByAthlete } = await import('@/src/services/exerciseWeightHistory.service');
      let athleteHistory = await listExerciseWeightHistoryByAthlete(athleteIdString);
      if (athleteHistory.length === 0) {
        // Compatibilidade com histórico legado salvo localmente.
        const weightHistoryJson = await AsyncStorage.getItem('exercise_weight_history');
        const allHistory = weightHistoryJson ? JSON.parse(weightHistoryJson) : [];
        athleteHistory = (Array.isArray(allHistory) ? allHistory : []).filter(
          (r: any) => r.athleteId === athleteIdString
        );
      }

      if (athleteHistory.length === 0) {
        setAvailableExercises([]);
        setWeightHistory([]);
        setSelectedExercise(null);
        return;
      }
      
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
  const confirmDeleteWorkout = async (workoutIds: string[], workoutCount: number) => {
    try {
      const { deleteAssignedWorkouts } = await import('@/src/services/assignedWorkouts.service');
      await deleteAssignedWorkouts(workoutIds);
      await loadAthleteWorkouts();
      showAlert('✅ Sucesso', `Treino${workoutCount !== 1 ? 's' : ''} deletado${workoutCount !== 1 ? 's' : ''} com sucesso!`, 'success');
    } catch (error) {
      console.error('Erro ao deletar treino:', error);
      showAlert('Erro', 'Não foi possível deletar o treino. Tente novamente.', 'error');
    }
  };

  const handleDeleteWorkout = (workoutIds: string[], isGroup: boolean = false) => {
    const workoutCount = workoutIds.length;
    const message = isGroup 
      ? `Deseja deletar este grupo de ${workoutCount} treino${workoutCount !== 1 ? 's' : ''}?`
      : `Deseja deletar este treino?`;

    showAlert(
      'Confirmar exclusão',
      message,
      'warning',
      () => confirmDeleteWorkout(workoutIds, workoutCount)
    );
  };

  const handleToggleAthleteAccess = () => {
    const isBlocked = String(athlete?.status || '').toLowerCase() === 'bloqueado';
    const shouldBlock = !isBlocked;

    showAlert(
      shouldBlock ? 'Bloquear conta do atleta' : 'Desbloquear conta do atleta',
      shouldBlock
        ? 'Este atleta não conseguirá mais fazer login no app até ser desbloqueado.'
        : 'Este atleta voltará a conseguir fazer login normalmente.',
      'warning',
      async () => {
        if (!athleteIdString) return;
        try {
          const { setAthleteBlockedStatus } = await import('@/src/services/athletes.service');
          await setAthleteBlockedStatus(athleteIdString, shouldBlock);
          await loadAthleteFromFirestore();
          showAlert(
            'Sucesso',
            shouldBlock
              ? 'Conta do atleta bloqueada com sucesso.'
              : 'Conta do atleta desbloqueada com sucesso.',
            'success'
          );
        } catch (error) {
          console.error('Erro ao alterar bloqueio do atleta:', error);
          showAlert('Erro', 'Não foi possível atualizar o status da conta.', 'error');
        }
      }
    );
  };

  const handleGeneratePdfReport = async () => {
    if (!athleteIdString || !reportStartDate || !reportEndDate) {
      showAlert('Período', 'Selecione o período do relatório.', 'warning');
      return;
    }
    if (new Date(reportStartDate).getTime() > new Date(reportEndDate).getTime()) {
      showAlert('Período inválido', 'A data inicial deve ser menor ou igual à data final.', 'warning');
      return;
    }
    setIsGeneratingReport(true);
    try {
      const { buildAthleteReportData } = await import('@/src/services/athleteReport.service');
      const { generateAthleteReportPdf, sharePdf } = await import('@/src/services/pdfExport.service');

      const reportData = await buildAthleteReportData(athleteIdString, {
        startDate: reportStartDate,
        endDate: reportEndDate,
      });
      const file = await generateAthleteReportPdf(reportData);
      const shared = await sharePdf(file.uri);
      if (shared) {
        showAlert('Relatório PDF', 'Relatório gerado e pronto para compartilhamento.', 'success');
      } else {
        showAlert('Relatório PDF', `PDF gerado em: ${file.fileName}`, 'info');
      }
    } catch (error: any) {
      console.error('Erro ao gerar relatório PDF:', error);
      showAlert('Erro', error?.message || 'Não foi possível gerar o relatório PDF.', 'error');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (!athlete) {
    return (
      <View className="flex-1 items-center justify-center" style={themeStyles.bg}>
        <Text className="text-xl" style={themeStyles.text}>Atleta não encontrado</Text>
        <TouchableOpacity
          className="rounded-lg py-3 px-6 mt-4"
          style={{ backgroundColor: theme.colors.primary }}
          onPress={() => router.back()}
        >
          <Text className="font-semibold" style={{ color: '#ffffff' }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const normalizedAthleteStatus = String(athlete?.status || '').toLowerCase();
  const isBlocked = normalizedAthleteStatus === 'bloqueado';
  const isRemoved = normalizedAthleteStatus === 'conta removida';

  return (
    <ScrollView className="flex-1" style={themeStyles.bg}>
      <View className="px-6 pt-20 pb-20">
        {/* Header com botão voltar */}
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

        {/* Seção de perfil do atleta */}
        <View className="flex-row items-center mb-6">
          <View
            className="w-20 h-20 rounded-full border-2 mr-4 overflow-hidden items-center justify-center"
            style={{
              backgroundColor: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.1)',
              borderColor: theme.colors.primary + '50',
            }}
          >
            {athlete.photoURL ? (
              <Image source={{ uri: athlete.photoURL }} style={{ width: 80, height: 80 }} resizeMode="cover" />
            ) : (
              <Text className="font-bold text-2xl" style={{ color: theme.colors.primary }}>
                {athlete.name.charAt(0)}
              </Text>
            )}
          </View>

          <View className="flex-1">
            {/* Nome do atleta ao lado da foto */}
            <Text className="text-3xl font-bold mb-2" style={themeStyles.text}>
              {athlete.name}
            </Text>

            <View
              className="border px-3 py-1 rounded-lg self-start mb-2"
              style={{
                backgroundColor: isRemoved
                  ? theme.colors.backgroundSecondary
                  : isBlocked
                  ? (theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.08)')
                  : (theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.08)'),
                borderColor: isRemoved ? theme.colors.border : isBlocked ? '#ef444455' : '#10b98155',
              }}
            >
              <Text
                className="font-semibold text-xs"
                style={{
                  color: isRemoved ? theme.colors.textTertiary : isBlocked ? '#ef4444' : '#10b981',
                }}
              >
                {isRemoved ? 'Conta removida' : isBlocked ? 'Bloqueado' : 'Ativo'}
              </Text>
            </View>
            
            {/* Status "Treinou Hoje" */}
            {hasTrainedToday ? (
              <View className="border px-4 py-2 rounded-lg self-start"
                style={{
                  backgroundColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                  borderColor: '#10b981' + '50',
                }}
              >
                <Text className="font-semibold text-sm" style={{ color: '#10b981' }}>
                  Treinou Hoje
                </Text>
              </View>
            ) : (
              <View className="border px-4 py-2 rounded-lg self-start"
                style={{
                  backgroundColor: theme.colors.backgroundTertiary,
                  borderColor: theme.colors.border,
                }}
              >
                <Text className="font-semibold text-sm" style={themeStyles.textTertiary}>
                  Não treinou hoje
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Tabs - Ordem: Gráficos, Treinos, Fotos */}
        <View className="flex-row mb-6" style={{ borderBottomColor: theme.colors.border, borderBottomWidth: 1 }}>
          <TouchableOpacity
            className="flex-1 py-3 border-b-2"
            style={{
              borderBottomColor: activeTab === 'graficos' ? theme.colors.primary : 'transparent',
            }}
            onPress={() => setActiveTab('graficos')}
          >
            <Text
              className="text-center font-semibold"
              style={{
                color: activeTab === 'graficos' ? theme.colors.text : theme.colors.textTertiary
              }}
            >
              Gráficos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 py-3 border-b-2"
            style={{
              borderBottomColor: activeTab === 'treinos' ? theme.colors.primary : 'transparent',
            }}
            onPress={() => setActiveTab('treinos')}
          >
            <Text
              className="text-center font-semibold"
              style={{
                color: activeTab === 'treinos' ? theme.colors.text : theme.colors.textTertiary
              }}
            >
              Treinos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 py-3 border-b-2"
            style={{
              borderBottomColor: activeTab === 'fotos' ? theme.colors.primary : 'transparent',
            }}
            onPress={() => setActiveTab('fotos')}
          >
            <Text
              className="text-center font-semibold"
              style={{
                color: activeTab === 'fotos' ? theme.colors.text : theme.colors.textTertiary
              }}
            >
              Fotos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo das Tabs */}
        {activeTab === 'graficos' && (
          <View className="mb-6">
            <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
              Evolução de Peso/Carga
            </Text>
            
            {/* Seletor de Exercício */}
            {availableExercises.length > 0 ? (
              <>
                <View className="mb-1">
                  <Text className="text-sm mb-2" style={themeStyles.textSecondary}>Selecione o exercício:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                    <View className="flex-row gap-2">
                      {availableExercises.map((exercise) => (
                        <TouchableOpacity
                          key={exercise.id}
                          onPress={() => setSelectedExercise(exercise.id)}
                          className="px-4 py-2 rounded-lg border"
                          style={{
                            backgroundColor: selectedExercise === exercise.id
                              ? (theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.1)')
                              : theme.colors.backgroundTertiary,
                            borderColor: selectedExercise === exercise.id
                              ? theme.colors.primary
                              : theme.colors.border,
                          }}
                        >
                          <Text className="font-semibold" style={{
                            color: selectedExercise === exercise.id
                              ? theme.colors.primary
                              : theme.colors.textTertiary
                          }}>
                            {exercise.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                
                {/* Gráfico de Evolução */}
                {weightHistory.length > 0 ? (
                  <View className="rounded-xl p-4 mb-0 border" style={themeStyles.card}>
                    <Text className="font-semibold mb-2 text-center" style={themeStyles.text}>
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
                      yAxisColor={theme.colors.borderSecondary}
                      xAxisColor={theme.colors.borderSecondary}
                      yAxisTextStyle={{ color: theme.colors.textSecondary, fontSize: 10 }}
                      xAxisLabelTextStyle={{ color: theme.colors.textSecondary, fontSize: 9 }}
                      hideDataPoints={false}
                      dataPointsColor="#fb923c"
                      dataPointsRadius={6}
                      dataPointsWidth={6}
                      dataPointsHeight={6}
                      textShiftY={-2}
                      textShiftX={-5}
                      textFontSize={10}
                      hideRules={false}
                      rulesColor={theme.colors.border}
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
                  <View className="rounded-xl p-8 items-center border" style={themeStyles.card}>
                    <Text className="text-center" style={themeStyles.textSecondary}>
                      Nenhum registro de peso encontrado para este exercício.
                    </Text>
                    <Text className="text-sm text-center mt-2" style={themeStyles.textTertiary}>
                      Registre o peso usado durante os treinos para ver a evolução aqui.
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View className="rounded-xl p-8 items-center border mb-4" style={themeStyles.card}>
                <Text className="text-center mb-2" style={themeStyles.textSecondary}>
                  Nenhum exercício com registro de peso ainda.
                </Text>
                <Text className="text-sm text-center" style={themeStyles.textTertiary}>
                  Complete treinos e registre o peso usado para ver a evolução aqui.
                </Text>
              </View>
            )}

          </View>
        )}

        {activeTab === 'treinos' && (
          <View className="mb-6">
            {/* Sub-tabs dentro de Treinos */}
            <View className="flex-row mb-4" style={{ borderBottomColor: theme.colors.border, borderBottomWidth: 1 }}>
              <TouchableOpacity
                className="flex-1 py-2 border-b-2"
                style={{
                  borderBottomColor: workoutSubTab === 'proximos' ? theme.colors.primary : 'transparent',
                }}
                onPress={() => {
                  setWorkoutSubTab('proximos');
                  setWorkoutsToShow(5); // Resetar paginação ao trocar de aba
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
                  setWorkoutsToShow(5); // Resetar paginação ao trocar de aba
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

            {athleteWorkouts.length === 0 ? (
              <View className="rounded-xl p-6 border" style={themeStyles.card}>
                <Text className="text-center" style={themeStyles.textSecondary}>
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
                          <View className="rounded-xl p-6 border" style={themeStyles.card}>
                            <Text className="text-center" style={themeStyles.textSecondary}>
                              Nenhum treino concluído ainda
                            </Text>
                          </View>
                        ) : (
                          workoutsToDisplay.map((workout: any) => {
                            const feedbackIconSrc = getFeedbackIconSource(workout.feedback, workout.feedbackEmoji);
                            return (
                            <View
                              key={workout.id}
                              className="border rounded-xl p-4 mb-3"
                              style={{
                                ...themeStyles.card,
                                borderColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : '#000000',
                              }}
                            >
                              <View className="flex-row items-center gap-2">
                                <TouchableOpacity
                                  className="flex-1 min-w-0 pr-1"
                                  onPress={() => {
                                    router.push({
                                      pathname: '/workout-details',
                                      params: { workoutId: workout.id },
                                    });
                                  }}
                                >
                                  <View>
                                    <Text className="font-semibold text-lg mb-1" style={themeStyles.text}>
                                      {workout.name}
                                    </Text>
                                    <Text className="text-sm mb-1" style={themeStyles.textSecondary}>
                                      {workout.date} • {workout.dayOfWeek}
                                    </Text>
                                    {workout.completedDate && (
                                      <Text className="text-xs" style={themeStyles.textTertiary}>
                                        Concluído em: {new Date(workout.completedDate).toLocaleDateString('pt-BR')}
                                      </Text>
                                    )}
                                  </View>
                                </TouchableOpacity>

                                {feedbackIconSrc ? (
                                  <View
                                    className="justify-center items-center shrink-0"
                                    style={{ width: 64 }}
                                    pointerEvents="none"
                                  >
                                    <Image
                                      source={feedbackIconSrc}
                                      style={{ width: 52, height: 52 }}
                                      resizeMode="contain"
                                    />
                                  </View>
                                ) : null}

                                <View className="items-end justify-center" style={{ gap: 10 }}>
                                  <View
                                    className="border px-3 py-1 rounded-full"
                                    style={{
                                      backgroundColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                                      borderColor: '#10b981' + '50',
                                    }}
                                  >
                                    <Text className="text-xs font-semibold" style={{ color: '#10b981' }}>
                                      {workout.status}
                                    </Text>
                                  </View>
                                  <TouchableOpacity
                                    className="flex-row items-center border rounded-lg py-1.5 px-2.5"
                                    style={{
                                      backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                                      borderColor: '#ef4444' + '50',
                                    }}
                                    onPress={() => {
                                      handleDeleteWorkout([workout.id], false);
                                    }}
                                  >
                                    <FontAwesome name="trash" size={12} color="#ef4444" />
                                    <Text className="text-xs font-semibold ml-1" style={{ color: '#ef4444' }}>
                                      Deletar
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                            );
                          })
                        )}
                        
                        {hasMore && (
                          <TouchableOpacity
                            className="border rounded-xl py-3 px-6 mt-2"
                            style={themeStyles.cardSecondary}
                            onPress={() => setWorkoutsToShow(workoutsToShow + 5)}
                          >
                            <Text className="font-semibold text-center" style={{ color: theme.colors.primary }}>
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
                          <View className="rounded-xl border overflow-hidden" style={themeStyles.card}>
                            <EmptyState
                              imageSource={require('../assets/images/Coracao.png')}
                              message="Não há treinos agendados."
                            />
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
                                  className="rounded-xl p-4 mb-3 border"
                                  style={themeStyles.card}
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
                                        <Text className="font-semibold text-lg mb-1" style={themeStyles.text}>
                                          {item.name}
                                        </Text>
                                        <Text className="text-sm mb-1" style={{ color: theme.colors.primary }}>
                                          {dayOfWeek} • {totalCount} treino{totalCount !== 1 ? 's' : ''}
                                        </Text>
                                        <Text className="text-xs" style={themeStyles.textSecondary}>
                                          {firstDate.toLocaleDateString('pt-BR')} até {lastDate.toLocaleDateString('pt-BR')}
                                        </Text>
                                      </View>
                                    </TouchableOpacity>
                                    
                                    <View className="items-end">
                                      <View className="border px-3 py-1 rounded-full mb-2"
                                        style={{
                                          backgroundColor: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.1)',
                                          borderColor: theme.colors.primary + '50',
                                        }}
                                      >
                                        <Text className="text-xs font-semibold" style={{ color: theme.colors.primary }}>
                                          Pendente
                                        </Text>
                                      </View>
                                      {/* Botão Editar - treino atribuído (ex.: atleta com dor, ajustar exercícios) */}
                                      <TouchableOpacity
                                        className="flex-row items-center border rounded-lg py-1.5 px-2.5 mb-2"
                                        style={{
                                          backgroundColor: theme.mode === 'dark' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                                          borderColor: '#10b981' + '50',
                                        }}
                                        onPress={() => {
                                          router.push({
                                            pathname: '/edit-assigned-workout',
                                            params: { assignedWorkoutId: sortedGroupWorkouts[0].id },
                                          });
                                        }}
                                      >
                                        <FontAwesome name="pencil" size={12} color="#10b981" />
                                        <Text className="text-xs font-semibold ml-1" style={{ color: '#10b981' }}>
                                          Editar
                                        </Text>
                                      </TouchableOpacity>
                                      {/* Botão de deletar */}
                                      <TouchableOpacity
                                        className="flex-row items-center border rounded-lg py-1.5 px-2.5"
                                        style={{
                                          backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                                          borderColor: '#ef4444' + '50',
                                        }}
                                        onPress={() => {
                                          const workoutIds = sortedGroupWorkouts.map((w: any) => w.id);
                                          handleDeleteWorkout(workoutIds, true);
                                        }}
                                      >
                                        <FontAwesome name="trash" size={12} color="#ef4444" />
                                        <Text className="text-xs font-semibold ml-1" style={{ color: '#ef4444' }}>
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
                                  className="rounded-xl p-4 mb-3 border"
                                  style={themeStyles.card}
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
                                        <Text className="font-semibold text-lg mb-1" style={themeStyles.text}>
                                          {item.workout.name}
                                        </Text>
                                        <Text className="text-sm mb-1" style={themeStyles.textSecondary}>
                                          {item.workout.date} • {item.workout.dayOfWeek}
                                        </Text>
                                      </View>
                                    </TouchableOpacity>
                                    
                                    <View className="items-end">
                                      <View className="border px-3 py-1 rounded-full mb-2"
                                        style={{
                                          backgroundColor: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.1)',
                                          borderColor: theme.colors.primary + '50',
                                        }}
                                      >
                                        <Text className="text-xs font-semibold" style={{ color: theme.colors.primary }}>
                                          {item.workout.status}
                                        </Text>
                                      </View>
                                      {/* Botão Editar - treino atribuído (ajustar exercícios para o atleta) */}
                                      <TouchableOpacity
                                        className="flex-row items-center border rounded-lg py-1.5 px-2.5 mb-2"
                                        style={{
                                          backgroundColor: theme.mode === 'dark' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                                          borderColor: '#10b981' + '50',
                                        }}
                                        onPress={() => {
                                          router.push({
                                            pathname: '/edit-assigned-workout',
                                            params: { assignedWorkoutId: item.workout.id },
                                          });
                                        }}
                                      >
                                        <FontAwesome name="pencil" size={12} color="#10b981" />
                                        <Text className="text-xs font-semibold ml-1" style={{ color: '#10b981' }}>
                                          Editar
                                        </Text>
                                      </TouchableOpacity>
                                      {/* Botão de deletar */}
                                      <TouchableOpacity
                                        className="flex-row items-center border rounded-lg py-1.5 px-2.5"
                                        style={{
                                          backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                                          borderColor: '#ef4444' + '50',
                                        }}
                                        onPress={() => {
                                          handleDeleteWorkout([item.workout.id], false);
                                        }}
                                      >
                                        <FontAwesome name="trash" size={12} color="#ef4444" />
                                        <Text className="text-xs font-semibold ml-1" style={{ color: '#ef4444' }}>
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
                            className="border rounded-xl py-3 px-6 mt-2"
                            style={themeStyles.cardSecondary}
                            onPress={() => setWorkoutsToShow(workoutsToShow + 5)}
                          >
                            <Text className="font-semibold text-center" style={{ color: theme.colors.primary }}>
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
            <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
              Fotos
            </Text>
            <View className="rounded-xl p-6 border" style={themeStyles.card}>
              <Text className="text-center" style={themeStyles.textSecondary}>
                Nenhuma foto disponível
              </Text>
            </View>
          </View>
        )}

        {/* Botão Atribuir Treino */}
        <TouchableOpacity
          className="rounded-xl py-4 px-6 mt-1 border"
          style={{
            backgroundColor: theme.mode === 'dark' 
              ? 'rgba(249, 115, 22, 0.4)' 
              : 'rgba(251, 146, 60, 0.2)',
            borderColor: theme.colors.primary + '50',
            opacity: isRemoved ? 0.45 : 1,
          }}
          disabled={isRemoved}
          onPress={() => {
            router.push({
              pathname: '/assign-workout',
              params: { athleteId: athleteIdString },
            });
          }}
        >
          <Text className="font-bold text-center text-lg" style={{ color: theme.colors.primary }}>
            ➕ Atribuir Treino
          </Text>
        </TouchableOpacity>

        {/* Último Feedback - dados reais dos treinos concluídos */}
        {(() => {
          const workoutsWithFeedback = athleteWorkouts
            .filter((w: any) => w.status === 'Concluído' && (w.feedbackText || w.feedbackEmoji || w.feedback != null))
            .sort((a: any, b: any) => new Date(b.completedDate || b.date).getTime() - new Date(a.completedDate || a.date).getTime());
          const lastFeedback = workoutsWithFeedback[0];
          if (!lastFeedback) return null;
          const dateStr = lastFeedback.completedDate || lastFeedback.date;
          const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
          const label = getFeedbackLabel(lastFeedback.feedback, lastFeedback.feedbackEmoji);
          const feedbackMessage =
            lastFeedback.feedbackText || (label ? `Sentiu: ${label}` : '');
          const feedbackIconSrc = getFeedbackIconSource(lastFeedback.feedback, lastFeedback.feedbackEmoji);
          if (!feedbackMessage && !feedbackIconSrc) return null;
          return (
            <View className="rounded-xl p-4 border mt-4" style={themeStyles.card}>
              <Text className="font-semibold mb-3" style={themeStyles.text}>
                Último Feedback
              </Text>
              <View className="flex-row items-start gap-2">
                {feedbackIconSrc ? (
                  <Image source={feedbackIconSrc} style={{ width: 28, height: 28 }} resizeMode="contain" />
                ) : null}
                <Text className="text-sm leading-5 flex-1" style={themeStyles.textSecondary}>
                  {athlete.name} disse: "{feedbackMessage}"{formattedDate ? ` - ${formattedDate}` : ''}
                </Text>
              </View>
            </View>
          );
        })()}

        <View className="rounded-xl border p-4 mt-4" style={themeStyles.card}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-semibold" style={themeStyles.text}>
              Relatório PDF do atleta
            </Text>
            <Text className="text-xs" style={themeStyles.textSecondary}>
              Treina+ / Vision10
            </Text>
          </View>

          <View className="flex-row mb-3" style={{ gap: 8 }}>
            <TouchableOpacity
              className="px-3 py-2 rounded-lg border"
              style={{
                borderColor: reportPreset === '30' ? theme.colors.primary : theme.colors.border,
                backgroundColor: reportPreset === '30' ? theme.colors.primary + '20' : theme.colors.backgroundSecondary,
              }}
              onPress={() => applyPresetPeriod('30')}
            >
              <Text className="text-xs font-semibold" style={{ color: reportPreset === '30' ? theme.colors.primary : theme.colors.textSecondary }}>
                30 dias
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-3 py-2 rounded-lg border"
              style={{
                borderColor: reportPreset === '90' ? theme.colors.primary : theme.colors.border,
                backgroundColor: reportPreset === '90' ? theme.colors.primary + '20' : theme.colors.backgroundSecondary,
              }}
              onPress={() => applyPresetPeriod('90')}
            >
              <Text className="text-xs font-semibold" style={{ color: reportPreset === '90' ? theme.colors.primary : theme.colors.textSecondary }}>
                90 dias
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-3 py-2 rounded-lg border"
              style={{
                borderColor: reportPreset === 'custom' ? theme.colors.primary : theme.colors.border,
                backgroundColor: reportPreset === 'custom' ? theme.colors.primary + '20' : theme.colors.backgroundSecondary,
              }}
              onPress={() => setReportPreset('custom')}
            >
              <Text className="text-xs font-semibold" style={{ color: reportPreset === 'custom' ? theme.colors.primary : theme.colors.textSecondary }}>
                Personalizado
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row mb-3" style={{ gap: 8 }}>
            <TouchableOpacity
              className="flex-1 rounded-lg border px-3 py-2.5"
              style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundSecondary }}
              onPress={() => {
                setReportPickingDate('start');
                setReportDateModalVisible(true);
              }}
            >
              <Text className="text-[11px]" style={themeStyles.textSecondary}>Início</Text>
              <Text className="text-sm font-semibold" style={themeStyles.text}>{formatBrDate(reportStartDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 rounded-lg border px-3 py-2.5"
              style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundSecondary }}
              onPress={() => {
                setReportPickingDate('end');
                setReportDateModalVisible(true);
              }}
            >
              <Text className="text-[11px]" style={themeStyles.textSecondary}>Fim</Text>
              <Text className="text-sm font-semibold" style={themeStyles.text}>{formatBrDate(reportEndDate)}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="rounded-lg py-3 px-4 flex-row items-center justify-center"
            style={{ backgroundColor: theme.colors.primary, opacity: isGeneratingReport ? 0.7 : 1 }}
            onPress={handleGeneratePdfReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <FontAwesome name="file-pdf-o" size={16} color="#000" />
                <Text className="font-semibold ml-2" style={{ color: '#000' }}>
                  Gerar relatório PDF
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Botão Bloquear/Desbloquear conta do atleta */}
        {!isRemoved && (
          <TouchableOpacity
            className="rounded-xl py-3.5 px-6 mt-4 border"
            style={{
              backgroundColor: isBlocked
                ? (theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)')
                : (theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.14)' : 'rgba(239, 68, 68, 0.08)'),
              borderColor: isBlocked ? '#10b98155' : '#ef444455',
            }}
            onPress={handleToggleAthleteAccess}
            activeOpacity={0.8}
          >
            <Text
              className="font-semibold text-center"
              style={{ color: isBlocked ? '#10b981' : '#ef4444' }}
            >
              {isBlocked ? '🔓 Desbloquear conta do atleta' : '🔒 Bloquear conta do atleta'}
            </Text>
          </TouchableOpacity>
        )}

        {isRemoved && (
          <View
            className="rounded-xl py-3.5 px-4 mt-4 border"
            style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundSecondary }}
          >
            <Text className="text-center text-xs" style={themeStyles.textSecondary}>
              Este atleta removeu a conta de login. Os dados foram mantidos apenas para histórico do treinador.
            </Text>
          </View>
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

      <Modal
        visible={reportDateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReportDateModalVisible(false)}
      >
        <View className="flex-1 justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View className="rounded-2xl p-4" style={themeStyles.card}>
            <Text className="font-semibold mb-2" style={themeStyles.text}>
              Selecionar data de {reportPickingDate === 'start' ? 'início' : 'fim'}
            </Text>
            <Calendar
              onDayPress={(day) => {
                if (reportPickingDate === 'start') {
                  setReportStartDate(day.dateString);
                  if (reportPreset !== 'custom') setReportPreset('custom');
                } else {
                  setReportEndDate(day.dateString);
                  if (reportPreset !== 'custom') setReportPreset('custom');
                }
                setReportDateModalVisible(false);
              }}
              maxDate={todayDate}
              markedDates={{
                ...(reportStartDate ? { [reportStartDate]: { selected: true, selectedColor: theme.colors.primary } } : {}),
                ...(reportEndDate ? { [reportEndDate]: { selected: true, selectedColor: theme.colors.primary } } : {}),
              }}
              theme={{
                calendarBackground: theme.colors.card,
                dayTextColor: theme.colors.text,
                monthTextColor: theme.colors.text,
                textDisabledColor: theme.colors.textTertiary,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: '#000',
                todayTextColor: theme.colors.primary,
                arrowColor: theme.colors.primary,
              }}
            />
            <TouchableOpacity
              className="mt-3 rounded-lg py-2"
              style={{ borderColor: theme.colors.border, borderWidth: 1 }}
              onPress={() => setReportDateModalVisible(false)}
            >
              <Text className="text-center font-semibold" style={themeStyles.text}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
