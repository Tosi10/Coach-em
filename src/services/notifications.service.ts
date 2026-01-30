/**
 * Notifications Service - Notificações locais e push (expo-notifications)
 * Opção 3.1.1: Configurar biblioteca de notificações
 */

import * as Notifications from 'expo-notifications';

/**
 * Configura como o app lida com notificações quando está em primeiro plano.
 * - showAlert: exibe o alerta nativo
 * - playSound: toca o som
 * - setBadge: atualiza o badge no ícone
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldAnimate: true,
  }),
});

/**
 * Solicita permissão para enviar notificações ao usuário.
 * @returns true se a permissão foi concedida
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Configura o canal de notificações no Android (recomendado para Android 8+).
 * Chamar uma vez no início do app.
 */
export async function setupNotificationChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Padrão',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#fb923c',
  });

  await Notifications.setNotificationChannelAsync('workouts', {
    name: 'Treinos',
    description: 'Lembretes e notificações de treinos',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#fb923c',
  });
}

/**
 * Monta um Date a partir de data (YYYY-MM-DD) e horário (HH:mm).
 */
function parseDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

const triggerDate = (date: Date, channelId: string) => ({
  type: Notifications.SchedulableTriggerInputTypes.DATE,
  date,
  channelId,
});

/**
 * Agenda apenas 1 lembrete para o TREINADOR: na hora do início do treino.
 * Assim o treinador não recebe 2 mensagens por aula.
 */
export async function scheduleWorkoutRemindersForCoach(
  workoutId: string,
  dateStr: string,
  timeStr: string,
  workoutName: string,
  channelId: string = 'workouts'
): Promise<string[]> {
  const scheduledIds: string[] = [];
  const workoutAt = parseDateTime(dateStr, timeStr);

  if (workoutAt.getTime() <= Date.now()) return scheduledIds;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Início do treino',
        body: `"${workoutName}" começa agora (${timeStr}).`,
        sound: true,
        channelId,
      },
      trigger: triggerDate(workoutAt, channelId),
    });
    if (id) scheduledIds.push(id);
  } catch (e) {
    console.warn('Erro ao agendar lembrete (treinador):', e);
  }
  return scheduledIds;
}

/**
 * Agenda 2 lembretes para o ATLETA: 30 min antes e na hora do treino.
 */
export async function scheduleWorkoutRemindersForAthlete(
  workoutId: string,
  dateStr: string,
  timeStr: string,
  workoutName: string,
  channelId: string = 'workouts'
): Promise<string[]> {
  const scheduledIds: string[] = [];
  const workoutAt = parseDateTime(dateStr, timeStr);

  if (workoutAt.getTime() <= Date.now()) return scheduledIds;

  try {
    // 1. 30 minutos antes
    const thirtyMinBefore = new Date(workoutAt.getTime() - 30 * 60 * 1000);
    if (thirtyMinBefore.getTime() > Date.now()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Treino em 30 min 💪',
          body: `"${workoutName}" às ${timeStr}. Prepare-se!`,
          sound: true,
          channelId,
        },
        trigger: triggerDate(thirtyMinBefore, channelId),
      });
      if (id) scheduledIds.push(id);
    }

    // 2. Na hora do treino
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora do treino! 💪',
        body: `"${workoutName}" – comece agora.`,
        sound: true,
        channelId,
      },
      trigger: triggerDate(workoutAt, channelId),
    });
    if (id) scheduledIds.push(id);
  } catch (e) {
    console.warn('Erro ao agendar lembretes (atleta):', e);
  }
  return scheduledIds;
}
