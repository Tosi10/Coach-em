/**
 * Botão de ação no perfil do atleta (visão treinador) — ícone FontAwesome, sem emojis.
 */

import { useTheme } from '@/src/contexts/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ComponentProps } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Tone = 'primary' | 'warning' | 'danger';

type Props = {
  icon: ComponentProps<typeof FontAwesome>['name'];
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: Tone;
  className?: string;
};

export function CoachAthleteActionButton({
  icon,
  label,
  onPress,
  disabled = false,
  tone = 'primary',
  className = 'mt-3',
}: Props) {
  const { theme } = useTheme();

  const palette: Record<Tone, { bg: string; border: string; color: string }> = {
    primary: {
      bg: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.14)' : 'rgba(251, 146, 60, 0.1)',
      border: `${theme.colors.primary}66`,
      color: theme.colors.primary,
    },
    warning: {
      bg: theme.mode === 'dark' ? 'rgba(245, 158, 11, 0.14)' : 'rgba(245, 158, 11, 0.1)',
      border: '#f59e0b66',
      color: '#f59e0b',
    },
    danger: {
      bg: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.14)' : 'rgba(239, 68, 68, 0.08)',
      border: '#ef444466',
      color: '#ef4444',
    },
  };

  const p = palette[tone];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      className={`rounded-xl py-3.5 px-5 border ${className}`}
      style={{
        backgroundColor: p.bg,
        borderColor: p.border,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <View className="flex-row items-center justify-center">
        <View
          className="w-9 h-9 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${p.color}22` }}
        >
          <FontAwesome name={icon} size={16} color={p.color} />
        </View>
        <Text className="font-semibold text-base" style={{ color: p.color }}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
