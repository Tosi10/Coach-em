/**
 * WorkoutCard Component
 * 
 * Componente reutilizável para exibir um card de treino na lista.
 * Usado tanto na biblioteca de treinos (treinador) quanto na lista de treinos (atleta).
 */

import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';

interface WorkoutCardProps {
    name: string;
    description?: string;
    exercisesCount: number;
    createdAt: string;
    onPress: () => void;
}

export function WorkoutCard({
    name,
    description,
    exercisesCount,
    createdAt,
    onPress,
}: WorkoutCardProps) {
    const { theme } = useTheme();
    const themeStyles = getThemeStyles(theme.colors);

    // Formatar data para exibição
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            });
        } catch {
            return dateString;
        }
    };

    return (
        <TouchableOpacity
        className="rounded-xl p-4 mb-3 border"
        style={{
          ...themeStyles.card,
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 4,
        }}
        onPress={onPress}
        activeOpacity={0.7}
        >
            <Text className="text-lg font-semibold mb-1" style={themeStyles.text}>
                {name}
            </Text>
            {description && (
                <Text className="text-sm mb-3" style={themeStyles.textSecondary}>
                    {description}
                </Text>
            )}
            <View className="flex-row gap-4 flex-wrap items-center">
                <View className="flex-row items-center">
                    <Text className="text-xs font-semibold mr-1" style={{ color: theme.colors.primary }}>
                        💪
                    </Text>
                    <Text className="text-xs" style={themeStyles.textTertiary}>
                        {exercisesCount} {exercisesCount === 1 ? 'exercício' : 'exercícios'}
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <Text className="text-xs font-semibold mr-1" style={{ color: theme.colors.primary }}>
                        📅
                    </Text>
                    <Text className="text-xs" style={themeStyles.textTertiary}>
                        {formatDate(createdAt)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}