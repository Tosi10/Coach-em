import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';
import { Text, View } from 'react-native';

type BetaBadgeVariant = 'pill' | 'card';

type BetaBadgeProps = {
  label?: string;
  subtitle?: string;
  variant?: BetaBadgeVariant;
};

export function BetaBadge({
  label = 'BETA',
  subtitle = 'Versão em validação final antes do lançamento oficial.',
  variant = 'pill',
}: BetaBadgeProps) {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const baseBg = theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.14)';
  const cardBg = theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.12)' : 'rgba(251, 146, 60, 0.08)';

  if (variant === 'card') {
    return (
      <View
        className="rounded-xl py-3 px-4"
        style={{
          backgroundColor: cardBg,
          borderWidth: 1,
          borderColor: 'rgba(251, 146, 60, 0.35)',
        }}
      >
        <Text className="text-xs text-center font-semibold" style={{ color: theme.colors.primary }}>
          Treina+ {label}
        </Text>
        <Text className="text-[11px] text-center mt-1" style={themeStyles.textTertiary}>
          {subtitle}
        </Text>
      </View>
    );
  }

  return (
    <View className="items-center">
      <View
        className="rounded-full px-3 py-1"
        style={{
          backgroundColor: baseBg,
          borderWidth: 1,
          borderColor: 'rgba(251, 146, 60, 0.55)',
        }}
      >
        <Text className="text-[11px] font-semibold tracking-wider" style={{ color: theme.colors.primary }}>
          {label}
        </Text>
      </View>
      {subtitle ? (
        <Text className="text-xs mt-1 text-center" style={themeStyles.textTertiary}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
