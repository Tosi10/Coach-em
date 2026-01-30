/**
 * WorkoutCard Component
 *
 * Componente reutilizável para exibir um card de treino na lista.
 * Usado tanto na biblioteca de treinos (treinador) quanto na lista de treinos (atleta).
 * Opcional: onDuplicate exibe um ícone compacto de duplicar no canto do card.
 */

import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, TouchableOpacity, View } from 'react-native';

interface WorkoutCardProps {
    name: string;
    description: string;
    exercisesCount: number;
    createdAt: string;
    onPress: () => void;
    /** Se informado, mostra ícone de duplicar no canto (biblioteca do treinador) */
    onDuplicate?: () => void;
}

export function WorkoutCard({
    name,
    description,
    exercisesCount,
    createdAt,
    onPress,
    onDuplicate,
}: WorkoutCardProps) {
    const { theme } = useTheme();
    const themeStyles = getThemeStyles(theme.colors);

    return (
        <View className="rounded-xl mb-3 border overflow-hidden" style={{
            ...themeStyles.card,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
        }}>
            <TouchableOpacity
                className="p-4 flex-1"
                onPress={onPress}
                activeOpacity={0.7}
                style={{ paddingRight: onDuplicate ? 48 : 16 }}
            >
                <Text className="text-lg font-semibold mb-1" style={themeStyles.text}>
                    {name}
                </Text>
                <Text className="text-sm mb-2" style={themeStyles.textSecondary}>
                    {description}
                </Text>
                <View className="flex-row gap-4">
                    <Text className="text-xs" style={themeStyles.textTertiary}>
                        {exercisesCount} exercícios
                    </Text>
                    <Text className="text-xs" style={themeStyles.textTertiary}>
                        Criado em: {createdAt}
                    </Text>
                </View>
            </TouchableOpacity>

            {onDuplicate && (
                <TouchableOpacity
                    onPress={onDuplicate}
                    activeOpacity={0.7}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full items-center justify-center"
                    style={{
                        backgroundColor: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.15)',
                        borderWidth: 1,
                        borderColor: theme.colors.primary + '50',
                    }}
                >
                    <FontAwesome name="copy" size={18} color={theme.colors.primary} />
                </TouchableOpacity>
            )}
        </View>
    );
}