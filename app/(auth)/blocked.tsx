import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';

export default function BlockedAccountScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center px-6" style={themeStyles.bg}>
      <View
        className="w-full rounded-2xl p-6 border"
        style={{
          ...themeStyles.card,
          borderColor: theme.colors.border,
        }}
      >
        <View className="items-center mb-4">
          <View
            className="w-14 h-14 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.18)' }}
          >
            <FontAwesome name="lock" size={22} color="#ef4444" />
          </View>
          <Text className="text-xl font-bold text-center" style={themeStyles.text}>
            {t('blocked.title')}
          </Text>
        </View>

        <Text className="text-center text-sm leading-6 mb-6" style={themeStyles.textSecondary}>
          {t('blocked.body')}
        </Text>

        <TouchableOpacity
          className="rounded-xl py-3.5 border"
          style={{ borderColor: theme.colors.primary + '70' }}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text className="text-center font-semibold" style={{ color: theme.colors.primary }}>
            {t('blocked.backToLogin')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

