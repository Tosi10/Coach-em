import Constants from 'expo-constants';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';

export type AndroidNavigationBarStyle = 'light' | 'dark';

/** Aplica cor da barra de navegação Android (ignora Expo Go). */
export async function applyAndroidNavigationBar(options: {
  backgroundColor: string;
  buttonStyle: AndroidNavigationBarStyle;
}): Promise<void> {
  if (Platform.OS !== 'android' || Constants.appOwnership === 'expo') return;

  try {
    await NavigationBar.setBackgroundColorAsync(options.backgroundColor);
    await NavigationBar.setButtonStyleAsync(options.buttonStyle);
    await NavigationBar.setVisibilityAsync('visible');
  } catch {
    // no-op — alguns dispositivos/modais podem falhar silenciosamente
  }
}
