import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EditExerciseScreen() {
    const router = useRouter();
    const { exerciseId } = useLocalSearchParams();
    
    // Garantir que exerciseId seja sempre string (useLocalSearchParams pode retornar array)
    const exerciseIdString = Array.isArray(exerciseId) ? exerciseId[0] : exerciseId;
    
    // Estados (iguais ao create-exercise.tsx)
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
    const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
    const [equipment, setEquipment] = useState<string[]>([]);
    const [duration, setDuration] = useState('');
    const [newMuscleGroup, setNewMuscleGroup] = useState('');
    const [newEquipment, setNewEquipment] = useState('');
    const [loading, setLoading] = useState(true);

    // PARTE 1: Carregar dados do exercício quando a tela abrir
    useEffect(() => {
        const loadExercise = async () => {
            try {
                // Buscar todos os exercícios salvos
                const savedExercisesJson = await AsyncStorage.getItem('saved_exercises');
                let savedExercises = [];
                
                if (savedExercisesJson) {
                    savedExercises = JSON.parse(savedExercisesJson);
                }

                // Encontrar o exercício pelo ID
                const exercise = savedExercises.find((ex: any) => ex.id === exerciseIdString);

                if (exercise) {
                    // Preencher os campos com os dados do exercício
                    setName(exercise.name || '');
                    setDescription(exercise.description || '');
                    setDifficulty(exercise.difficulty || 'beginner');
                    setMuscleGroups(exercise.muscleGroups || []);
                    setEquipment(exercise.equipment || []);
                    setDuration(exercise.duration ? exercise.duration.toString() : '');
                } else {
                    Alert.alert('Erro', 'Exercício não encontrado.');
                    router.back();
                }
            } catch (error) {
                console.error('Erro ao carregar exercício:', error);
                Alert.alert('Erro', 'Não foi possível carregar o exercício.');
                router.back();
            } finally {
                setLoading(false);
            }
        };

        if (exerciseIdString) {
            loadExercise();
        }
    }, [exerciseIdString]);

    // PARTE 2: Função para salvar as alterações
    const handleUpdateExercise = async () => {
        // Validação (igual ao create)
        if (!name.trim()) {
            Alert.alert('Erro', 'Por favor, preencha o nome do exercício.');
            return;
        }
      
        if (!description.trim()) {
            Alert.alert('Erro', 'Por favor, preencha a descrição do exercício.');
            return;
        }
      
        if (muscleGroups.length === 0) {
            Alert.alert('Erro', 'Por favor, adicione pelo menos um grupo muscular.');
            return;
        }
      
        try {
            // Buscar todos os exercícios salvos
            const savedExercisesJson = await AsyncStorage.getItem('saved_exercises');
            let savedExercises = [];
            
            if (savedExercisesJson) {
                savedExercises = JSON.parse(savedExercisesJson);
            }

            // Encontrar o índice do exercício a ser atualizado
            const exerciseIndex = savedExercises.findIndex((ex: any) => ex.id === exerciseIdString);

            if (exerciseIndex === -1) {
                Alert.alert('Erro', 'Exercício não encontrado.');
                return;
            }

            // Criar objeto atualizado (mantém ID, createdAt, createdBy, isGlobal)
            const updatedExercise = {
                ...savedExercises[exerciseIndex], // Mantém dados originais
                name: name.trim(),
                description: description.trim(),
                difficulty: difficulty,
                muscleGroups: muscleGroups,
                equipment: equipment.length > 0 ? equipment : ['Nenhum'],
                duration: duration ? parseInt(duration) : undefined,
                updatedAt: new Date().toISOString(), // Atualiza data de modificação
            };

            // Substituir o exercício antigo pelo atualizado
            savedExercises[exerciseIndex] = updatedExercise;

            // Salvar de volta no AsyncStorage
            await AsyncStorage.setItem(
                'saved_exercises',
                JSON.stringify(savedExercises)
            );

            Alert.alert('Sucesso', 'Exercício atualizado com sucesso!');
            router.back();
        } catch (error) {
            console.error('Erro ao atualizar exercício:', error);
            Alert.alert('Erro', 'Não foi possível atualizar o exercício.');
        }
    };

    // Funções auxiliares (iguais ao create-exercise.tsx)
    const addMuscleGroup = () => {
        if (newMuscleGroup.trim() && !muscleGroups.includes(newMuscleGroup.trim())) {
            setMuscleGroups([...muscleGroups, newMuscleGroup.trim()]);
            setNewMuscleGroup('');
        }
    };

    const removeMuscleGroup = (group: string) => {
        setMuscleGroups(muscleGroups.filter(g => g !== group));
    };

    const addEquipment = () => {
        if (newEquipment.trim() && !equipment.includes(newEquipment.trim())) {
            setEquipment([...equipment, newEquipment.trim()]);
            setNewEquipment('');
        }
    };

    const removeEquipment = (item: string) => {
        setEquipment(equipment.filter(e => e !== item));
    };

    // Mostrar loading enquanto carrega
    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <Text className="text-xl font-bold text-neutral-900">
                    Carregando...
                </Text>
            </View>
        );
    }

    // PARTE 3: JSX (igual ao create-exercise.tsx, mas com título "Editar Exercício")
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
                    Editar Exercício
                </Text>
                <Text className="text-neutral-600 mb-6">
                    Atualize as informações do exercício
                </Text>

                {/* Campo Nome */}
                <View className="mb-4">
                    <Text className="text-neutral-900 font-semibold mb-2">
                        Nome do Exercício *
                    </Text>
                    <TextInput
                        className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900"
                        placeholder="Ex: Agachamento"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                {/* Campo Descrição */}
                <View className="mb-4">
                    <Text className="text-neutral-900 font-semibold mb-2">
                        Descrição *
                    </Text>
                    <TextInput
                        className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900"
                        placeholder="Descreva o exercício..."
                        multiline
                        numberOfLines={4}
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                {/* Campo Dificuldade */}
                <View className="mb-4">
                    <Text className="text-neutral-900 font-semibold mb-2">
                        Dificuldade *
                    </Text>
                    <View className="flex-row gap-3">
                        {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                            <TouchableOpacity
                                key={level}
                                className={`flex-1 py-3 rounded-lg border-2 ${
                                    difficulty === level
                                        ? 'bg-primary-600 border-primary-600'
                                        : 'bg-neutral-50 border-neutral-200'
                                }`}
                                onPress={() => setDifficulty(level)}
                            >
                                <Text
                                    className={`text-center font-semibold ${
                                        difficulty === level ? 'text-white' : 'text-neutral-700'
                                    }`}
                                >
                                    {level === 'beginner' ? 'Iniciante' : level === 'intermediate' ? 'Intermediário' : 'Avançado'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Grupos Musculares */}
                <View className="mb-4">
                    <Text className="text-neutral-900 font-semibold mb-2">
                        Grupos Musculares *
                    </Text>
                    <View className="flex-row gap-2 mb-2">
                        <TextInput
                            className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900"
                            placeholder="Ex: pernas"
                            value={newMuscleGroup}
                            onChangeText={setNewMuscleGroup}
                            onSubmitEditing={addMuscleGroup}
                        />
                        <TouchableOpacity
                            className="bg-primary-600 rounded-lg px-6 py-3"
                            onPress={addMuscleGroup}
                        >
                            <Text className="text-white font-semibold">+</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                        {muscleGroups.map((group, index) => (
                            <TouchableOpacity
                                key={index}
                                className="bg-primary-100 px-3 py-1 rounded-full flex-row items-center gap-2"
                                onPress={() => removeMuscleGroup(group)}
                            >
                                <Text className="text-primary-700">{group}</Text>
                                <Text className="text-primary-700">×</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Equipamentos */}
                <View className="mb-4">
                    <Text className="text-neutral-900 font-semibold mb-2">
                        Equipamentos
                    </Text>
                    <View className="flex-row gap-2 mb-2">
                        <TextInput
                            className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900"
                            placeholder="Ex: Barra"
                            value={newEquipment}
                            onChangeText={setNewEquipment}
                            onSubmitEditing={addEquipment}
                        />
                        <TouchableOpacity
                            className="bg-primary-600 rounded-lg px-6 py-3"
                            onPress={addEquipment}
                        >
                            <Text className="text-white font-semibold">+</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                        {equipment.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                className="bg-neutral-100 px-3 py-1 rounded-full flex-row items-center gap-2"
                                onPress={() => removeEquipment(item)}
                            >
                                <Text className="text-neutral-700">{item}</Text>
                                <Text className="text-neutral-700">×</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Duração */}
                <View className="mb-6">
                    <Text className="text-neutral-900 font-semibold mb-2">
                        Duração (segundos)
                    </Text>
                    <TextInput
                        className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900"
                        placeholder="Ex: 60"
                        keyboardType="numeric"
                        value={duration}
                        onChangeText={setDuration}
                    />
                </View>

                {/* Botão Salvar */}
                <TouchableOpacity
                    className="bg-primary-600 rounded-lg py-4 px-6"
                    onPress={handleUpdateExercise}
                >
                    <Text className="text-white font-semibold text-center text-lg">
                        💾 Salvar Alterações
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}