import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { ToastProvider } from '@/components/ToastProvider';
import { ThemeProvider, useTheme } from '@/src/contexts/ThemeContext';
import Constants from 'expo-constants';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'select-user-type',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') return;
      // expo-notifications não é suportado no Expo Go (SDK 53+). Só carrega em development build.
      if (Constants.appOwnership === 'expo') return;
      try {
        const { setupNotificationChannel, requestNotificationPermissions } = await import('@/src/services/notifications.service');
        await setupNotificationChannel();
        await requestNotificationPermissions();
      } catch (e) {
        console.warn('Notificações não disponíveis (use um development build):', e);
      }
    })();
  }, []);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNavContent() {
  const { theme } = useTheme();
  
  // Configurar barra de navegação do sistema Android para escuro
  // NOTA: setBackgroundColorAsync não funciona com edgeToEdgeEnabled=true no app.json
  // A configuração da barra é feita via app.json (navigationBar)
  useEffect(() => {
    if (Platform.OS === 'android') {
      const configureNavigationBar = async () => {
        try {
          // Configurar cor dos ícones da barra (claro no modo escuro, escuro no modo claro)
          await NavigationBar.setButtonStyleAsync(theme.mode === 'dark' ? 'light' : 'dark');
          // Garantir que a barra seja sempre visível
          await NavigationBar.setVisibilityAsync('visible');
          // NOTA: setBackgroundColorAsync não é suportado com edgeToEdgeEnabled
          // A cor de fundo é configurada via app.json > android > navigationBar > backgroundColor
        } catch (error) {
          console.error('Erro ao configurar barra de navegação:', error);
        }
      };
      configureNavigationBar();
    }
  }, [theme.mode]);
  
  // Custom theme para React Navigation baseado no tema atual
  const navigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.primary,
    },
  };

  // Configuração de animações suaves para transições
  const screenOptions = {
    headerShown: false,
    animation: Platform.select({
      ios: 'default' as const,
      android: 'fade_from_bottom' as const,
      default: 'default' as const,
    }),
    animationDuration: 300,
    gestureEnabled: true,
    gestureDirection: 'horizontal' as const,
    // Manter fundo durante transições baseado no tema
    contentStyle: {
      backgroundColor: theme.colors.background,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <ToastProvider>
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} backgroundColor={theme.colors.background} />
        <Stack screenOptions={screenOptions}>
        <Stack.Screen name="select-user-type" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="workout-details" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right' as const,
            contentStyle: {
              backgroundColor: '#0a0a0a',
            },
          }} 
        />
        <Stack.Screen 
          name="workout-template-details" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right' as const,
            contentStyle: {
              backgroundColor: '#0a0a0a',
            },
          }} 
        />
        <Stack.Screen 
          name="create-workout" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_bottom' as const,
            contentStyle: {
              backgroundColor: '#0a0a0a',
            },
          }} 
        />
        <Stack.Screen 
          name="workouts-library" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right' as const,
            contentStyle: {
              backgroundColor: '#0a0a0a',
            },
          }} 
        />
        <Stack.Screen 
          name="exercises-library" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right' as const,
            contentStyle: {
              backgroundColor: '#0a0a0a',
            },
          }} 
        />
        <Stack.Screen 
          name="create-exercise" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_bottom' as const,
            contentStyle: {
              backgroundColor: '#0a0a0a',
            },
          }} 
        />
        <Stack.Screen 
          name="assign-workout" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_bottom' as const,
            contentStyle: {
              backgroundColor: '#0a0a0a',
            },
          }} 
        />
        <Stack.Screen 
          name="athlete-profile" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right' as const,
            contentStyle: {
              backgroundColor: '#0a0a0a',
            },
          }} 
        />
        <Stack.Screen 
          name="modal" 
          options={{ 
            presentation: 'modal',
            animation: 'fade' as const,
            animationDuration: 250,
            contentStyle: {
              backgroundColor: '#0a0a0a',
            },
          }} 
        />
        </Stack>
      </ToastProvider>
    </NavigationThemeProvider>
  );
}

function RootLayoutNav() {
  return (
    <ThemeProvider>
      <RootLayoutNavContent />
    </ThemeProvider>
  );
}
