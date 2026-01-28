import { CustomAlert } from '@/components/CustomAlert';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EditExerciseScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const themeStyles = getThemeStyles(theme.colors);
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

    // Estados para CustomAlert
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
    const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | null>(null);

    // Função helper para mostrar alert customizado
    const showAlert = (
        title: string,
        message: string,
        type: 'success' | 'error' | 'info' | 'warning' = 'info',
        onConfirm?: () => void
    ) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertType(type);
        setAlertOnConfirm(() => onConfirm);
        setAlertVisible(true);
    };

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
                    showAlert('Erro', 'Exercício não encontrado.', 'error', () => router.back());
                }
            } catch (error) {
                console.error('Erro ao carregar exercício:', error);
                showAlert('Erro', 'Não foi possível carregar o exercício.', 'error', () => router.back());
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
            showAlert('Erro', 'Por favor, preencha o nome do exercício.', 'error');
            return;
        }
      
        if (!description.trim()) {
            showAlert('Erro', 'Por favor, preencha a descrição do exercício.', 'error');
            return;
        }
      
        if (muscleGroups.length === 0) {
            showAlert('Erro', 'Por favor, adicione pelo menos um grupo muscular.', 'error');
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
                showAlert('Erro', 'Exercício não encontrado.', 'error');
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

            showAlert('Sucesso', 'Exercício atualizado com sucesso!', 'success', () => {
                router.back();
            });
        } catch (error) {
            console.error('Erro ao atualizar exercício:', error);
            showAlert('Erro', 'Não foi possível atualizar o exercício.', 'error');
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
            <View className="flex-1 items-center justify-center" style={themeStyles.bg}>
                <Text className="text-xl font-bold" style={themeStyles.text}>
                    Carregando...
                </Text>
            </View>
        );
    }

    // PARTE 3: JSX (igual ao create-exercise.tsx, mas com título "Editar Exercício")
    return (
        <ScrollView className="flex-1 bg-dark-950">
            <View className="px-6 pt-20 pb-20">
                {/* Header com botão voltar melhorado */}
                <TouchableOpacity
                    className="mb-6 flex-row items-center"
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <View className="bg-dark-800 border border-dark-700 rounded-full w-10 h-10 items-center justify-center mr-3">
                        <FontAwesome name="arrow-left" size={18} color="#fb923c" />
                    </View>
                    <Text className="text-primary-400 font-semibold text-lg">
                        Voltar
                    </Text>
                </TouchableOpacity>

                <Text className="text-3xl font-bold text-white mb-2">
                    Editar Exercício
                </Text>
                <Text className="text-neutral-400 mb-6">
                    Atualize as informações do exercício
                </Text>

                {/* Campo Nome */}
                <View className="mb-4">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        Nome do Exercício *
                    </Text>
                    <TextInput
                        className="border rounded-lg px-4 py-3"
                        style={{
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                        placeholder="Ex: Agachamento"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                {/* Campo Descrição */}
                <View className="mb-4">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        Descrição *
                    </Text>
                    <TextInput
                        className="border rounded-lg px-4 py-3"
                        style={{
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                        placeholder="Descreva o exercício..."
                        placeholderTextColor={theme.colors.textTertiary}
                        multiline
                        numberOfLines={4}
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                {/* Campo Dificuldade */}
                <View className="mb-4">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        Dificuldade *
                    </Text>
                    <View className="flex-row gap-3">
                        {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                            <TouchableOpacity
                                key={level}
                                className="flex-1 py-3 rounded-lg border-2"
                                style={{
                                  backgroundColor: difficulty === level 
                                    ? theme.colors.primary
                                    : theme.colors.card,
                                  borderColor: difficulty === level 
                                    ? theme.colors.primary
                                    : theme.colors.border,
                                }}
                                onPress={() => setDifficulty(level)}
                            >
                                <Text
                                    className="text-center font-semibold"
                                    style={{
                                      color: difficulty === level ? '#ffffff' : theme.colors.textSecondary
                                    }}
                                >
                                    {level === 'beginner' ? 'Iniciante' : level === 'intermediate' ? 'Intermediário' : 'Avançado'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Grupos Musculares */}
                <View className="mb-4">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        Grupos Musculares *
                    </Text>
                    <View className="flex-row gap-2 mb-2">
                        <TextInput
                            className="flex-1 border rounded-lg px-4 py-3"
                            style={{
                              backgroundColor: theme.colors.card,
                              borderColor: theme.colors.border,
                              color: theme.colors.text,
                            }}
                            placeholder="Ex: pernas"
                            placeholderTextColor={theme.colors.textTertiary}
                            value={newMuscleGroup}
                            onChangeText={setNewMuscleGroup}
                            onSubmitEditing={addMuscleGroup}
                        />
                        <TouchableOpacity
                            className="rounded-lg px-6 py-3"
                            style={{ backgroundColor: theme.colors.primary }}
                            onPress={addMuscleGroup}
                        >
                            <Text className="font-semibold" style={{ color: '#ffffff' }}>+</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                        {muscleGroups.map((group, index) => (
                            <TouchableOpacity
                                key={index}
                                className="px-3 py-1 rounded-full flex-row items-center gap-2 border"
                                style={{
                                  backgroundColor: theme.mode === 'dark' 
                                    ? theme.colors.primary + '30'
                                    : theme.colors.primary + '20',
                                  borderColor: theme.colors.primary + '60',
                                }}
                                onPress={() => removeMuscleGroup(group)}
                            >
                                <Text style={{ color: theme.colors.primary }}>{group}</Text>
                                <Text style={{ color: theme.colors.primary }}>×</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Equipamentos */}
                <View className="mb-4">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        Equipamentos
                    </Text>
                    <View className="flex-row gap-2 mb-2">
                        <TextInput
                            className="flex-1 border rounded-lg px-4 py-3"
                            style={{
                              backgroundColor: theme.colors.card,
                              borderColor: theme.colors.border,
                              color: theme.colors.text,
                            }}
                            placeholder="Ex: Barra"
                            placeholderTextColor={theme.colors.textTertiary}
                            value={newEquipment}
                            onChangeText={setNewEquipment}
                            onSubmitEditing={addEquipment}
                        />
                        <TouchableOpacity
                            className="rounded-lg px-6 py-3"
                            style={{ backgroundColor: theme.colors.primary }}
                            onPress={addEquipment}
                        >
                            <Text className="font-semibold" style={{ color: '#ffffff' }}>+</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                        {equipment.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                className="px-3 py-1 rounded-full flex-row items-center gap-2 border"
                                style={themeStyles.cardSecondary}
                                onPress={() => removeEquipment(item)}
                            >
                                <Text style={themeStyles.textSecondary}>{item}</Text>
                                <Text style={themeStyles.textSecondary}>×</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Duração */}
                <View className="mb-6">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        Duração (segundos)
                    </Text>
                    <TextInput
                        className="border rounded-lg px-4 py-3"
                        style={{
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                        placeholder="Ex: 60"
                        placeholderTextColor={theme.colors.textTertiary}
                        keyboardType="numeric"
                        value={duration}
                        onChangeText={setDuration}
                    />
                </View>

                {/* Botão Salvar */}
                <TouchableOpacity
                    className="rounded-lg py-4 px-6"
                    style={{
                      backgroundColor: theme.colors.primary,
                      shadowColor: theme.colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                    onPress={handleUpdateExercise}
                >
                    <Text className="font-semibold text-center text-lg" style={{ color: '#ffffff' }}>
                        💾 Salvar Alterações
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertTitle}
                message={alertMessage}
                type={alertType}
                confirmText="OK"
                onConfirm={() => {
                    setAlertVisible(false);
                    alertOnConfirm?.();
                }}
            />
        </ScrollView>
    );
}