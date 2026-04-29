import { Sentry } from '@/src/instrumentation/sentry';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { DarkTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import '../global.css';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppVideoPlayer } from '@/components/AppVideoPlayer';
import { ToastProvider } from '@/components/ToastProvider';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/src/contexts/ThemeContext';
import Constants from 'expo-constants';
import { auth } from '@/src/services/firebase.config';

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

/** Nome do ficheiro + módulo — usado no preload e no log de falhas. */
const CRITICAL_IMAGES: { name: string; asset: number }[] = [
  { name: 'HouseLaranja2.png', asset: require('../assets/images/HouseLaranja2.png') },
  { name: 'HouseCinza2.png', asset: require('../assets/images/HouseCinza2.png') },
  { name: 'TreinoLaranja2.png', asset: require('../assets/images/TreinoLaranja2.png') },
  { name: 'TreinoCinza2.png', asset: require('../assets/images/TreinoCinza2.png') },
  { name: 'PerfilLaranja2.png', asset: require('../assets/images/PerfilLaranja2.png') },
  { name: 'PerfilCinza2.png', asset: require('../assets/images/PerfilCinza2.png') },
  { name: 'AtletasLaranja2.png', asset: require('../assets/images/AtletasLaranja2.png') },
  { name: 'AtletasCinza2.png', asset: require('../assets/images/AtletasCinza2.png') },
  { name: 'Coach-emNovo.png', asset: require('../assets/images/Coach-emNovo.png') },
  { name: 'PanoramaSemanal2.png', asset: require('../assets/images/PanoramaSemanal2.png') },
  { name: 'AtivosHoje2.png', asset: require('../assets/images/AtivosHoje2.png') },
  { name: 'IconeWorkoutComplete2.png', asset: require('../assets/images/IconeWorkoutComplete2.png') },
  { name: 'Pendentes2.png', asset: require('../assets/images/Pendentes2.png') },
  { name: 'BibliotecaDeExercicios2.png', asset: require('../assets/images/BibliotecaDeExercicios2.png') },
  { name: 'MeusTreinos2.png', asset: require('../assets/images/MeusTreinos2.png') },
  { name: 'IconeTaxadeaderencia2.png', asset: require('../assets/images/IconeTaxadeaderencia2.png') },
  { name: 'iconetreinosmaisdificeis2.png', asset: require('../assets/images/iconetreinosmaisdificeis2.png') },
  { name: 'atletasmaisativos2.png', asset: require('../assets/images/atletasmaisativos2.png') },
  { name: 'IconeEstaSemanaAtleta2.png', asset: require('../assets/images/IconeEstaSemanaAtleta2.png') },
  { name: 'Sequencia2.png', asset: require('../assets/images/Sequencia2.png') },
  { name: 'Coracao.png', asset: require('../assets/images/Coracao.png') },
];

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const [assetsReady, setAssetsReady] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    let cancelled = false;
    const preloadCriticalAssets = async () => {
      if (!loaded) return;
      try {
        // Sequencial + 1 retry: em dev o Metro serve por HTTP; 21 pedidos em paralelo saturava e falhava
        // na maior parte das imagens. Um a um replica melhor o comportamento estável do lote único.
        const failedNames: string[] = [];
        const loadWithRetry = async (asset: number): Promise<boolean> => {
          try {
            await Asset.loadAsync(asset);
            return true;
          } catch {
            await new Promise<void>((r) => setTimeout(r, 120));
            try {
              await Asset.loadAsync(asset);
              return true;
            } catch {
              return false;
            }
          }
        };
        for (const { name, asset } of CRITICAL_IMAGES) {
          if (cancelled) break;
          const ok = await loadWithRetry(asset);
          if (!ok) failedNames.push(name);
        }
        if (failedNames.length > 0) {
          console.warn(
            `Pré-carregamento: ${failedNames.length}/${CRITICAL_IMAGES.length} falharam após retry: ${failedNames.join(', ')}`
          );
        }
      } catch (assetError) {
        console.warn('Falha ao pré-carregar imagens críticas:', assetError);
      } finally {
        if (!cancelled) {
          setAssetsReady(true);
        }
      }
    };
    preloadCriticalAssets();
    return () => {
      cancelled = true;
    };
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    SplashScreen.hideAsync().catch(() => {
      // no-op
    });
  }, [loaded]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (loaded && assetsReady) {
      timer = setTimeout(() => {
        setIntroVisible(false);
      }, 6000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loaded, assetsReady]);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') return;
      // expo-notifications não é suportado no Expo Go (SDK 53+). Só carrega em development build.
      if (Constants.appOwnership === 'expo') return;
      try {
        const {
          setupNotificationChannel,
          requestNotificationPermissions,
          syncAthleteWorkoutReminders,
          syncUserExpoPushToken,
        } = await import('@/src/services/notifications.service');
        await setupNotificationChannel();
        await requestNotificationPermissions();

        const savedType = await AsyncStorage.getItem('userType');
        const athleteId = await AsyncStorage.getItem('currentAthleteId');
        const authUid = auth.currentUser?.uid;
        const tokenUserId = savedType === 'ATHLETE' ? (athleteId || authUid) : authUid;
        if (tokenUserId) {
          await syncUserExpoPushToken(tokenUserId);
        }

        if (savedType === 'ATHLETE' && athleteId) {
          await syncAthleteWorkoutReminders(athleteId, 'workouts');
        }
      } catch (e) {
        console.warn('Notificações não disponíveis (use um development build):', e);
      }
    })();
  }, []);

  if (!loaded || !assetsReady || introVisible) {
    return (
      <View style={styles.introContainer}>
        <AppVideoPlayer
          source={require('../assets/videos/Coach-emVideo.mp4')}
          shouldPlay
          isLooping
          isMuted
          nativeControls={false}
          contentFit="contain"
          surfaceType="textureView"
          style={styles.introVideo}
        />
        <View pointerEvents="none" style={styles.introWatermarkMask} />
      </View>
    );
  }

  return <RootLayoutNav />;
}

const styles = StyleSheet.create({
  introContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introVideo: {
    width: '100%',
    height: '100%',
  },
  introWatermarkMask: {
    position: 'absolute',
    right: -4,
    top: '54%',
    width: 140,
    height: 120,
    backgroundColor: '#000000',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
});

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
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="athlete-legal-acceptance"
          options={{
            headerShown: false,
            gestureEnabled: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="select-user-type" options={{ headerShown: false }} />
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
          name="coach-calendar" 
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
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNavContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
