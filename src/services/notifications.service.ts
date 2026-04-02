/**
 * Notificações locais (expo-notifications).
 * No Expo Go (SDK 53+), importar expo-notifications quebra o app — só carregamos em dev build / standalone.
 */

import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

type NotificationsModule = typeof import('expo-notifications');

let notificationsMod: NotificationsModule | null = null;
let handlerConfigured = false;

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (isExpoGo) return null;
  if (!notificationsMod) {
    notificationsMod = await import('expo-notifications');
  }
  return notificationsMod;
}

async function ensureHandler(): Promise<void> {
  if (isExpoGo || handlerConfigured) return;
  const N = await loadNotifications();
  if (!N) return;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldAnimate: true,
    }),
  });
  handlerConfigured = true;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const N = await loadNotifications();
  if (!N) return false;
  await ensureHandler();
  const { status: existing } = await N.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await N.requestPermissionsAsync();
  return status === 'granted';
}

export async function setupNotificationChannel(): Promise<void> {
  const N = await loadNotifications();
  if (!N) return;
  await ensureHandler();
  await N.setNotificationChannelAsync('default', {
    name: 'Padrão',
    importance: N.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#fb923c',
  });
  await N.setNotificationChannelAsync('workouts', {
    name: 'Treinos',
    description: 'Lembretes e notificações de treinos',
    importance: N.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#fb923c',
  });
}

function parseDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export async function scheduleWorkoutRemindersForCoach(
  workoutId: string,
  dateStr: string,
  timeStr: string,
  workoutName: string,
  channelId: string = 'workouts'
): Promise<string[]> {
  const scheduledIds: string[] = [];
  const N = await loadNotifications();
  if (!N) return scheduledIds;
  await ensureHandler();

  const workoutAt = parseDateTime(dateStr, timeStr);
  if (workoutAt.getTime() <= Date.now()) return scheduledIds;

  try {
    const id = await N.scheduleNotificationAsync({
      content: {
        title: 'Início do treino',
        body: `"${workoutName}" começa agora (${timeStr}).`,
        sound: true,
        channelId,
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DATE,
        date: workoutAt,
        channelId,
      },
    });
    if (id) scheduledIds.push(id);
  } catch (e) {
    console.warn('Erro ao agendar lembrete (treinador):', e);
  }
  return scheduledIds;
}

export async function scheduleWorkoutRemindersForAthlete(
  workoutId: string,
  dateStr: string,
  timeStr: string,
  workoutName: string,
  channelId: string = 'workouts'
): Promise<string[]> {
  const scheduledIds: string[] = [];
  const N = await loadNotifications();
  if (!N) return scheduledIds;
  await ensureHandler();

  const workoutAt = parseDateTime(dateStr, timeStr);
  if (workoutAt.getTime() <= Date.now()) return scheduledIds;

  try {
    const thirtyMinBefore = new Date(workoutAt.getTime() - 30 * 60 * 1000);
    if (thirtyMinBefore.getTime() > Date.now()) {
      const id = await N.scheduleNotificationAsync({
        content: {
          title: 'Treino em 30 min 💪',
          body: `"${workoutName}" às ${timeStr}. Prepare-se!`,
          sound: true,
          channelId,
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DATE,
          date: thirtyMinBefore,
          channelId,
        },
      });
      if (id) scheduledIds.push(id);
    }

    const id = await N.scheduleNotificationAsync({
      content: {
        title: 'Hora do treino! 💪',
        body: `"${workoutName}" – comece agora.`,
        sound: true,
        channelId,
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DATE,
        date: workoutAt,
        channelId,
      },
    });
    if (id) scheduledIds.push(id);
  } catch (e) {
    console.warn('Erro ao agendar lembretes (atleta):', e);
  }
  return scheduledIds;
}
