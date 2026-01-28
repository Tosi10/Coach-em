import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { ToastProvider } from '@/components/ToastProvider';
import { useColorScheme } from '@/components/useColorScheme';

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

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  // Custom dark theme matching Zeus app style
  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: '#fb923c', // Orange accent
      background: '#0a0a0a', // Almost black
      card: '#171717', // Dark gray for cards
      text: '#fff', // White text
      border: '#262626', // Dark border
      notification: '#fb923c', // Orange for notifications
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
    // Manter fundo escuro durante transições
    contentStyle: {
      backgroundColor: '#0a0a0a', // Almost black - mesmo do tema
    },
    cardStyle: {
      backgroundColor: '#0a0a0a', // Garantir que o card também seja escuro
    },
  };

  return (
    <ThemeProvider value={customDarkTheme}>
      <ToastProvider>
        <StatusBar style="light" backgroundColor="#0a0a0a" />
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
            cardStyle: {
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
            cardStyle: {
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
            cardStyle: {
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
            cardStyle: {
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
            cardStyle: {
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
            cardStyle: {
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
            cardStyle: {
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
            cardStyle: {
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
            cardStyle: {
              backgroundColor: '#0a0a0a',
            },
          }} 
        />
        </Stack>
      </ToastProvider>
    </ThemeProvider>
  );
}
