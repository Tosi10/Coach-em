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
  await N.setNotificationChannelAsync('interval_protocol', {
    name: 'Timer intervalado',
    description: 'Alertas de troca de fase com tela bloqueada',
    importance: N.AndroidImportance.HIGH,
    vibrationPattern: [0, 280, 120, 280, 120, 280],
    lightColor: '#fb923c',
  });
}

/** Fases do protocolo (nome + duração em segundos) para agendar notificações. */
export type IntervalProtocolPhaseForNotif = { id?: string; name: string; duration: number };

let intervalProtocolPhaseNotifIds: string[] = [];
let isSyncingAthleteReminders = false;

const MAX_INTERVAL_PHASE_NOTIFICATIONS = 48;

/** Cancela lembretes de troca de fase do intervalado (ex.: app voltou ao primeiro plano ou pausou). */
export async function cancelAllIntervalProtocolPhaseNotifications(): Promise<void> {
  const N = await loadNotifications();
  if (!N) {
    intervalProtocolPhaseNotifIds = [];
    return;
  }
  for (const id of intervalProtocolPhaseNotifIds) {
    try {
      await N.cancelScheduledNotificationAsync(id);
    } catch {
      // ignore
    }
  }
  intervalProtocolPhaseNotifIds = [];
}

/**
 * Agenda uma notificação por troca de fase com horário absoluto.
 * Necessário com tela bloqueada: o JS do app para, mas o SO ainda dispara a notificação (som + vibração).
 */
export async function scheduleIntervalProtocolPhaseChain(params: {
  sequence: IntervalProtocolPhaseForNotif[];
  startPhaseIndex: number;
  firstPhaseEndMs: number;
}): Promise<void> {
  const N = await loadNotifications();
  if (!N) return;

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await ensureHandler();
  await setupNotificationChannel();

  await cancelAllIntervalProtocolPhaseNotifications();

  const { sequence, startPhaseIndex, firstPhaseEndMs } = params;
  if (!sequence.length || startPhaseIndex >= sequence.length) return;

  let endMs = firstPhaseEndMs;
  let scheduled = 0;
  const now = Date.now();

  for (let idx = startPhaseIndex; idx < sequence.length && scheduled < MAX_INTERVAL_PHASE_NOTIFICATIONS; idx++) {
    const next = idx + 1 < sequence.length ? sequence[idx + 1] : null;

    if (endMs > now + 300) {
      try {
        const nextPhaseName = next?.name?.trim();
        const isLastPhase = !next;
        const id = await N.scheduleNotificationAsync({
          content: {
            title: isLastPhase ? "Coach'em · Protocolo concluído" : "Coach'em · Troca de fase",
            body: isLastPhase
              ? 'Parabéns! Você concluiu o protocolo.'
              : `Próxima fase: ${nextPhaseName || 'Fase seguinte'}`,
            sound: true,
          },
          trigger: {
            type: N.SchedulableTriggerInputTypes.DATE,
            date: new Date(endMs),
            channelId: 'interval_protocol',
          },
        });
        if (id) intervalProtocolPhaseNotifIds.push(id);
        scheduled += 1;
      } catch (e) {
        console.warn('scheduleIntervalProtocolPhaseChain:', e);
        break;
      }
    }

    if (!next) break;
    endMs += Math.max(1, Number(next.duration) || 0) * 1000;
  }
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
    // Remove agendamentos antigos do mesmo treino/data para evitar duplicidade
    // quando dois fluxos chamam o sync quase ao mesmo tempo.
    const existing = await N.getAllScheduledNotificationsAsync();
    const getTriggerTimeMs = (item: any): number | null => {
      const value = item?.trigger?.value?.date ?? item?.trigger?.date ?? null;
      if (!value) return null;
      const ms = new Date(value).getTime();
      return Number.isFinite(ms) ? ms : null;
    };
    const thirtyMinBefore = new Date(workoutAt.getTime() - 30 * 60 * 1000);
    const thirtyMinBeforeMs = thirtyMinBefore.getTime();
    const workoutAtMs = workoutAt.getTime();
    const approxSameTime = (a: number | null, b: number): boolean => {
      if (!a) return false;
      return Math.abs(a - b) <= 60_000;
    };

    const duplicateCandidates = existing.filter((item) => {
      const data = (item.content?.data || {}) as Record<string, unknown>;
      const title = String(item.content?.title || '');
      const triggerMs = getTriggerTimeMs(item);
      const isLegacyAthleteReminder =
        (title.includes('Treino em 30 min') && approxSameTime(triggerMs, thirtyMinBeforeMs)) ||
        (title.includes('Hora do treino') && approxSameTime(triggerMs, workoutAtMs));
      return (
        (
          data?.type === 'athlete_workout_reminder' &&
          data?.workoutId === workoutId &&
          data?.dateStr === dateStr &&
          data?.timeStr === timeStr
        ) ||
        isLegacyAthleteReminder
      );
    });
    for (const item of duplicateCandidates) {
      try {
        await N.cancelScheduledNotificationAsync(item.identifier);
      } catch {
        // ignore
      }
    }

    if (thirtyMinBefore.getTime() > Date.now()) {
      const id = await N.scheduleNotificationAsync({
        content: {
          title: 'Treino em 30 min 💪',
          body: `"${workoutName}" às ${timeStr}. Prepare-se!`,
          sound: 'default',
          data: {
            type: 'athlete_workout_reminder',
            reminderKind: 'before_30m',
            workoutId,
            dateStr,
            timeStr,
          },
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
        data: {
          type: 'athlete_workout_reminder',
          reminderKind: 'at_time',
          workoutId,
          dateStr,
          timeStr,
        },
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
  if (isSyncingAthleteReminders) return;
  isSyncingAthleteReminders = true;

  try {
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
  } finally {
    isSyncingAthleteReminders = false;
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
