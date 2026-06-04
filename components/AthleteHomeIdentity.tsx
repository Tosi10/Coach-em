/**
 * Topo da Home do atleta — foto + nome (roadmap §7.2).
 */

import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

export function AthleteHomeIdentity() {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const router = useRouter();

  if (!user) return null;

  const photo = user.photoURL;
  const name = user.displayName || user.email || t('common.athlete');

  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/profile')}
      activeOpacity={0.85}
      className="mb-6 flex-row items-center rounded-2xl p-4 border"
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border,
        marginTop: 12,
      }}
    >
      <View
        className="w-14 h-14 rounded-full items-center justify-center overflow-hidden mr-4"
        style={{ backgroundColor: theme.colors.border }}
      >
        {photo ? (
          <Image source={{ uri: photo }} className="w-14 h-14" resizeMode="cover" />
        ) : (
          <FontAwesome name="user" size={28} color={theme.colors.textTertiary} />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold" style={themeStyles.text} numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-xs mt-0.5" style={themeStyles.textSecondary}>
          {t('home.tapProfileHint')}
        </Text>
      </View>
      <FontAwesome name="chevron-right" size={14} color={theme.colors.textTertiary} />
    </TouchableOpacity>
  );
}
