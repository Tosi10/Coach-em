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
        className="bg-dark-900 rounded-xl p-4 mb-3 border border-dark-700"
        style={{
          shadowColor: '#fb923c',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 4,
        }}
        onPress={onPress}
        >
            <Text className="text-lg font-semibold text-white mb-1">
                {name}
            </Text>
            <Text className="text-neutral-400 text-sm mb-2">
                {description}
            </Text>
            <View className="flex-row gap-4">
                <Text className="text-neutral-500 text-xs">
                    {exercisesCount} exercícios
                </Text>
                <Text className="text-neutral-500 text-xs">
                    Criado em: {createdAt}
                </Text>
            </View>
        </TouchableOpacity>
    )
}