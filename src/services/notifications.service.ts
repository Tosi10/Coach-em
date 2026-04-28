/**
 * Notificações locais (expo-notifications).
 * No Expo Go (SDK 53+), importar expo-notifications quebra o app — só carregamos em dev build / standalone.
 */

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase.config';

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
      shouldShowBanner: true,
      shouldShowList: true,
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
          sound: 'default',
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
        sound: 'default',
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

/**
 * Garante que os lembretes do atleta fiquem agendados no dispositivo atual.
 * Chame no startup/login e também quando carregar treinos.
 */
export async function syncAthleteWorkoutReminders(
  athleteId: string,
  channelId: string = 'workouts'
): Promise<void> {
  if (!athleteId) return;
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;
  await setupNotificationChannel();

  const { listAssignedWorkoutsByAthleteId } = await import('./assignedWorkouts.service');
  const workouts = await listAssignedWorkoutsByAthleteId(athleteId);
  const now = Date.now();

  for (const w of workouts) {
    if (w.status === 'Concluído' || !w.scheduledTime || !w.date) continue;
    const workoutAt = parseDateTime(w.date, w.scheduledTime);
    if (workoutAt.getTime() <= now) continue;

    // chave com data/hora para reagendar automaticamente se treino mudar
    const key = `workout_${w.id}_${w.date}_${w.scheduledTime}_athlete_reminders_scheduled`;
    const alreadyScheduled = await AsyncStorage.getItem(key);
    if (alreadyScheduled === 'true') continue;

    await scheduleWorkoutRemindersForAthlete(w.id, w.date, w.scheduledTime, w.name, channelId);
    await AsyncStorage.setItem(key, 'true');
  }
}

function getExpoProjectId(): string | undefined {
  const easProjectId = (Constants as any)?.easConfig?.projectId;
  if (typeof easProjectId === 'string' && easProjectId.trim()) return easProjectId.trim();

  const extraProjectId = (Constants as any)?.expoConfig?.extra?.eas?.projectId;
  if (typeof extraProjectId === 'string' && extraProjectId.trim()) return extraProjectId.trim();

  return undefined;
}

/**
 * Registra/atualiza o Expo Push Token no Firestore para envio remoto.
 * Salva em users/{uid} e também em coachemAthletes/{uid} (quando existir).
 */
export async function syncUserExpoPushToken(userId: string): Promise<string | null> {
  if (!userId) return null;

  const N = await loadNotifications();
  if (!N) return null;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  const projectId = getExpoProjectId();
  if (!projectId) {
    console.warn('Projeto EAS (projectId) não encontrado para gerar Expo Push Token.');
    return null;
  }

  try {
    const tokenResult = await N.getExpoPushTokenAsync({ projectId });
    const token = tokenResult?.data;
    if (!token) return null;

    const payload = {
      expoPushToken: token,
      expoPushTokenUpdatedAt: serverTimestamp(),
      expoPushPlatform: Constants.platform?.ios ? 'ios' : Constants.platform?.android ? 'android' : 'unknown',
    };

    await setDoc(doc(db, 'users', userId), payload, { merge: true });
    try {
      await setDoc(doc(db, 'coachemAthletes', userId), payload, { merge: true });
    } catch {
      // Usuários que não são atletas podem não ter doc em coachemAthletes.
    }
    return token;
  } catch (error) {
    console.warn('Falha ao registrar Expo Push Token:', error);
    return null;
  }
}
