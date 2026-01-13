/**
 * WorkoutCard Component
 * 
 * Componente reutilizável para exibir um card de treino na lista.
 * Usado tanto na biblioteca de treinos (treinador) quanto na lista de treinos (atleta).
 */

import { Text, TouchableOpacity, View } from 'react-native';

interface WorkoutCardProps {
    name: string;
    description: string;
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

    return (
        <TouchableOpacity
        className="bg-neutral-50 rounded-lg p-4 mb-3 border border-neutral-200"
        onPress={onPress}
        >
            <Text className="text-lg font-semibold text-neutral-900 mb-1">
                {name}

            </Text>
            <Text className="text-neutral-600 text-sm mb-2">
                {description}
            </Text>
            <View className="flex-row gap-4">
                <Text className="text-neutral-500 text-xs">
                    {exercisesCount} exercícios
                </Text>
                <Text className="text-neutral-500 text-xs">S
                    Criado em: {createdAt}
                </Text>

            </View>

        </TouchableOpacity>
    )
}