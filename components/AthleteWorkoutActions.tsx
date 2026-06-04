/**
 * Botões da aba Treinos (atleta) — mesmo estilo premium do treinador (Início).
 */

import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { UserType } from '@/src/types';
import { isCoachedAthlete } from '@/src/types/athleteMode';
import { canManageOwnTraining, isAthletePro } from '@/src/utils/athleteCapabilities';
import { getThemeStyles } from '@/src/utils/themeStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  athleteUid: string;
};

export function AthleteWorkoutActions({ athleteUid }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const { user } = useAuthContext();

  if (!canManageOwnTraining(user)) {
    if (user?.userType === UserType.ATHLETE && isCoachedAthlete(user) && !isAthletePro(user)) {
      return (
        <View
          className="mb-6 rounded-xl p-4 border"
          style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}
        >
          <Text className="text-sm" style={themeStyles.textSecondary}>
            {t('tabTwo.coachedFreeHint')}
          </Text>
        </View>
      );
    }
    return null;
  }

  const cardShadow = {
    shadowColor: '#fb923c',
    shadowOffset: { width: 0, height: 2 } as const,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: Platform.OS === 'android' ? 0 : 5,
  };

  const gradientColors =
    theme.mode === 'dark'
      ? (['rgba(251,146,60,0.24)', 'rgba(251,146,60,0.12)'] as const)
      : (['rgba(251,146,60,0.18)', 'rgba(251,146,60,0.08)'] as const);

  const libraryCard = (onPress: () => void, imageSource: number, title: string, imageH: number) => (
    <TouchableOpacity
      className="rounded-xl flex-1"
      style={{ ...cardShadow, overflow: 'visible', borderWidth: 0 }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'rgba(251, 146, 60, 0.65)',
          overflow: 'hidden',
          minHeight: 200,
          paddingVertical: 16,
          paddingHorizontal: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image source={imageSource} style={{ width: 112, height: imageH, marginBottom: 10 }} resizeMode="contain" />
        <Text
          className="font-bold text-center text-sm tracking-tight"
          style={themeStyles.text}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.86}
        >
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View className="mb-6">
      {!isAthletePro(user) && (
        <Text className="text-xs mb-3" style={themeStyles.textSecondary}>
          {t('tabTwo.soloFreeLimitsHint')}
        </Text>
      )}

      <View className="flex-row gap-3 mb-3">
        {libraryCard(
          () => router.push('/exercises-library'),
          require('../assets/images/BibliotecaDeExercicios2.png'),
          t('exercisesLibrary.title'),
          82
        )}
        {libraryCard(
          () => router.push('/workouts-library'),
          require('../assets/images/MeusTreinos2.png'),
          t('workoutsLibrary.title'),
          80
        )}
      </View>

      <TouchableOpacity
        className="rounded-2xl py-4 px-6 border"
        style={{
          backgroundColor:
            theme.mode === 'dark' ? 'rgba(249, 115, 22, 0.34)' : 'rgba(251, 146, 60, 0.18)',
          borderColor: theme.colors.primary + '85',
          borderWidth: 1.4,
        }}
        activeOpacity={0.7}
        onPress={() =>
          router.push({ pathname: '/assign-workout', params: { athleteId: athleteUid } })
        }
      >
        <View className="flex-row items-center justify-center">
          <Image
            source={require('../assets/images/Sinal+.png')}
            style={{ width: 26, height: 26, marginRight: 10 }}
            resizeMode="contain"
          />
          <Text className="font-bold text-center text-lg" style={{ color: theme.colors.primary }}>
            {t('assignWorkout.titleH1')}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
