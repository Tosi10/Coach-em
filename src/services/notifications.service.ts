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
