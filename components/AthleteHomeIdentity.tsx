/**
 * Identidade do atleta na Home — avatar, logo e saudação.
 */

import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

const AVATAR_SIZE = 80;
const LOGO_WIDTH = Platform.OS === 'ios' ? 200 : 210;
const LOGO_HEIGHT = Platform.OS === 'ios' ? 80 : 84;

export function AthleteHomeIdentity() {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const router = useRouter();

  if (!user) return null;

  const photo = user.photoURL;
  const name = user.displayName || user.email || t('common.athlete');
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  const goToProfile = () => router.push('/(tabs)/profile');

  return (
    <View>
      <View className="flex-row items-start justify-between">
        <TouchableOpacity
          onPress={goToProfile}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('tabs.profile')}
        >
          <View
            className="rounded-full border overflow-hidden items-center justify-center"
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              backgroundColor:
                theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.12)',
              borderColor: theme.colors.primary + '50',
            }}
          >
            {photo ? (
              <Image
                source={{ uri: photo }}
                style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
                resizeMode="cover"
              />
            ) : (
              <Text className="font-bold text-3xl" style={{ color: theme.colors.primary }}>
                {initial}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <Image
          source={require('../assets/images/Coach-emNovo03.png')}
          style={{
            width: LOGO_WIDTH,
            height: LOGO_HEIGHT,
            marginTop: -4,
          }}
          resizeMode="contain"
        />
      </View>

      <TouchableOpacity
        onPress={goToProfile}
        activeOpacity={0.85}
        className="mt-3"
        accessibilityRole="button"
        accessibilityLabel={t('tabs.profile')}
      >
        <Text className="text-3xl font-bold" style={themeStyles.text}>
          {name}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
