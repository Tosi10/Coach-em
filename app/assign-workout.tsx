import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Dados mockados de atletas (temporário - depois virá do Firebase)
const mockAthletes = [
    { id: '1', name: 'João Silva', sport: 'Futebol', status: 'Ativo' },
    { id: '2', name: 'Maria Oliveira', sport: 'Vôlei', status: 'Ativo' },
    { id: '3', name: 'Pedro Santos', sport: 'Basquete', status: 'Ativo' },
    { id: '4', name: 'Ana Souza', sport: 'Atletismo', status: 'Ativo' },
    { id: '5', name: 'Carlos Ferreira', sport: 'Futebol', status: 'Ativo' },
    { id: '6', name: 'Laura Rodrigues', sport: 'Vôlei', status: 'Ativo' },
    { id: '7', name: 'Rafael Oliveira', sport: 'Basquete', status: 'Ativo' },
    { id: '8', name: 'Camila Silva', sport: 'Atletismo', status: 'Ativo' },
  ];
  
  // Dados mockados de treinos (simplificados - depois virá da biblioteca)
  const mockWorkouts = [
    { id: '1', name: 'Treino de Força - Pernas', description: 'Treino completo para desenvolvimento de força nas pernas' },
    { id: '2', name: 'Treino de Força - Peito', description: 'Treino completo para desenvolvimento de força no peito' },
  ];
  
  export default function AssignWorkoutScreen() {
    const router = useRouter();
    const { athleteId } = useLocalSearchParams<{ athleteId: string }>();
  
    // Estado para armazenar qual treino foi selecionado
    const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
    
    // Estado para armazenar a data escolhida (formato: YYYY-MM-DD)
    const [selectedDate, setSelectedDate] = useState<string>(
      new Date().toISOString().split('T')[0] // Data de hoje como padrão
    );
  
    // Encontrar o atleta pelo ID recebido
    const athlete = mockAthletes.find(a => a.id === athleteId);

    const handleAssignWorkout = () => {
        if (!selectedWorkoutId) {
            Alert.alert('Erro', 'Por favor, selecione um treino.');
            return;
        }

        const workout = mockWorkouts.find(w => w.id === selectedWorkoutId);

        if(!workout) {
            Alert.alert('Erro', 'Treino não encontrado.');
            return;
        }

        Alert.alert(
            'Treino Atribuído',
            `Treino "${workout.name}" atribuído para ${athlete?.name} em ${selectedDate}`,
            [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                }
            ]
        );
    };

    // Se o atleta não foi encontrado, mostra mensagem de erro
    if (!athlete) {
        return (
            <View className="flex-1 bg-white justify-center items-center px-6">
                <Text className="text-xl font-bold text-neutral-900 mb-4">
                    Atleta não encontrado
                </Text>
                <TouchableOpacity
                    className="bg-primary-600 rounded-lg py-3 px-6"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-semibold">
                        Voltar
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
            <ScrollView className="flex-1 bg-white">
                <View className="px-6 pt-12 pb-20">
                    <TouchableOpacity 
                        className="mb-6"
                        onPress={() => router.back()}
                    >
                        <Text className="text-primary-600 font-semibold text-lg">
                            ← Voltar
                        </Text>
                    </TouchableOpacity>

                    <Text className="text-3xl font-bold text-neutral-900 mb-2">
                        Atribuir Treino
                    </Text>
                    <Text className="text-neutral-600 mb-6">
                        Escolha um treino e a data para {athlete.name}
                    </Text>

                    <View className="bg-primary-50 rounded-lg p-4 mb-6 border border-primary-200">
                        <Text className="text-lg font-semibold text-neutral-900 mb-1">
                            {athlete.name}
                        </Text>
                        <Text className="text-neutral-600">
                            {athlete.sport} • {athlete.status}
                        </Text>
                    </View>

                    <View className="mb-6">
                        <Text className="text-xl font-bold text-neutral-900 mb-4">
                            Selecionar Treino *
                        </Text>

                        {mockWorkouts.map((workout) => (
                            <TouchableOpacity
                            key={workout.id}
                            className={`bg-neutral-50 rounded-lg p-4 mb-3 border-2 ${
                                selectedWorkoutId === workout.id
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-neutral-200'
                            }`}
                            onPress={() => setSelectedWorkoutId(workout.id)}
                            >
                                <Text className="text-lg font-semibold text-neutral-900 mb-1">
                                    {workout.name}
                                </Text>
                                <Text className="text-neutral-600 text-sm">
                                    {workout.description}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View className="mb-6">
                        <Text className="text-xl font-bold text-neutral-900 mb-4">
                            Data do Treino *
                        </Text>
                        <TextInput
                            className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900"
                            placeholder="YYYY-MM-DD"
                            value={selectedDate}
                            onChangeText={setSelectedDate}
                        />
                        <Text className="text-neutral-500 text-xs mt-2">
                            Formato: YYYY-MM-DD (ex: 2026-01-15)
                        </Text>
                    </View>

                    {/* Botão de Atribuir */}
                    <TouchableOpacity
                        className="bg-primary-600 rounded-lg py-4 px-6 mt-6"
                        onPress={handleAssignWorkout}
                    >
                        <Text className="text-white font-semibold text-center text-lg">
                            ✅ Atribuir Treino
                        </Text>
                    </TouchableOpacity>

                </View>

            </ScrollView>
    );
}